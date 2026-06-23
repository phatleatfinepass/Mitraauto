# E-4 - Drift Baseline, Monitoring, Incident Runbook, And Owners

Recorded: 2026-06-23 13:21:49 EEST +0300  
UTC: 2026-06-23T10:21:49Z

Status: Complete with blockers carried

## Decision

E-4 can close as an operating baseline and monitoring handoff. It does not make Mitra Auto release-ready or growth-ready.

The current production baseline is intentionally a failing baseline: it records what production is doing now so deployment parity fixes can be verified and future regressions can be detected. Local repo policy gates pass, but the live host still serves the generic Figma-hosted SPA shell for sampled public, utility, private, redirect, and error routes.

## Evidence Coverage

| Evidence mode | State | Notes |
| --- | --- | --- |
| `REPO` | `EXECUTED_WITH_FINDINGS` | Prior E-phase board evidence and local source contracts exist. |
| `LOCAL_GATES` | `EXECUTED` | Static assets, sitemaps, Merchant feed, route migration, private routes, checkout, and commerce checks passed locally. |
| `LIVE` | `EXECUTED_WITH_FINDINGS` | 23 production URLs were checked with bounded read-only HTTP evidence. |
| `BROWSER` | `SUPPLIED_REVIEW_REQUIRED_FROM_E3` | E-3 browser evidence is linked; browser was not rerun in E-4. |
| `MIGRATION` | `EXECUTED_WITH_FINDINGS` | Local migration rules pass, but production redirects/soft-404 policy fail. |
| `PLATFORM` | `UNAVAILABLE` | Cloudflare, Search Console, GBP, Merchant Center, analytics, logs, and field data are not available. |
| `FIELD_PERFORMANCE` | `UNAVAILABLE` | No CrUX/Search Console field performance readback is available. |
| `INCIDENT` | `EXECUTED` | Incident runbook, rollback triggers, and owner map are now recorded. |

## Baseline Summary

Production observation from the E-4 bounded matrix:

- Public HTML samples return `200 text/html` with the same generic title.
- Raw HTML samples have no route-specific canonical and no JSON-LD.
- Raw HTML samples include the JavaScript-required shell text.
- `/robots.txt` and `/sitemap.xml` return `404`.
- `/sitemap-products.xml` and `/merchant-products.xml` return `200 text/html` instead of XML.
- Legacy product identifiers, legacy service/catalog aliases, private routes, unknown routes, and unknown product URLs return `200 text/html` instead of their target redirect/error/private policies.

Local source gates passed:

- `npm run static-assets:check`
- `npm run sitemap:check`
- `npm run feed:check`
- `npm run route-migration:check`
- `npm run private-routes:check`
- `npm run checkout:check`
- `npm run commerce:check`

Interpretation: the repo has the expected contracts, but production deployment/runtime parity is still not proven.

## Release Drift Rules

Block deployment or rollback when:

- `robots.txt`, `sitemap.xml`, product sitemap, or Merchant feed is missing, HTML, incorrectly redirected, or wrong content type.
- Homepage or core public templates become blocked, noindex, non-200, or canonicalized to the wrong host.
- Private/admin/account routes render public `200` content or private data.
- Unknown routes/products return public `200` soft-404 content.
- Legacy service/product URLs or opaque product identifiers fail permanent one-hop redirect policy after deploy parity is fixed.
- Product page, Product/Offer schema, Merchant feed, cart, checkout, price, availability, identifiers, or seller facts diverge.
- Checkout, account, order-confirmation, CMS, or customer routes become indexable or enter sitemaps.
- Booking, contact, catalog, product, cart, or checkout journeys become inaccessible or ambiguous for keyboard users/browser agents.

Create a critical review artifact when:

- Route-specific raw head, rendered head, H1, schema, primary content, language, or internal links change on a public template.
- Locale canonicals/hreflang/internal links conflict.
- Internal links point to redirects, errors, private routes, legacy IDs, or noncanonical duplicates at scale.
- Platform diagnostics change in Search Console, Merchant Center, GBP, analytics, logs, or field CWV.

Warnings should create review artifacts, not automatically fail deployment, for optional metadata, recommended schema fields, non-critical image metadata, response-time changes, unused preload warnings, or non-blocking accessibility markers.

## Monitoring Cadence

Each release:

- Run local gates: `static-assets:check`, `sitemap:check`, `feed:check`, `route-migration:check`, `private-routes:check`, `checkout:check`, and `commerce:check`.
- Run bounded live HTTP matrix across homepage, service hub, service detail, contact, location, catalog, product slug, legacy product identifiers, legacy aliases, checkout, private routes, unknown routes, robots, sitemap, product sitemap, and Merchant feed.
- Run rendered browser smoke for homepage, service booking, contact, catalog, product, cart, checkout, private route, and unknown route.
- Annotate release date/time, branch/commit, affected templates, Cloudflare/Figma Make deployment, static assets, redirects, schema/feed changes, provider deployments, and exceptions.

Weekly:

- Check critical production asset URLs and redirect samples.
- Review Search Console manual actions, security issues, indexing, sitemap, page experience, and enhancement reports when access exists.
- Review Merchant Center diagnostics, Business Profile edits/suspension/hours, booking/order/checkout failures, and private-route alerts.

Monthly:

- Segment Search Console and analytics by page type, locale, device, country, query intent, product/service family, inventory state, and qualified outcome.
- Review product/feed stock and price drift, local facts, content freshness, service claim evidence, accessibility regression queue, field Core Web Vitals, and conversion quality.
- Refresh representative URL set when a new page type, language route, product state, service state, or provider integration ships.

Quarterly:

- Recheck structured-data feature status, Merchant Center policy, GBP policy, crawler/AI policy, schema support, and documentation freshness.
- Review route architecture, stale redirects, content portfolio, owner evidence, experiment decisions, privacy/accessibility/legal boundaries, and source freshness.

## Owner Map

| Area | Owner | Backup | Verification |
| --- | --- | --- | --- |
| Production host, Cloudflare Pages/Functions, redirects, status policy, static assets | Hosting/Cloudflare/engineering owner | SEO/growth ops owner | Public HTTP matrix and provider readback pass. |
| Public/private route boundary, account/CMS/admin access, security/privacy | Engineering/security owner | Privacy/legal reviewer | Unauthenticated route probes and security review pass. |
| Search Console, indexing, sitemap submission, URL inspection, traffic anomaly diagnosis | SEO/growth ops owner | Analytics owner | Search Console readback and release annotation are recorded. |
| Merchant feed, product facts, price, stock, schema/feed/cart/checkout parity | Commerce/PIM owner | Engineering owner | Feed diagnostics, product samples, and checkout reconciliation pass. |
| Analytics, events, consent, booking/order/revenue reconciliation | Analytics/revenue owner | Growth ops owner | Analytics and business-system reconciliation pass with limitations documented. |
| Local facts, GBP, citations, service evidence, reviews, media, legal and policy claims | Business/local/content owner | Legal/privacy reviewer | Owner-approved evidence package is current. |
| Accessibility, SXO, mobile customer journeys, browser-agent operability | Frontend/accessibility owner | QA/growth owner | Browser/accessibility matrix passes on desktop and mobile. |

## Incident Runbook

### P0 - Private/Admin Exposure

Trigger: private/admin/account route exposes public `200` shell or private data.

First 15 minutes:

- Freeze deployments and preserve sanitized evidence.
- Confirm unauthenticated reproduction in private/incognito context.
- Disable or protect route at edge if private content is visible.

First hour:

- Read recent deployment and route-policy changes.
- Patch Cloudflare/status/auth policy or rollback to last safe build.
- If data exposure is confirmed, escalate to privacy/legal and follow incident obligations.

Verification: unauthenticated routes return `401`, `403`, or safe `404`, no private content, and noindex where applicable.

Rollback criteria: any confirmed private data exposure or unauthenticated admin surface.

### P0 - Static SEO Asset Or Feed Failure

Trigger: `robots.txt`, `sitemap.xml`, product sitemap, or Merchant feed is missing, HTML, blocked, or wrong content type.

First 15 minutes:

- Confirm live HTTP status/content type from the canonical host.
- Compare repo `src/public` assets and build output.
- Check deployment target, static asset routing, cache, and edge fallback order.

First hour:

- Deploy the correct static asset/routing fix or rollback to last known good deployment.
- Purge relevant CDN cache if safe.
- Submit/retry sitemap/feed fetch in platform tools when access exists.

Verification: assets return expected status, content type, and body; local and live checks agree.

Rollback criteria: canonical production cannot serve critical static SEO assets within the incident window.

### P1 - Organic Or Indexing Anomaly

Trigger: material drop in organic clicks/impressions/indexed pages or template-level visibility.

First 15 minutes:

- Check analytics/Search Console data freshness, timezone, filters, consent, and tracking changes.
- Scope decline by page type, query intent, country, device, language, and search appearance.
- Correlate with release annotations and production drift baseline.

First hour:

- Check robots, noindex, canonical, redirects, raw/rendered HTML, sitemaps, manual actions, security issues, and platform status.
- Separate demand, SERP, competitor, content, inventory, and measurement explanations before broad edits.
- Patch only confirmed root cause or document hypothesis and next checkpoint.

Verification: segmented report shows affected scope, ruled-out causes, confirmed cause or open hypotheses, and next measurement checkpoint.

Rollback criteria: a release-introduced blocker/critical technical regression aligns with the decline.

### P1 - Merchant/Product Mismatch

Trigger: Merchant Center disapproval spike, feed fetch failure, or price/availability mismatch.

First 15 minutes:

- Check feed URL status/content type and latest generated feed timestamp.
- Sample affected item IDs across website page, Product schema, feed, cart, and checkout.
- Identify whether mismatch is product source, feed generation, deploy, cache, or checkout pricing.

First hour:

- Regenerate/redeploy feed or fix source contract.
- Pause affected promotion/scaling if product terms are unreliable.
- Record Merchant Center diagnostics when access exists.

Verification: sampled items reconcile across feed, page, schema, cart, checkout, and provider diagnostics.

Rollback criteria: false price, false availability, unsupported fitment, or checkout-term mismatch is live.

### P1 - Booking, Checkout, Or Measurement Failure

Trigger: booking, cart, checkout, or Paytrail callback journey fails or records misleading revenue/conversion data.

First 15 minutes:

- Confirm whether the issue is UI, provider, edge function, analytics event, or business-system reconciliation.
- Avoid test payments or destructive submissions unless explicitly approved.
- Check noindex/canonical status and customer-facing recovery messaging.

First hour:

- Fix or rollback the failing journey, provider function, or event mapping.
- Annotate revenue/analytics data-quality gap.
- Reconcile server-confirmed Paytrail state before reporting purchase outcomes.

Verification: checkout/browser smoke and server/provider readback pass; events use `booking_submitted` and server-confirmed purchase semantics.

Rollback criteria: customers cannot complete purchase/booking or revenue events become materially misleading.

### P1 - Accessibility Or Mobile Journey Regression

Trigger: accessibility or mobile journey regression blocks booking, contact, product selection, cart, or checkout.

First 15 minutes:

- Reproduce on affected route/device with keyboard and browser accessibility tree.
- Identify whether a shared component, modal, form control, or route chunk changed.
- Confirm no high-impact action is ambiguous or irreversible.

First hour:

- Patch accessible name/label/focus/state or rollback shared component change.
- Run desktop and mobile browser smoke.
- Record any temporary exception with owner, mitigation, and expiry.

Verification: all visible controls have stable accessible names, fields have labels/errors/autocomplete where applicable, and primary journey completes safely.

Rollback criteria: booking, contact, product/cart, or checkout cannot be operated by keyboard or clear accessible controls.

## Rollback And Communication

Freeze trigger:

- Any P0/blocker or confirmed release-introduced P1/critical regression affecting crawl access, private route protection, product/checkout truth, or customer task completion.

Default rollback path:

1. Freeze new changes.
2. Preserve sanitized evidence and exact timestamps.
3. Identify last known good deployment/source state.
4. Roll back or patch the smallest edge/runtime/source change required.
5. Re-run local gates, live HTTP matrix, and affected browser/platform checks.
6. Annotate the incident and update the baseline, tests, and owner register.

Communication path:

- Incident owner opens the decision log with timestamp, severity, affected scope, and evidence.
- Engineering owner handles technical mitigation and rollback.
- SEO/growth ops owner records Search Console/platform implications and release annotation.
- Business/local/commerce owner approves any public fact, price, policy, or claim exception.
- Privacy/security/legal reviewer is pulled in for private data, consent, payment, legal, or unsupported-claim risk.

## Next Review Triggers

- Production host changes from Figma-hosted runtime to Cloudflare Pages/repo build output.
- Cloudflare, Search Console, GBP, Merchant Center, GA4, server logs, or field CWV access becomes available.
- Static SEO assets, edge redirects, private route policy, or raw metadata injection changes.
- Product feed, product schema, checkout, Paytrail, booking, service content, local facts, or legal/policy copy changes.
- Before paid acquisition, guide/content scaling, SEO experiments, or local/product growth campaigns begin.

## Verification

```text
node --input-type=module <<'NODE' ... E-4 live HTTP bounded baseline ... NODE: passed with findings
npm run static-assets:check: passed
npm run sitemap:check: passed
npm run feed:check: passed
npm run route-migration:check: passed
npm run private-routes:check: passed
npm run checkout:check: passed
npm run commerce:check: passed
```

## Figma Make Sync

None.

E-4 changed docs/evidence artifacts only. No Figma Make source files were changed.

## Limitations

Authenticated Cloudflare, Search Console, Google Business Profile, Merchant Center, analytics, server log, and field Core Web Vitals evidence remains unavailable. Rendered browser evidence is linked from E-3 and was not rerun in E-4. This handoff improves regression detection and incident discipline; it does not guarantee crawling, indexing, selected canonicals, rankings, rich results, local-pack visibility, Merchant Center approval, traffic, conversions, revenue, ROI, or AI inclusion.
