# C-5 Local And Content Browser Verification

Status: Complete locally with owner/platform exceptions

Recorded: 2026-06-22

## Decision

C-5 browser verification is complete for the local development runtime at `http://127.0.0.1:3002`. Canonical contact, Helsinki, services hub, bespoke service detail, and generated service fallback routes render the expected local facts, metadata, schema classes, booking/contact affordances, and mobile/desktop layouts.

This is not production launch proof. Search Console URL Inspection, Rich Results Test against deployed URLs, Business Profile readback, live HTTP status, live redirects, and production crawl evidence remain Phase D/E or owner/platform work.

## Browser Sample

| Route | Viewport | Result |
| --- | --- | --- |
| `/yhteystiedot` | 1280x900 | Pass: FI contact page renders NAP, hours, map link, phone, email, booking CTA, canonical, `ContactPage`, `LocalBusiness`, and breadcrumb JSON-LD. |
| `/en/contact` | 390x844 | Pass: EN contact page renders equivalent contact facts and mobile layout with no horizontal overflow. |
| `/helsinki` | 1280x900 | Pass: location page renders Helsinki H1, Hankasuontie address, phone/email/map, booking CTA, canonical, and local/page/breadcrumb JSON-LD. |
| `/palvelut` | 1280x900 | Pass after patch: services hub now renders FI lang, service hub title/canonical, `CollectionPage` graph, local contact links, booking CTA, and no horizontal overflow. |
| `/en/services` | 390x844 | Pass after patch: services hub now renders EN lang, service hub title/canonical, `CollectionPage` graph, contact links, booking CTA, and no horizontal overflow. |
| `/palvelut/autohuolto` | 1280x900 | Pass: bespoke service page renders localized service content, owner-review caveat, price section, related service links, local NAP links, booking CTA, `Service` JSON-LD, and canonical. |
| `/en/services/tire-repair` | 390x844 | Pass: mobile service detail renders safety limits, price caveats, related links, local contact facts, `Service` JSON-LD, and canonical. |
| `/palvelut/basic-hand-wash-suv` | 1280x900 | Pass: generated service page renders service content but remains `noindex, follow` and is excluded from sitemap. |
| `/en/services/basic-hand-wash-suv` | 390x844 | Pass: generated EN service page renders mobile content but remains `noindex, follow` and is excluded from sitemap. |
| `/contact` | 1280x900 | Advisory: noncanonical legacy-style alias renders 404 with `noindex, follow` and is not in sitemap. No current internal link or sitemap dependency found. |

## Implementation Fixes Made During C-5

`src/components/site/pages/ServicesPage.tsx`

- Added shared local SEO head handling for `/palvelut` and `/en/services`.
- Set service hub title, description, canonical, hreflang, `CollectionPage`, `WebSite`, `LocalBusiness`, and breadcrumb JSON-LD.
- Added wrapping behavior for desktop category buttons.

`src/i18n/dictionaries/site.ts`

- Added FI/EN service hub SEO title and description.
- Replaced unverified "100% satisfaction guarantee" service trust copy with a safer visible process claim.

`src/components/site/sections/ContactSection.tsx`

- Replaced `60%_40%` grid columns with minmax fractional tracks.
- Added overflow clipping to prevent decorative map/background elements from creating horizontal scroll.

## Evidence Coverage

| Evidence mode | State | Notes |
| --- | --- | --- |
| Repository/source inspection | Executed | Route mappings, sitemap policy, service page source, contact/local source reviewed. |
| Local browser desktop | Executed | Contact, Helsinki, services hub, service detail, generated service page, and `/contact` alias sampled. |
| Local browser mobile | Executed | EN contact, services hub, service detail, and generated service page sampled. |
| Sitemap source check | Executed | Canonical service/contact/location routes present; generated service sample and `/contact` absent. |
| Browser console | Executed | Zero error-level console messages in the active Playwright session. |
| Production HTTP/live crawl | Unavailable | Not run in C-5. Remains E-3/live launch QA. |
| Search Console/GBP/Merchant/platform | Unavailable | Access/evidence not supplied. Remains Phase D/E and owner/platform work. |

## Remaining Exceptions

- GBP owner confirmation, primary category, special hours, services/products, photos, appointment URL, and citation correction remain owner/platform exceptions from C-1.
- Service owner review is still required before service content can be called growth-ready.
- Original workshop/process media remains missing.
- Production direct-route status, deployed redirects, deployed sitemap fetch, live noindex/canonical behavior, and Google tool validation remain E-3.

## Verification

```text
command -v npx >/dev/null 2>&1: passed
/Users/chandler/.codex/skills/playwright/scripts/playwright_cli.sh open http://127.0.0.1:3002/contact && /Users/chandler/.codex/skills/playwright/scripts/playwright_cli.sh snapshot: passed, advisory /contact 404 confirmed
/Users/chandler/.codex/skills/playwright/scripts/playwright_cli.sh eval browser route sample: passed
curl -fsS http://127.0.0.1:3002/sitemap.xml | rg -n "yhteystiedot|en/contact|helsinki|en/services|palvelut/autohuolto|en/services/tire-repair|basic-hand-wash-suv|https://www.mitra-auto.fi/contact" || true: passed
/Users/chandler/.codex/skills/playwright/scripts/playwright_cli.sh console error: passed
npm run i18n:audit: passed
/Users/chandler/.codex/skills/distill-heavy-output/scripts/distill_cmd.sh "Return only whether npm run build passed or failed, plus the first error if it failed. Format: status line, then error line or 'no errors'." -- npm run build: passed
git diff --check: passed
```

## Figma Make Sync

```text
/Figma/src/components/site/pages/ServicesPage.tsx
/Figma/src/i18n/dictionaries/site.ts
/Figma/src/components/site/sections/ContactSection.tsx
```

## Next

Continue with `D-1 - KPI Tree And Event Dictionary`.
