# Local SEO Audit - 2026-06-21

Scope: Mitra Auto local SEO surfaces in the repo, plus light public-source corroboration for business identity. This is not a Google Business Profile login audit.

## Executive Findings

1. The site now has a single local business data source in `src/config/businessProfile.ts`.
2. Contact, Helsinki, footer, about, service schema, product seller schema, and homepage/contact/location metadata now use the same business identity.
3. LocalBusiness/AutoRepair JSON-LD is now emitted on the homepage, Helsinki page, contact page, and service pages using the same `@id`.
4. Placeholder phone/email values were removed from local pages and FAQ NAP output.
5. Unverified review/rating/customer-count claims were removed from the homepage and Helsinki/tire-hotel surfaces. Review markup was not added.
6. Hours still require owner confirmation because public web snippets are not perfectly consistent with the website’s displayed hours.

## Implemented Changes

- Added `src/config/businessProfile.ts`
  - Public name: Mitra Auto
  - Legal name: Mitra Auto Oy
  - Business ID: 3408833-8
  - Address: Hankasuontie 5, 00390 Helsinki
  - Phone: +358 40 777 7163
  - Email: contact@mitra-auto.fi
  - Website: https://www.mitra-auto.fi
  - Visible opening hours used by the site and schema

- Added `src/utils/localSeo.ts`
  - Shared title/description/canonical/`hreflang`/LocalBusiness/WebSite/WebPage/Breadcrumb JSON-LD hook for indexable local pages.

- Updated visible local surfaces
  - `src/SiteApp.tsx`: homepage local metadata/schema; removed unverified homepage reviews and aggregate rating claim.
  - `src/components/site/pages/ContactPage.tsx`: real phone/email/map, ContactPage schema, local canonical/alternates.
  - `src/components/site/pages/HelsinkiPage.tsx`: real local facts instead of `[TBD]`/rating/customer-count stats; local canonical/alternates/schema.
  - `src/components/site/sections/ContactSection.tsx`: shared business profile data.
  - `src/components/site/layout/Footer.tsx`: footer NAP block with address, phone, email.
  - `src/components/site/pages/AboutPage.tsx`: shared business ID/address.
  - `src/components/site/pages/ServiceDetailPage.tsx`: service schema now references the shared local business entity.
  - `src/components/catalog/ProductDetailPage.tsx`: Product seller now references the shared business entity.
  - `src/i18n/dictionaries/site.ts`: removed public `[TBD]` FAQ/local claims for booking lead time, cancellation, service duration, tire-hotel price, and phone/email.

## Public Evidence Checked

- Mitra Auto terms page: `https://www.mitra-auto.fi/legal/terms`
- Mitra Auto homepage snippet: `https://www.mitra-auto.fi/`
- Finder business listing: `https://www.finder.fi/Autokorjaamo%2Bja%2Bautohuolto/Mitra%2BAuto%2BOy/Helsinki/yhteystiedot/4064293`
- 16100 business listing: `https://www.16100.fi/yritykset/E6baf49f6-27fb-5674-8080-3c466ae7204f/mitra-auto-oy`
- Proff listing: `https://www.proff.fi/yrityksen/mitra-auto-oy/helsinki/autokorjaamot/3408833-8I0064`
- Rengasvertailu installation-point listing: `https://rengasvertailu.fi/asennuspisteet/mitra-auto-oy/`

These sources corroborate the name, business ID, phone, and address. They do not replace owner confirmation for hours, Google Business Profile ownership, categories, photos, services, or special hours.

## Data Source And Ownership Map

| Data element | Current source | Website owner | Schema/feed use | Status |
| --- | --- | --- | --- | --- |
| Public business name | `businessProfile.publicName` | Business owner | LocalBusiness, WebSite, footer | Implemented |
| Legal name | `businessProfile.legalName`, legal pages | Business owner/legal | LocalBusiness `legalName`, footer/about | Implemented |
| Business ID | `businessProfile.businessId`, legal pages | Business owner/legal | LocalBusiness `identifier`, about | Implemented |
| Address | `businessProfile.address` | Business owner | LocalBusiness address, maps, footer/contact | Implemented |
| Phone | `businessProfile.phoneE164` | Business owner | Contact links, LocalBusiness contactPoint, footer | Implemented |
| Email | `businessProfile.email` | Business owner | Contact links, LocalBusiness contactPoint, footer | Implemented |
| Hours | `businessProfile.openingHours` | Business owner/operations | LocalBusiness openingHoursSpecification, contact display | Needs owner confirmation |
| Google Business Profile category | Not in repo | Business Profile owner | No schema dependency | Missing |
| Special hours/closures | Not in repo | Operations | Not emitted | Missing |
| Reviews | Not verified in repo | Reputation owner | No review schema | Do not mark up |
| Photos/logo | Repo assets, not GBP-reviewed | Marketing/site owner | Not emitted except existing UI assets | Needs asset governance |

## Local URL Architecture

| Page type | Current URL pattern | Indexable | Ideal URL pattern | Canonical policy | Sitemap policy | Schema policy | Internal-link policy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage | `/`, `/en` | Yes | Same | Self canonical per language, reciprocal alternates | Include both | LocalBusiness + WebSite + WebPage | Main nav/footer/services/catalog |
| Helsinki location page | `/helsinki`, `/en/helsinki` | Yes | Same | Self canonical per language, reciprocal alternates | Include both | LocalBusiness + WebPage + Breadcrumb | Nav/footer/home/service pages should link to this as the location page |
| Contact page | `/yhteystiedot`, `/en/contact` | Yes | Same | Self canonical per language, reciprocal alternates | Include both | ContactPage + LocalBusiness + Breadcrumb | Footer/nav/FAQ should link here |
| Service hub | `/palvelut`, `/en/services` | Yes | Same | Self canonical | Include both | Breadcrumb + local business reference later | Link to canonical service pages |
| Bespoke service page | `/palvelut/{service-slug}`, `/en/services/{service-slug}` | Yes | Human-readable service slugs | Self canonical; aliases canonicalize to primary path | Include primary canonical service URLs only | Service semantic + LocalBusiness + Breadcrumb | Hub, related services, homepage |
| Generated service page | `/palvelut/{serviceId}`, `/en/services/{serviceId}` | No | Consolidate or create unique pages | `noindex, follow` | Exclude | Semantic only | Avoid using as primary SEO internal links |
| Product detail | `/catalog/{tire|rim}/{slug}`, `/en/catalog/{tire|rim}/{slug}` | Yes when ready/published | Human-readable product slugs | Self canonical to slug | Future dynamic product sitemap | Product + Offer seller referencing local entity | Category/product cards |
| Checkout/account/CMS/PWA | utility/private routes | No | Same | No canonical while active | Exclude | None | No SEO body links |

## Business Profile Consistency Matrix

| Surface | Required local data | Current state |
| --- | --- | --- |
| Website footer | Name, address, phone, email | Implemented from shared profile |
| Contact page | NAP, hours, map, booking path | Implemented from shared profile |
| Helsinki page | Location, services, hours, contact | Implemented from shared profile |
| Legal pages | Legal identity and contact | Already present; not fully refactored to shared profile |
| LocalBusiness JSON-LD | Name, URL, phone, email, address, hours | Implemented from shared profile |
| Google Business Profile | Owner, categories, hours, services, photos, appointment URL | Must be checked in GBP directly |
| Citations/directories | NAP, category, profile links | Public snippets mostly align on NAP; hours need confirmation |

## Schema Decisions

| Page/surface | Markup | Classification | Notes |
| --- | --- | --- | --- |
| Homepage | LocalBusiness/AutoRepair, WebSite, WebPage, Breadcrumb | Google-supported where applicable plus semantic site identity | No reviews or fake ratings |
| Helsinki page | LocalBusiness/AutoRepair, WebPage, Breadcrumb | Google-supported where applicable | Single real location only; no city doorway expansion |
| Contact page | ContactPage, LocalBusiness/AutoRepair, Breadcrumb | ContactPage semantic + local business supported where applicable | Visible NAP matches schema |
| Service pages | LocalBusiness/AutoRepair, Service, Breadcrumb | LocalBusiness/Breadcrumb supported; Service semantic-only | Service markup is not reported as a Google service rich result |
| Product pages | Product/Offer seller references Mitra Auto | Google-supported Product where page data is sufficient | Seller identity now reconciled |
| Reviews | None | Not applicable | No review schema until reviews are authentic, visible, source-governed, and eligible |

## Google Business Profile Work Plan

1. Confirm GBP ownership is controlled by a business-owned account.
2. Confirm exact public name: `Mitra Auto` or `Mitra Auto Oy`; do not add service/city keywords to the name.
3. Confirm primary category against current GBP categories; likely auto repair/garage category, but do not set without owner review.
4. Confirm address display and map pin for Hankasuontie 5, 00390 Helsinki.
5. Confirm hours and define holiday/special-hour owner.
6. Add appointment URL with clean UTM tracking that does not become canonical.
7. Add services only where actually offered and maintained.
8. Add original exterior, workshop, waiting area, team, and service photos with consent.
9. Create ethical review request and response SOP; no review gating or incentives for positive sentiment.
10. Monitor duplicates, suggested edits, messages, calls, directions, bookings, and photo performance monthly.

## Measurement Plan

- Google Search Console: query/page performance for `/helsinki`, `/yhteystiedot`, `/palvelut/*`, `/en/*`.
- GBP performance: calls, website clicks, direction requests, messages, bookings, photo views.
- Analytics events: click-to-call, email click, direction click, booking start, booking submit, service selected, catalog product view, cart add.
- Call tracking: only if it preserves NAP consistency and avoids swapping schema/footer phone numbers.
- Local conversion quality: booking completion, no-show/cancellation, service category, revenue where available.

## Acceptance Tests

1. A crawler can find name, address, phone, email, and hours from the homepage/footer and contact page.
2. `/`, `/en`, `/helsinki`, `/en/helsinki`, `/yhteystiedot`, and `/en/contact` each have self-canonical and reciprocal alternates.
3. LocalBusiness JSON-LD parses and matches visible NAP content.
4. No LocalBusiness review/rating markup is emitted.
5. No local pages show `[TBD]` in NAP, hours, or public FAQ contact data.
6. Generated service ID pages remain `noindex, follow`.
7. Checkout/account/CMS/PWA routes remain `noindex, nofollow` and excluded from sitemap.
8. Sitemap includes canonical local/contact/service URLs only.

## Risks Requiring Business Confirmation

- Opening hours and special hours must be confirmed in the owner-controlled Business Profile.
- Public email differs across some citations (`contact@mitra-auto.fi` on site/legal pages, other email on at least one directory snippet). Choose the canonical public customer email and reconcile directories.
- Google Business Profile category, services, photos, products, appointment URL, and messaging settings are not visible from repo access.
- Existing old service components still contain placeholder prices/durations; these should remain unlinked or be cleaned before being exposed.
- Do not create Espoo/Vantaa/Kirkkonummi landing pages unless each has genuine local utility and does not imply a fake branch.

## Validation

- `npm run build`: passed.
- `git diff --check`: passed.
