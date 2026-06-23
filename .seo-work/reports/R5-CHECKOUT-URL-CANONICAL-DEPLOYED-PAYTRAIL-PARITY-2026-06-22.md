# R-5 - Checkout URL, Canonical, And Deployed Paytrail Parity

Recorded: 2026-06-22

Status: Complete locally with deployed Paytrail parity blocker

Progress: `[█████████████░░░░░░░] 63%`

## Decision

R-5 local remediation is complete.

Checkout now routes through `/checkout`, checkout utility pages remain `noindex, nofollow` with no canonical or alternate links, client Paytrail callbacks use the canonical public site URL, and the local Paytrail Edge Function restricts callbacks to allowed checkout success/cancel URLs.

Production Paytrail parity is still blocked because the deployed `payments_create_paytrail` source differs from local and does not contain the R-5 callback allowlist or canonical `www` callback defaults.

## Implemented

| File | Purpose |
| --- | --- |
| `src/SiteApp.tsx` | Cart checkout now calls `navigate('/checkout')` instead of rendering checkout via local state on the current URL. |
| `src/components/site/checkout/CheckoutPage.tsx` | Checkout sends `success_url` and `cancel_url` from `publicSiteUrl`, not `window.location.origin`. |
| `supabase/functions/payments_create_paytrail/index.ts` | Paytrail callback defaults now use `https://www.mitra-auto.fi`; callback URLs are normalized through allowed origin and allowed path checks. |
| `scripts/check_checkout_runtime_parity.mjs` | Adds a regression gate for checkout URL navigation, utility noindex/no-canonical policy, callback allowlisting, edge route allowance, and checkout price/stock validation markers. |
| `package.json` | Adds `npm run checkout:check`. |

## Figma Make Sync Files

Only these R-5 files need Figma Make source patching:

```text
/Figma/src/SiteApp.tsx
/Figma/src/components/site/checkout/CheckoutPage.tsx
```

The Supabase function, verification script, package script, board, and reports are not Figma Make files.

## Runtime Policy

Checkout URL policy:

```text
Cart checkout action must push /checkout into browser history.
Direct /checkout, /checkout/success, and /checkout/cancel remain reachable utility routes.
```

Canonical/indexing policy:

```text
Checkout, success, and cancel are noindex utility pages.
They intentionally remove canonical and alternate links while active.
```

Paytrail callback policy:

```text
Client callback URLs come from publicSiteUrl.
Server callback defaults are:
https://www.mitra-auto.fi/checkout/success
https://www.mitra-auto.fi/checkout/cancel

Server accepts only configured allowed frontend origins and only:
/checkout/success
/checkout/cancel
```

## Local Browser Evidence

| URL | Robots | Canonical | Alternates | Heading | Result |
| --- | --- | --- | ---: | --- | --- |
| `http://127.0.0.1:4175/checkout` | `noindex, nofollow` | none | 0 | `Kassa` | Passed |
| `http://127.0.0.1:4175/checkout/success` | `noindex, nofollow` | none | 0 | `Emme voineet vahvistaa tilaustasi` | Passed |
| `http://127.0.0.1:4175/checkout/cancel` | `noindex, nofollow` | none | 0 | `Maksu keskeytettiin` | Passed |

## Live Evidence

Direct live checkout route:

```text
https://www.mitra-auto.fi/checkout
HTTP 200 text/html
Rendered robots: noindex, nofollow
Rendered canonical: none
Rendered alternates: none
Heading: Checkout
```

Live utility reachability:

| URL | HTTP | Content type | Redirects |
| --- | ---: | --- | ---: |
| `https://www.mitra-auto.fi/checkout` | 200 | `text/html` | 0 |
| `https://www.mitra-auto.fi/checkout/success` | 200 | `text/html` | 0 |
| `https://www.mitra-auto.fi/checkout/cancel` | 200 | `text/html` | 0 |

Supabase function readback:

| Field | Value |
| --- | --- |
| Project ref | `rcmmbwdebnmicrweoiyz` |
| Function | `payments_create_paytrail` |
| Status | `ACTIVE` |
| Verify JWT | `true` |
| Version | `23` |
| Updated at | `2026-05-02 05:35:57 EEST` |
| Source parity | `different` |
| Remote has canonical `www` default | `no` |
| Remote has callback allowlist | `no` |

## Remaining Blockers

| Blocker | Owner | Required resolution |
| --- | --- | --- |
| Deployed `payments_create_paytrail` differs from local R-5 source and lacks callback allowlist/canonical `www` defaults. | Supabase/commerce deployment owner | Deploy the updated function to `rcmmbwdebnmicrweoiyz`, redownload it, and verify source parity. |
| Paytrail merchant credential and callback env values were not available in the local shell. | Commerce/provider owner | Verify Paytrail secrets and callback env through secret-safe provider readback; never print secret values. |
| Local cart-to-checkout URL fix is not proven on production. | Frontend/hosting owner | Deploy current app build and run live cart-to-checkout browser smoke verifying URL becomes `/checkout`. |

## Verification

```text
npm run checkout:check: passed
deno check supabase/functions/payments_create_paytrail/index.ts: passed
npm run build through distill wrapper: passed
npm run commerce:check: passed
source ~/.config/projects/bin/project && project mitraauto: passed, project ref rcmmbwdebnmicrweoiyz confirmed
codex mcp get supabase-mitra: passed, project-specific MCP config points to rcmmbwdebnmicrweoiyz
supabase functions list --project-ref "$SUPABASE_PROJECT_REF" -o json: passed, payments_create_paytrail active verify_jwt true
supabase functions download payments_create_paytrail --project-ref "$SUPABASE_PROJECT_REF" --use-api: passed with source parity finding
Playwright MCP local checkout utility route checks: passed
curl live checkout utility route matrix: passed for reachability
Playwright MCP live /checkout head check: passed for direct route head
git diff --check -- R-5 touched files: passed
```

## Required Owner Actions

| Owner | Action | Verification |
| --- | --- | --- |
| Figma Make/source sync owner | Patch `/Figma/src/SiteApp.tsx` and `/Figma/src/components/site/checkout/CheckoutPage.tsx`. | Figma Make cart checkout changes URL to `/checkout`; no checkout page renders on stale product/catalog URL. |
| Supabase/commerce owner | Deploy `supabase/functions/payments_create_paytrail/index.ts`. | Downloaded deployed source matches local and contains `FRONTEND_ALLOWED_ORIGINS` plus `normalizeFrontendRedirectUrl`. |
| Commerce/provider owner | Confirm Paytrail secrets and callback env using secret-safe readback. | Env status is recorded as set/missing only; production callbacks resolve to `https://www.mitra-auto.fi/checkout/success` and `/checkout/cancel`. |

## Closeout

R-5 closes local implementation and evidence.

Release remains blocked until the current app build and updated Paytrail Edge Function are deployed and provider-safe Paytrail callback parity is verified.

Next:

```text
Continue with R-6 - Authenticated provider and platform readback.
```
