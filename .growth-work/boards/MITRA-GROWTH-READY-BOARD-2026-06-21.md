# Mitra Auto Growth Readiness Board

Status: Active

Parent board: `None - Mitra Auto growth readiness root board`

Workstream: Growth Readiness

Surface: public website routes, catalog/product pages, service pages, local pages, schema, sitemap, Supabase catalog data, Figma Make source sync, analytics/platform setup, launch QA, and growth handoff.

Current progress: `[██████████████████░░] 90%`

Current phase: `Phase E - Release Closeout, Evidence Ledger, And Growth Handoff`

Current task: `E-3 - Live Crawl And Browser Smoke Evidence`

Figma Make source: `https://github.com/phatleatfinepass/Mitraauto.git`

Implementation checkout: `/Users/chandler/code/Mitraauto-main`

Security and provider reference: `AGENTS.md` project instructions and `supabase-mitra` project-specific MCP rule

Growth reports: `.seo-work/reports/*.md`

Runtime decision: this board assumes the current release path below until a separate hosted-backend or SSR/prerender decision is recorded.

Current release runtime:

```text
Figma Make / Vite SPA UI
-> Supabase Postgres, catalog read models, RPCs, and migrations
-> public Mitra Auto website, catalog, booking, checkout, contact
-> Google Business Profile, Merchant Center, Search Console, analytics
-> qualified bookings, paid orders, fulfilled service, retention, reviews
```

Blocked gates:

- Growth-ready classification is blocked until Phase E proves source parity, provider evidence, live crawl/browser QA, drift baseline, and deployed production behavior.
- Live measurement readiness is blocked until analytics access, platform readback, and booking/order reconciliation are verified outside the local Phase D contract.
- Local SEO readiness is blocked until Phase C confirms Google Business Profile facts with the business owner.

## Goal

Deliver Mitra Auto growth readiness so that search, local, product, and service traffic can land on accurate public pages and convert into qualified bookings, paid orders, fulfilled service, and retention loops with production behavior through:

```text
Figma Make / Vite SPA UI
-> Supabase catalog data and RPCs
-> canonical public routes, schema, sitemap, booking, checkout, and contact
-> Search Console, Google Business Profile, Merchant Center, analytics, and operations
```

Core product rule:

```text
Every public growth surface must be canonical, truthful, source-governed, measurable, and tied to a real customer task.
```

Release must prove:

- canonical product slug URLs and legacy identifier redirects,
- safe indexability for every public, utility, private, and generated route class,
- local business facts that match visible content, schema, GBP, and citations,
- product page, schema, cart, checkout, feed, price, availability, and URL consistency,
- service content quality with verified proof, limitations, and owner review,
- event and outcome measurement reconciled to bookings and orders,
- Figma Make/source sync with no stale runtime files,
- live crawl, browser QA, accessibility smoke, and monitoring readiness.

## Workstream Ownership

Growth Readiness owns:

- public route/indexability policy,
- product URL migration and canonical policy,
- dynamic product sitemap policy,
- schema governance,
- local SEO facts and GBP/citation readiness,
- service and product content readiness,
- measurement/KPI/event readiness,
- search-to-outcome conversion journeys,
- Figma Make patch-state ledger for growth-critical files,
- launch QA and monitoring handoff.

Growth Readiness does not own:

- broad visual redesign beyond growth-critical UI changes,
- unrelated CMS/admin feature work,
- Tire Storage full implementation beyond retention-readiness handoff,
- provider credentials or secret storage,
- legal approval of claims, policies, or review solicitation,
- final business decision to scale acquisition.

Shared boundaries:

- Product/catalog data comes from Supabase catalog read models, `webshop_items`, tire/rim search indexes, and catalog RPCs.
- Booking/order outcome truth comes from Mitra booking/order systems, not analytics alone.
- Local facts come from `src/config/businessProfile.ts` plus owner-confirmed Google Business Profile/citation evidence.
- Figma Make source must follow local repo source of truth unless the owner records a different deployment path.
- Provider-changing work is governed by project wrapper and `supabase-mitra` rules in `AGENTS.md`.

## Non-Goals

- Do not guarantee rankings, traffic, rich results, AI citations, local-pack placement, conversion lift, revenue lift, or ROI.
- Do not mass-publish city-swapped doorway pages or generated service pages.
- Do not add fake reviews, fake ratings, fake scarcity, fake stock, hidden fees, or unsupported policy/schema claims.
- Do not use arbitrary catalog filter states as indexable landing pages without validated demand and unique content.
- Do not push provider config, migrations, or hosting changes without target readback and secret-safe workflow.
- Do not treat client-side URL replacement as a complete SEO migration when HTTP redirects are required.
- Do not treat analytics clicks, form starts, or rankings as fulfilled business outcomes.

## Source Boundaries

Figma Make / frontend source target:

```text
src/SiteApp.tsx
src/components/catalog/
src/components/site/
src/components/site/layout/
src/components/site/pages/
src/components/site/sections/
src/config/businessProfile.ts
src/i18n/
src/public/sitemap.xml
src/utils/catalogSeo.ts
src/utils/localSeo.ts
src/utils/productsSearch.ts
src/utils/pricing.ts
```

Supabase production target:

```text
supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql
future sitemap/feed/catalog lookup migrations or Edge/server redirect functions
```

Docs and board target:

```text
.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md
.seo-work/reports/SEO-ARCHITECTURE-AUDIT-2026-06-21.md
.seo-work/reports/TECHNICAL-SEO-AUDIT-2026-06-21.md
.seo-work/reports/LOCAL-SEO-AUDIT-2026-06-21.md
.seo-work/reports/PRODUCT-SEO-AUDIT-2026-06-21.md
.seo-work/reports/SERVICE-CONTENT-EVALUATION-2026-06-21.md
FIGMA_SKELETON_AUDIT_REPORT.md
FULL_SYSTEM_QA_REPORT.md
CATALOG_LEGACY_CLEANUP_*.md
TIRE_STORAGE_BACKEND_DEVELOPMENT_PLAN.md
```

Provider and platform targets:

```text
Supabase project ref: rcmmbwdebnmicrweoiyz
Supabase MCP: supabase-mitra
Google Business Profile
Google Search Console
Google Merchant Center
GA4/GTM or equivalent analytics
Hosting/edge redirect layer
```

Reference-only or evidence source:

```text
.seo-work/**
.growth-work/**
historical QA and catalog cleanup reports
```

Rules:

- Growth workspace files must not contain secrets or raw personal data.
- Supabase migrations, provider scripts, SQL tests, and provider logs do not belong in Figma Make.
- Figma Make files must be copied from local source when the skeleton has stale imports.
- Product URL, sitemap, schema, feed, cart, and checkout policy must use one source-governed product data contract.

## Product And Runtime Decisions

Locked decisions:

- Canonical product URLs use human-readable slugs.
- UUID, EAN, derived EAN, and supplier code are legacy identifiers only.
- Old product identifiers must resolve and should receive HTTP 301/308 to canonical slug URLs when host/edge lookup is available.
- Dynamic product sitemap is required for product discovery.
- Generated service pages remain `noindex, follow` until promoted with unique evidence.
- Product `Offer` schema is emitted only when a valid positive visible price exists.
- Review/rating schema stays absent until authentic, visible, eligible, permissioned, and source-governed reviews exist.
- LocalBusiness schema must match visible NAP and real-world operation.
- Service schema must match visible service content and is semantic-only where no Google service rich result applies.
- Measurement must separate visits, leads, bookings, accepted bookings, completed services, paid orders, revenue, cash, and margin.

Runtime blockers must appear as:

- missing Supabase migration,
- missing host/edge redirect capability,
- missing product sitemap generator,
- missing GBP owner confirmation,
- missing analytics/Search Console/Merchant Center access,
- missing booking/order reconciliation,
- route returns wrong status or wrong canonical,
- visible data conflicts with schema/feed/cart/checkout,
- Figma Make source mismatch or stale import.

Runtime blockers must not appear as:

- fake success,
- placeholder facts,
- client-only redirect treated as completed migration,
- hidden schema claims,
- arbitrary filter pages,
- local-only analytics claims,
- unverified GBP/category/hours assumptions.

Provider decisions:

- Before Supabase work, run `source ~/.config/projects/bin/project && project mitraauto`.
- Confirm `SUPABASE_PROJECT_REF=rcmmbwdebnmicrweoiyz`.
- Confirm `codex mcp get supabase-mitra`.
- Confirm required secret status as `set` or `missing` only.
- Run harmless readback before any write.
- Apply only the smallest explicit provider write.
- Verify through provider readback, SQL/RPC smoke, live route behavior, or dashboard state.

## Pre-Implementation Analysis

Recorded: 2026-06-21

Decision: clear to use this board as the active Mitra Growth Readiness workstream. Phase A is already closed from the completed audit/report consolidation. Implementation resumes at `B-1`.

Product Design context gate:

- `product-design:get-context`: not needed for this docs-only board conversion.
- Product: Mitra Auto public website and catalog.
- Users: search visitors, local service customers, tire/rim buyers, returning Tire Hotel customers, business operators.
- Screen/flow: public homepage, local/contact, service pages, catalog, product detail, booking, checkout, Figma Make preview.
- Figma source: `https://github.com/phatleatfinepass/Mitraauto.git`.
- Interactivity level: production website and operational growth system.

Current source evaluation:

| Source | Finding | Board action |
| --- | --- | --- |
| `.seo-work/reports/SEO-ARCHITECTURE-AUDIT-2026-06-21.md` | Slug-first product route work exists locally. Product migration and source-level redirects are now implemented; sitemap, SSR/prerender, production redirect verification, and 404 policy remain open. | Phase B. |
| `.seo-work/reports/TECHNICAL-SEO-AUDIT-2026-06-21.md` | Noindex/schema/head improvements exist locally. Live HTTP validation remains open. | Phase B and E. |
| `.seo-work/reports/LOCAL-SEO-AUDIT-2026-06-21.md` | Shared business profile and LocalBusiness schema exist. GBP owner evidence is missing. | Phase C. |
| `.seo-work/reports/PRODUCT-SEO-AUDIT-2026-06-21.md` | Product schema and catalog SEO improved. Product sitemap, feed, category landings, and lifecycle rules remain open. | Phase B and C. |
| `.seo-work/reports/SERVICE-CONTENT-EVALUATION-2026-06-21.md` | Ten bespoke service pages exist, but content is too generic for strong local/service SEO. | Phase C. |
| `FIGMA_SKELETON_AUDIT_REPORT.md` | Figma Make skeleton has stale imports and missing utilities. | Phase B and E. |
| `FULL_SYSTEM_QA_REPORT.md` | Historical QA defects passed, but current SEO changes need fresh browser/live validation. | Phase E. |
| `CATALOG_LEGACY_CLEANUP_PHASE10_BACKEND_RETIREMENT.md` | Legacy catalog path is retired; current lifecycle is raw supplier -> selected winner -> CMS -> webshop_items -> public catalog RPCs. | Phase B product/source contract. |
| `TIRE_STORAGE_BACKEND_DEVELOPMENT_PLAN.md` | Tire Storage is retention-relevant but incomplete beyond backend foundation/admin RPC layer. | Phase C/D retention handoff. |

Current runtime evaluation:

| Source | Finding | Board action |
| --- | --- | --- |
| `supabase-mitra` | Product slug migration is local, not yet proven applied in target project. | `B-1`. |
| Hosting/edge layer | Dynamic product identifier redirects require lookup-capable middleware or equivalent. | `B-2`. |
| Static sitemap | Canonical commercial URLs exist locally; D-3 found deployed sitemap/feed/static artifact mismatch on production. | `B-3`, `D-3`, `E-3`. |
| Google Business Profile | Not accessed from repo audit. | `C-1`. |
| Search Console/analytics/Merchant Center | D-3 recorded missing authenticated access and public production robots/sitemap/feed mismatch. | `D-3`, `D-5`, `E-3`. |
| Figma Make preview | `CONTACT_INFO` crash fixed locally, but skeleton source sync remains a risk. | `B-1`, `E-1`. |

Risks found before implementation:

| Risk | Owner task | Decision |
| --- | --- | --- |
| Client-rendered SPA may delay or weaken search-critical rendering evidence. | `B-5` | Decide SSR/prerender/edge rendering or accept with rendered evidence. |
| Product identifier migration is incomplete without HTTP redirects. | `B-2` | Treat as blocker unless owner accepts documented limitation. |
| Product discovery is incomplete without product sitemap/feed. | `B-3`, `B-4` | Build sitemap first, then feed governance. |
| Local SEO facts are not owner-confirmed in GBP. | `C-1` | Cannot close local readiness from repo only. |
| Content priorities are not supported by competitor/SERP/customer evidence. | `C-2`, `C-3`, `D-5` | Treat category/guide work as hypothesis until research is run. |
| Analytics cannot prove business value without reconciliation. | `D-1`, `D-2` | Measurement gate blocks growth-ready classification. |

Pre-implementation verification:

- `cat PLUSSA_MODULE_BOARD_STANDARD_TEMPLATE.md`: passed, template read.
- Plussa boards directory scan: passed, 11 board files found.
- `.seo-work/reports/*.md`: previously read for board construction.
- `git diff --check` on this board: passed after standard-board conversion.

## Phase A - Audit, Source Inventory, And Growth Contract

Progress: `[█████] 100%`

Purpose: close the evidence-gathering and board-contract phase. Phase A is documentation and analysis only; it does not authorize provider changes.

| Task | Name | Owner | Status | Exit condition |
| --- | --- | --- | --- | --- |
| A-1 | SEO and Growth report inventory | Docs/SEO | Done | All primary `.seo-work` reports and supporting project reports are listed as evidence sources. |
| A-2 | Public route and product URL contract | SEO/Engineering | Done | Route families, indexability, canonical, redirect, sitemap, schema, and internal-link policies are frozen. |
| A-3 | Local, schema, and business facts contract | Local SEO/Business | Done | Business-profile source, schema rules, GBP dependencies, and review restrictions are recorded. |
| A-4 | Content, product, and Tire Storage backlog contract | Content/Catalog/Ops | Done | Service/product/category/Tire Storage workstreams and acceptance expectations are recorded. |
| A-5 | Board standard conversion and Phase B readiness | Docs/Growth | Done | Board follows Plussa A-E task standard and resumes at `B-1`. |

### A-1 Detailed Checklist - SEO And Growth Report Inventory

- [x] Inspect `.seo-work/reports`.
- [x] Inspect supporting Figma, QA, catalog cleanup, and Tire Storage reports.
- [x] Separate executed evidence from unavailable platform/live evidence.
- [x] Record source reports in this board.
- [x] Assign unresolved evidence gaps to later phases.

### A-1 Closeout - SEO And Growth Report Inventory

Status: Done

Recorded: 2026-06-21

Summary:

- Primary SEO reports and supporting operational reports were inventoried.
- Evidence gaps are recorded in Pre-Implementation Analysis.
- Platform/live evidence is not treated as passed.

Implementation code changes: none.

Verification:

```text
rg --files .seo-work/reports: passed
wc -l .seo-work/reports/*.md supporting reports: passed
```

Blockers:

- None. Platform evidence gaps are assigned to later phases.

### A-2 Detailed Checklist - Public Route And Product URL Contract

- [x] Identify every public route family.
- [x] Classify indexable, noindex utility, private/admin, and unknown routes.
- [x] Freeze product slug policy.
- [x] Freeze redirect and sitemap policy.
- [x] Assign runtime work to Phase B.

### A-2 Closeout - Public Route And Product URL Contract

Status: Done

Recorded: 2026-06-21

Summary:

- Product URLs must be human-readable slugs.
- Opaque UUID/EAN/supplier-code routes are legacy identifiers only.
- Product sitemap and HTTP-level redirects are Phase B blockers.

Implementation code changes: none.

Verification:

```text
SEO architecture route matrix: reviewed
Technical SEO route policy matrix: reviewed
Product SEO route policy matrix: reviewed
```

Blockers:

- None for Phase A. Runtime implementation starts in `B-1`.

### A-3 Detailed Checklist - Local, Schema, And Business Facts Contract

- [x] Identify website business-profile source.
- [x] Record LocalBusiness/schema rules.
- [x] Record GBP owner dependencies.
- [x] Record review/rating restrictions.
- [x] Assign owner-confirmed local facts to Phase C.

### A-3 Closeout - Local, Schema, And Business Facts Contract

Status: Done

Recorded: 2026-06-21

Summary:

- `src/config/businessProfile.ts` is the website business profile source.
- GBP, special hours, categories, services, photos, appointment URL, and review SOP remain owner/platform work.
- Schema must match visible and verified content.

Implementation code changes: none.

Verification:

```text
Local SEO audit: reviewed
Product SEO schema policy: reviewed
Service technical schema policy: reviewed
```

Blockers:

- GBP evidence assigned to `C-1`.

### A-4 Detailed Checklist - Content, Product, And Tire Storage Backlog Contract

- [x] Classify P1/P2 service pages.
- [x] Record generated service noindex policy.
- [x] Record product/category content requirements.
- [x] Record Tire Storage retention impact and incomplete phases.
- [x] Assign implementation work to Phase C/D.

### A-4 Closeout - Content, Product, And Tire Storage Backlog Contract

Status: Done

Recorded: 2026-06-21

Summary:

- P1 service pages need verified operational proof, safety limits, duration, exclusions, aftercare, reviewer, and media.
- Product pages need tire/rim content modules and category landing policy.
- Tire Storage is a retention opportunity but remains incomplete past backend/admin RPC groundwork.

Implementation code changes: none.

Verification:

```text
Service content evaluation: reviewed
Product SEO audit: reviewed
Tire Storage backend plan: reviewed
```

Blockers:

- Content implementation assigned to `C-2` and `C-3`.

### A-5 Detailed Checklist - Board Standard Conversion And Phase B Readiness

- [x] Read Plussa board standard template.
- [x] Inspect Plussa board examples.
- [x] Convert Mitra board to A-E phase discipline.
- [x] Set current phase/task/progress.
- [x] Assign active implementation start to `B-1`.

### A-5 Closeout - Board Standard Conversion And Phase B Readiness

Status: Done

Recorded: 2026-06-21

Summary:

- Board now follows the Plussa A-E phase and 25-task-slot tracking model.
- Phase A is closed as analysis and board setup.
- Current task should be read from the board header; the board has advanced beyond Phase A setup.

Implementation code changes:

- `.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md` rewritten to standard board shape.

Verification:

```text
PLUSSA_MODULE_BOARD_STANDARD_TEMPLATE.md: read
Plussa boards directory: scanned
git diff --check: passed after standard-board conversion
```

Blockers:

- None for Phase A.

### Phase A Wrap-Up - Audit, Source Inventory, And Growth Contract

Status: Complete locally

Progress: `[█████] 100%`

Recorded: 2026-06-21

What is ready:

- Phase A audit is complete as a docs/source-inventory phase.
- Primary SEO reports and supporting operational reports are listed and classified.
- Public route, product URL, schema, local, content, and measurement contracts are frozen enough to start Phase B.
- Unavailable evidence is not treated as passed; it is assigned to exact later phases.
- Board now uses the Plussa A-E / 25-task-slot model.
- Progress is reported at the board header, phase header, phase wrap-up, and board wrap-up levels only; task closeouts record status and evidence, not separate progress bars.

Audit result:

| Area | Phase A decision | Next owner |
| --- | --- | --- |
| Source inventory | Complete locally. The five `.seo-work/reports` are the primary SEO evidence; Figma, QA, catalog cleanup, and Tire Storage reports are supporting evidence. | Phase B/E for runtime and release evidence. |
| Route architecture | Contract frozen. Public route families, utility/private route policy, generated-service noindex policy, and product slug policy are known. | Phase B. |
| Product SEO | Contract frozen. Slug URLs, legacy identifier redirects, product sitemap, Product schema, and feed/page/cart consistency are required. | Phase B. |
| Local SEO | Repo foundation exists, but owner/platform proof is missing. | Phase C. |
| Service content | Audit complete. P1 service pages need original proof, safety limits, exclusions, duration, aftercare, reviewer, and media. | Phase C. |
| Schema | Policy frozen. Markup must match visible verified content and cannot invent reviews, ratings, offers, stock, locations, or policies. | Phase C/B. |
| Measurement | Not ready. KPI tree, events, platform access, and booking/order reconciliation are missing. | Phase D. |
| Figma Make | Risk identified. Local source has the `CONTACT_INFO` fix; Figma Make still needs source sync verification. | Phase B/E. |
| Tire Storage | Retention opportunity identified, but not public-growth ready. | Phase C/D handoff. |

What is not ready:

- Provider, live crawl, platform, measurement, GBP, Merchant Center, and browser evidence remain open.
- Supabase slug migration is not recorded as applied in the target project.
- HTTP-level legacy product redirects are not recorded.
- Dynamic product sitemap is not implemented.
- GBP owner facts are not verified.
- Analytics/Search Console/Merchant Center access is not recorded.
- No production live crawl or fresh browser QA exists for the current SEO changes.

Verification:

```text
Template read: passed
Plussa board directory and standard examples: reviewed
Mitra SEO reports: reviewed
Mitra supporting reports: reviewed
Board conversion: complete locally
```

Provider evidence:

- Not applicable in Phase A.

Figma Make evidence:

- Not applicable in Phase A.

Decision:

```text
Phase A is closed.
It is safe to continue to Phase B because the route/product migration work is clearly scoped and blocked evidence is assigned to later phases.
Next task is B-2 - Product Redirect And Legacy URL Migration.
```

## Phase B - Technical And Product SEO Runtime

Progress: `[█████] 100%`

Purpose: close the technical/product runtime blockers that prevent Mitra from being growth-ready: source sync, Supabase slug migration, legacy redirects, dynamic product sitemap, product data reconciliation, and live-rendered technical validation.

| Task | Name | Owner | Status | Exit condition |
| --- | --- | --- | --- | --- |
| B-1 | Source Sync And Supabase Slug Migration Gate | Engineering/Supabase | Done | GitHub/Figma Make sync protocol is confirmed; `supabase-mitra` migration is applied and product slug/legacy lookups pass. |
| B-2 | Product Redirect And Legacy URL Migration | Engineering/Hosting | Done | Old product identifiers and legacy public paths return one-hop 301/308 to canonical targets in source-level redirect handlers; production verification remains B-5/E. |
| B-3 | Dynamic Product Sitemap And Lifecycle Status | Engineering/Catalog | Done | Product sitemap emits only product-ready canonical slug URLs and lifecycle status behavior is defined. |
| B-4 | Product Schema, Feed, Cart, And Checkout Reconciliation | Catalog/Commerce/Engineering | Done | Product page, JSON-LD, cart, checkout, Merchant feed export, and server-side checkout validation share the same product commerce contract. |
| B-5 | Technical Runtime QA Closeout | QA/Engineering/SEO | Done | Rendered-route audit, build checks, sitemap parse, route head checks, and SPA/SSR decision evidence are recorded. |

### Phase B Extra Layer - Runtime Assurance And Evidence Controls

Recorded: 2026-06-22

Purpose: keep Phase B auditable after implementation by separating source completion, local runtime evidence, edge behavior, production verification, platform evidence, and future drift monitoring.

| Layer | Purpose | Status | Owner |
| --- | --- | --- | --- |
| L0 Source contract | Repo files, migrations, route policy, scripts, and data contracts exist. | Passed locally | Engineering |
| L1 Deterministic local runtime | Build, i18n, XML, sitemap, feed, commerce, function type checks, and browser-rendered head/schema pass locally. | Passed locally with one performance warning | Engineering/SEO QA |
| L2 Edge and host behavior | Cloudflare Pages Function supports product redirects and confirmed-missing product 404 behavior. | Smoke-tested locally with mocked provider responses | Hosting/Engineering |
| L3 Production evidence | Deployed redirects, sitemap/feed fetches, HTTP status, rendered schema, and checkout behavior are tested on `https://www.mitra-auto.fi`. | Not executed in Phase B | E-3 Release QA |
| L4 Platform and outcome evidence | Search Console, Merchant Center, Business Profile, analytics, booking/order outcomes, and field performance prove external system health. | Unavailable in Phase B | Phase C/D/E owners |
| L5 Drift monitoring | Future changes compare status, canonicals, metadata, schema, feeds, and product lifecycle states against baselines. | Specified, not automated | E-4/Growth Ops |

Evidence coverage:

| Evidence mode | State | Phase B note |
| --- | --- | --- |
| `REPO` | `EXECUTED_WITH_FINDINGS` | Source and board artifacts inspected; Phase B findings fixed locally. |
| `BUILD` | `EXECUTED_WITH_FINDINGS` | Build passed; remaining warning is the large main JS chunk. |
| `LIVE` | `UNAVAILABLE` | Production crawl was not run; E-3 owns deployed host verification. |
| `BROWSER` | `EXECUTED_WITH_FINDINGS` | MCP browser checks covered representative home, local, catalog, product, checkout, and not-found routes. |
| `PLATFORM` | `UNAVAILABLE` | Search Console, Merchant Center, Business Profile, analytics, and CrUX were not accessed. |
| `CONTENT` | `SUPPLIED_REVIEW_REQUIRED` | Prior content audits exist; Phase B scope was runtime. |
| `CONVERSION` | `EXECUTED_WITH_FINDINGS` | Product commerce contract and checkout revalidation checks passed locally. |
| `MIGRATION` | `EXECUTED_WITH_FINDINGS` | Slug migration, legacy redirects, sitemap-canonical alignment, and product 404 logic were implemented and smoke-tested. |

Controls closed or handed off:

| Control | Result | Handoff |
| --- | --- | --- |
| `TECH-005` canonical consistency | Passed locally for sampled product sitemap URLs. | E-3 production crawl. |
| `TECH-007` server-side redirects | Source implemented and smoke-tested. | E-3 deployed redirect crawl. |
| `TECH-008` missing content 404/410 | Product 404 edge behavior smoke-tested; generic missing route requires host policy verification. | E-3 deployed status check. |
| `TECH-009` sitemap canonical URLs | Product sitemap validates with 60,918 URLs. | E-3 deployed sitemap fetch/header check. |
| `JS-004` deterministic client-route head | Representative rendered route head/schema checks passed after B-5 fixes. | E-3 live rendered checks. |
| `SCHEMA-011` Product/Offer consistency | Product page, schema, feed, cart, checkout, and Paytrail validation share the commerce contract. | Merchant Center and live checkout checks. |
| `COM-012` utility noindex | Checkout noindex/no-canonical behavior passed browser check. | E-3 production browser check. |
| `OPS-006` drift baseline | Baseline URL set and fields are defined in the Phase B wrap-up report. | E-4 monitoring automation. |

Residual risks:

- Deployed host execution is not verified.
- Merchant Center diagnostics and approval are not verified.
- Paytrail server-side revalidation is not provider-tested on the deployed function.
- Main JS bundle remains large at roughly 2.62 MB minified, about 662 kB gzip in B-5 build output.
- Search Console, analytics, Business Profile, CrUX, and server-log evidence are unavailable.
- Product canonical URL collisions are deduped in sitemap output but should still receive catalog cleanup.

Primary artifact:

```text
.seo-work/reports/PHASE-B-TECHNICAL-PRODUCT-SEO-RUNTIME-AUDIT-WRAPUP-2026-06-22.md
```

### Phase B Pre-Analysis - Technical And Product SEO Runtime

Recorded: 2026-06-21

Status: Pre-implementation analysis recorded. No runtime code, provider migration, hosting redirect, or feed implementation is authorized by this section.

Decision: `B-1` is complete; continue to `B-2`. Do not run additional provider-changing operations until the relevant target and owner gates are confirmed.

Product Design context gate:

| Question | Answer |
| --- | --- |
| Is this a visual/product-design implementation task? | No. This is a technical/product SEO runtime planning gate. |
| Is Figma context required before implementation? | Only for source sync/crash parity in `B-1` and later final QA in `E-1`; not for the Phase B runtime contract. |
| Is implementation allowed by this entry? | No. This entry defines gates, risks, and required evidence before changes begin. |

Evidence mode:

| Surface | Current Phase B status | Evidence note |
| --- | --- | --- |
| Repository source | Available | Local worktree contains slug helpers, product detail routing, product schema work, static sitemap updates, and the Supabase slug/identifier migration file. |
| Build/runtime verification | Not current for Phase B | Prior build evidence exists, but `B-5` must rerun after Phase B runtime work. |
| Supabase target | Not verified in Phase B | `project mitraauto` and `codex mcp get supabase-mitra` must be confirmed before migration apply or SQL reads that affect implementation decisions. |
| Hosting/edge redirects | Not verified | SPA `replaceState` canonicalization exists, but HTTP 301/308 behavior cannot be proven from the client app. |
| Live crawl/rendered head | Not verified | Production status codes, rendered canonical, JSON-LD, and invalid-route behavior remain open. |
| Merchant/product feed | Not available | Feed policy must be drafted from product contract before Merchant Center or feed implementation can be considered complete. |
| Figma Make source | Plan confirmed | Local code no longer has live `CONTACT_INFO` source references. GitHub/Figma Make source sync protocol is recorded in `B-1`; final preview parity remains `E-1`. |

Current source evaluation:

| Source | Phase B read | Runtime implication |
| --- | --- | --- |
| `src/utils/catalogSeo.ts` | Builds human-readable tire/rim identifiers, rejects opaque UUID/GTIN/supplier-code identifiers when better slug material exists, and parses `/catalog/{type}/{identifier}` plus `/en/catalog/{type}/{identifier}`. | Acceptable as local canonical path helper, but uniqueness/collision behavior must be proven against Supabase rows. |
| `src/utils/productsSearch.ts` | Product detail direct-load depends on `catalog_get_tire_by_identifier_v1` and `catalog_get_rim_by_identifier_v1`. | Direct product URL loads are blocked until migration exists on the real target. |
| `supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql` | Adds public-ready indexes and RPC lookup by UUID, stored slug, generated slug, EAN, derived EAN, and supplier code. | Correct migration shape for slug preservation, but it is local only until target verification and apply. |
| `src/SiteApp.tsx` | Client route loader resolves product identifiers and replaces legacy/opaque path with canonical slug path after data load. | Good user fallback, but not a search migration because the initial HTTP response is still not a permanent redirect. |
| `src/components/catalog/ProductDetailPage.tsx` | Emits product canonical, alternates, Product/Offer/Breadcrumb JSON-LD, and LocalBusiness graph on the client. | Schema policy is directionally correct, but rendered/live evidence is required because head is client-managed. |
| `src/components/catalog/CatalogPage.tsx`, `TireCard.tsx`, `RimCard.tsx` | Product cards have crawlable `href` paths to slug-first detail pages. | Internal-link policy is usable if every href resolves to canonical slug URLs and does not point to legacy identifiers. |
| `src/public/sitemap.xml` | Static sitemap includes core/local/service/catalog routes only. | Product discovery remains incomplete until a dynamic or generated product sitemap emits canonical product slug URLs. |
| `src/components/site/sections/ContactSection.tsx` | Local source no longer depends on undefined `CONTACT_INFO`. | Figma Make crash validation is assigned to `E-1` after source refresh/rebuild. |

Runtime/provider evaluation:

| Runtime dependency | Current status | Required before implementation close |
| --- | --- | --- |
| Supabase project | Not confirmed during Phase B analysis | Load `project mitraauto`, verify `SUPABASE_PROJECT_REF=rcmmbwdebnmicrweoiyz`, verify `supabase-mitra`, and run a harmless read. |
| Product slug RPCs | Local migration file only | Apply migration only after target verification, then smoke tire/rim lookup by slug, UUID, EAN, derived EAN, and supplier code. |
| Host redirect layer | Unknown | Decide whether redirects live in hosting middleware, edge function, CDN worker, or accepted limitation. Static redirect maps are not enough for product identifier migration unless the product set is frozen. |
| Dynamic product sitemap | Missing | Implement query-backed or build-generated sitemap using canonical product slug URL policy and lifecycle filters. |
| Product feed | Missing | Define feed fields and reconcile against visible page, schema, cart, and checkout before Merchant Center submission. |
| HTTP 404/410 | Unknown | Invalid product/service routes need real status behavior or a documented SSR/prerender/edge-rendering plan. |

Implementation boundaries:

| Task | Boundary before code/provider work |
| --- | --- |
| `B-1` | Source sync and Supabase migration may start only after project wrapper, MCP target, secret status, and harmless readback are recorded. |
| `B-2` | Client `replaceState` is not a redirect policy. Product legacy identifiers require one-hop HTTP 301/308 to the canonical slug URL or an owner-approved temporary limitation. |
| `B-3` | Sitemap output must include canonical product slugs only; hidden, draft, private, unavailable-permanent, redirect, error, noindex, and unusable no-price rows must be excluded. |
| `B-4` | Product page, JSON-LD, feed, cart, and checkout must use the same price, VAT, currency, availability, seller, GTIN/EAN, SKU/MPN, image, and canonical URL decisions. |
| `B-5` | Build, i18n audit, diff check, sitemap parse, rendered-head inspection, invalid-route status, and SPA/SSR decision evidence are required before Phase B can close. |

Blockers and risks:

| Blocker or risk | Owner task | Decision |
| --- | --- | --- |
| Figma Make final preview parity not verified | `E-1` | B-1 source sync protocol is confirmed; final Make preview validation remains release QA. |
| Product slug uniqueness/collision behavior only smoke-sampled | `B-1` | B-1 lookup smoke passed; broader collision audit can move to product sitemap/runtime QA. |
| Remote migration history has pre-existing drift | `B-1` | Do not run broad migration-up commands until migration history is reconciled. |
| Production HTTP redirect behavior not live-verified | `B-5`, `E-3` | Source-level static and edge redirects are implemented; deploy/live crawl must prove host execution. |
| Product sitemap production fetch not verified | `B-5`, `E-3` | Source-generated product sitemap exists and passes local validation; deployed fetch and crawl behavior remain release evidence. |
| Merchant feed submission and deployed checkout revalidation not verified | `B-5`, `E-3` | Source feed export and Paytrail server-side validation are implemented; production/provider verification remains. |
| Product schema is client-managed | `B-5` | Verify rendered head or decide SSR/prerender/edge-rendering. |
| SPA invalid-route status behavior unknown | `B-5` | Verify real 404/410 behavior or record runtime architecture fix. |
| Figma Make source may still be stale | `E-1` | Refresh from the confirmed GitHub source plan and verify the preview no longer throws `CONTACT_INFO`. |

Go / stop rules before implementation:

| Rule | Outcome |
| --- | --- |
| `project mitraauto` does not load expected directory, slug, URL, and project ref | Stop provider work. |
| `supabase-mitra` is missing, unauthenticated, or points anywhere except `rcmmbwdebnmicrweoiyz` | Stop provider work. |
| Product identifier lookup regresses on representative tire and rim rows | Stop Phase B closeout and reopen the Supabase slug migration gate. |
| Hosting cannot support dynamic product redirect lookup | Keep `B-2` open unless owner accepts a documented temporary limitation. |
| Product sitemap cannot exclude noncanonical or not-product-ready rows | Keep `B-3` open. |
| Page/schema/feed/cart/checkout disagree on price, URL, availability, seller, or identifiers | Keep `B-4` open. |
| Rendered routes or invalid routes cannot be verified | Keep `B-5` open and escalate SSR/prerender/edge-rendering decision. |

Initial implementation order:

1. Verify project wrapper and `supabase-mitra` target.
2. Confirm local/Figma source parity and `CONTACT_INFO` crash resolution.
3. Apply and smoke the Supabase slug/identifier lookup migration.
4. Implement HTTP legacy product redirects.
5. Add dynamic/generated product sitemap with lifecycle filters.
6. Reconcile product page, schema, feed, cart, and checkout samples.
7. Run full runtime QA and record the SSR/prerender/edge status decision.

### B-1 Detailed Checklist - Source Sync And Supabase Slug Migration Gate

- [x] Confirm local dirty/untracked growth-critical files.
- [x] Confirm GitHub/Figma Make source sync plan.
- [x] Run `rg CONTACT_INFO` and verify zero remaining references.
- [x] Load `project mitraauto`.
- [x] Verify `supabase-mitra` points to `rcmmbwdebnmicrweoiyz`.
- [x] Confirm secret status without printing values.
- [x] Run harmless Supabase readback.
- [x] Apply `supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql`.
- [x] Smoke tire/rim detail lookup by slug, UUID, EAN, derived EAN, supplier code.
- [x] Record closeout evidence and update progress.

### B-1 Closeout - Source Sync And Supabase Slug Migration Gate

Status: Done

Recorded: 2026-06-21

Summary:

- Local growth-critical source is dirty/untracked as expected for the active SEO worktree.
- Local source no longer contains `CONTACT_INFO` references under `src`.
- Project wrapper loaded the expected Mitra target: `PROJECT_DIR=/Users/chandler/code/Mitraauto-main`, `PROJECT_SLUG=mitraauto`, `SUPABASE_PROJECT_REF=rcmmbwdebnmicrweoiyz`, `SUPABASE_URL=https://rcmmbwdebnmicrweoiyz.supabase.co`.
- Secret-bearing database URLs were present but not printed.
- `supabase-mitra` is configured for `project_ref=rcmmbwdebnmicrweoiyz`.
- Harmless Postgres readback reached database `postgres` as `postgres` on Postgres `17.6`.
- Migration `20260621090000_catalog_slug_identifier_routes` was not applied before this task, then was applied directly as the smallest explicit write because the repo/remote migration history has unrelated drift.
- Supabase migration history was repaired for only `20260621090000` after the SQL apply succeeded.
- Product slug/legacy lookup smoke tests passed for tire and rim UUID, generated slug, EAN, derived EAN, and supplier-code identifiers.
- Stored SEO slug lookup passed where live data exists: public-ready tire stored slugs exist; public-ready rim stored slugs do not currently exist in the sampled database.
- GitHub remote is `https://github.com/phatleatfinepass/Mitraauto.git` on local branch `codex/pwa-cloudflare`.
- Remote branch inventory confirms `main` and `codex/pwa-cloudflare` exist.
- GitHub/Figma Make sync plan is confirmed; no push or Figma import was performed during this board update.

Confirmed GitHub/Figma Make source sync plan:

| Step | Owner | Gate |
| --- | --- | --- |
| 1. Keep `https://github.com/phatleatfinepass/Mitraauto.git` as the Figma Make source repository. | Engineering | `git remote -v` must show this repo as `origin`. |
| 2. Continue source work on `codex/pwa-cloudflare` until Phase B implementation is ready for review. | Engineering | Local branch must match the remote branch name before push. |
| 3. Commit and push the complete growth-ready source set, including `.growth-work`, `.seo-work`, `src/config/businessProfile.ts`, `src/utils/catalogSeo.ts`, `src/utils/localSeo.ts`, SEO route/component changes, and `supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql`. | Engineering | Do not omit the migration or new SEO utility files from the source sync. |
| 4. If Figma Make tracks `main`, merge through PR from `codex/pwa-cloudflare` into `main` after build and review pass. If Figma Make is configured to track `codex/pwa-cloudflare`, refresh/import that branch directly. | Engineering/Figma owner | One branch must be selected as the Figma Make source before preview validation. |
| 5. Rebuild/refresh Figma Make from the selected GitHub branch. | Figma owner | Preview must compile from GitHub source, not stale Make-local files. |
| 6. Validate the original Make crash is gone. | QA/Figma owner | `ContactSection` must not throw `ReferenceError: CONTACT_INFO is not defined`. |
| 7. Record the final Figma preview URL/status in `E-1` final source parity QA. | QA | B-1 does not require live Figma preview proof after this confirmed protocol; E-1 owns final parity verification. |

Files:

| File | Path | Purpose |
| --- | --- | --- |
| `businessProfile.ts` | `src/config/businessProfile.ts` | Shared business profile source. |
| `localSeo.ts` | `src/utils/localSeo.ts` | Local SEO metadata/schema helpers. |
| `catalogSeo.ts` | `src/utils/catalogSeo.ts` | Product slug and canonical URL helpers. |
| `20260621090000_catalog_slug_identifier_routes.sql` | `supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql` | Product identifier/slug lookup migration. |

Verification:

```text
curl -fsSL https://supabase.com/changelog.md | sed -n '1,120p':
reviewed 2026 Supabase changelog; Data API exposure change noted, no blocker for this function/index migration.

source ~/.config/projects/bin/project && project mitraauto:
PROJECT_DIR=/Users/chandler/code/Mitraauto-main
PROJECT_SLUG=mitraauto
SUPABASE_PROJECT_REF=rcmmbwdebnmicrweoiyz
SUPABASE_URL=https://rcmmbwdebnmicrweoiyz.supabase.co
DATABASE_URL_STATUS=set
TRANSACTION_POOLER_STATUS=set
SESSION_POOLER_STATUS=set

codex mcp get supabase-mitra:
url=https://mcp.supabase.com/mcp?project_ref=rcmmbwdebnmicrweoiyz

psql harmless readback:
postgres|postgres|17.6|2026-06-21

pre-apply migration history:
20260621090000 -> not_applied

psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql:
SET, SET, CREATE FUNCTION x2, CREATE INDEX x7, CREATE FUNCTION x2, REVOKE x4, GRANT x4

supabase migration repair 20260621090000 --status applied --db-url "$DATABASE_URL" --yes:
Repaired migration history: [20260621090000] => applied

post-apply migration history:
20260621090000

post-apply function inventory:
public.catalog_get_rim_by_identifier_v1|p_identifier text|security_definer
public.catalog_get_tire_by_identifier_v1|p_identifier text|security_definer
public.catalog_public_product_slug|...|security_invoker
public.catalog_slugify_public_path_segment|p_value text|security_invoker

post-apply index inventory:
webshop_items_rim_public_ready_generated_slug_idx
webshop_items_rim_public_ready_supplier_code_idx
webshop_tire_search_index_public_ready_derived_ean_idx
webshop_tire_search_index_public_ready_ean_idx
webshop_tire_search_index_public_ready_generated_slug_idx
webshop_tire_search_index_public_ready_seo_slug_idx
webshop_tire_search_index_public_ready_supplier_code_idx

tire RPC smoke:
tire_uuid pass
tire_generated_slug pass
tire_ean pass
tire_derived_ean pass
tire_supplier_code pass
tire_stored_seo_slug pass

rim RPC smoke:
rim_uuid pass
rim_generated_slug pass
rim_ean pass
rim_derived_ean pass
rim_supplier_code pass

stored SEO slug data availability:
tire_stored_seo_slug rows=2
rim_stored_seo_slug rows=0

rg -n "CONTACT_INFO" src || true:
no output

git remote -v:
origin https://github.com/phatleatfinepass/Mitraauto.git (fetch)
origin https://github.com/phatleatfinepass/Mitraauto.git (push)

git branch --show-current:
codex/pwa-cloudflare

git ls-remote --heads origin:
refs/heads/codex/pwa-cloudflare
refs/heads/main
```

Blockers:

- Remote migration history has pre-existing drift: many local migrations are not marked remote and one remote migration is missing locally. This is why `supabase migration up` was not used.
- The public RPCs use `SECURITY DEFINER`, matching existing project practice for public catalog functions. This was reviewed as constrained to visible, published, product-ready catalog rows, but it should remain part of the Supabase security review backlog.

### B-2 Detailed Checklist - Product Redirect And Legacy URL Migration

- [x] Inventory old product identifier URL patterns.
- [x] Inventory legacy content paths such as `/shop`, `/en/shop`, `/services`, `/about`, `/legal/privacy`, and `/legal/terms`.
- [x] Decide edge/server redirect implementation.
- [x] Add redirect-map test.
- [x] Verify one-hop permanent redirects with relevant destination.
- [x] Record owner-accepted limitation if lookup redirects cannot be implemented immediately.

### B-2 Closeout - Product Redirect And Legacy URL Migration

Status: Done

Recorded: 2026-06-21

Summary:

- Fixed legacy content paths now have permanent redirects in `src/public/_redirects` before the SPA fallback.
- Added static 301 redirects for legacy catalog, service hub, about, legal, local service alias, and DPF alias paths.
- Added a Cloudflare Pages-compatible catch-all edge function at `functions/[[path]].ts` for dynamic product identifier redirects.
- Dynamic product redirects parse `/catalog/{tire|rim}/{identifier}` and `/en/catalog/{tire|rim}/{identifier}`.
- Opaque product identifiers are UUIDs, long hex IDs, GTIN/EAN values, and supplier-code patterns with digits.
- The edge handler calls the public Supabase product identifier RPCs, builds the canonical human-readable slug, strips query/hash, and returns a one-hop `308` to the canonical product URL.
- Non-opaque slug URLs pass through to the app to avoid over-redirecting valid product slugs or short nonunique supplier labels.
- Added `scripts/check_seo_redirects.mjs` to verify fixed legacy redirects remain before the SPA fallback.
- No owner-approved limitation is required for source-level implementation. The remaining limitation is live host proof: the deployment platform must execute `_redirects` and the `functions/[[path]].ts` edge handler.

Files:

| File | Path | Purpose |
| --- | --- | --- |
| `_redirects` | `src/public/_redirects` | Static 301 redirects for fixed legacy content and service alias paths before SPA fallback. |
| `[[path]].ts` | `functions/[[path]].ts` | Edge product identifier redirect handler backed by Supabase public RPCs. |
| `check_seo_redirects.mjs` | `scripts/check_seo_redirects.mjs` | Source-level redirect ordering and coverage check. |

Verification:

```text
node scripts/check_seo_redirects.mjs:
SEO static redirect check passed: 15 permanent redirects before SPA fallback.

npx esbuild 'functions/[[path]].ts' --bundle --format=esm --platform=browser --outfile=/tmp/mitra-seo-redirect-function.mjs:
passed

edge handler simulation with live public Supabase RPC:
tire_ean 308 https://www.mitra-auto.fi/catalog/tire/triangle-advantex-suv-tr259-245-65-r17-111-h-summer
rim_ean 308 https://www.mitra-auto.fi/en/catalog/rim/rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-cb-65-1

npm run build:
passed; existing warning category: dynamic import chunk exceeds 500 kB.

build/_redirects:
contains the 15 fixed legacy 301 redirects before `/* /index.html 200`.
```

Blockers:

- Production host execution is not live-verified. B-5/E-3 must confirm deployed HTTP status codes for fixed redirects and dynamic product redirects.

### B-3 Detailed Checklist - Dynamic Product Sitemap And Lifecycle Status

- [x] Define product-ready query and eligibility filters.
- [x] Emit only canonical slug URLs.
- [x] Include FI/EN URLs only when indexable and canonical.
- [x] Exclude hidden, draft, private, unavailable-permanent, noindex, error, redirect, and no-price/unusable rows according to policy.
- [x] Define out-of-stock, discontinued, replacement, and retired product behavior.
- [x] Validate sitemap XML and sample URLs.

### B-3 Closeout - Dynamic Product Sitemap And Lifecycle Status

Status: Done

Recorded: 2026-06-21

Summary:

- Added a database-backed product sitemap generator at `scripts/generate_product_sitemaps.mjs`.
- Added a source-level product sitemap validator at `scripts/check_product_sitemaps.mjs`.
- Added public sitemap artifacts under `src/public`: `sitemap-products.xml`, `sitemap-products-1.xml`, and `sitemap-products-2.xml`.
- Added `sitemap:products` and `sitemap:check` package scripts.
- Added the product sitemap index to `robots.txt`.
- Added XML content-type and cache headers for `/sitemap-products*`.
- Added Supabase public source RPC `catalog_list_product_sitemap_rows_v1` through migrations `20260621204946` and `20260621205611`.
- The sitemap source includes public-ready tires and rims only: visible, published, product-ready, product type in tire/rim, and positive final price.
- The generated sitemap emits FI and EN canonical slug URLs only under `/catalog/{tire|rim}/{slug}` and `/en/catalog/{tire|rim}/{slug}`.
- The generator dedupes canonical URL collisions. Current live source produced 2,232 duplicate URL rows that are excluded from the sitemap output; slug collision cleanup remains a catalog-quality risk for B-4/B-5.
- Current live source produced 12,229 tire rows, 19,346 rim rows, 31,575 eligible products, and 60,918 unique canonical product sitemap URLs across 2 child sitemap files.
- Lifecycle policy: include in-stock and out-of-stock products when they remain visible, published, product-ready, and priced; exclude hidden, draft, private, not-ready, no-price, redirect, noindex, error, discontinued-without-replacement, and permanently retired products. Replacement and retired-product HTTP status behavior remains B-5 runtime QA because it requires route/status verification.
- Direct `product_cms` REST access is blocked by table permissions, so sitemap generation uses a constrained source RPC instead of direct table reads.
- Product sitemap generation requires `DATABASE_URL` from the Mitra project wrapper. Running without `project mitraauto` fails fast instead of generating a partial sitemap from the public REST cap.

Verification:

```text
source ~/.config/projects/bin/project && project mitraauto >/dev/null && npm run sitemap:products && npm run sitemap:check:
generatedAt=2026-06-21
tireRows=12229
rimRows=19346
eligibleProducts=31575
sitemapUrls=60918
sitemapFiles=sitemap-products-1.xml,sitemap-products-2.xml
skippedMissingSlug=0
duplicateUrlRows=2232
maxUrlsPerSitemap=45000
Product sitemap check passed: 60918 URLs across 2 file(s).

npm run sitemap:products without DATABASE_URL:
failed fast with setup message requiring `project mitraauto`

npm run sitemap:check:
Product sitemap check passed: 60918 URLs across 2 file(s).

xmllint --noout src/public/sitemap-products.xml src/public/sitemap-products-1.xml src/public/sitemap-products-2.xml src/public/sitemap.xml:
passed

npm run build:
passed; major warning category remains large minified chunks over 500 kB

ls -lh build/sitemap-products*.xml:
build/sitemap-products.xml, build/sitemap-products-1.xml, and build/sitemap-products-2.xml present

rg -n "sitemap-products" build/robots.txt build/_headers:
build/_headers contains `/sitemap-products*`
build/robots.txt contains `Sitemap: https://www.mitra-auto.fi/sitemap-products.xml`

git diff --check -- B-3 touched files:
passed
```

Blockers:

- Production deployed fetch is not verified. B-5/E-3 must confirm `https://www.mitra-auto.fi/sitemap-products.xml` and child sitemap HTTP status, headers, and crawlability after deployment.
- Product canonical URL collisions are deduped in the sitemap but should be reconciled as catalog data quality work during B-4/B-5.

### B-4 Detailed Checklist - Product Schema, Feed, Cart, And Checkout Reconciliation

- [x] Select representative tire and rim products.
- [x] Compare page title, slug, canonical, schema URL, and feed URL.
- [x] Compare visible price, VAT, schema price, cart price, checkout price, and feed price.
- [x] Compare availability, stock, GTIN/EAN, SKU/MPN, brand, image, seller, and product type.
- [x] Confirm Offer schema appears only with valid visible purchasable price.
- [x] Record Merchant Center feed fields and owner.

### B-4 Closeout - Product Schema, Feed, Cart, And Checkout Reconciliation

Status: Done

Recorded: 2026-06-22

Summary:

- Added shared product commerce contract helper `src/utils/productCommerce.ts`.
- Product page visible price, Product JSON-LD Offer price, JSON-LD `sku`, `gtin`, `mpn`, availability, cart display, checkout summary, and checkout Paytrail item payload now use the same source contract.
- Rim detail products now preserve `ean` from catalog mapping, matching tire detail behavior.
- Added `scripts/check_product_commerce_contract.mjs` and `npm run commerce:check` to enforce the source-level contract.
- Recorded B-4 report at `.seo-work/reports/PRODUCT-COMMERCE-RECONCILIATION-B4-2026-06-22.md`.
- Representative sitemap-source samples:
  - Tire: `0e17c454-f24b-9caa-1320-ad16baff95b1`, slug `michelin-crossclimate-3-sport-255-45-r19-104-y-summer`, net price `211.08`, in stock.
  - Rim: `00024bb0-2f88-dc51-fca7-b0c7bb8ed697`, slug `rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-00-cb-65-10`, net price `139.03`, in stock.
- Merchant feed fields are now implemented in `src/public/merchant-products.xml`.
- Paytrail payment creation now revalidates each product server-side by `product_type` and variant SKU before creating the payment.
- Server validation rejects missing product identity, unavailable products, out-of-stock rows, over-stock quantities, missing catalog prices, and stale/tampered client unit prices.
- Merchant feed export includes 31,575 products from the same public catalog lifecycle source.

Verification:

```text
npm run commerce:check:
Product commerce contract check passed: schema, cart, checkout, and product mapping use the shared commerce snapshot.

npm run build:
passed; existing warning categories: mixed static/dynamic Supabase client import and large minified chunk over 500 kB.

source ~/.config/projects/bin/project && project mitraauto >/dev/null && npm run feed:merchant && npm run feed:check:
generatedAt=2026-06-21
inputRows=31575
emittedItems=31575
skippedMissingSlug=0
skippedMissingPrice=0
skippedMissingImage=0
filename=merchant-products.xml
Merchant feed check passed: 31575 items in merchant-products.xml.

xmllint --noout src/public/merchant-products.xml:
passed

deno check supabase/functions/payments_create_paytrail/index.ts:
passed

git diff --check -- B-4 touched files:
passed
```

Blockers:

- Merchant Center submission/diagnostics are not verified.
- Deployed Paytrail Edge Function behavior is not verified.
- Production rendered schema validation remains B-5 because Product JSON-LD is client-managed.

### B-5 Detailed Checklist - Technical Runtime QA Closeout

- [x] Run `npm run build`.
- [x] Run `npm run i18n:audit` or record approved exceptions.
- [x] Run `git diff --check`.
- [x] Parse static and dynamic sitemaps.
- [x] Hard-refresh representative routes and inspect rendered head/schema.
- [x] Test invalid/retired URLs for 404/410 behavior.
- [x] Record SPA rendering risk decision: SSR, prerender, edge-rendering, or accepted rendered-evidence plan.
- [x] Update board progress and Phase B wrap-up.

### B-5 Closeout - Technical Runtime QA Closeout

Status: Done

Recorded: 2026-06-22

Summary:

- Full local runtime QA passed for build, i18n, XML, product sitemap, merchant feed, commerce contract, Paytrail function type check, Cloudflare Pages Function type check, and rendered route inspection.
- B-5 found and fixed root-route language/canonical drift, home SEO head leakage across routes, empty product meta descriptions, tire/rim sitemap-canonical slug drift, invalid product soft-404 behavior, product-edge 404 handling, and the mixed static/dynamic Supabase import build warning.
- Product sitemap generation currently emits 31,575 eligible products and 60,918 product URLs across 2 child sitemap files.
- Merchant feed generation currently emits 31,575 items.
- Rendered tire and rim product samples now emit non-empty product titles/descriptions, sitemap-matching canonicals, and Product/Breadcrumb JSON-LD.
- Invalid product slugs now render noindex not-found client-side and the Pages Function smoke test returns HTTP 404 with `x-robots-tag: noindex, follow`.
- Local Vite preview still returns HTTP 200 for missing routes because it bypasses host routing; production Pages Function behavior must be verified after deployment in E-3.

Implementation code changes:

```text
src/SiteApp.tsx
src/components/catalog/ProductDetailPage.tsx
src/components/site/layout/Footer.tsx
src/components/site/layout/Navbar.tsx
src/components/site/pages/ContactPage.tsx
src/components/site/pages/HelsinkiPage.tsx
src/components/site/pages/NotFoundPage.tsx
src/i18n/LanguageContext.tsx
src/i18n/dictionaries/site.ts
src/utils/catalogSeo.ts
src/utils/localSeo.ts
functions/[[path]].ts
.seo-work/reports/TECHNICAL-RUNTIME-QA-B5-2026-06-22.md
.seo-work/reports/TECHNICAL-RUNTIME-QA-B5-2026-06-22-console-errors.md
```

Verification:

```text
npm run i18n:audit
npm run commerce:check
deno check 'functions/[[path]].ts'
deno check supabase/functions/payments_create_paytrail/index.ts
git diff --check --
xmllint --noout src/public/sitemap.xml src/public/sitemap-products.xml src/public/sitemap-products-1.xml src/public/sitemap-products-2.xml src/public/merchant-products.xml
source ~/.config/projects/bin/project && project mitraauto >/dev/null && npm run sitemap:products && npm run sitemap:check && npm run feed:merchant && npm run feed:check && npm run build
deno eval direct Pages Function smoke test
MCP browser rendered route checks
```

Blockers:

- No open B-5 source blocker.
- E-3 must still verify deployed redirects, deployed product 404 status, deployed sitemap/feed fetches, rendered production Product JSON-LD, and provider-safe checkout behavior.
- Performance follow-up remains open for the current ~2.62 MB main JS chunk.

### Phase B Wrap-Up - Technical And Product SEO Runtime

Status: Done

Progress: `[█████] 100%`

Recorded: 2026-06-22

What is ready:

- B-1 source sync and Supabase slug migration are done.
- B-2 source-level redirect handling is done; production verification remains open.
- B-3 product sitemap generation and lifecycle policy are done; deployed sitemap fetch verification remains open.
- B-4 product commerce contract, Merchant feed export, and server-side checkout revalidation are implemented.
- B-5 local runtime QA is complete: rendered heads/schema, invalid product behavior, edge function smoke tests, XML validation, feed/sitemap generation, i18n, commerce, and build checks passed.

What is not ready:

- Production deployment evidence is not complete. E-3 must verify live redirect execution, live product 404 status, live sitemap/feed fetches, rendered production schema, and provider-safe checkout behavior.
- Main JS bundle remains large and should be split before broader launch/performance-sensitive acquisition.

Verification:

```text
npm run commerce:check: passed
npm run feed:check: passed
deno check 'functions/[[path]].ts': passed
deno check supabase/functions/payments_create_paytrail/index.ts: passed
npm run i18n:audit: passed
git diff --check --: passed
xmllint static/product sitemap and merchant feed XML: passed
npm run build: passed with remaining large chunk warning
MCP browser rendered route checks: passed
```

Provider evidence:

- Supabase reads used the Mitra project wrapper and live sitemap/feed source samples.
- No provider write was performed in B-5.
- Direct Pages Function smoke test used mocked Supabase/ASSETS responses and verified product 404 plus opaque identifier redirect behavior.

Figma Make evidence:

- B-4 Figma Make patch files are limited to changed `src/` UI/app source. Repo-only scripts, reports, migrations, functions, and public assets are not Figma Make patch files.

Decision:

```text
Phase B is closed locally as a source/runtime implementation phase.
Next task is C-1 - Google Business Profile And Citation Fact Gate.
E-3 must still verify deployed redirects, sitemap/feed fetches, rendered Product schema, product 404 status, and checkout behavior before release handoff.
```

## Phase C - Local, Service Content, And Schema Readiness

Progress: `[█████] 100%`

Purpose: make Mitra credible and useful for local/service/product search by verifying business facts, strengthening service/product content, and validating schema against visible evidence.

| Task | Name | Owner | Status | Exit condition |
| --- | --- | --- | --- | --- |
| C-1 | Google Business Profile And Citation Fact Gate | Business/Local SEO | Done with owner/platform exceptions | GBP ownership, category, hours, services, photos, appointment URL, public email, and citations are verified or exceptions recorded. |
| C-2 | Service Template Fields And P1 Rewrite | Content/Engineering/Service Owner | Done with owner/media exceptions | P1 service pages render required evidence fields and pass owner review. |
| C-3 | Product And Category Content Enrichment | Catalog/Content/SEO | Done with research/owner exceptions | Priority product modules, meta templates, and validated category landing plan are recorded. |
| C-4 | Schema Visible-Content Validation | SEO/Engineering | Done with owner/tool exceptions | LocalBusiness, Service, Product, CollectionPage, ContactPage, WebSite/WebPage, and Breadcrumb schema match visible content. |
| C-5 | Local And Content Browser Verification | QA/SEO | Complete locally with owner/platform exceptions | Local/service/content route checks pass on desktop/mobile and generated pages remain noindex. |

### Phase C Pre-Analysis - Local, Service Content, And Schema Readiness

Recorded: 2026-06-22

Decision: Phase C can begin with the local fact gate, but local readiness remains blocked until business-owner Google Business Profile evidence and citation corrections are supplied. C-1 can close only as a gate with recorded exceptions; it must not be interpreted as GBP verification.

### C-1 Detailed Checklist - Google Business Profile And Citation Fact Gate

- [x] Confirm website local source of truth in `src/config/businessProfile.ts`.
- [x] Compare website/schema facts against current local audit and public citation snippets.
- [x] Record GBP ownership/category/hours/services/photos/appointment/messaging evidence gaps.
- [x] Record citation corrections and owner decisions required.
- [x] Record review request/response SOP requirement without inventing a policy.

### C-1 Closeout - Google Business Profile And Citation Fact Gate

Status: Done with owner/platform exceptions recorded

Recorded: 2026-06-22

Summary:

- Website local facts are centralized in `src/config/businessProfile.ts` and currently drive visible local pages plus LocalBusiness schema.
- Public citation snippets mostly corroborate name, address, phone, and business ID.
- Public snippets also show email and hours conflicts that require owner correction.
- Google Business Profile ownership, verification status, primary category, additional categories, hours, special hours, services, products, appointment URL, messaging, photos, and review operations were not accessible from repo evidence.
- C-1 report records the exact owner evidence package needed before local readiness can be declared.

Implementation code changes:

- None. Missing facts require owner/platform evidence and should not be guessed in source.

Primary artifact:

```text
.seo-work/reports/GOOGLE-BUSINESS-PROFILE-CITATION-FACT-GATE-C1-2026-06-22.md
```

Verification:

```text
src/config/businessProfile.ts: reviewed
LOCAL-SEO-AUDIT-2026-06-21.md: reviewed
Official Google Business Profile policy/help sources: reviewed
Public citation search: reviewed
rg local NAP facts across src/Docs/.seo-work: passed
```

Blockers:

- Business/Local SEO owner must supply current GBP evidence and choose the canonical public customer email.
- Business/Local SEO owner must confirm true regular hours, special hours process, categories, services/products, appointment URL, messaging state, and photo set.
- Citation owner must update mismatched directories that still show the old Gmail address or conflicting hours.

Decision:

```text
C-1 is closed as a fact gate with recorded exceptions.
Local readiness is still blocked on owner/platform evidence.
Next task is C-2 - Service Template Fields And P1 Rewrite.
```

### C-2 Detailed Checklist - Service Template Fields And P1 Rewrite

- [x] Add or verify fields for duration, exclusions, eligibility, safety limits, aftercare, evidence, reviewer, review date, source notes.
- [x] Rewrite car service, tire change, tire hotel, diagnostics, AC service, DPF service, and tire repair with source-safe caveats.
- [x] Record original media/proof as an owner blocker where unavailable.
- [x] Confirm generated pages remain noindex by preserving existing generated-page route behavior.
- [x] Record owner review as required before growth-ready classification.

### C-2 Closeout - Service Template Fields And P1 Rewrite

Status: Done with owner/media exceptions

Recorded: 2026-06-22

Summary:

- Added a P1 service evidence layer in `src/i18n/dictionaries/serviceSeo.ts`.
- Rendered service-duration values, exclusions, eligibility, safety limits, aftercare, source/evidence notes, and review status in `src/components/site/pages/ServiceDetailPage.tsx`.
- Covered seven P1 pages in Finnish and English: car service, tire change, tire hotel, diagnostics, AC service, DPF service, and tire repair.
- Did not invent exact durations, warranties, legal claims, original photos, or named technician approval.
- Generated service pages remain controlled as generated/noindex pages; C-2 did not promote them to indexable SEO pages.

Implementation code changes:

- `src/i18n/dictionaries/serviceSeo.ts`
- `src/components/site/pages/ServiceDetailPage.tsx`

Primary artifact:

```text
.seo-work/reports/SERVICE-TEMPLATE-P1-REWRITE-C2-2026-06-22.md
```

Verification:

```text
npm run i18n:audit: passed
npm run build: passed
rg serviceSeoEvidenceByPageId/durationValue/notIncludedTitle/reviewedBy: passed
```

Blockers:

- Service owner must approve safety-sensitive copy before growth-ready classification.
- Business owner must supply original workshop/process/service photos or videos.
- Exact retightening, warranty, storage liability, tire repair standard, refrigerant, and emissions/roadworthiness wording still needs owner/source confirmation.

Figma Make sync:

```text
/Figma/src/i18n/dictionaries/serviceSeo.ts
/Figma/src/components/site/pages/ServiceDetailPage.tsx
```

Decision:

```text
C-2 is closed as source-complete with owner/media exceptions.
Next task is C-3 - Product And Category Content Enrichment.
```

### C-3 Detailed Checklist - Product And Category Content Enrichment

- [x] Define tire product content modules.
- [x] Define rim product content modules.
- [x] Define meta template policy through existing product SEO fallback plus source-safe visible buying-guide modules.
- [x] Record category landing candidates and required evidence.
- [x] Reject arbitrary filter landing pages.

### C-3 Closeout - Product And Category Content Enrichment

Status: Done with research/owner exceptions

Recorded: 2026-06-22

Summary:

- Added source-safe product buying-guide modules to tire and rim product detail pages.
- Added tire/rim category guidance cards to the catalog hub without creating indexable filter URLs.
- Replaced unverified 30-day return copy with safer order-term confirmation language.
- Recorded that category landing candidates are not promoted until demand, inventory, owner, and content evidence exist.

Implementation code changes:

- `src/i18n/dictionaries/catalog.ts`
- `src/components/catalog/ProductDetailPage.tsx`
- `src/components/catalog/CatalogPage.tsx`

Primary artifact:

```text
.seo-work/reports/PRODUCT-CATEGORY-CONTENT-ENRICHMENT-C3-2026-06-22.md
```

Verification:

```text
npm run i18n:audit: passed
npm run build: passed
rg categoryGuide/buyingGuide/fitmentCheck/returnsDesc/30-day/30 päivän: passed
git diff --check: passed
```

Blockers:

- Product/category owner must approve shipping, pickup, installation, returns, warranty, and used-inventory terms before richer policy claims can be added.
- Search Console, Merchant Center, competitor/SERP, and customer evidence are required before any category landing candidate becomes indexable.
- Used tire/rim pages need real condition, quantity, age/date-code, tread/defect, photo, availability, and terms fields before promotion.

Figma Make sync:

```text
/Figma/src/i18n/dictionaries/catalog.ts
/Figma/src/components/catalog/ProductDetailPage.tsx
/Figma/src/components/catalog/CatalogPage.tsx
```

Decision:

```text
C-3 is closed as source-complete with research/owner exceptions.
Next task is C-4 - Schema Visible-Content Validation.
```

### C-4 Detailed Checklist - Schema Visible-Content Validation

- [x] Validate LocalBusiness/AutoRepair.
- [x] Validate ContactPage and WebPage/WebSite.
- [x] Validate Service graph against visible service content.
- [x] Validate Product/Offer/Breadcrumb against product page data.
- [x] Confirm no review/rating schema is emitted without eligible visible data.
- [x] Record rich-result/schema tool outputs.

### C-4 Closeout - Schema Visible-Content Validation

Status: Done with owner/tool exceptions

Recorded: 2026-06-22

Summary:

- Validated the schema layer against visible page content and source-governed facts.
- Kept LocalBusiness/AutoRepair, WebSite, WebPage/ContactPage/CollectionPage, BreadcrumbList, Service, Product, and visible-price Offer schema within their current evidence boundaries.
- Disabled product `AggregateRating` schema because review source, eligibility, consent, moderation, and policy proof are not yet available.
- Confirmed category/catalog pages are collection surfaces and do not mark categories as Product entities.
- Confirmed FAQ, shipping, return-policy, and review schema remain absent until they have owner-approved visible data and policy support.

Implementation code changes:

- `src/components/catalog/ProductDetailPage.tsx`

Primary artifact:

```text
.seo-work/reports/SCHEMA-VISIBLE-CONTENT-VALIDATION-C4-2026-06-22.md
```

Verification:

```text
Official Google structured data docs: reviewed
rg aggregateRating src/components/catalog/ProductDetailPage.tsx: passed
rg "FAQPage|AggregateRating|MerchantReturnPolicy|shippingDetails" src/components src/utils src/config: passed
npm run i18n:audit: passed
npm run build: passed
git diff --check: passed
```

Blockers:

- Business/Local SEO owner must still supply GBP and citation proof from C-1.
- Product/category owner must still approve shipping, returns, warranty, used-condition, and review policy before richer Product/Offer schema is added.
- Rich Results Test, Schema Markup Validator, Search Console enhancement reports, and URL Inspection remain C-5/E-3 verification.

Figma Make sync:

```text
/Figma/src/components/catalog/ProductDetailPage.tsx
```

Decision:

```text
C-4 is closed as source-complete with owner/tool exceptions.
Next task is C-5 - Local And Content Browser Verification.
```

### C-5 Detailed Checklist - Local And Content Browser Verification

- [x] Browser-check local/contact/service pages on desktop and mobile.
- [x] Verify NAP, hours, contact actions, map links, booking paths.
- [x] Verify generated service pages are noindex and excluded from sitemap.
- [x] Verify internal links from service pages to related services/products/contact/location.
- [x] Record Phase C wrap-up evidence.

### C-5 Closeout - Local And Content Browser Verification

Status: Complete locally with owner/platform exceptions

Recorded: 2026-06-22

Summary:

- Browser-checked canonical contact, Helsinki, services hub, bespoke service detail, generated service fallback, and `/contact` alias routes on desktop and mobile samples.
- Confirmed canonical local/contact/service routes render NAP, hours, phone, email, map links, booking CTAs, localized titles, localized canonicals, expected JSON-LD types, and no horizontal overflow.
- Confirmed generated service detail URLs render content but remain `noindex, follow` and are excluded from `sitemap.xml`.
- Fixed services hub metadata/canonical/schema inheritance from the homepage.
- Fixed services/contact-section horizontal overflow.
- Replaced unsupported "100% satisfaction guarantee" service trust copy with safer process wording.
- Recorded `/contact` as an advisory noncanonical alias: it returns the local 404 UI with `noindex, follow`, has no sitemap entry, and no internal dependency was found.

Implementation code changes:

- `src/components/site/pages/ServicesPage.tsx`
- `src/i18n/dictionaries/site.ts`
- `src/components/site/sections/ContactSection.tsx`

Primary artifact:

```text
.seo-work/reports/LOCAL-CONTENT-BROWSER-VERIFICATION-C5-2026-06-22.md
```

Verification:

```text
command -v npx >/dev/null 2>&1: passed
Playwright CLI browser route sample: passed
curl sitemap source sample: passed
Playwright CLI console error: passed
npm run i18n:audit: passed
npm run build: passed
git diff --check: passed
```

Blockers:

- Production HTTP, deployed direct-route status, redirects, deployed sitemap fetches, URL Inspection, Rich Results Test, Search Console, GBP, and Merchant/platform evidence remain unavailable in C-5.
- Business owner must still supply GBP/citation proof and approve service safety/policy-sensitive content.

Figma Make sync:

```text
/Figma/src/components/site/pages/ServicesPage.tsx
/Figma/src/i18n/dictionaries/site.ts
/Figma/src/components/site/sections/ContactSection.tsx
```

Decision:

```text
C-5 is complete locally with owner/platform exceptions.
Phase C can close as local source/browser verified, but not as production/platform growth-ready.
Next task is D-1 - KPI Tree And Event Dictionary.
```

### Phase C Wrap-Up - Local, Service Content, And Schema Readiness

Status: Complete locally with owner/platform exceptions

Progress: `[█████] 100%`

Recorded: 2026-06-22

Integrated phase audit:

- C-1 through C-5 were reviewed as a single Growth readiness gate.
- Phase C improves local source truth, service content depth, product/category decision support, schema visible-content safety, and local browser behavior.
- Phase C does not prove GBP ownership, citation correction, Search Console status, Rich Results Test output, live HTTP behavior, Merchant Center diagnostics, or business outcome quality.
- Unsupported service guarantee/trust language found during the phase wrap-up was removed from the shared dictionary.

Extra Growth readiness layer:

| Layer | Purpose | Phase C result | Remaining owner |
| --- | --- | --- | --- |
| L1 source truth | Business facts, service copy, product/category policy, schema source | Executed | Engineering/Search |
| L2 rendered browser proof | Local/contact/service pages render facts, links, metadata, schema, noindex behavior | Executed locally | QA/Search |
| L3 owner fact proof | GBP, citations, hours, categories, service claims, original media, policy-sensitive copy | Exceptions recorded | Business/Service/Product owner |
| L4 platform proof | Search Console, GBP, Merchant Center, Rich Results Test, URL Inspection | Unavailable | Platform owners |
| L5 outcome proof | Bookings, calls, orders, qualified leads, revenue quality, retention | Deferred to Phase D | Analytics/Business |

Primary phase artifact:

```text
.seo-work/reports/PHASE-C-LOCAL-SERVICE-CONTENT-SCHEMA-READINESS-WRAPUP-2026-06-22.md
```

Figma Make sync for Phase C:

```text
/Figma/src/i18n/dictionaries/serviceSeo.ts
/Figma/src/components/site/pages/ServiceDetailPage.tsx
/Figma/src/i18n/dictionaries/catalog.ts
/Figma/src/components/catalog/ProductDetailPage.tsx
/Figma/src/components/catalog/CatalogPage.tsx
/Figma/src/components/site/pages/ServicesPage.tsx
/Figma/src/i18n/dictionaries/site.ts
/Figma/src/components/site/sections/ContactSection.tsx
```

Phase C remaining exceptions:

- Business/Local SEO owner must supply GBP ownership, verification, category, hours, services/products, photos, appointment URL, messaging, and citation proof.
- Business/citation owner must reconcile public email and hours conflicts.
- Service owner must approve safety-sensitive copy and provide original proof media.
- Product/legal owner must approve shipping, pickup, installation, returns, warranty, used-condition, and review policy before richer Product/Offer schema or category landing pages are promoted.
- SEO/platform owner must run production URL Inspection, Rich Results Test, deployed sitemap/redirect checks, Search Console, GBP, and Merchant Center readback in later phases.

Decision:

```text
Phase C is closed as local source/browser verified with owner/platform exceptions.
Growth-ready classification remains blocked until Phase D and Phase E prove measurement, production deployment behavior, platform readback, and launch QA.
```

## Phase D - Measurement, Revenue, Conversion, And Platform QA

Progress: `[█████] 100%`

Purpose: connect search and local/product traffic to qualified business outcomes with consent-aware analytics, platform evidence, conversion journeys, accessibility checks, and experiment guardrails.

| Task | Name | Owner | Status | Exit condition |
| --- | --- | --- | --- | --- |
| D-1 | KPI Tree And Event Dictionary | Analytics/Business | Done with owner/platform exceptions | Primary outcome, formulas, source systems, events, consent behavior, and owners are drafted for approval. |
| D-2 | Booking And Order Reconciliation | Analytics/Engineering | Done with owner/platform exceptions | Booking/order/payment/invoice/fulfillment reconciliation contract and discrepancy thresholds recorded; implementation, platform readback, and owner status approval pending. |
| D-3 | Search Console, GBP, Merchant Center, And Analytics Readback | SEO/Analytics/Business | Done with critical platform exceptions | Platform evidence envelope, owner register, and public production fetch blockers recorded; authenticated platform readback remains unavailable. |
| D-4 | Conversion, SXO, And Accessibility QA | Product/QA/Engineering | Done with warnings | Service booking, product purchase, install booking, contact, and Tire Hotel journeys are mapped and smoke-tested locally; checkout accessibility and trust warnings recorded. |
| D-5 | Experiment And Monitoring QA Closeout | Growth/Analytics | Done with platform and owner exceptions | Experiment registry, search-facing test guardrails, monitoring thresholds, incident runbook, and Phase D gate are recorded; no experiment is launch-ready. |

### Phase D Pre-Analysis - Measurement, Revenue, Conversion, And Platform QA

Recorded: 2026-06-22

Decision: Phase D can start as a measurement and conversion contract phase before implementation. D-1 and D-2 are complete locally with owner/platform exceptions. D-3 is complete locally as a platform envelope and public readback checkpoint with critical deployment/platform exceptions. D-4 and D-5 can proceed as local journey, accessibility, experiment, and monitoring specifications, but they cannot claim live conversion quality, revenue, or platform health without authenticated platform readback.

Pre-analysis artifact:

```text
.seo-work/reports/PHASE-D-MEASUREMENT-REVENUE-CONVERSION-PLATFORM-QA-PRE-ANALYSIS-2026-06-22.md
```

Evidence used:

- Microsoft Clarity source, consent banner, and current event calls were inspected.
- Booking, checkout, Paytrail order creation, webhook payment update, contact/local actions, customer account, Phase B wrap-up, and Phase C wrap-up were inspected.
- Search Console, GBP, Merchant Center, GA4/GTM or equivalent analytics, CrUX, PageSpeed field data, server logs, live analytics events, real booking/order exports, margin, CAC, and retention data were unavailable.

Current source decision:

| Surface | Source state | Phase D implication |
| --- | --- | --- |
| Analytics runtime | Clarity is present, public-site only, and consent-gated. No GA4/GTM/dataLayer implementation was found in inspected public source. | Clarity can support UX diagnostics, but it is not a complete KPI/revenue/search measurement system. |
| Current events | Source records page view, consent grant, booking modal open, booking completed, cart item added, checkout payment started, checkout success view, and checkout cancel view. | Event dictionary, key-event policy, deduplication IDs, owners, and downstream reconciliation are missing. |
| Booking | Public booking creates Supabase bookings or install bookings and sends notifications. | Submitted booking is measurable, but accepted/completed/cancelled/no-show status needs operational reconciliation. |
| Checkout | Checkout creates pending Paytrail orders; webhook updates order/invoice payment status and payment events. | `/checkout/success` must not be treated as purchase/revenue proof without order/payment reconciliation. |
| Contact/local | Phone, email, map, directions, and booking actions are visible. | Local actions need privacy-safe events plus GBP/analytics readback before reporting. |
| Retention | Customer account, preferences, service book, pickup/order state, and Tire Hotel backend surfaces exist. | Retention metrics need approved lifecycle definitions and repeat/fulfilled outcome sources. |

Extra Phase D layer:

| Layer | Purpose | Current state |
| --- | --- | --- |
| D0 Data Contract Gate | Primary outcome, owners, consent model, source systems, IDs, and periods. | Blocked. |
| D1 KPI Tree | Qualified bookings, paid orders, fulfilled service, retention, revenue, and guardrails. | Not implemented. |
| D2 Event Contract | Event names, parameters, consent behavior, identity rules, QA, and key-event policy. | Source events exist; governed dictionary missing. |
| D3 Reconciliation | Match analytics events to `bookings`, `orders`, `payment_events`, invoice events, and operational statuses. | Source targets identified; data proof missing. |
| D4 Platform Readback | Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, and logs with dataset envelopes. | Blocked by access. |
| D5 Journey QA | Booking, product purchase, install booking, contact/local, retention, errors, accessibility, and mobile QA. | Ready for local specification. |
| D6 Experiment And Monitoring | Experiment registry, release annotations, alerts, incident runbook, rollback. | Ready for specification, not live activation. |

Implementation rule:

```text
Do not implement new tracking tags or claim conversion/revenue readiness until D-1 defines the approved KPI/event/consent contract and D-2 defines reconciliation against booking/order truth.
```

### D-1 Detailed Checklist - KPI Tree And Event Dictionary

- [x] Confirm primary business outcome as a draft pending business approval.
- [x] Define acquisition, activation, quality, retention, and guardrail metrics.
- [x] Define event names and parameters.
- [x] Define key events.
- [x] Define consent and data-quality limits.

### D-1 Closeout - KPI Tree And Event Dictionary

Status: Done with owner/platform exceptions

Recorded: 2026-06-22

Summary:

- Added the D-1 measurement contract under `.growth-work/measurement`.
- Proposed primary outcome is `fulfilled_profitable_customer_outcome`, pending business owner approval.
- Defined KPI tree, formulas, grains, source systems, cadence, owners, data-quality status, and guardrails.
- Defined event dictionary, canonical event names, current source state, common parameters, key-event policy, PII exclusions, and reconciliation targets.
- Recorded the semantic risk that current `booking_completed` source behavior means booking submit success, not completed service.
- No tracking tags, GA4/GTM properties, server events, or platform integrations were implemented.

Artifacts:

```text
.growth-work/measurement/kpi-tree.json
.growth-work/measurement/event-dictionary.json
.growth-work/measurement/MEASUREMENT-SPEC-D1.md
.seo-work/reports/KPI-TREE-EVENT-DICTIONARY-D1-2026-06-22.md
```

Remaining blockers:

- Business owner must approve the primary outcome and final qualification definitions.
- Analytics owner must approve destination platform, property ownership, consent mode, and key-event policy.
- D-2 must reconcile analytics events to `bookings`, `orders`, `payment_events`, invoice events, and operational statuses.
- D-3 must record Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, and platform dataset envelopes.

Verification:

```text
node -e "for (const f of ['.growth-work/measurement/kpi-tree.json','.growth-work/measurement/event-dictionary.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
rg -n "trackClarityEvent|upgradeClaritySession|trackClarityPageView|AnalyticsConsentBanner|initClarityForCurrentRuntime|Clarity\\." src supabase/functions -g '!node_modules': passed
rg -n "from\\(['\\\"](bookings|orders|payment_events|invoice_events|customer_events)['\\\"]\\)|status: 'confirmed'|status: \\\"paid\\\"|payment_status|fulfillment_status|marketing_consent|contact_consent" src supabase/functions supabase/migrations -g '!node_modules': passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/measurement/kpi-tree.json .growth-work/measurement/event-dictionary.json .growth-work/measurement/MEASUREMENT-SPEC-D1.md .seo-work/reports/KPI-TREE-EVENT-DICTIONARY-D1-2026-06-22.md: passed
```

### D-2 Detailed Checklist - Booking And Order Reconciliation

- [x] Identify booking/order source tables or APIs.
- [x] Define deduplication IDs and event timing.
- [x] Reconcile booking submitted, accepted, completed, no-show/cancelled.
- [x] Reconcile product checkout/order paid/install booking.
- [x] Record discrepancy threshold and owner.

### D-2 Closeout - Booking And Order Reconciliation

Status: Done with owner/platform exceptions

Recorded: 2026-06-22

Created:

- `.growth-work/measurement/booking-order-reconciliation.json`
- `.growth-work/measurement/BOOKING-ORDER-RECONCILIATION-D2.md`
- `.seo-work/reports/BOOKING-ORDER-RECONCILIATION-D2-2026-06-22.md`

Adjusted:

- `.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md`

Source truth policy:

- Booking submitted can only count after `bookings` insert or `order_install_booking` returns a booking id.
- Current `booking_completed` source event is semantically wrong because it fires after booking submission success, not fulfilled service.
- Purchase can only count from signed Paytrail callback/server state, not `/checkout/success` page view alone.
- Order fulfillment can only count after approved CMS/operations fulfillment status.
- Invoice paid must stay separate from ecommerce order revenue until finance approves revenue treatment.
- Analytics must not carry names, emails, phones, license plates, addresses, notes, payment details, tokens, private manage URLs, auth identifiers, or free text.

Remaining exceptions:

- Analytics platform readback is deferred to D-3.
- Owner-approved booking/order/fulfillment status definitions are missing.
- Finance revenue, refund, VAT, fee, cash/manual order, and margin definitions are missing.
- Durable non-PII analytics-to-server correlation is not implemented in the reviewed source.
- Live Supabase schema was not read back in this task.

Verification:

```text
rg -n "idempotency|booking_completed|booking_submitted|checkout_payment_started|purchase|payment_events|invoice_events|fulfillment_status|payment_status|paytrail_status|status: 'confirmed'|status: \"confirmed\"" src supabase/functions supabase/migrations: passed
rg -n "create table if not exists public\.(bookings|orders|payment_events|invoice_payment_links|invoice_payment_details|invoice_documents|customers|customer_vehicles|customer_history)|create table public\.(bookings|orders|payment_events|invoice_payment_links|invoice_payment_details|invoice_documents|customers|customer_vehicles|customer_history)|alter table public\.(bookings|orders|payment_events|invoice_payment_links|invoice_payment_details|invoice_documents|customers|customer_vehicles|customer_history)" supabase/migrations: passed
node -e "for (const f of ['.growth-work/measurement/booking-order-reconciliation.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/measurement/booking-order-reconciliation.json .growth-work/measurement/BOOKING-ORDER-RECONCILIATION-D2.md .seo-work/reports/BOOKING-ORDER-RECONCILIATION-D2-2026-06-22.md: passed
```

### D-3 Detailed Checklist - Search Console, GBP, Merchant Center, And Analytics Readback

- [x] Record Search Console property and owner access status.
- [x] Record GA4/GTM or analytics property and owner access status.
- [x] Record GBP profile and diagnostics owner access status.
- [x] Record Merchant Center account/feed diagnostics owner access status.
- [x] Record platform evidence envelope with scope and date range.

### D-3 Closeout - Search Console, GBP, Merchant Center, And Analytics Readback

Status: Done with critical platform exceptions

Recorded: 2026-06-22

Created:

- `.growth-work/measurement/platform-readback-d3.json`
- `.growth-work/measurement/PLATFORM-READBACK-D3.md`
- `.seo-work/reports/SEARCH-CONSOLE-GBP-MERCHANT-ANALYTICS-READBACK-D3-2026-06-22.md`

Adjusted:

- `.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md`

Public readback findings:

- `https://www.mitra-auto.fi/robots.txt` returned `HTTP/2 404`.
- `https://www.mitra-auto.fi/sitemap.xml` did not reliably serve XML; HEAD showed `text/html` Figma Make shell and one body fetch returned 404.
- `https://www.mitra-auto.fi/sitemap-products.xml` returned `HTTP/2 200` with `text/html`, not XML.
- `https://www.mitra-auto.fi/sitemap-products-1.xml` returned `HTTP/2 200` with `text/html`, not XML.
- `https://www.mitra-auto.fi/merchant-products.xml` returned `HTTP/2 200` with `text/html`, not RSS/XML.

Remaining exceptions:

- Search Console authenticated property/readback is unavailable.
- Google Business Profile owner/diagnostics readback is unavailable.
- Merchant Center account/feed diagnostics readback is unavailable.
- Analytics dashboard/API/debug readback is unavailable.
- CrUX/PageSpeed readback was not run in D-3.
- Deployed Figma Make/static asset behavior does not match local `src/public` artifacts.

Verification:

```text
rg -n "google-site-verification|GTM-|gtag|dataLayer|GA4|VITE_GA|VITE_GTM|VITE_CLARITY|CLARITY|merchant|Search Console|Business Profile|GBP|GOOGLE" src index.html .env.example package.json scripts -g '!src/public/merchant-products.xml' -g '!node_modules': passed
curl -I https://www.mitra-auto.fi/robots.txt: failed expected state, observed HTTP/2 404
curl -I https://www.mitra-auto.fi/sitemap.xml: failed expected state, observed text/html
curl -I https://www.mitra-auto.fi/sitemap-products.xml: failed expected state, observed text/html
curl -I https://www.mitra-auto.fi/merchant-products.xml: failed expected state, observed text/html
node -e "for (const f of ['.growth-work/measurement/platform-readback-d3.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/measurement/platform-readback-d3.json .growth-work/measurement/PLATFORM-READBACK-D3.md .seo-work/reports/SEARCH-CONSOLE-GBP-MERCHANT-ANALYTICS-READBACK-D3-2026-06-22.md: passed
```

### D-4 Detailed Checklist - Conversion, SXO, And Accessibility QA

- [x] Map service booking journey.
- [x] Map tire/rim product journey.
- [x] Map install booking journey.
- [x] Map contact/local journey.
- [x] Map Tire Hotel retention journey.
- [x] Run accessibility smoke for keyboard, labels, focus, errors, mobile, and forms.

### D-4 Closeout - Conversion, SXO, And Accessibility QA

Status: Done with warnings

Recorded: 2026-06-22

Created:

- `.seo-work/conversion/conversion-journeys.json`
- `.growth-work/measurement/conversion-sxo-accessibility-d4.json`
- `.growth-work/measurement/CONVERSION-SXO-ACCESSIBILITY-D4.md`
- `.seo-work/reports/CONVERSION-SXO-ACCESSIBILITY-QA-D4-2026-06-22.md`
- `.seo-work/reports/conversion-audit.json`
- `.seo-work/reports/CONVERSION-AUDIT.md`

Adjusted:

- `.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md`

Browser/source QA summary:

- Service booking page and modal pass local smoke with measurement/owner exceptions.
- Product detail, cart, checkout, terms gate, and missing-required-field validation path pass local smoke with accessibility warnings.
- Install booking source path supports paid-order install URL and single-use token booking; no real paid-order token was available for browser smoke.
- Contact/local mobile route renders phone, email, hours, map, FAQ, and booking CTA.
- Tire Hotel mobile route renders price, process, inclusions, exclusions, related services, source/update notes, and booking CTA.

Warnings:

- Checkout exposes duplicate responsive submit controls to strict browser-agent locators.
- Checkout validation recovery appears as toast-level messaging instead of field-associated errors.
- Footer social links point to generic platform homepages instead of verified Mitra profiles.

Verification:

```text
npm run build: passed
Playwright MCP browser smoke on /palvelut/autohuolto, product detail -> cart -> checkout, /yhteystiedot, /palvelut/rengashotelli: passed with warnings
node -e "for (const f of ['.seo-work/conversion/conversion-journeys.json','.growth-work/measurement/conversion-sxo-accessibility-d4.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
python /Users/chandler/.codex/plugins/cache/growth/growth/4.1.4/skills/seo-aeo-geo/scripts/conversion_audit.py --site-dir build --journeys .seo-work/conversion/conversion-journeys.json --output-dir .seo-work/reports: failed because `python` is unavailable on this host
python3 /Users/chandler/.codex/plugins/cache/growth/growth/4.1.4/skills/seo-aeo-geo/scripts/conversion_audit.py --site-dir build --journeys .seo-work/conversion/conversion-journeys.json --output-dir .seo-work/reports: failed with 12 static entry-page findings because the Vite SPA build emits one `index.html` instead of prerendered route HTML
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .seo-work/conversion/conversion-journeys.json .growth-work/measurement/conversion-sxo-accessibility-d4.json .growth-work/measurement/CONVERSION-SXO-ACCESSIBILITY-D4.md .seo-work/reports/CONVERSION-SXO-ACCESSIBILITY-QA-D4-2026-06-22.md: passed
```

### D-5 Detailed Checklist - Experiment And Monitoring QA Closeout

- [x] Create experiment registry shape.
- [x] Define search-facing test guardrails.
- [x] Define monitoring thresholds for SEO, GBP, Merchant Center, analytics, booking/order events.
- [x] Define incident runbook and owners.
- [x] Record Phase D wrap-up.

### D-5 Closeout - Experiment And Monitoring QA Closeout

Status: Done with platform and owner exceptions

Recorded: 2026-06-22

Created:

- `.growth-work/experiments/experiment-registry.json`
- `.growth-work/measurement/experiment-monitoring-d5.json`
- `.growth-work/measurement/EXPERIMENT-MONITORING-D5.md`
- `.seo-work/reports/EXPERIMENT-MONITORING-QA-D5-2026-06-22.md`
- `.growth-work/reports/experiment-guard.json`
- `.growth-work/reports/EXPERIMENT-GUARD.md`

Adjusted:

- `.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md`

Summary:

- Registered four draft experiment/validation candidates: service booking decision support, product fitment/purchase clarity, checkout recovery accessibility remediation, and local contact-action quality.
- Defined search-facing experiment guardrails for canonicals, indexability, sitemap/feed truth, schema/visible-content parity, cloaking avoidance, release annotations, and rollback.
- Defined monitoring thresholds for production robots/sitemap/feed availability, Search Console, GBP, Merchant Center, analytics integrity, booking/order reconciliation, critical journey accessibility, and CWV/runtime performance.
- Defined an incident runbook that starts with data integrity and separates technical, tracking, platform, inventory, demand, market, and content/trust causes before assigning root cause.
- Recorded that no experiment is launch-ready because instrumentation, owner approvals, platform readback, production asset behavior, reconciliation, and D-4 checkout accessibility warnings remain unresolved.

Remaining blockers:

- Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, server logs, and live booking/order/payment/fulfillment exports remain unavailable.
- Production robots/sitemap/product sitemap/merchant feed mismatch remains open from D-3.
- Business, finance, operations, ecommerce, privacy, analytics, and SEO owner approvals remain unavailable.
- D-4 checkout accessibility warnings remain open.

Verification:

```text
python3 /Users/chandler/.codex/plugins/cache/growth/growth/4.1.4/skills/seo-aeo-geo/scripts/experiment_guard.py .growth-work/experiments/experiment-registry.json --output-dir .growth-work/reports: passed with advisory instrumentation-unverified findings for draft experiments
node -e "for (const f of ['.growth-work/experiments/experiment-registry.json','.growth-work/measurement/experiment-monitoring-d5.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/experiments/experiment-registry.json .growth-work/measurement/experiment-monitoring-d5.json .growth-work/measurement/EXPERIMENT-MONITORING-D5.md .seo-work/reports/EXPERIMENT-MONITORING-QA-D5-2026-06-22.md .growth-work/reports/experiment-guard.json .growth-work/reports/EXPERIMENT-GUARD.md: passed
```

### Phase D Wrap-Up - Measurement, Revenue, Conversion, And Platform QA

Status: Complete locally with platform and owner exceptions

Progress: `[█████] 100%`

Recorded: 2026-06-22

Wrap-up artifact:

```text
.growth-work/measurement/phase-d-wrapup.json
.seo-work/reports/PHASE-D-MEASUREMENT-REVENUE-CONVERSION-PLATFORM-QA-WRAPUP-2026-06-22.md
```

Decision:

```text
Phase D is complete locally.
D-1 is complete as a draft measurement contract with owner/platform exceptions. D-2 is complete locally as a source-backed reconciliation contract with owner/platform exceptions. D-3 is complete locally as a platform envelope and public readback checkpoint with critical deployment/platform exceptions. D-4 is complete locally with checkout accessibility/trust warnings. D-5 is complete locally as an experiment and monitoring contract. Growth-ready classification remains blocked until Phase E verifies production/source/provider/platform evidence and remaining owner exceptions.
```

Extra Growth OS control layer:

| Layer | Purpose | State |
| --- | --- | --- |
| D0 Source Truth And Ownership | Approved outcome, source systems, owners, consent, status dictionaries, and finance treatment. | Blocked for live readiness. |
| D1 KPI And Event Semantics | KPI tree, event dictionary, key-event policy, PII exclusions, and schema-valid metric graph. | Complete locally with unverified metric quality warnings. |
| D2 Server Reconciliation | Tie analytics events to booking, order, payment, invoice, fulfillment, and retention truth. | Contract complete; implementation/live readback pending. |
| D3 Platform Readback | Dataset envelopes and health readback for Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, and logs. | Blocked by access and public asset mismatch. |
| D4 Journey And Accessibility QA | Prove critical journeys are usable, truthful, recoverable, and accessible. | Complete locally with checkout warnings. |
| D5 Experiment And Monitoring Governance | Draft experiments, search controls, guardrails, monitoring, incident workflow, and rollback. | Complete locally; no experiment launch-ready. |
| D6 Phase E Evidence Handoff | Move unresolved production/source/provider/drift/live evidence into Phase E. | Handoff ready. |

Wrap-up audit findings:

- Critical: Production `robots.txt`, sitemap, product sitemap, and Merchant feed asset mismatch remains a live platform blocker from D-3.
- Critical: Authenticated Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, server log, and live business-system readback remain unavailable.
- Critical: Revenue/conversion claims remain blocked by missing business, operations, ecommerce, finance, privacy, and analytics owner definitions.
- Warning: `kpi_tree_audit.py` now passes structurally with 0 blockers and 0 criticals, but reports unverified metric quality and hypothesis relationships.
- Warning: D-4 checkout duplicate submit controls and field-error recovery warnings block checkout-impacting experiments.
- Advisory: `experiment_guard.py` passes, but all four draft experiments remain instrumentation-unverified.

Verification:

```text
python3 /Users/chandler/.codex/plugins/cache/growth/growth/4.1.4/skills/seo-aeo-geo/scripts/kpi_tree_audit.py .growth-work/measurement/kpi-tree.json --output-dir .growth-work/reports: passed with warnings/advisories
python3 /Users/chandler/.codex/plugins/cache/growth/growth/4.1.4/skills/seo-aeo-geo/scripts/experiment_guard.py .growth-work/experiments/experiment-registry.json --output-dir .growth-work/reports: passed with advisory instrumentation-unverified findings for draft experiments
node -e "for (const f of ['.growth-work/measurement/kpi-tree.json','.growth-work/measurement/event-dictionary.json','.growth-work/measurement/booking-order-reconciliation.json','.growth-work/measurement/platform-readback-d3.json','.growth-work/measurement/conversion-sxo-accessibility-d4.json','.growth-work/measurement/experiment-monitoring-d5.json','.growth-work/measurement/phase-d-wrapup.json','.growth-work/experiments/experiment-registry.json','.growth-work/reports/kpi-tree-audit.json','.growth-work/reports/experiment-guard.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/measurement/kpi-tree.json .growth-work/measurement/phase-d-wrapup.json .seo-work/reports/PHASE-D-MEASUREMENT-REVENUE-CONVERSION-PLATFORM-QA-WRAPUP-2026-06-22.md .growth-work/reports/kpi-tree-audit.json .growth-work/reports/KPI-TREE-AUDIT.md .growth-work/reports/experiment-guard.json .growth-work/reports/EXPERIMENT-GUARD.md: passed
```

## Phase E - Release Closeout, Evidence Ledger, And Growth Handoff

Progress: `[██░░░] 40%`

Purpose: package production evidence, source/provider ledgers, live crawl/browser QA, drift baseline, monitoring cadence, and final readiness classification.

| Task | Name | Owner | Status | Exit condition |
| --- | --- | --- | --- | --- |
| E-1 | Figma Make Patch-State Ledger | Docs/Frontend | Complete with Figma preview blocker | Local/GitHub/Figma Make patch scope is reconciled; owner still must patch and preview Figma Make. |
| E-2 | Supabase, Hosting, And Provider Ledger | Docs/Engineering/Supabase | Complete with provider blockers | Supabase readback, hosting evidence, provider gaps, and secret status are recorded without secrets. |
| E-3 | Live Crawl And Browser Smoke Evidence | QA/SEO/Engineering | Blocked | Production crawl and desktop/mobile browser smoke pass or blockers are explicit. |
| E-4 | Drift Baseline And Monitoring Handoff | SEO/Analytics/Engineering | Blocked | Representative URL baseline, monitoring cadence, and incident workflow are recorded. |
| E-5 | Final Growth Readiness Classification | Growth/Business | Blocked | Board classifies Mitra as growth-ready, pilot-ready with limitations, blocked, or complete locally only. |

### Phase E Pre-Analysis - Release Closeout, Evidence Ledger, And Growth Handoff

Recorded: 2026-06-22

Status: Analysis complete before implementation

Artifacts:

```text
.growth-work/release/phase-e-preanalysis.json
.seo-work/reports/PHASE-E-RELEASE-CLOSEOUT-EVIDENCE-LEDGER-GROWTH-HANDOFF-PRE-ANALYSIS-2026-06-22.md
```

Decision: Phase E can start after Phase D local closeout, but release classification remains blocked until source parity, provider evidence, live crawl/browser QA, drift baseline, and production behavior are verified.

Evidence-state rule:

```text
Phase E must record evidence as EXECUTED, EXECUTED_WITH_FINDINGS, SUPPLIED_REVIEW_REQUIRED, FAILED, or UNAVAILABLE.
Missing platform access, supplied reports, and local source checks are not production passes.
```

Phase E evidence matrix:

| Mode | Current state | Phase E requirement |
| --- | --- | --- |
| `REPO` | `SUPPLIED_REVIEW_REQUIRED` | E-1/E-2 reconcile local, GitHub, Figma Make, Supabase, hosting, functions, scripts, public assets, and generated reports without mixing scopes. |
| `BUILD` | `SUPPLIED_REVIEW_REQUIRED` | E-1/E-3 record final Figma Make preview/build and any local build used as evidence. |
| `LIVE` | `EXECUTED_WITH_FINDINGS` | E-3 reruns bounded production HTTP/live checks and resolves or records blockers. |
| `BROWSER` | `SUPPLIED_REVIEW_REQUIRED` | E-3 smoke-tests production desktop/mobile journeys. |
| `PLATFORM` | `UNAVAILABLE` | E-2/E-3/E-4 record Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, logs, and provider envelopes where access exists. |
| `CONTENT` | `SUPPLIED_REVIEW_REQUIRED` | E-5 reconciles owner/media/platform exceptions from Phase C. |
| `CONVERSION` | `EXECUTED_WITH_FINDINGS` | E-3/E-5 verify checkout accessibility and provider-safe booking/checkout evidence. |
| `MIGRATION` | `SUPPLIED_REVIEW_REQUIRED` | E-3/E-4 validate old product identifier redirects, sitemap/canonical behavior, not-found states, and drift baseline. |
| `INCIDENT` | `UNAVAILABLE` | E-4 defines incident triggers and response owner; no time-series incident evidence exists yet. |

Extra release layer:

| Layer | Purpose | Task |
| --- | --- | --- |
| E0 Evidence Authority Gate | Separate executed, supplied, failed, unavailable, and owner-exception evidence before classification. | Whole phase |
| E1 Source Parity Gate | Record local/GitHub/Figma Make parity and stale source risks. | E-1 |
| E2 Provider And Secret-Safe Ledger | Record Supabase, hosting, functions, redirects, static assets, provider states, and secret status without exposing secrets. | E-2 |
| E3 Live Runtime Evidence | Verify production crawl, HTTP, redirects, robots, sitemaps, feeds, browser journeys, checkout, and direct-route behavior. | E-3 |
| E4 Drift And Monitoring Handoff | Create representative URL baseline, drift rules, monitoring cadence, incident triggers, and owner handoff. | E-4 |
| E5 Final Readiness Classification | Reconcile phase wrap-ups, exceptions, live/platform evidence, unresolved risk, and final status. | E-5 |

Pre-implementation rules:

- E-1 must list only Figma Make source files that actually need manual Figma patching.
- E-2 must use the Mitra project wrapper and project-specific Supabase guardrails before provider/backend readback or changes.
- E-2 must record secrets only as `set` or `missing`; no secrets may be written to repo artifacts.
- E-3 must treat production robots/sitemap/feed mismatch as a blocker until live fetch proves expected text/XML behavior.
- E-3 must not run destructive checkout or booking actions; provider-safe smoke only.
- E-4 must version only sanitized drift baselines and avoid raw customer/authenticated data.
- E-5 must classify readiness as growth-ready, pilot-ready with limitations, blocked, or complete locally only.

Verification:

```text
node -e "JSON.parse(require('fs').readFileSync('.growth-work/release/phase-e-preanalysis.json','utf8')); console.log('json ok')": passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/release/phase-e-preanalysis.json .seo-work/reports/PHASE-E-RELEASE-CLOSEOUT-EVIDENCE-LEDGER-GROWTH-HANDOFF-PRE-ANALYSIS-2026-06-22.md: passed
rg -n 'Current progress|Current phase|Current task|Phase E Pre-Analysis|Progress: `\\[░░░░░\\] 0%`|Recorded: 2026-06-22|E-1 \\|' .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md: passed
```

### E-1 Detailed Checklist - Figma Make Patch-State Ledger

- [x] Record created/adjusted/deleted Figma Make files.
- [x] Confirm no stale `LanguageContext`, `ThemeContext`, `components/Toaster`, missing `etrtoFitment`, or `CONTACT_INFO` in local source.
- [ ] Confirm Figma Make build/preview. Blocked until owner patches `/Figma/src` and runs Figma Make preview.
- [x] Separate Figma files from Supabase/provider files.
- [x] Record closeout.

### E-1 Closeout - Figma Make Patch-State Ledger

Status: Complete with Figma preview blocker

Recorded: 2026-06-22

Progress: `[█░░░░] 20%`

Artifacts:

```text
.growth-work/release/e1-figma-make-patch-state-ledger.json
.seo-work/reports/FIGMA-MAKE-PATCH-STATE-LEDGER-E1-2026-06-22.md
```

Decision: E-1 closes as a ledger task. Figma Make itself is not verified until the owner patches the listed `/Figma/src` files and confirms preview/build.

Evidence states:

| Evidence | State | Finding |
| --- | --- | --- |
| Local repo | `EXECUTED_WITH_FINDINGS` | Local Phase B-D source changes exist and build passes with large-chunk warning. |
| GitHub remote | `EXECUTED_WITH_FINDINGS` | `origin/codex/pwa-cloudflare` matches local `HEAD` before uncommitted Phase B-D work; GitHub is not yet updated with current local changes. |
| Figma Make preview | `UNAVAILABLE` | Preview was not directly executed here; owner must patch and verify Figma Make. |
| Build | `EXECUTED_WITH_FINDINGS` | `npm run build` passed; Vite reported a large chunk warning. |

Figma Make source files to patch:

```text
/Figma/src/SiteApp.tsx
/Figma/src/main.tsx
/Figma/src/components/catalog/CatalogPage.tsx
/Figma/src/components/catalog/ProductDetailPage.tsx
/Figma/src/components/catalog/RimCard.tsx
/Figma/src/components/catalog/TireCard.tsx
/Figma/src/components/legal/PrivacyPolicyVersions.tsx
/Figma/src/components/legal/legalContent.ts
/Figma/src/components/site/analytics/AnalyticsConsentBanner.tsx
/Figma/src/components/site/booking/BookingModal.tsx
/Figma/src/components/site/cart/CartDrawer.tsx
/Figma/src/components/site/checkout/CheckoutPage.tsx
/Figma/src/components/site/layout/Footer.tsx
/Figma/src/components/site/layout/Navbar.tsx
/Figma/src/components/site/modals/AuthModal.tsx
/Figma/src/components/site/pages/AboutPage.tsx
/Figma/src/components/site/pages/ContactPage.tsx
/Figma/src/components/site/pages/HelsinkiPage.tsx
/Figma/src/components/site/pages/LegalPage.tsx
/Figma/src/components/site/pages/NotFoundPage.tsx
/Figma/src/components/site/pages/ServiceDetailPage.tsx
/Figma/src/components/site/pages/ServicesPage.tsx
/Figma/src/components/site/pages/TireHotelPage.tsx
/Figma/src/components/site/sections/ContactSection.tsx
/Figma/src/config/businessProfile.ts
/Figma/src/i18n/LanguageContext.tsx
/Figma/src/i18n/dictionaries/catalog.ts
/Figma/src/i18n/dictionaries/common.ts
/Figma/src/i18n/dictionaries/legal.ts
/Figma/src/i18n/dictionaries/serviceSeo.ts
/Figma/src/i18n/dictionaries/site.ts
/Figma/src/lib/clarity.ts
/Figma/src/utils/catalogSeo.ts
/Figma/src/utils/localSeo.ts
/Figma/src/utils/openingHours.ts
/Figma/src/utils/pricing.ts
/Figma/src/utils/productCommerce.ts
/Figma/src/utils/productsSearch.ts
```

Presence gate in Figma Make:

```text
/Figma/src/components/shared/Toaster.tsx
/Figma/src/theme/ThemeContext.tsx
/Figma/src/utils/etrtoFitment.ts
/Figma/src/utils/etrtoFitmentClient.ts
```

Do not list these as Figma Make patch files:

```text
src/public/*
supabase/*
scripts/*
.growth-work/*
.seo-work/*
.playwright-mcp/*
dist/*
```

Stale-source findings:

- `CONTACT_INFO` is absent from local `src`; Figma Make must replace stale `ContactSection.tsx` and add `businessProfile.ts`.
- Local `SiteApp.tsx` imports `./components/shared/Toaster`; Figma Make must not use stale `components/Toaster`.
- Local i18n files changed together; Figma Make should patch `LanguageContext.tsx` and listed dictionaries as one batch.
- `ThemeContext.tsx`, `etrtoFitment.ts`, and `etrtoFitmentClient.ts` must remain present in Figma Make.

Verification:

```text
git ls-remote --heads origin codex/pwa-cloudflare main master: passed
rg -n "from ['\"].*Toaster|components/Toaster|CONTACT_INFO|etrtoFitmentClient|from ['\"].*/etrtoFitment['\"]" src/SiteApp.tsx src/main.tsx src/components src/i18n src/theme src/utils src/config src/lib package.json: passed with expected presence hits
/Users/chandler/.codex/skills/distill-heavy-output/scripts/distill_cmd.sh "Run the Mitra Auto production build. Return only: pass/fail, warnings/errors grouped by file, and whether dist was generated. Do not include routine Vite transform progress." -- npm run build: passed with Vite large-chunk warning
```

Cleanup: generated `dist` was removed after build verification.

### E-2 Detailed Checklist - Supabase, Hosting, And Provider Ledger

- [x] Record Supabase project slug/ref.
- [x] Record secret status as `set`/`missing` only.
- [x] Record migration/function/provider source.
- [x] Record harmless readback and post-write readback.
- [x] Record hosting redirect/sitemap deployment evidence.

### E-2 Closeout - Supabase, Hosting, And Provider Ledger

Status: Complete with provider blockers

Recorded: 2026-06-22

Progress: `[██░░░] 40%`

Artifacts:

```text
.growth-work/release/e2-supabase-hosting-provider-ledger.json
.seo-work/reports/SUPABASE-HOSTING-PROVIDER-LEDGER-E2-2026-06-22.md
```

Decision: E-2 closes as a provider ledger. Release readiness remains blocked by Cloudflare authenticated readback gaps and public hosting mismatches.

Evidence states:

| Evidence | State | Finding |
| --- | --- | --- |
| Project wrapper | `EXECUTED` | `project mitraauto` loaded expected project dir, slug, Supabase ref, and Supabase URL. |
| Supabase MCP | `EXECUTED` | `supabase-mitra` points to `project_ref=rcmmbwdebnmicrweoiyz`; generic Supabase MCP was not used. |
| Supabase database | `EXECUTED` | Remote read succeeded on Postgres `17.6`; target slug/sitemap migrations are applied and expected RPC signatures exist. |
| Supabase functions | `EXECUTED_WITH_FINDINGS` | Functions readback succeeded; `payments_create_paytrail` is active, but deployed parity with local checkout revalidation remains unverified. |
| Cloudflare authenticated readback | `UNAVAILABLE` | Cloudflare token/account/zone/pages variables are missing from the Mitra wrapper. |
| Public hosting | `EXECUTED_WITH_FINDINGS` | Cloudflare is visible publicly, but robots/sitemap/feed/product redirect behavior is not release-ready. |
| Secret hygiene | `EXECUTED_WITH_FINDINGS` | Local ignored `.vercel/.env.preview.local` contains sensitive marker names; no values were copied into artifacts. |

Supabase readback:

```text
project_ref=rcmmbwdebnmicrweoiyz
database=postgres
postgres_version=17.6
applied_migrations=20260621090000,20260621204946,20260621205611
rpc_present=catalog_get_rim_by_identifier_v1,catalog_get_tire_by_identifier_v1,catalog_list_product_sitemap_rows_v1,catalog_public_product_slug,catalog_slugify_public_path_segment
```

Secret status:

```text
DATABASE_URL=set
SUPABASE_TRANSACTION_POOLER_URL=set
SUPABASE_SESSION_POOLER_URL=set
KEYCHAIN_DB_PASSWORD=set
CLOUDFLARE_API_TOKEN=missing
CLOUDFLARE_ACCOUNT_ID=missing
CLOUDFLARE_ZONE_ID=missing
CLOUDFLARE_ZONE_NAME=missing
CLOUDFLARE_PAGES_PROJECT=missing
PUBLIC_BASE_URL=missing
```

Provider blockers:

- Cloudflare authenticated account, zone, Pages, deployment, and environment readback is unavailable.
- Public `https://www.mitra-auto.fi/robots.txt` returns `404`.
- Public `https://www.mitra-auto.fi/sitemap.xml` returns `404`.
- Public `https://www.mitra-auto.fi/merchant-products.xml` returns the HTML shell instead of XML.
- Public opaque product URL sample `https://www.mitra-auto.fi/catalog/tire/1234567890123` returns `200` HTML with no redirect.
- Local `supabase/functions/payments_create_paytrail/index.ts` is modified; deployed checkout revalidation parity is unverified.
- Local ignored `.vercel/.env.preview.local` contains sensitive marker names and requires owner cleanup/rotation decision.

Verification:

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

### E-3 Detailed Checklist - Live Crawl And Browser Smoke Evidence

- [ ] Crawl representative canonical URLs.
- [ ] Crawl noindex/private/utility routes.
- [ ] Test old product identifier redirects.
- [ ] Test invalid/retired URLs.
- [ ] Browser-smoke service booking, product detail, add to cart, checkout start, contact, language routes, and mobile.

### E-3 Closeout - Live Crawl And Browser Smoke Evidence

Status: Blocked

Recorded: Pending

### E-4 Detailed Checklist - Drift Baseline And Monitoring Handoff

- [ ] Create representative URL set.
- [ ] Record status, canonical, robots, title, description, hreflang, schema, sitemap membership, content marker, and accessibility markers.
- [ ] Define release drift comparison rules.
- [ ] Define weekly/monthly/quarterly monitoring cadence.
- [ ] Define incident response owner and trigger.

### E-4 Closeout - Drift Baseline And Monitoring Handoff

Status: Blocked

Recorded: Pending

### E-5 Detailed Checklist - Final Growth Readiness Classification

- [ ] Reconcile all phase wrap-ups.
- [ ] Reconcile remaining exceptions.
- [ ] Record release classification.
- [ ] Record remaining risks and owner tasks.
- [ ] Record final verification.

### E-5 Closeout - Final Growth Readiness Classification

Status: Blocked

Recorded: Pending

### Phase E Wrap-Up - Release Closeout, Evidence Ledger, And Growth Handoff

Status: Blocked

Progress: `[░░░░░] 0%`

Recorded: Pending

Decision:

```text
Phase E is blocked.
It cannot close until production/source/provider/platform evidence is available.
```

## Board Wrap-Up - Growth Readiness

Status: Blocked

Progress: `[████████████████░░░░] 80%`

Recorded: Pending

Completed phases:

| Phase | Progress | Status | Evidence |
| --- | --- | --- | --- |
| Phase A - Audit, Source Inventory, And Growth Contract | `[█████] 100%` | Complete locally | Reports inventoried, route/schema/content contracts recorded, board standard applied. |
| Phase B - Technical And Product SEO Runtime | `[█████] 100%` | Complete locally | B-1 through B-5 source/runtime gates complete; production redirect/sitemap/feed/schema/checkout evidence remains E-3. |
| Phase C - Local, Service Content, And Schema Readiness | `[█████] 100%` | Complete locally with owner/platform exceptions | C-1 through C-5 source/content/schema/browser gates complete; GBP/citation/platform/outcome proof remains later-phase owner work. |
| Phase D - Measurement, Revenue, Conversion, And Platform QA | `[█████] 100%` | Complete locally with platform and owner exceptions | D-1 through D-5 complete locally; authenticated platform readback, deployed static asset behavior, live business-system reconciliation, owner approvals, and D-4 checkout warnings remain blockers. |
| Phase E - Release Closeout, Evidence Ledger, And Growth Handoff | `[░░░░░] 0%` | Blocked | Pending source parity, provider evidence, live crawl/browser QA, drift baseline, and production evidence. |

Release classification:

```text
blocked - build-to-launch hardening active
```

Remaining risks:

| Risk | Owner | Release impact |
| --- | --- | --- |
| Figma Make final preview parity not verified | `E-1` | Blocks release handoff, not B-1 closure. |
| Production redirect verification missing | `B-5`, `E-3` | Blocks live migration/legacy URL closure. |
| Product sitemap deployed fetch verification missing | `B-5`, `E-3` | Blocks final production discovery readiness, but source-generated product sitemap exists and validates locally. |
| Merchant feed submission and deployed checkout validation not verified | `B-5`, `E-3` | Blocks production commerce trust. |
| GBP owner evidence missing | `C-1` | Blocks local SEO readiness. |
| P1 service proof/content missing | `C-2` | Blocks service SEO strength. |
| Platform readback and live reconciliation missing | `D-3`, `D-5`, `E-2`, `E-3` | Blocks growth-ready classification. |
| Deployed robots/sitemap/feed asset mismatch | `D-3`, `E-3` | Blocks Search Console and Merchant Center readiness until production serves expected XML/text artifacts. |
| Checkout accessibility warnings | `D-4` | Field-associated errors and duplicate responsive submit controls should be fixed before growth-ready classification. |
| Experiment launch readiness missing | `D-5`, `E-4` | No experiment can launch until instrumentation, sample policy, platform readback, reconciliation, and guardrails are verified. |
| Live crawl/browser QA missing | `E-3` | Blocks production readiness. |
| Figma Make source sync uncertain | `E-1` | Can reintroduce runtime failures. |

Final verification:

```text
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md: passed
LC_ALL=C rg -n "[^[:ascii:]]" .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md: progress-bar glyphs only
```

Handoff:

```text
Next task: E-1 - Figma Make Patch-State Ledger
Reason: Phase D is complete locally; release handoff now needs source parity, provider evidence, live crawl/browser QA, drift baseline, and final growth-readiness classification.
```
