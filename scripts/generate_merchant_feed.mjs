import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_DIR = 'src/public';
const SITE_URL = 'https://www.mitra-auto.fi';
const VAT_MULTIPLIER = 1.255;
const HOME_DELIVERY_FEE_INCL_VAT_EUR = 50;
const SHIPPING_COUNTRY = 'FI';
const PAGE_SIZE = 5000;
const TODAY = new Date().toISOString().slice(0, 10);

function getPostgresEnvironment(databaseUrl) {
  const url = new URL(databaseUrl);

  return {
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.replace(/^\//, '')),
    PGSSLMODE: url.searchParams.get('sslmode') ?? 'require',
  };
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeSlug(value) {
  const normalized = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || null;
}

function normalizeGtin(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14 ? digits : null;
}

function priceInclVat(price) {
  const value = Number(price);
  return Number.isFinite(value) && value > 0 ? (value * VAT_MULTIPLIER).toFixed(2) : null;
}

function productPath(row) {
  const slug = normalizeSlug(row.seo_slug) || normalizeSlug(row.generated_slug);
  if (!slug) return null;
  return `/catalog/${row.product_type === 'rim' ? 'rim' : 'tire'}/${slug}`;
}

function feedTitle(row) {
  return [
    row.brand,
    row.model,
    row.size_text,
    row.product_type === 'tire' && row.season && row.season !== 'all_season' ? row.season : null,
  ].filter(Boolean).join(' ').trim();
}

function feedDescription(row, title) {
  const description = String(row.short_description ?? row.long_description ?? '').trim();
  if (description) return description;

  if (row.product_type === 'rim') {
    return `${title}. Alloy or steel rim for compatible vehicles. Confirm fitment before ordering.`;
  }

  return `${title}. Tyre sold by Mitra Auto in Helsinki. Confirm vehicle compatibility before ordering.`;
}

function googleProductCategory(row) {
  return row.product_type === 'rim'
    ? 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Wheel Systems > Motor Vehicle Rims & Wheels'
    : 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Tires';
}

function merchantProductType(row) {
  return row.product_type === 'rim'
    ? 'Rims > Wheels'
    : `Tyres > ${row.season || 'Passenger tyres'}`;
}

function fetchFeedRows() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Run through the Mitra project wrapper: source ~/.config/projects/bin/project && project mitraauto && npm run feed:merchant');
  }

  const rows = [];
  const databaseEnv = getPostgresEnvironment(process.env.DATABASE_URL);

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const query = `
      with source_rows as (
        select
          i.variant_id::text as id,
          'tire'::text as product_type,
          coalesce(nullif(i.brand_display_name, ''), i.brand) as brand,
          i.model,
          i.size_string as size_text,
          i.season,
          i.seo_slug,
          public.catalog_public_product_slug(
            i.product_type,
            coalesce(nullif(i.brand_display_name, ''), i.brand),
            i.model,
            i.size_string,
            i.season,
            i.width_in,
            i.rim_diameter_in,
            i.bolt_pattern,
            i.et_offset_mm,
            null::numeric,
            i.color
          ) as generated_slug,
          coalesce(i.final_price_eur, i.price) as price_ex_vat,
          i.in_stock,
          i.stock_qty,
          coalesce(nullif(i.best_image_url, ''), nullif(i.hero_image_url, '')) as image_url,
          coalesce(nullif(i.ean, ''), nullif(i.derived_ean, '')) as gtin,
          i.short_description,
          i.long_description
        from public.webshop_tire_search_index i
        where i.is_visible
          and i.publish_status = 'published'
          and i.product_ready
          and coalesce(i.final_price_eur, i.price) > 0

        union all

        select
          w.variant_id::text as id,
          'rim'::text as product_type,
          coalesce(nullif(w.brand_display_name, ''), w.brand) as brand,
          w.model,
          w.size_string as size_text,
          w.season,
          w.seo_slug,
          public.catalog_public_product_slug(
            w.product_type,
            coalesce(nullif(w.brand_display_name, ''), w.brand),
            w.model,
            w.size_string,
            w.season,
            w.width_in,
            w.rim_diameter_in,
            w.bolt_pattern,
            w.et_offset_mm,
            coalesce(w.center_bore_mm, w.cb_mm),
            w.color
          ) as generated_slug,
          coalesce(w.final_price_eur, w.price) as price_ex_vat,
          w.in_stock,
          w.stock_qty,
          coalesce(nullif(w.best_image_url, ''), nullif(w.hero_image_url, '')) as image_url,
          coalesce(nullif(w.ean, ''), nullif(w.derived_ean, '')) as gtin,
          w.short_description,
          w.long_description
        from public.webshop_items w
        where w.product_type = 'rim'
          and w.is_visible
          and w.publish_status = 'published'
          and w.product_ready
          and coalesce(w.final_price_eur, w.price) > 0
      )
      select coalesce(jsonb_agg(to_jsonb(page_rows)), '[]'::jsonb)::text
      from (
        select *
        from source_rows
        where image_url is not null
        order by product_type, id
        limit ${PAGE_SIZE}
        offset ${offset}
      ) page_rows;
    `;

    const result = spawnSync('psql', [
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
      '-t',
      '-A',
      '-c',
      query,
    ], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50,
      env: {
        ...process.env,
        ...databaseEnv,
      },
    });

    if (result.status !== 0) {
      throw new Error(`Merchant feed database fetch failed: ${result.stderr.trim() || result.stdout.trim()}`);
    }

    const page = JSON.parse(result.stdout.trim() || '[]');
    if (!Array.isArray(page) || page.length === 0) break;

    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

function buildFeedXml(rows) {
  const items = [];
  const stats = {
    inputRows: rows.length,
    emittedItems: 0,
    skippedMissingSlug: 0,
    skippedMissingPrice: 0,
    skippedMissingImage: 0,
  };

  for (const row of rows) {
    const path = productPath(row);
    const price = priceInclVat(row.price_ex_vat);
    const image = String(row.image_url ?? '').trim();

    if (!path) {
      stats.skippedMissingSlug += 1;
      continue;
    }
    if (!price) {
      stats.skippedMissingPrice += 1;
      continue;
    }
    if (!image) {
      stats.skippedMissingImage += 1;
      continue;
    }

    const title = feedTitle(row);
    const gtin = normalizeGtin(row.gtin);
    const loc = `${SITE_URL}${path}`;
    const availability = row.in_stock ? 'in stock' : 'out of stock';

    items.push([
      '    <item>',
      `      <g:id>${escapeXml(row.id)}</g:id>`,
      `      <g:title>${escapeXml(title)}</g:title>`,
      `      <g:description>${escapeXml(feedDescription(row, title))}</g:description>`,
      `      <g:link>${escapeXml(loc)}</g:link>`,
      `      <g:image_link>${escapeXml(image)}</g:image_link>`,
      `      <g:availability>${availability}</g:availability>`,
      '      <g:condition>new</g:condition>',
      `      <g:price>${price} EUR</g:price>`,
      '      <g:shipping>',
      `        <g:country>${SHIPPING_COUNTRY}</g:country>`,
      `        <g:price>${HOME_DELIVERY_FEE_INCL_VAT_EUR.toFixed(2)} EUR</g:price>`,
      '      </g:shipping>',
      `      <g:brand>${escapeXml(row.brand)}</g:brand>`,
      gtin ? `      <g:gtin>${escapeXml(gtin)}</g:gtin>` : null,
      `      <g:mpn>${escapeXml(row.model)}</g:mpn>`,
      `      <g:google_product_category>${escapeXml(googleProductCategory(row))}</g:google_product_category>`,
      `      <g:product_type>${escapeXml(merchantProductType(row))}</g:product_type>`,
      '    </item>',
    ].filter(Boolean).join('\n'));
    stats.emittedItems += 1;
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    '    <title>Mitra Auto product feed</title>',
    `    <link>${SITE_URL}</link>`,
    '    <description>Canonical tyre and rim products available from Mitra Auto.</description>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return { xml, stats };
}

function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const rows = fetchFeedRows();
  const { xml, stats } = buildFeedXml(rows);
  writeFileSync(join(PUBLIC_DIR, 'merchant-products.xml'), xml);

  console.log(JSON.stringify({
    generatedAt: TODAY,
    ...stats,
    filename: 'merchant-products.xml',
  }, null, 2));
}

main();
