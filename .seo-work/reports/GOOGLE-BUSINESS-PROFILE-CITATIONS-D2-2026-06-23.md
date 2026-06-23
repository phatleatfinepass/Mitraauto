# D-2 - Google Business Profile, Citations, And Business Fact Approval

Status: Complete with blockers carried

Recorded: 2026-06-23

## Purpose

D-2 records whether Mitra Auto has enough owner-approved Google Business Profile, citation, and business-fact evidence to call local SEO facts ready.

It does not. The repo has a central business-profile source, but GBP access and owner approval are unavailable, and public citations conflict on email, weekday opening time, alias/brand history, and proof-sensitive claims.

## Evidence State

| Evidence mode | State | Meaning |
| --- | --- | --- |
| `REPO` | `EXECUTED_WITH_FINDINGS` | `src/config/businessProfile.ts` centralizes name, legal name, business ID, address, phone, email, hours, service area, map links, and LocalBusiness schema source. |
| `LOCAL_SOURCE` | `EXECUTED` | Contact, footer, Helsinki, contact-section, opening-hours, and LocalBusiness utilities read from the central business profile. |
| `LIVE` | `EXECUTED_WITH_FINDINGS` | Public pages return `200`, but raw homepage HTML still exposes the Figma Make shell and not full local NAP/hours before JavaScript rendering. |
| `PLATFORM` | `UNAVAILABLE` | No GBP account/location ID, owner, verification, category, services, photos, reviews, duplicate/suspension, appointment URL, or API/screenshot export was available. |
| `OWNER_POLICY` | `UNAVAILABLE` | No business owner approval for canonical email, hours, service area, category, citations, reviews, photos, alias, or special hours. |
| `PUBLIC_CITATIONS` | `EXECUTED_WITH_FINDINGS` | Public citations corroborate legal identity and address, but conflict on email/hours and expose additional claims requiring owner review. |
| `OFFICIAL_DOCS` | `REVIEWED_2026_06_23` | Current Google Business Profile guidance was reviewed for real-world name, address/service-area, duplicate profile, phone, hours, category, and verified-edit policy. |

## Repo Business Facts

| Fact | Current repo value | Source | D-2 state |
| --- | --- | --- | --- |
| Public name | `Mitra Auto` | `src/config/businessProfile.ts` | Source present; owner/GBP confirmation required. |
| Legal name | `Mitra Auto Oy` | `src/config/businessProfile.ts` | Corroborated by public registry/citation evidence; owner/GBP confirmation still required. |
| Business ID | `3408833-8` | `src/config/businessProfile.ts` | Corroborated by public registry/citation evidence. |
| Website | `https://www.mitra-auto.fi` | `src/config/businessProfile.ts` | Source present; GBP website URL readback unavailable. |
| Address | `Hankasuontie 5, 00390 Helsinki, Finland` | `src/config/businessProfile.ts` | Broadly corroborated; GBP pin/signage/customer-facing status unavailable. |
| Phone | `+358 40 777 7163` | `src/config/businessProfile.ts` | Broadly corroborated; GBP/citation owner approval unavailable. |
| Email | `contact@mitra-auto.fi` | `src/config/businessProfile.ts` | Conflicts with public citation snippets using `info.mitra.auto@gmail.com`. |
| Hours | Mon-Fri 09:00-18:00, Sat 10:00-17:00, Sun closed | `src/config/businessProfile.ts` | Conflicts with citation surfaces showing Mon-Fri 08:30-18:00. |
| Service area | Helsinki | `src/config/businessProfile.ts` | Source present; GBP service-area and practical local scope unavailable. |
| Schema type | `AutoRepair`, `AutomotiveBusiness`, `LocalBusiness` | `src/config/businessProfile.ts` | Acceptable as source-level type; GBP category still unavailable. |

No source-code facts were changed in D-2 because there is no owner-approved replacement truth.

## GBP Readback

| Required readback | Status | Evidence |
| --- | --- | --- |
| GBP account/location ID | Blocked | Project wrapper had no GBP account/location metadata. |
| Owner and backup owner | Blocked | No dashboard, API, or sanitized export supplied. |
| Verification status | Blocked | Unavailable. |
| Profile name | Blocked | Unavailable. |
| Primary/additional categories | Blocked | Unavailable. |
| Address, service area, and map pin | Blocked | Unavailable. |
| Phone, website, appointment URL | Blocked | Unavailable. |
| Regular and special hours | Blocked | Unavailable. |
| Services/products and attributes | Blocked | Unavailable. |
| Photos/logo/cover/exterior/interior/workshop | Blocked | Unavailable. |
| Reviews and owner response process | Blocked | Unavailable. |
| Duplicate/suspension status | Blocked | Unavailable. |
| Messaging state | Blocked | Unavailable. |

Minimum evidence required: sanitized GBP screenshots/export or API envelope showing profile identity, access owner, verification, categories, NAP, hours, service area, appointment URL, services/products, attributes, photos, reviews, duplicate/suspension state, and timestamp.

## Public Citation Matrix

| Surface | Corroborates | Conflict or limitation | D-2 action |
| --- | --- | --- | --- |
| Mitra Auto public site snippets | Brand, address, phone, public hours snippets. | Raw homepage HTML only exposed Figma Make shell and brand text, not full NAP/hours. | Production raw HTML/local proof remains a deployment/SEO blocker. |
| Mitra Auto terms/privacy snippets | Legal name, business ID, address, `contact@mitra-auto.fi`, phone. | Does not approve GBP fields or citations. | Keep as website source until owner facts change. |
| `autokorjaamo.fi` | `Mitra Auto Oy`, address, phone. | Shows `info.mitra.auto@gmail.com`, Mon-Fri `08:30-18:00`, review count, AC permit, loan car, cafe/waiting-room, and warranty-like claims. | Owner must confirm facts and correct citation or approve documented difference. |
| `Rengasvertailu` | Name, business ID, address, phone, Konala/Helsinki context. | Public snippet shows old Gmail and `08:30-18:00`; staff/service-area claims need owner proof. | Owner correction/evidence required. |
| `Taloustutka` | Business ID, legal name, address, industry, founded date. | Shows other name/alias `Espoon rengas ja autohuolto`; not an operational GBP proof source. | Owner must classify alias as valid, historical, or stale. |
| Finder/Fonecta/Facebook/AutoJerry snippets | Several surfaces corroborate address/phone/business identity. | Multiple snippets use old Gmail; AutoJerry-style paths reference `Espoon rengas ja autohuolto`. Snippets are not correction evidence. | Owner/citation cleanup packet required. |

## Findings

### BLOCKER - GBP Owner/Profile Readback Is Unavailable

- Evidence: no GBP account/location ID, verification state, profile fields, categories, services, photos, reviews, duplicate/suspension state, or appointment URL was supplied.
- Impact: local SEO cannot be marked ready, GBP cannot be optimized safely, and LocalBusiness schema must not be enriched from assumptions.
- Owner: Business/Local SEO owner.
- Required resolution: provide sanitized GBP dashboard/API evidence and approve a canonical local fact record.

### CRITICAL - Citation NAP Conflicts Are Unresolved

- Evidence: repo uses `contact@mitra-auto.fi` and Mon-Fri `09:00-18:00`; public citation surfaces show `info.mitra.auto@gmail.com` and Mon-Fri `08:30-18:00`.
- Impact: inconsistent facts can weaken local trust, confuse users, and produce wrong contact or arrival expectations.
- Owner: Business owner.
- Required resolution: choose canonical public email and real customer-facing hours, then update website, GBP, and citations consistently.

### CRITICAL - Alias/Brand Relationship Needs Owner Decision

- Evidence: public registry/directory evidence references `Espoon rengas ja autohuolto` around business ID `3408833-8`.
- Impact: entity consistency and citation cleanup cannot pass until the owner decides whether this is historical, valid DBA, or stale citation data.
- Owner: Business owner.
- Required resolution: approve naming policy and update citations accordingly.

### WARNING - Raw Production HTML Does Not Expose Full Local Proof

- Evidence: live homepage raw HTML scan exposed `Created in Figma Make` and `Mitra Auto`, but not address, phone, email, or hours.
- Impact: crawler, AI, and local proof extraction rely on rendered JavaScript until production raw HTML/edge metadata/schema parity is fixed.
- Owner: Deployment/SEO engineering owner.
- Required resolution: serve route-specific raw HTML, metadata, schema, and visible NAP for launch-critical local pages.

### WARNING - Generic Social Links Are Not Trust Evidence

- Evidence: `src/components/site/layout/Footer.tsx` links to generic `facebook.com`, `twitter.com`, `instagram.com`, and `linkedin.com`.
- Impact: these cannot be used as `sameAs` proof and should not appear as official profile links.
- Owner: Business/content owner.
- Required resolution: remove them or replace only with owner-approved official profiles.

### CRITICAL - Review, Rating, And Customer-Count Claims Remain Unapproved

- Evidence: `src/i18n/dictionaries/common.ts` and `src/i18n/dictionaries/site.ts` still contain rating, review, and `500+` customer claims. LocalBusiness review/aggregateRating schema is not emitted, which is correct until proof exists.
- Impact: visible trust claims need provenance or removal before local/content growth readiness.
- Owner: Business/content/legal owner.
- Required resolution: provide review/customer-count evidence or remove/soften these claims in D-5.

## Owner Evidence Packet Required

- Owner-approved public name, legal name, business ID, address, service area, phone, canonical email, website URL, booking URL, regular hours, and special-hours process.
- GBP account ID, location ID, owner, backup owner, verification state, profile name, primary category, additional categories, address/pin, service area, phone, website, appointment URL, services/products, attributes, messaging, photos, reviews, duplicate/suspension status, and last update timestamp.
- Citation cleanup evidence for Google, Apple Maps, Bing Places, Finder, Fonecta, AutoJerry, autokorjaamo.fi, Rengasvertailu, Facebook, and automotive/service directories.
- Review request/response SOP with no gating, incentive, copied-review, or self-serving schema policy.
- Official social profile URLs or owner decision to remove social links.
- Decision on `Espoon rengas ja autohuolto` alias/history.

## Implementation Policy

Files likely to change after owner evidence:

- `src/config/businessProfile.ts`
- `src/i18n/dictionaries/site.ts`
- `src/i18n/dictionaries/common.ts`
- `src/components/site/pages/ContactPage.tsx`
- `src/components/site/pages/HelsinkiPage.tsx`
- `src/components/site/sections/ContactSection.tsx`
- `src/components/site/layout/Footer.tsx`
- `src/utils/localSeo.ts`

Non-repo work likely required:

- Google Business Profile fields and verification cleanup.
- Citation and directory corrections.
- Google/Apple/Bing map profile cleanup.
- Review request and response SOP.
- Owned photo/media governance.

## Official Source Notes

Reviewed Google Business Profile guidance:

- `https://support.google.com/business/answer/3038177?hl=en`
- `https://support.google.com/business/answer/3039617?hl=en`

Operational rules applied from those docs:

- Use the real-world business name, not keyword-stuffed names.
- Use a precise real-world address or service area.
- Avoid duplicate profiles for the same location.
- Use the fewest correct categories for the overall business.
- Provide phone, website, and regular hours that represent the actual business location.
- Hybrid service-area auto repair businesses can show a storefront address only if staffed and able to receive customers during stated hours.

## Verification

```text
source ~/.config/projects/bin/project && project mitraauto provider metadata check: passed with GBP metadata missing
curl raw homepage local-fact scan: passed with findings; raw HTML exposed Figma Make shell and not full NAP/hours
rg source proof-sensitive local facts/social/review claims: passed with findings
public citation review: passed with conflicts recorded
```

## Decision

```text
D-2 is complete as a GBP/citation/business-fact evidence gate.
D-2 is not a local SEO pass.
Local readiness remains blocked until owner-approved GBP evidence, citation corrections, canonical NAP/hours/email decisions, review/social proof, and production raw HTML/local schema parity are supplied and reconciled.
Next task is D-3 - Merchant Center Feed Diagnostics And Product Policy Approval.
```
