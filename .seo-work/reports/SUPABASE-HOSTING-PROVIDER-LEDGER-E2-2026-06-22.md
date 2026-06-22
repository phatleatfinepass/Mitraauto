# E-2 - Supabase, Hosting, And Provider Ledger

Recorded: 2026-06-22

Status: Complete with provider blockers

## Decision

E-2 can close as a ledger task. It cannot mark the release provider-ready because Cloudflare authenticated readback is unavailable and public hosting checks still show SEO deployment mismatches.

## Project Identity

| Item | Evidence |
| --- | --- |
| Project wrapper | `project mitraauto` loaded |
| Project dir | `/Users/chandler/code/Mitraauto-main` |
| Project slug | `mitraauto` |
| Supabase project ref | `rcmmbwdebnmicrweoiyz` |
| Supabase URL | `https://rcmmbwdebnmicrweoiyz.supabase.co` |
| Project-specific MCP | `supabase-mitra` |
| Generic Supabase MCP | Not used |

## Secret Status

Only `set` or `missing` was recorded.

| Secret / provider value | Status |
| --- | --- |
| Keychain DB password for `mitraauto.supabase.db` / `postgres` | `set` |
| `DATABASE_URL` | `set` |
| `SUPABASE_TRANSACTION_POOLER_URL` | `set` |
| `SUPABASE_SESSION_POOLER_URL` | `set` |
| `CLOUDFLARE_API_TOKEN` | `missing` |
| `CLOUDFLARE_ACCOUNT_ID` | `missing` |
| `CLOUDFLARE_ZONE_ID` | `missing` |
| `CLOUDFLARE_ZONE_NAME` | `missing` |
| `CLOUDFLARE_PAGES_PROJECT` | `missing` |
| `PUBLIC_BASE_URL` | `missing` |

## Supabase Readback

Database readback succeeded against the confirmed project.

| Check | Result |
| --- | --- |
| Remote DB read | `ok` |
| Database | `postgres` |
| Postgres version | `17.6` |
| Migration table columns | `version`, `statements`, `name`, `created_by`, `idempotency_key`, `rollback` |

Target Phase B migrations are applied remotely:

```text
20260621090000
20260621204946
20260621205611
```

Expected public RPC signatures exist remotely:

```text
catalog_get_rim_by_identifier_v1(p_identifier text)
catalog_get_tire_by_identifier_v1(p_identifier text)
catalog_list_product_sitemap_rows_v1(p_limit integer, p_offset integer)
catalog_public_product_slug(p_product_type text, p_brand text, p_model text, p_size_string text, p_season text, p_width_in numeric, p_rim_diameter_in numeric, p_bolt_pattern text, p_et_offset_mm numeric, p_center_bore_mm numeric, p_color text)
catalog_slugify_public_path_segment(p_value text)
```

Supabase Functions readback succeeded. `payments_create_paytrail` is active remotely, but local source is modified and the remote function timestamp predates the current Phase B-D checkout revalidation work. Treat deployed checkout revalidation as unverified until function deployment/readback is performed.

## Hosting And Cloudflare

Cloudflare authenticated account, zone, Pages, and deployment readback is unavailable because project wrapper Cloudflare variables are missing.

Public host checks observed Cloudflare response headers and these sanitized outcomes:

| URL | Result |
| --- | --- |
| `https://mitra-auto.fi/` | Final `https://www.mitra-auto.fi/`, HTTP `200`, redirects `1` |
| `https://www.mitra-auto.fi/` | HTTP `200`, `text/html`, redirects `0` |
| `https://www.mitra-auto.fi/catalog/tire/1234567890123` | HTTP `200`, `text/html`, redirects `0`; opaque product redirect not observed |
| `https://www.mitra-auto.fi/robots.txt` | HTTP `404` |
| `https://www.mitra-auto.fi/sitemap.xml` | HTTP `404` |
| `https://www.mitra-auto.fi/merchant-products.xml` | HTTP `200`, but body starts with HTML shell instead of XML |

Local provider source that must be reconciled with deployment:

```text
functions/[[path]].ts
src/public/_headers
src/public/_redirects
build/_headers
build/_redirects
supabase/config.toml
supabase/functions/payments_create_paytrail/index.ts
supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql
supabase/migrations/20260621204946_catalog_product_sitemap_source.sql
supabase/migrations/20260621205611_catalog_product_sitemap_pagination.sql
```

## Secret Hygiene

`.vercel/.env.preview.local` exists locally, is ignored/untracked, and contains sensitive marker names. No values were copied into this report. Owner should remove/rotate as appropriate.

`.env.example` is tracked as a template. No secret values were recorded in this ledger.

## Blockers

- Cloudflare authenticated readback is unavailable.
- Public `robots.txt` and `sitemap.xml` return `404`.
- Public `merchant-products.xml` serves the HTML shell instead of XML.
- Public opaque product URL sample did not redirect to a human-readable slug.
- `payments_create_paytrail` deployed parity is unverified after local checkout revalidation changes.
- Local ignored `.vercel/.env.preview.local` requires owner cleanup/rotation decision.

## Verification

```text
source ~/.config/projects/bin/project && project mitraauto >/dev/null && printf 'PROJECT_DIR=%s\nPROJECT_SLUG=%s\nSUPABASE_PROJECT_REF=%s\nSUPABASE_URL=%s\nDATABASE_URL_STATUS=%s\nSUPABASE_TRANSACTION_POOLER_URL_STATUS=%s\nSUPABASE_SESSION_POOLER_URL_STATUS=%s\n' "$PROJECT_DIR" "$PROJECT_SLUG" "$SUPABASE_PROJECT_REF" "$SUPABASE_URL" "${DATABASE_URL:+set}" "${SUPABASE_TRANSACTION_POOLER_URL:+set}" "${SUPABASE_SESSION_POOLER_URL:+set}": passed
codex mcp get supabase-mitra: passed
security find-generic-password -s mitraauto.supabase.db -a postgres >/dev/null 2>&1; keychain_result=$?; if [ "$keychain_result" -eq 0 ]; then echo 'KEYCHAIN_DB_PASSWORD_STATUS=set'; else echo 'KEYCHAIN_DB_PASSWORD_STATUS=missing'; fi: passed
source ~/.config/projects/bin/project && project mitraauto >/dev/null && psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "select 'db_read=ok', current_database(), current_setting('server_version');": passed
source ~/.config/projects/bin/project && project mitraauto >/dev/null && psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "select version from supabase_migrations.schema_migrations where version in ('20260621090000','20260621204946','20260621205611') order by version;": passed
source ~/.config/projects/bin/project && project mitraauto >/dev/null && psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('catalog_get_tire_by_identifier_v1','catalog_get_rim_by_identifier_v1','catalog_list_product_sitemap_rows_v1','catalog_public_product_slug','catalog_slugify_public_path_segment') order by 1;": passed
source ~/.config/projects/bin/project && project mitraauto >/dev/null && supabase functions list --project-ref "$SUPABASE_PROJECT_REF": passed
for url in https://mitra-auto.fi/ https://www.mitra-auto.fi/ https://www.mitra-auto.fi/catalog/tire/1234567890123 https://www.mitra-auto.fi/robots.txt https://www.mitra-auto.fi/sitemap.xml https://www.mitra-auto.fi/merchant-products.xml; do curl -sSIL -o /dev/null --max-time 20 -w '%{url_effective}|http=%{http_code}|content_type=%{content_type}|redirects=%{num_redirects}|remote_ip=%{remote_ip}\n' "$url"; done: passed with findings
```
