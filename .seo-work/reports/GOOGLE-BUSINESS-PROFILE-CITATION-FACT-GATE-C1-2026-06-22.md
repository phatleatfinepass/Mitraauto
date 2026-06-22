# Google Business Profile And Citation Fact Gate - C-1

Date: 2026-06-22

Scope: repo business-profile source, visible local/NAP references, existing local SEO report, light public citation search, and current Google Business Profile policy references. This is not a logged-in Google Business Profile audit.

## Gate Decision

C-1 is complete as a fact gate with exceptions recorded.

Mitra is not local-SEO-ready until the business owner supplies direct Google Business Profile evidence and approves citation corrections.

## Source References

- Website source of truth: `src/config/businessProfile.ts`
- Existing local audit: `.seo-work/reports/LOCAL-SEO-AUDIT-2026-06-21.md`
- Google Business Profile guidelines: https://support.google.com/business/answer/3038177
- Google Business Profile eligibility and ownership guidelines: https://support.google.com/business/answer/13763036
- Google Business Profile verification: https://support.google.com/business/answer/7107242
- Google local ranking guidance: https://support.google.com/business/answer/7091
- Google profile editing guidance: https://support.google.com/business/answer/3039617

## Locally Verified Website Facts

| Fact | Repo source | Status |
| --- | --- | --- |
| Public name | `businessProfile.publicName` = `Mitra Auto` | Source verified |
| Legal name | `businessProfile.legalName` = `Mitra Auto Oy` | Source verified |
| Business ID | `businessProfile.businessId` = `3408833-8` | Source verified |
| Website URL | `businessProfile.websiteUrl` = `https://www.mitra-auto.fi` | Source verified |
| Address | `Hankasuontie 5, 00390 Helsinki, FI` | Source verified |
| Phone | `+358407777163` / `+358 40 777 7163` | Source verified |
| Public email | `contact@mitra-auto.fi` | Source verified |
| Regular hours | Mon-Fri 09:00-18:00, Sat 10:00-17:00, Sun closed | Source present, owner confirmation required |
| Service area | `Helsinki` | Source present, owner confirmation required |
| Schema type | `AutoRepair`, `AutomotiveBusiness`, `LocalBusiness` | Source verified |

## Google Business Profile Evidence Gap

Direct GBP evidence was unavailable. The following cannot be treated as passed:

| GBP item | Required owner evidence | Gate result |
| --- | --- | --- |
| Ownership | Screenshot/export showing business-owned manager account and profile status | Not verified |
| Verification status | GBP verification status from Google UI | Not verified |
| Primary category | Current GBP primary category | Not verified |
| Additional categories | Current additional categories, if any | Not verified |
| Public name | Current GBP profile name | Not verified |
| Address and map pin | Current GBP address plus pin placement | Not verified |
| Phone | Current GBP phone | Not verified |
| Website URL | Current GBP website link and UTM policy | Not verified |
| Hours | Current regular hours | Not verified |
| Special hours | Holiday/closure process and upcoming exceptions | Missing |
| Services/products | Current GBP services/products list | Not verified |
| Appointment URL | Booking/profile URL | Not verified |
| Messaging | On/off state and owner response process | Not verified |
| Photos/logo | Current logo, cover, exterior, interior, workshop, and service photos | Not verified |
| Reviews | Review request/response SOP and owner process | Missing |

## Public Citation Findings

Public search snippets corroborate core identity on several surfaces, but snippets are not authoritative source truth.

| Surface found in public search | Corroborates | Issue |
| --- | --- | --- |
| Finder | Name, address, category, business ID | Snippet shows `info.mitra.auto@gmail.com`, conflicting with website `contact@mitra-auto.fi` |
| Fonecta | Name, address, phone, category | Profile appears unconfirmed in snippet |
| Proff/Taloustutka-style sources | Name, business ID, address, phone | Does not verify GBP facts or current customer email |
| AutoJerry | Name, address, business ID, hours close to website source | Needs owner confirmation and profile relationship decision |
| autokorjaamo.fi | Name, address, phone | Snippet shows `info.mitra.auto@gmail.com` and Mon-Fri 08:30-18:00, conflicting with website hours |
| Facebook snippets | Name, address, phone | Snippets show old Gmail address; source ownership/current use not verified |

## Consistency Matrix

| Field | Website/schema | Public snippets | Gate action |
| --- | --- | --- | --- |
| Name | `Mitra Auto` / `Mitra Auto Oy` | Mostly aligned | Keep; confirm GBP exact display name |
| Address | Hankasuontie 5, 00390 Helsinki | Mostly aligned | Keep; confirm GBP pin and directory formatting |
| Phone | +358 40 777 7163 | Mostly aligned | Keep; confirm GBP and citations |
| Email | `contact@mitra-auto.fi` | Mixed with `info.mitra.auto@gmail.com` | Owner must choose canonical public email and update directories |
| Hours | Mon-Fri 09:00-18:00, Sat 10:00-17:00 | Mixed; at least one snippet has Mon-Fri 08:30-18:00 | Owner must confirm true operating hours and special-hour process |
| Category | Website implies auto repair/garage | Public snippets show auto repair/service categories | Owner must confirm GBP primary/additional categories |
| Services | Website lists multiple services | Directory/service marketplaces list service categories/reviews | Owner must confirm current offered services before GBP and service content work |
| Photos | Not governed in repo | Unknown | Owner must supply/approve real GBP and website photos |
| Reviews | No schema emitted | Marketplace/review snippets exist | Do not copy or mark up as LocalBusiness review schema |

## Owner Evidence Package Required

To unblock local readiness, the business owner should provide current screenshots or exports for:

1. GBP profile overview with ownership/verification status.
2. Business information tab: name, category, address, service area, phone, website, hours, special hours, attributes.
3. Services/products tabs.
4. Booking/appointment link and messaging state.
5. Photos tab showing logo, cover, exterior, interior/workshop, team/service media.
6. Review management process: who requests reviews, who replies, response SLA, no gating or incentives for positive reviews.
7. Citation correction list: Finder, Fonecta, Proff or equivalent, AutoJerry, autokorjaamo.fi, Facebook, Apple Maps, Bing Places, and any active Finnish automotive directories.

## Policy Decisions

- Do not keyword-stuff the GBP name. Use the real-world business name only.
- Do not add fake city/service terms to GBP categories, name, or citations.
- Do not create additional location pages unless Mitra has a genuine eligible customer-facing location.
- Do not add LocalBusiness review/rating markup from Google, marketplace, or copied testimonials.
- Keep UTM tracking on GBP links only if it does not change canonical URL behavior.
- Use the website business-profile object as the local source until owner evidence requires a correction.

## Implementation Files To Change After Owner Evidence

Expected source files if owner evidence changes facts:

- `src/config/businessProfile.ts`
- `src/i18n/dictionaries/site.ts`
- `src/components/site/pages/ContactPage.tsx`
- `src/components/site/pages/HelsinkiPage.tsx`
- `src/components/site/sections/ContactSection.tsx`
- `src/components/site/layout/Footer.tsx`
- `src/utils/localSeo.ts`

Expected non-repo/platform work:

- Google Business Profile fields
- citation/directory profiles
- photo asset governance
- review request/response SOP

No source-code facts were changed in C-1 because the missing items require business owner evidence.

## C-1 Acceptance Result

| Acceptance item | Result |
| --- | --- |
| GBP ownership confirmed | Blocked: owner evidence required |
| GBP category confirmed | Blocked: owner evidence required |
| GBP hours/special hours confirmed | Blocked: owner evidence required |
| Public email reconciled | Blocked: owner decision required |
| Citations compared | Done from public snippets, not authoritative |
| Citation corrections recorded | Done |
| Review SOP recorded | Required, not supplied |
| Website/schema local facts checked | Done |
| Exceptions recorded | Done |

## Next Action

Continue with C-2 service content work, but do not declare Phase C local readiness until the owner evidence package above is supplied and reconciled.
