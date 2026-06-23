# E-3 - Accessibility, SXO, Checkout, And Customer Journey Smoke

Recorded: 2026-06-23

Status: Complete with blockers carried

Production URL: https://www.mitra-auto.fi

## Decision

E-3 is complete as a rendered customer-journey smoke. It does not approve release.

The rendered production UI supports the main paths better than the raw HTTP layer from E-2: service booking opens, product facts render, add-to-cart works, checkout now moves to `/checkout`, checkout is noindex/no-canonical after hydration, and contact facts are reachable. However, accessibility and agent-operability defects remain in shared controls, catalog controls, product gallery controls, and checkout controls. Mobile viewport evidence was unavailable in this run.

No booking, checkout payment, order submission, contact form submission, login, account action, provider write, or private data action was submitted.

## Evidence Coverage

| Evidence mode | State | Result |
| --- | --- | --- |
| Browser journey | `EXECUTED_WITH_FINDINGS` | Homepage, DPF service, booking modal, contact, catalog, product, cart, and checkout were smoke-tested. |
| Accessibility | `EXECUTED_WITH_FINDINGS` | Labels, names, focus, landmarks, forms, and high-impact controls were inspected with rendered DOM checks. |
| Conversion/SXO | `EXECUTED_WITH_FINDINGS` | Service, product, cart, checkout, and contact task paths render, but defects remain. |
| Commerce source gates | `EXECUTED` | `npm run checkout:check` and `npm run commerce:check` passed. |
| Mobile viewport | `UNAVAILABLE` | The available browser MCP tools did not expose viewport resize/device emulation. |
| Platform/field performance | `UNAVAILABLE` | No Search Console, analytics, CrUX, logs, or provider readback in E-3. |

## Positive Journey Evidence

Homepage:

- Skip link exists: `Siirry pääsisältöön`.
- `main`, `nav`, and `footer` landmarks exist.
- Core links to services, catalog, tire hotel, phone, email, and map/contact routes are crawlable.
- Contact facts are visible.

DPF service and booking:

- Rendered page confirms service, location, pricing/quote context, and process/duration context.
- Internal review blocker text was not found.
- Booking modal opens with focus moved to the license-plate field.
- Modal has dialog role, title `Pikavaraaja`, visible label `Rekisterinumero`, cancel/close controls, and disabled `Jatka` until required selection.

Product, cart, and checkout:

- Product page exposes exact product, variant dimensions, price, availability, seller, delivery/terms context, and Product JSON-LD.
- Cart state shows product and price.
- Checkout action moves URL to `/checkout`.
- Checkout rendered with `robots=noindex,nofollow`, no canonical, H1 `Kassa`, product and price visible, and submit button disabled before required data.
- Local checkout and commerce gates passed.

Contact:

- Contact page renders title, canonical, `index,follow`, H1, NAP facts, hours, and actionable tel/mailto/maps links.

## Findings

### CRITICAL - Global header exposes a visible unnamed button

Evidence:

The rendered homepage, DPF service page, product page, catalog, checkout, and contact page each exposed a visible top-navigation button with no accessible name.

Impact:

Screen-reader users and browser agents cannot determine the control purpose. Because it appears globally, it affects every public journey.

Fix:

Give the button a stable `aria-label` or visible text that names the action.

### CRITICAL - Checkout has unlabeled checkbox inputs and ambiguous toggle names

Evidence:

Checkout rendered two visible checkbox inputs with no label or `aria-label`. Related checkout controls exposed ambiguous button names such as `on`.

Impact:

High-impact purchase flow is not fully accessible or agent-operable because users cannot reliably understand agreement/selection controls before order confirmation.

Fix:

Every checkbox/toggle needs visible and programmatic label text, required state where applicable, and selected-state naming that communicates the exact choice.

### CRITICAL - Catalog search and product-list actions are not sufficiently labelled

Evidence:

The catalog license plate input uses placeholder `ABC-123` but has no visible/programmatic label. Repeated product-list buttons are named only `Lisää`.

Impact:

Vehicle lookup and product add actions are ambiguous for assistive technology and browser agents.

Fix:

Add a visible/programmatic plate-search label and product-specific add button names such as `Lisää [product name] ostoskoriin`.

### WARNING - Product media/gallery controls include unnamed buttons

Evidence:

Product detail exposed two visible unnamed product media buttons near the image area.

Fix:

Name each media control: open image, previous image, next image, or select thumbnail.

### WARNING - Repeated unused preload warning

Evidence:

Browser console showed repeated warnings for `/_json/.../_index.json` being preloaded but not used shortly after load. No JavaScript errors were observed.

Fix:

Review preload hints and remove or correct the unused preload.

### BLOCKER - Mobile journey evidence unavailable

Evidence:

The available browser MCP tools did not expose viewport resize/device emulation. Observed viewport was desktop-sized at `1517x935`.

Fix:

Run mobile smoke for homepage, service booking, catalog, product/cart, checkout, and contact before release approval.

## Verification

```text
mcp__playwright.browser_navigate/evaluate rendered smoke for homepage, DPF service, booking modal, catalog, product, cart, checkout, and contact: passed with findings
mcp__playwright.browser_console_messages level=warning all=true: passed with findings
npm run checkout:check: passed
npm run commerce:check: passed
```

## Closeout

E-3 can close as `complete with blockers carried`.

Mitra Auto remains not release-ready because:

- E-2 production HTTP/static/redirect/private/error/raw-head blockers remain open.
- E-3 found accessibility defects in shared controls, catalog, product media, and checkout.
- Mobile viewport evidence is unavailable.
- Platform and field-performance evidence remains unavailable.
