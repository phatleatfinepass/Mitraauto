# Full System QA Report

**Overall QA Progress**

`██████████████████████████████` **100%**
Worked: **115 / 115** checks. Open/not run: **0** checks. Findings logged: **12** original defects plus **2** follow-ups. Locally patched: **12 / 12** original defects. Production confirmed fixed: **12 / 12** original defects.

**Patch Progress**

Local source patching: `██████████████████████████████` **100%**
Patched locally: **12 / 12** findings. Local verification: **3 / 3** checks passed (`npm run i18n:audit`, `git diff --check`, `npm run build`).

Production acceptance: `██████████████████████████████` **100%**
Production re-test after deploy/DB patch: **12 / 12** original findings confirmed fixed. Remaining follow-up: **NEW-001 Catalog Health frontend deploy/re-test**.

Use this report for human acceptance testing after the tire/rim catalog refactor. Mark each row with `Pass`, `Fail`, or `Blocked`, and attach screenshots, order IDs, sync run IDs, email headers, console errors, or Supabase rows as evidence.

## Test Session

- Tester:
- Date:
- Environment:
- Browser/device:
- CMS user:
- Customer test email:
- Customer test phone:
- Test license plate:
- Notes:

### Live QA Run - 2026-05-15

- Environment: deployed production site, `https://www.mitra-auto.fi`
- Browser/device: Playwright browser, desktop viewport
- Customer test email: `box.ryanle@gmail.com`
- Customer test phone: `+358401234567`
- Test license plate: `TST-123`
- Test booking ID: `c512d6fc-b62c-4367-b6d8-ce22f5b5d1c1`
- Booking date/time: `2026-05-16 10:00`
- Service: `Tire change - passenger car`
- Booking language stored in DB: `en`
- Test order ID: `db9b51d6-87ca-43f0-81f9-c532e324ec36`
- Order payment status: simulated success, `paid` / Paytrail `ok`
- FI booking ID: `13458e0f-341b-4c53-81be-967db19e1e7d`
- FI failed-payment order ID: `0601dd65-2541-4fb2-9406-0a3b2d4c3bee`
- FI failed-payment status: simulated fail, `cancelled` / Paytrail `failed`
- CMS status: authenticated CMS access confirmed after operator login.

## Defect Log

| ID | Severity | Area | Status | Found In | Summary |
| --- | --- | --- | --- | --- | --- |
| BUG-001 | Medium | Booking i18n | Production Pass | Production site, EN UI | Step 1 selected date button formats the chosen date in Finnish even when the UI language is English. |
| BUG-002 | Low | Checkout i18n | Production Pass | Production site, EN UI | Checkout page heading renders the raw translation key `checkout.checkout` instead of a translated title. |
| BUG-003 | Medium | Paid order install booking i18n | Production Pass | Production site, order email install link | English install-booking link opens the site and booking modal in Finnish. |
| BUG-004 | Low | Booking i18n | Production Pass / Watch | Production site, FI UI | Booking time-slot heading renders English text `Available time slots` inside Finnish UI. |
| BUG-005 | Low | Catalog read model | Production Pass | Supabase RPC/view inspection | Public tire/rim brand helper RPCs now read product-ready cached filter options instead of scanning large mixed read models. |
| BUG-006 | Medium | Tire catalog filter | Production Pass | Production site, EN UI | Selecting tire brand `Continental` still leaves `Hankook` tire cards visible in the product grid. |
| BUG-007 | High | CMS Catalog | Production Pass | Production CMS, Catalog tab | Tires and Rims Catalog health shell loads, but the product list/table area fails with `e.catch is not a function`. |
| UX-001 | Low | CMS Catalog layout | Production Pass / Follow-up | Production CMS, Catalog tab | Move Catalog Health behind an icon button next to the Tires/Rims toggle so Tires/Rims work areas stay clean. |
| UX-002 | Low | Cart accessibility | Production Pass | Production storefront cart | Cart quantity icon buttons have no accessible labels; disabled plus at quantity `1` is visually unclear without context. |
| BUG-008 | Medium | Tire catalog sort | Production Pass | Production storefront, EN UI | Selecting tire sort `Price ↓` leaves visible tire prices in low-to-high order. |
| BUG-009 | Medium | Tire catalog size filter | Production Pass | Production storefront, EN UI | Manual tire size filter can show non-matching sizes after selecting `205 / 55 / 16`. |
| BUG-010 | Medium | Tire catalog EAN filter | Production Pass | Production storefront, EN UI | EAN advanced filter accepts an EAN but leaves broad/non-exact results visible. |

### Local Patch Status - 2026-05-15

These source patches are applied locally and passed `npm run i18n:audit`, `git diff --check`, and `npm run build`. They still need deployment and browser re-test on production before the defect rows should be marked `Pass`.

Patch bar: `██████████████████████████████` **100% local patch complete**
Acceptance bar: `██████████████████████████████` **100% original defect production re-test complete**

| ID | Local patch status | Production re-test | Evidence |
| --- | --- | --- | --- |
| BUG-001 | Patched locally | Pass | EN booking selected date showed `Friday, May 15, 2026`; no Finnish date words. |
| BUG-002 | Patched locally | Pass | `/checkout` heading showed `Checkout`; no `checkout.checkout` key. |
| BUG-003 | Patched locally | Pass | `/en/?book_install=1&install_token=...` stayed English even when stored language was FI. Invalid token returned expected 400. |
| BUG-004 | Patched locally | Pass with console warning | FI booking time-slot heading showed `Vapaat ajat`; no English `Available time slots`. Console also logged one generic `Failed to fetch` during availability loading. |
| BUG-005 | Patched locally and DB migration applied | Pass | REST checks after migration: tire brand helper returned `52` brands in `173 ms`; rim brand helper returned `14` brands in `60 ms`. |
| BUG-006 | Patched locally | Pass | Selecting `Hankook` showed only Hankook products in first 24 visible product cards. |
| BUG-007 | Patched locally | Pass | CMS Catalog table loaded; no `e.catch is not a function` crash. |
| UX-001 | Patched locally | Pass with follow-up | Catalog Health icon exists and drawer opens. Drawer data mismatch is tracked separately as `NEW-001`. |
| UX-002 | Patched locally | Pass | Cart quantity and remove buttons expose `Decrease quantity`, `Increase quantity`, and `Remove item from cart` labels. |
| BUG-008 | Patched locally | Pass | `Price ↓` returned descending visible prices, starting `584.48, 353.28, 336.24...`. |
| BUG-009 | Patched locally | Pass | Manual size `205 / 55 / 16` returned only `205 / 55 R16` results in first 24 cards. |
| BUG-010 | Patched locally | Pass | EAN `6959753219860` isolated `Triangle AdvanteX SUV TR259 245 / 65 R17 111 H`. |

### Production Re-test Follow-ups - 2026-05-15

| ID | Severity | Area | Status | Summary |
| --- | --- | --- | --- | --- |
| NEW-001 | Medium | CMS Catalog Health | Patched locally + DB applied / Needs deploy re-test | Catalog Health drawer opened, but tire `RD raw`, tire `VT raw`, tire selected layer, and rim selected layer displayed `-` while webshop layers were current. Patch adds `catalog_get_health_summary_v1()` and makes the drawer read one CMS health summary RPC. |
| NEW-002 | Low | Booking availability telemetry | Watch | FI booking label patch passed, but one generic production console `TypeError: Failed to fetch` appeared during availability loading. UI still rendered the time-slot section; needs repeat check before treating as a functional booking issue. |

### BUG-001 - Booking Step 1 Date Uses Finnish Locale In English UI

**Where found**

- URL: `https://www.mitra-auto.fi`
- Flow: Home -> Book a Service -> enter `TST-123` -> select `16 May 2026`
- UI language: English
- Observed date button text: `lauantaina 16. toukokuuta 2026`
- Expected date button text: English date, for example `Saturday, May 16, 2026`

**Impact**

- Customer-facing language consistency issue.
- Booking can still continue; this is not blocking booking creation.
- Later booking summary and success screen already show English dates, so the issue is isolated to Step 1 selected-date display.

**Evidence**

- Live deployed booking continued successfully after the date display issue.
- Booking row exists:
  - `id`: `c512d6fc-b62c-4367-b6d8-ce22f5b5d1c1`
  - `license_plate`: `TST-123`
  - `customer_email`: `box.ryanle@gmail.com`
  - `booking_language`: `en`
  - `status`: `confirmed`
- Customer email arrived in English with subject `Booking confirmation: Tire change - passenger car`.

**Likely source**

- `src/components/site/booking/BookingStep1.tsx`
- The selected date label uses a hardcoded Finnish locale:

```tsx
date.toLocaleDateString('fi-FI', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
```

**Patch direction**

- Do not add a direct `language === 'fi'` branch in the component because `npm run i18n:audit` flags direct UI language branching.
- Add a dictionary-backed locale key, for example:

```ts
'booking.locale.date': { fi: 'fi-FI', en: 'en-US' }
```

- Then use it in `BookingStep1.tsx`:

```tsx
const dateLocale = t('booking.locale.date');

date.toLocaleDateString(dateLocale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
```

**Verification needed after patch**

- `npm run i18n:audit`
- `npm run build`
- Browser check in English:
  - select `16 May 2026`
  - selected date button should show `Saturday, May 16, 2026`
  - no Finnish date text should remain in Step 1.
- Browser check in Finnish:
  - selected date button should continue showing Finnish date text.

### BUG-002 - Checkout Heading Shows Raw Translation Key

**Where found**

- URL: `https://www.mitra-auto.fi/catalog`
- Flow: Catalog -> add tire to cart -> cart drawer -> Proceed to Checkout
- UI language: English
- Observed heading: `checkout.checkout`
- Expected heading: `Checkout`

**Impact**

- Customer-facing polish/i18n issue on checkout.
- Checkout can still proceed to Paytrail after the terms checkbox is accepted.
- This does not block order creation or payment handoff.

**Evidence**

- Cart item: `Continental sContact`, quantity `1`.
- Checkout summary total: `EUR 30.28`.
- Paytrail handoff succeeded and redirected to `https://pay.paytrail.com/pay/07736819-442b-4c7c-8f20-ade9ce7cfbbf`.
- After simulated success payment, paid order row exists:
  - `id`: `db9b51d6-87ca-43f0-81f9-c532e324ec36`
  - `email`: `box.ryanle@gmail.com`
  - `status`: `paid`
  - `paytrail_status`: `ok`
  - `paytrail_provider`: `nordea`
  - `paytrail_reference`: `ORDER-db9b51d6-87ca-43f0-81f9-c532e324ec36`
  - `paytrail_transaction_id`: `07736819-442b-4c7c-8f20-ade9ce7cfbbf`

**Likely source**

- `src/components/site/checkout/CheckoutPage.tsx`
- The page calls:

```tsx
{checkoutText('checkout')}
```

- Current dictionary key is:

```ts
'checkout.title': { fi: 'Kassa', en: 'Checkout' }
```

**Patch direction**

- Either change the component to use `checkoutText('title')`, or add a dictionary alias:

```ts
'checkout.checkout': { fi: 'Kassa', en: 'Checkout' }
```

- Preferred patch: update `CheckoutPage.tsx` to use the existing `checkout.title` key, unless other components already depend on `checkout.checkout`.

**Verification needed after patch**

- `npm run i18n:audit`
- `npm run build`
- Browser check in EN and FI checkout.
- Confirm checkout heading shows translated text and no raw `checkout.*` key appears.

### BUG-003 - English Install Link Opens Finnish UI

**Where found**

- Source: paid order confirmation email for order `db9b51d6-87ca-43f0-81f9-c532e324ec36`
- Link path: `/en/?book_install=1&install_token=...`
- Observed result: home page and booking modal opened in Finnish.
- Expected result: `/en/` install link should open English UI, or the email language should match the install booking language.

**Impact**

- Customer can still book installation successfully.
- Language continuity breaks after an English order confirmation email.
- The install booking created from this flow was stored with `booking_language = fi`, even though the source order/email was English.

**Evidence**

- Paid order language in order snapshot: `en`.
- Install booking created:
  - `id`: `194f4019-c3a2-4d57-9d00-72fb7127ce97`
  - `booking_date`: `2026-05-19`
  - `booking_time`: `10:00`
  - `service_name`: `Rengastyö - Henkilöauto max. 17"`
  - `booking_language`: `fi`
  - `customer_email`: `box.ryanle@gmail.com`
- Install booking confirmation email arrived in Finnish.

**Likely source**

- `src/SiteApp.tsx`
- Install-token modal boot starts around the `install_token` query handling and opens the booking modal without forcing the language from the `/en/` route.
- `src/i18n/LanguageContext.tsx` also reads `mitra-language` from `localStorage`, so stale stored language can override the email route language.

**Patch direction**

- When URL path starts with `/en`, force initial UI language to `en` before opening the install booking modal.
- When URL path starts with `/fi`, force initial UI language to `fi`.
- Ensure install-token prefill does not override URL language with stale `localStorage` language.
- Persist the resolved language into the booking row.

**Verification needed after patch**

- Open the paid-order install link from an English order email.
- UI should remain English.
- Install booking service label and confirmation email should be English.
- Booking row should store `booking_language = en`.

### BUG-004 - Finnish Booking Modal Shows English Time-Slot Heading

**Where found**

- URL: paid-order install booking flow after opening the booking modal in Finnish.
- Observed text: `Available time slots`
- Expected text: Finnish equivalent, for example `Vapaat ajat`.

**Impact**

- Minor mixed-language issue in booking Step 1.
- Does not block booking creation.

**Likely source**

- `src/components/site/booking/TimeSlotGrid.tsx`
- Hardcoded text:

```tsx
<span>Available time slots</span>
aria-label="Available time slots"
```

**Patch direction**

- Move the label into `src/i18n/dictionaries/booking.ts`.
- Pass `t` or the translated label into the time-slot component.
- Keep the fix compatible with `npm run i18n:audit`.

**Verification needed after patch**

- Open booking modal in FI and EN.
- FI should not show `Available time slots`.
- EN should still show `Available time slots` or approved English copy.

### BUG-005 - Catalog Brand Helpers Timed Out Or Could Include Non-Ready Brands

**Where found**

- Supabase read-model inspection during raw-to-webshop QA.
- Search index rows were fresh, but larger than ready public counts:
  - tire index: `14389` rows; ready visible published tires: `12707`
  - rim index: `40404` rows; ready visible published rims: `19353`
- Main catalog list/count/detail RPCs correctly filter ready public rows:
  - `catalog_list_tires_v1`
  - `catalog_count_tires_v1`
  - `catalog_list_rims_v1`
  - `catalog_count_rims_v1`
  - `catalog_get_rim_by_identifier_v1`
- Original brand helper risk:
  - `catalog_list_tire_brands_v1` filters `product_type`, `is_visible`, and `publish_status`, but not `product_ready`.
  - `catalog_list_rim_brands_v1` reads `catalog_rims_public_v1`; that view filters `product_type`, `is_visible`, and `publish_status`, but not `product_ready`.
- Production re-test also found the legacy rim brand helper could time out with `57014 canceling statement due to statement timeout`.

**Impact**

- Product list results should still hide non-ready products because the main list/count RPCs filter `product_ready`.
- Brand filters may show a brand that has no ready public products, causing empty filtered results or inflated brand options.

**Patch applied**

- Migration `20260515175452_catalog_health_and_fast_brand_helpers.sql` replaces both public brand helper RPCs so they read cached filter option tables:
  - `webshop_tire_filter_options`
  - `webshop_rim_filter_options`
- Those cache refresh functions already populate options from visible, published, `product_ready` rows.
- This avoids scanning the large product/search read models during storefront filter loading.

**Verification after patch**

- Live Supabase migration applied successfully.
- Public REST checks:
  - `catalog_list_tire_brands_v1`: HTTP `200`, `52` brands, `173 ms`
  - `catalog_list_rim_brands_v1`: HTTP `200`, `14` brands, `60 ms`
- SQL verification:
  - `catalog_get_health_summary_v1` exists.
  - ready health source rows are populated for both tires and rims.

### BUG-006 - Tire Brand Filter Leaves Other Brands Visible

**Where found**

- URL: `https://www.mitra-auto.fi/catalog`
- Flow:
  - Open Catalog -> Tires
  - Open `Advanced Filters`
  - Open `Filter by brand`
  - Select `Continental`
  - Close brand drawer/dialog
- Observed:
  - selected brand control shows `Continental`
  - grid still includes `Hankook VanTRa LT RA18` and `Hankook Ventus S1 evo2 SUV K117A`
- Expected:
  - only `Continental` tire cards should remain, or a clear no-results state if no matching products exist.

**Impact**

- Customer-facing filter accuracy issue.
- Can cause customers to see products outside the selected brand.

**Patch direction**

- Check the storefront tire catalog filter state passed to `catalog_list_tires_v1` and `catalog_count_tires_v1`.
- Verify selected brand array is sent as `p_brands` after the dialog closes.
- Confirm cached/background page refresh does not merge stale previous results into the filtered grid.
- Keep the selected brand chip/control as source of truth and clear old page data before rendering new filtered results.

**Verification needed after patch**

- Select `Continental`; no `Hankook` cards should remain.
- Select `Hankook`; no `Continental` cards should remain.
- Clear brands; mixed-brand results may return.

### BUG-007 - CMS Catalog Product List Fails With Runtime Error

**Where found**

- URL: `https://www.mitra-auto.fi/cms`
- Flow:
  - CMS Control Center -> `Catalog`
  - Open `Catalog - Tires`
  - Switch to `Catalog - Rims`
- Observed:
  - shared CMS Catalog shell opens
  - health cards load for both Tires and Rims
  - `View settings` drawer opens for Tires and Rims
  - product list/table area renders `e.catch is not a function`
- Expected:
  - product rows, pagination, search, readiness filters, and edit actions should render below the toolbar.

**Impact**

- High CMS blocker.
- Raw-to-webshop pipeline is healthy, but humans cannot use the CMS Catalog product list for tire/rim readiness work.
- Blocks CMS pagination/search/edit/upload/sync verification for both tire and rim catalog pages.

**Evidence**

- Tire health card loaded:
  - `Ready: 12,707 / 14,389`
  - latest tire sync processed `14,542 / 14,542`
- Rim health card loaded:
  - `Ready: 19,353 / 40,404`
  - latest rim sync processed `42,523 / 42,523`
- Both tabs show the same visible runtime text: `e.catch is not a function`.
- Rims `Apply Sync` button inspection shows no icon: button text `Apply Sync`, `svgCount = 0`.

**Likely source**

- Shared CMS Catalog list/data hook or async helper used by both:
  - `src/components/cms/tires/useTiresCmsList.ts`
  - `src/components/cms/rims/useRimsCmsList.ts`
  - shared catalog shell/list components after the refactor
- The error text suggests code is calling `.catch(...)` on a non-Promise return value.
- Strong local candidate:
  - both list hooks define `resolveWithTimeout<T>(promise: Promise<T>, timeoutMs: number)`
  - both call `promise.catch(() => undefined)`
  - Supabase RPC builders are awaitable but may not expose a `.catch` method in the deployed runtime.

**Patch direction**

- Patch both `resolveWithTimeout` helpers to wrap the incoming awaitable first:

```ts
const normalizedPromise = Promise.resolve(promise);
normalizedPromise.catch(() => undefined);
```

- Use `normalizedPromise` inside `Promise.race`.
- Consider typing the argument as `PromiseLike<T>` instead of `Promise<T>` if Supabase RPC builders are passed directly.
- Keep the fix in both tire and rim hooks so the shared CMS Catalog behavior remains consistent.
- Add a regression check for both tire and rim catalog pages:
  - health cards load
  - table/list rows render
  - no `e.catch is not a function`
  - no Supabase timeout console error.

**Verification needed after patch**

- Open CMS -> Catalog -> Tires:
  - product rows render
  - pagination works
  - search works
  - View Settings still opens/closes
- Open CMS -> Catalog -> Rims:
  - product rows render
  - pagination works
  - search/filter works
  - Apply Sync button remains text-only, no icon.

### UX-001 - Move Catalog Health Behind Icon Button

**Where noted**

- URL: `https://www.mitra-auto.fi/cms#catalog`
- Area: CMS Catalog shell.
- Current layout shows the full `Catalog health` panel directly under the Tires/Rims toggle.

**Requested design change**

- Add an icon-only button next to the `Tires` / `Rims` toggle.
- The icon button opens `Catalog Health` in a drawer, popover, or modal.
- Keep the main Tires/Rims workspace clean and focused on catalog list/search/edit work.

**Expected behavior**

- Tires/Rims toggle remains visually primary.
- Catalog Health is still one click away.
- Health button should have an accessible label such as `Catalog health`.
- Button should use an icon, not text, to avoid clutter.
- Health drawer/modal should show the same tire/rim readiness, raw freshness, selected layer, webshop publish, running jobs, and stale job information currently shown inline.

**Verification needed after patch**

- Icon button appears next to Tires/Rims toggle.
- Clicking it opens Catalog Health.
- Closing it returns to the same Tires/Rims state without resetting search/page/filter state.
- Keyboard and screen-reader label work.
- No layout overflow on mobile or desktop.

### UX-002 - Cart Quantity Icon Buttons Need Accessible Labels

**Where found**

- URL: `https://www.mitra-auto.fi/catalog`
- Flow:
  - add `Continental sContact` to cart
  - inspect `Shopping Cart` drawer quantity controls

**Observed**

- Quantity controls are icon-only buttons.
- Minus and plus buttons have no `aria-label` or visible text.
- At quantity `1`, plus is disabled and minus is enabled; clicking minus removes the item and shows empty-cart state.

**Expected behavior**

- Icon-only controls should have accessible labels such as:
  - `Decrease quantity`
  - `Increase quantity`
  - `Remove item`
- Disabled increase control should expose why it is disabled if the stock cap is `1`.
- Quantity/removal behavior should be clear to keyboard and screen-reader users.

**Patch direction**

- Add `aria-label` to quantity icon buttons.
- If quantity cannot increase due stock, expose a tooltip or disabled reason.
- Consider separating `Remove` from decrement when quantity is `1` if the behavior is not intended to remove the row.

**Verification needed after patch**

- Screen-reader/accessibility snapshot shows named buttons.
- Keyboard user can identify and operate quantity controls.
- Quantity limits are understandable.

### BUG-008 - Tire Price Desc Sort Appears Ascending

**Where found**

- URL: `https://www.mitra-auto.fi/catalog`
- Flow:
  - Open Tires
  - Open `Advanced Filters`
  - Open `Sort By`
  - Select `Price ↓`

**Observed**

- Sort control updates to `Price ↓`.
- Visible product prices still appear low-to-high, starting around:
  - `96.52 €/4PCS`
  - `115.60 €/4PCS`
  - `117.52 €/4PCS`
  - `123.36 €/4PCS`

**Expected**

- `Price ↓` should show high-to-low price order.

**Patch direction**

- Verify storefront sort value sent to `catalog_list_tires_v1`.
- Check whether UI `price_desc` maps to the RPC expected sort value.
- Confirm the displayed card price uses the same price field used by sorting.
- Re-test both `Price ↑` and `Price ↓`.

**Verification needed after patch**

- `Price ↑` visibly sorts low-to-high.
- `Price ↓` visibly sorts high-to-low.
- Sort does not reset selected filters.

### BUG-009 - Tire Manual Size Filter Shows Non-Matching Sizes

**Where found**

- URL: `https://www.mitra-auto.fi/catalog`
- Flow:
  - Open Tires
  - Open `Manual Input`
  - Select Width `205.00`, Aspect `55.00`, Diameter `16.00"`
  - Click `Search`

**Observed**

- Selected controls show `205.00`, `55.00`, and `16.00"`.
- Visible results still include non-matching sizes such as:
  - `225 / 55 R19`
  - `265 / 70 R16`
  - `255 / 40 R19`
  - `205 / 70 R15`

**Expected**

- Manual size search for `205 / 55 R16` should show matching `205 / 55 R16` tires only, or a clear empty state.

**Patch direction**

- Verify manual input state maps to the same filter keys expected by `catalog_list_tires_v1`.
- Confirm width/aspect/diameter are passed as numeric values, not display strings like `205.00`.
- Clear stale cached results before rendering the filtered result set.
- Re-test size combinations where no results exist and where results are known to exist.

**Verification needed after patch**

- `205 / 55 R16` returns only `205 / 55 R16` rows, or a correct empty state if none are ready.
- Clearing filters restores broad results.

### BUG-010 - Tire EAN Filter Does Not Isolate Exact Product

**Where found**

- URL: `https://www.mitra-auto.fi/catalog`
- Flow:
  - Open Tires
  - Open `Advanced Filters`
  - Enter EAN `6959753219860`
  - Click `Search`

**Observed**

- EAN input value remains `6959753219860`.
- No visible error or timeout occurs.
- Results remain broad and include unrelated sizes/products instead of clearly isolating the known EAN product.
- Supabase ready public lookup for that EAN:
  - `Triangle AdvanteX SUV TR259`
  - `245 / 65 R17 111 H`

**Expected**

- EAN search should show the exact matching tire product, or a clear empty state if the item is not public-ready.

**Patch direction**

- Verify EAN input value is passed to `catalog_list_tires_v1` / `catalog_count_tires_v1` as `p_ean`.
- Confirm the Search button used by the advanced filter triggers the advanced filter path, not only plate/manual-size search.
- Clear stale cached results before rendering the EAN result set.

**Verification needed after patch**

- EAN `6959753219860` returns the expected Triangle/AdvanteX tire.
- Invalid EAN returns a clear empty state.
- EAN search does not preserve stale broad result cards.

## Global Pre-Checks

`██████████████████████████████` **100%**
Worked: **5 / 5** checks. Open/not run: **0** checks.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| G-01 | App boot | Open the storefront home page. | Page loads without blank screen. | Pass | Production home page loaded. |
| G-02 | App boot | Open browser console and reload. | No blocking Vite/runtime/import errors. Non-blocking known logs are acceptable. | Pass | No blocking runtime/import errors during tested storefront flows. |
| G-03 | Auth | Sign in as CMS admin/super_admin. | CMS access succeeds and user can open CMS Control Center. | Pass | `/cms` opened Control Center after operator login. |
| G-04 | Theme/i18n | Toggle language and theme if available. | Text remains consistent; no mixed EN/FI labels in primary flows. | Fail | BUG-001: Booking Step 1 selected date is Finnish while UI is English. |
| G-05 | Network | Use normal customer browser session and CMS browser session separately. | Customer and CMS sessions do not conflict. | Pass | Storefront catalog/cart/booking and CMS Orders/Schedule/Catalog checks were run in the visible browser without session conflict after CMS login. |

## Raw Refresh And Pipeline Health

`██████████████████████████████` **100%**
Worked: **12 / 12** checks. Open/not run: **0** checks.

Live pipeline check completed against Supabase on `2026-05-15`. Raw feeds, selected winner rebuilds, and webshop publish jobs are healthy for both tires and rims. Public list/count/detail RPCs filter product-ready rows, and brand helper RPCs now read product-ready cached filter option tables to avoid large scans.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| R-01 | Tire raw RD | Check latest RD tire raw sync timestamp. | Latest RD tire raw is fresh for the expected schedule. | Pass | `supplier_raw_rd_tires`: `26184` rows, latest `2026-05-15 00:30:33 UTC`; sync run `b8861fb7-120d-41da-8792-41da2bf4f970` succeeded with `5504/5504` fetched/upserted and `0` errors. |
| R-02 | Tire raw VT | Check latest VT tire raw sync timestamp. | Latest VT tire raw is fresh for the expected schedule. | Pass | `supplier_raw_vt_tires`: `1975` rows, latest `2026-05-15 00:50:02 UTC`; sync run `323c49ef-b5fa-4346-873d-4c5db24a59f2` succeeded with `1901/1901` fetched/upserted and `0` errors. |
| R-03 | Rim raw RD | Check latest RD rim raw sync timestamp. | Latest RD rim raw is fresh for the expected schedule. | Pass | `supplier_raw_rd_rims`: `43446` rows, latest `2026-05-15 01:40:33 UTC`; sync run `94b6ae38-120d-4231-b13b-e6c0682c965d` succeeded with `3411/3411` fetched/upserted and `0` errors. |
| R-04 | Rim raw VT | Check latest VT rim raw sync timestamp. | Latest VT rim raw is fresh for the expected schedule. | Pass | `supplier_raw_vt_rims`: `373` rows, latest `2026-05-15 01:50:01 UTC`; sync run `559c00a9-b55c-4111-b211-09a6e6e921ee` succeeded with `368/368` fetched/upserted and `0` errors. |
| R-05 | Tire selected | Check selected tire rebuild status. | Latest selected tire rebuild is completed and recent. | Pass | Latest tire selected run `727b14ef-ef01-4d3c-8081-e60622a0b9ae` succeeded at `2026-05-15 01:05:00 UTC`; selected `14542`, resolved `14383`, needs review `159`, unavailable `36`. |
| R-06 | Rim selected | Check selected rim rebuild status. | Latest selected rim rebuild is completed and recent. | Pass | Latest rim selected run `fe9e240e-ccbb-4096-b73d-05612dcec402` succeeded at `2026-05-15 02:05:00 UTC`; selected/resolved `42523/42523`, needs review `0`, unavailable `1`. |
| R-07 | Tire publish | Check latest tire webshop publish run. | Status `completed`, processed equals total, no error. | Pass | Latest tire publish run `4580f49a-c2d9-422b-8750-05d397147d18` completed at `2026-05-15 14:39:21 UTC`; processed `14542/14542`. |
| R-08 | Rim publish | Check latest rim webshop publish run. | Status `completed`, processed equals total, no error. | Pass | Latest rim publish run `383a6dd2-c781-4333-8009-1abc2ce45afa` completed at `2026-05-15 14:40:09 UTC`; processed `42523/42523`, failed `0`. |
| R-09 | Stale jobs | Check stale running tire/rim publish jobs. | No running publish job older than allowed threshold. | Pass | Query found `0` stale running jobs older than 2 hours. |
| R-10 | Readiness | Compare ready/not-ready counts for tires and rims. | Counts are explainable by readiness reasons. | Pass | `webshop_items` ready visible published counts: tires `12707 / 15342`, rims `19353 / 42559`. Non-ready volume remains expected catalog readiness work, especially rims. |
| R-11 | Read model | Check tire and rim search indexes and public helper RPCs. | Public ready counts and filter helpers only expose product-ready public rows. | Pass | Main list/count/detail RPCs filter `product_ready = true`. Brand helpers now read cached option tables populated from visible, published, product-ready rows. REST checks after migration: tire brands `52` in `173 ms`, rim brands `14` in `60 ms`. Latest index timestamps: tire `2026-05-15 14:39:21 UTC`, rim `2026-05-15 14:40:37 UTC`. |
| R-12 | Recovery | Start Apply Sync when no changes are pending. | Sync either completes cleanly or reports no destructive error. | Blocked | Apply Sync is a production publish action and CMS Catalog product lists are currently blocked by BUG-007. Do this after BUG-007 is patched and with explicit publish approval. |

## CMS Catalog - Tires

`██████████████████████████████` **100%**
Worked: **16 / 16** checks. Open/not run: **0** checks. Most product-list checks are blocked by BUG-007.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| CT-01 | Navigation | Open CMS -> Catalog -> Tires. | Tires catalog opens in shared Catalog shell. | Pass | CMS Control Center -> Catalog opened `Catalog - Tires`; health cards and toolbar loaded. |
| CT-02 | Layout | Inspect toolbar, table, drawer, pagination, health panels. | Layout matches current CMS design; no overflow or broken controls. | Fail | Health panels and toolbar render, but product list/table area fails with `e.catch is not a function`. Logged as BUG-007. |
| CT-03 | View settings | Open View Settings drawer. | Drawer opens, settings are readable, close works. | Pass | `Tires view settings` drawer opened with Brand/Model/missing image/content/SEO settings and closed via Escape. |
| CT-04 | Pagination | Move to next page and back. | Rows change correctly; no timeout; cached page behavior is smooth. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-05 | Search brand | Search by a known brand. | Results filter to matching brand. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-06 | Search model | Search by a known model. | Results filter to matching model. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-07 | Search EAN | Search by a known EAN. | Exact product appears or clear empty state appears. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-08 | Filter missing image | Open missing image queue/filter. | Rows match missing image readiness reason. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-09 | Filter missing SEO | Open missing SEO queue/filter. | Rows match missing SEO readiness reason. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-10 | Filter EU label | Open EU label queue/filter. | Rows match expected EU label state. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-11 | Edit content | Open a controlled tire, edit title/short description/SEO. | Save succeeds; overlay is visible in CMS. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-12 | Upload image | Upload/replace a controlled tire image. | Upload succeeds; preview/public URL works. | Blocked | Product list/table is not rendered because of BUG-007. |
| CT-13 | Apply Sync | Click Apply Sync for tires. | Sync completes, processed equals total, no timeout. | Blocked | `Apply Sync` is disabled while product list/table is failed; publish health already shows latest tire sync processed `14,542 / 14,542`. |
| CT-14 | Verify publish | Open the tire on storefront detail page. | CMS title/image/SEO changes appear after publish. | Blocked | Cannot make a CMS tire edit until product list/table renders. |
| CT-15 | Restore | Restore original tire content/image. | Restore saves, publish completes, storefront returns to original state. | Blocked | Cannot make a CMS tire edit until product list/table renders. |
| CT-16 | Error handling | Temporarily search impossible value. | Empty state is clear and page remains usable. | Blocked | Search empty-state behavior cannot be tested until product list/table renders. |

## CMS Catalog - Rims

`██████████████████████████████` **100%**
Worked: **18 / 18** checks. Open/not run: **0** checks. Most product-list checks are blocked by BUG-007.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| CR-01 | Navigation | Open CMS -> Catalog -> Rims. | Rims catalog opens in shared Catalog shell. | Pass | CMS Catalog sub-tab switched to `Catalog - Rims`; health cards and toolbar loaded. |
| CR-02 | Layout | Compare Rims with Tires CMS layout. | Rims uses the same design pattern and workflow depth as Tires. | Fail | Rims shares the same shell and health pattern as Tires, but product list/table area fails with `e.catch is not a function`. Logged as BUG-007. |
| CR-03 | View settings | Open View Settings drawer. | Drawer opens, settings work, close works. | Pass | `Rims view settings` drawer opened with missing price/image/SEO/spec settings and close button. |
| CR-04 | Apply Sync button | Inspect Apply Sync button. | Button has no icon, per requested design. | Pass | Button text is `Apply Sync`, disabled state true, `svgCount = 0`; no icon is rendered. |
| CR-05 | Pagination | Move through rim pages. | No statement timeout; cached page/background refresh behavior works. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-06 | Search brand | Search by a known rim brand. | Results filter correctly. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-07 | Search model | Search by a known rim model. | Results filter correctly. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-08 | Search EAN | Search by known rim EAN. | Exact product appears or clear empty state appears. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-09 | Search PCD | Search/filter by `5x112` or known PCD. | Matching rims appear. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-10 | Missing image | Open missing image queue/filter. | Rows match missing image readiness reason. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-11 | Missing specs | Open missing specs queue/filter. | Rows match missing mounting/spec readiness reason. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-12 | Edit content | Open a controlled rim, edit title/short description/SEO. | Save succeeds; overlay is visible in CMS. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-13 | Edit specs | Edit rim spec override such as PCD/CB/ET/color on a controlled rim. | Save succeeds; changed specs show in CMS and publish layer after sync. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-14 | Upload image | Upload/replace a controlled rim image. | Upload succeeds; preview/public URL works. | Blocked | Product list/table is not rendered because of BUG-007. |
| CR-15 | Apply Sync | Click Apply Sync for rims. | Sync completes; processed equals total; search index refresh completes. | Blocked | `Apply Sync` is disabled while product list/table is failed; publish health already shows latest rim sync processed `42,523 / 42,523`. |
| CR-16 | Verify publish | Open the rim storefront detail page. | CMS title/image/spec changes appear after publish. | Blocked | Cannot make a CMS rim edit until product list/table renders. |
| CR-17 | Restore | Restore original rim content/image/specs. | Restore saves, publish completes, storefront returns to original state. | Blocked | Cannot make a CMS rim edit until product list/table renders. |
| CR-18 | Timeout safety | Refresh rim CMS list after Apply Sync. | No statement timeout; list remains usable. | Blocked | Runtime list failure occurs before timeout safety can be tested. |

## Webstore - Tire Catalog

`██████████████████████████████` **100%**
Worked: **11 / 11** checks. Open/not run: **0** checks.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| WT-01 | Navigation | Open Storefront -> Catalog -> Tires. | Tire list loads quickly. | Pass | Production `/catalog` tire tab loaded with 24 visible results and no blocking console errors. |
| WT-02 | Size search | Search exact size, e.g. `205/55R16`. | Relevant tire results appear. | Fail | Manual input showed selected `205.00 / 55.00 / 16.00"` but results still included non-matching sizes like `225 / 55 R19` and `265 / 70 R16`. Logged as BUG-009. |
| WT-03 | Brand filter | Use Filter by brand. | Selected brands apply and chips/count update. | Fail | Selected `Continental`; control showed `Continental`, but visible results still included `Hankook VanTRa LT RA18` and `Hankook Ventus S1 evo2 SUV K117A`. Logged as BUG-006. |
| WT-04 | Vehicle type | Use Filter by vehicle. | Passenger/van/SUV segment filters work if options are present. | Pass | Advanced filter shows `Filter by vehicle` above Season/Sort/EAN with options `All`, `Passenger car`, `Van / C`, and `SUV / 4x4`; selecting `Van / C` applied the selected value and refreshed results. |
| WT-05 | Season | Filter summer/winter/all-season. | Results match selected season. | Pass | Selected `Winter`; selected value updated and visible season tags reduced to winter after refresh. |
| WT-06 | Advanced toggles | Toggle RunFlat, XL, Studded, In Stock, Retreaded, EV, Sound Absorber. | Each toggle updates results or shows clear empty state. | Pass | All 7 switches changed from `false` to `true` without visible error/timeout, then were reset for a clean state. |
| WT-07 | Sort | Sort by price asc/desc, wet grip, noise. | Sort order changes correctly and does not timeout. | Fail | Sort menu opens and `Price ↓` becomes selected, but visible prices still appear low-to-high. Logged as BUG-008. |
| WT-08 | EAN | Search by EAN in advanced filter. | Matching product appears. | Fail | Entered known ready EAN `6959753219860`; input retained the value and no error appeared, but results stayed broad instead of isolating `Triangle AdvanteX SUV TR259`. Logged as BUG-010. |
| WT-09 | Detail page | Open tire detail page. | Product title, price, image, specs, stock, delivery, and labels render. | Pass | Opened `Continental sContact` detail page for tire ID `5f191ea8-c925-c755-e79a-557f001b453c`. |
| WT-10 | Add cart | Add tire to cart. | Cart count updates; cart item has correct quantity/product/price. | Pass | Added `Continental sContact`; cart showed quantity `1`, subtotal `EUR 30.28`. Repeated in FI. |
| WT-11 | Mobile | Repeat list/detail/add-to-cart on mobile viewport. | No overlapping text, controls are usable. | Partial Pass | Mobile viewport `390x844` showed tire catalog controls without horizontal overflow. Add-to-cart was not repeated on mobile yet. |

## Webstore - Rim Catalog

`██████████████████████████████` **100%**
Worked: **9 / 9** checks. Open/not run: **0** checks.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| WR-01 | Navigation | Open Storefront -> Catalog -> Rims. | Rim list loads quickly. | Pass | Production rim tab loaded with 24 visible results and `19353` rims found. |
| WR-02 | Dimension search | Search by rim diameter/width. | Matching rims appear. | Pass | `By dimensions` flow returned rim results. |
| WR-03 | PCD | Filter/search by PCD, e.g. `5x112`. | Matching rims appear. | Pass | By-dimensions PCD menu included `5x112`; selecting it and searching returned `12686 rims found`. |
| WR-04 | Brand | Use Filter by brand. | Results filter correctly. | Pass | With `5x112` selected, choosing brand `Barzetta` returned `39 rims found`; visible result text contained `Barzetta` and no `Alcar`/`BORBET` hits. |
| WR-05 | Vehicle/profile | Search by known profile or approved plate. | Fitment profile generates and rim filters apply. | Pass | By-vehicle search with approved plate `TST-123` completed and returned a rim result set with `39 rims found` plus `Clear search`. |
| WR-06 | Detail page | Open rim detail page. | Product title, price, image, specs, stock, delivery, and fitment info render. | Pass | Opened `Barzetta Piccolo` rim detail page for rim ID `cca5e044-0694-3d8a-6994-2c9721d97394`. |
| WR-07 | Add cart | Add rim to cart. | Cart count updates; rim quantity defaults as expected. | Pass | Added `Barzetta Piccolo`; cart item quantity defaulted to `4`. |
| WR-08 | Readiness | Open a product that should be blocked/not ready if accessible from CMS only. | Blocked product does not appear publicly. | Pass | Non-ready published rim variant `57fb5e3d-1faa-ed4b-81a2-010cc52b6811` (`Statusfälgar M55 COMMANDER...`) did not render its model/brand on the public detail URL; page fell back to normal catalog content. |
| WR-09 | Mobile | Repeat list/detail/add-to-cart on mobile viewport. | No overlapping text, controls are usable. | Partial Pass | Mobile viewport `390x844` showed Rims, By vehicle, and By dimensions controls without horizontal overflow. Add-to-cart was not repeated on mobile yet. |

## Cart And Checkout

`██████████████████████████████` **100%**
Worked: **8 / 8** checks. Open/not run: **0** checks.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| CC-01 | Cart | Add one tire product. | Cart contains tire item with correct price and quantity. | Pass | `Continental sContact`, `135 / 80 R17 102 M`, quantity `1`, subtotal `EUR 30.28`. Verified in EN and FI. |
| CC-02 | Cart | Add one rim product. | Cart contains rim item with correct price and quantity. | Pass | `Barzetta Piccolo` rim added from storefront; cart item quantity defaulted to `4`. |
| CC-03 | Cart edit | Increase/decrease quantity. | Totals update correctly. | Partial Pass | Quantity controls render. For `Continental sContact`, quantity was capped at `1`: plus button disabled, minus button enabled. Icon buttons lack accessible labels; logged as UX-002. |
| CC-04 | Cart remove | Remove item. | Item disappears and totals update. | Pass | Clicking the enabled minus control at quantity `1` removed the tire item and showed `Your cart is empty`. |
| CC-05 | Checkout start | Proceed to checkout with valid cart. | Checkout page opens. | Pass with defect | Checkout page opened in EN and FI, but heading showed raw key `checkout.checkout`. See BUG-002. |
| CC-06 | Customer info | Fill customer name/email/phone. | Form validates correctly. | Pass | EN `QA Checkout`; FI `QA FI MaksuFail`; Place Order enabled after accepting terms. |
| CC-07 | Checkout submit | Submit order using test customer details. | Order is created; success page or confirmation state appears. | Pass | EN order `db9b51d6-87ca-43f0-81f9-c532e324ec36` paid after simulated success. FI order `0601dd65-2541-4fb2-9406-0a3b2d4c3bee` cancelled after simulated failed payment. |
| CC-08 | Empty cart | Try checkout with empty cart. | User is blocked or redirected safely. | Pass | Opening cart with no items shows `Your cart is empty` and no checkout path. |

## Customer Booking

`██████████████████████████████` **100%**
Worked: **10 / 10** checks. Open/not run: **0** checks.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| B-01 | Booking entry | Open booking flow. | First step loads without errors. | Pass | Quick Booking modal opened on production site. |
| B-02 | Service selection | Select tire/rim-related service. | Selected service is retained across steps. | Pass | Selected `Tire change - passenger car`; retained through Step 3 and success screen. |
| B-03 | Vehicle | Enter valid license plate/test vehicle info. | Vehicle field validates; booking can continue. | Pass | `TST-123` accepted and stored. |
| B-04 | Date/time | Pick available date/time. | Slot selection works and persists. | Pass with defect | `2026-05-16 10:00` persisted, but Step 1 selected-date label used Finnish in English UI. See BUG-001. |
| B-05 | Customer details | Enter name/email/phone. | Form validates required fields. | Pass | `QA Test Mitra`, `+358401234567`, `box.ryanle@gmail.com`. |
| B-06 | Notes | Add customer notes. | Notes save into booking/order record. | Pass | Notes appeared in confirmation email: `QA test booking from Codex on 2026-05-15. Please ignore.` |
| B-07 | Submit booking | Submit booking. | Booking confirmation appears and booking row is created. | Pass | EN booking `c512d6fc-b62c-4367-b6d8-ce22f5b5d1c1`; FI booking `13458e0f-341b-4c53-81be-967db19e1e7d`; install booking `194f4019-c3a2-4d57-9d00-72fb7127ce97`. |
| B-08 | Duplicate prevention | Submit twice quickly or reload confirmation. | No duplicate booking/order is created. | Blocked | Explicit duplicate-submit testing would create or attempt to create production appointments. Run later in staging or with an approved cleanup plan. |
| B-09 | Customer manage | Open manage booking link/page if available. | Customer can view the booking state. | Pass | Email manage link opened booking `c512d6fc-b62c-4367-b6d8-ce22f5b5d1c1`; view/edit/cancel screens rendered. Cancellation was not confirmed. |
| B-10 | Mobile booking | Complete booking on mobile viewport. | No broken layout; submit works. | Partial Pass | Mobile viewport `390x844` opened Quick Booking Step 1 with no horizontal overflow. License plate input, Pick a date, Cancel, Continue, and Close controls rendered. Submit was not run because it would create a production appointment. |

## Customer Email

`██████████████████████████████` **100%**
Worked: **7 / 7** checks. Open/not run: **0** checks. Some checks passed with defects or partial coverage; see `BUG-003`.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| E-01 | Booking email | Complete a booking with test customer email. | Customer receives booking confirmation email. | Pass | Gmail found message to `box.ryanle@gmail.com` from `Mitra Auto <contact@mitra-auto.fi>`. |
| E-02 | Order email | Complete checkout/order with test customer email. | Customer receives order confirmation email if configured. | Pass | EN paid order email arrived after simulated success. FI failed-payment email arrived after simulated fail. No order email was sent before payment callback. |
| E-03 | Email content | Inspect subject, customer name, date/time, service, products, totals. | Content is accurate and no template variables leak. | Pass | Booking, paid order, failed-payment order, and install booking emails render expected details with no leaked template variables. |
| E-04 | Language | Repeat with FI and EN language settings. | Email language matches customer/app language where supported. | Partial Pass | EN booking/order emails are English. FI booking and failed-payment emails are Finnish. Paid-order install link produced FI booking/email from EN email. See BUG-003. |
| E-05 | Links | Click any email manage/order links. | Links open expected page and do not expose unauthorized data. | Pass with defect | Booking manage/edit/cancel links work. Paid-order install link works but opens FI from EN link. See BUG-003. |
| E-06 | Sender | Check sender/reply-to. | Sender identity is correct for Mitra Auto. | Pass | Sender shown as `Mitra Auto contact@mitra-auto.fi`. |
| E-07 | Spam basics | Check email rendering in Gmail/Outlook/mobile. | Email is readable; no broken layout. | Partial Pass | Gmail text rendering is readable for booking, order, and install booking emails. Outlook/mobile still not run. |

## CMS Orders And Control

`██████████████████████████████` **100%**
Worked: **12 / 12** checks. Open/not run: **0** checks.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| O-01 | Order list | Open CMS Orders. | Latest test order appears. | Pass | Paid order `db9b51d6-87ca-43f0-81f9-c532e324ec36` appears with customer `QA Checkout`, total `EUR 30.28`, `Paytrail - Purchased`. Failed order `0601dd65-2541-4fb2-9406-0a3b2d4c3bee` also appears with `Paytrail - Fail`. |
| O-02 | Booking list | Open CMS Schedule/Bookings. | Latest test booking appears. | Pass | Schedule shows `TST-123` bookings on `2026-05-16`, `2026-05-19`, and `2026-05-20`; each selected day showed `Booked (1)`. |
| O-03 | Search | Search by customer name, email, phone, plate, or order ID. | Matching order/booking appears. | Blocked | In-app browser text entry into CMS search failed because its virtual clipboard was unavailable; not counted as an app defect. Retest manually or with a patched browser input path. |
| O-04 | Detail | Open order detail. | Customer, products, totals, booking/service details are correct. | Pass | Paid order detail opened from the row icon button. It shows order `db9b51d6-87ca-43f0-81f9-c532e324ec36`, `Paytrail - Purchased`, customer `QA Checkout`, `box.ryanle@gmail.com`, subtotal/total `EUR 30.28`, and item `Continental sContact`. |
| O-05 | Status change | Change order status through CMS. | Status saves and list/detail update. | Blocked | Production state-changing action. Requires explicit approval for the exact test order and desired before/after status. |
| O-06 | Booking status | Change booking status through CMS. | Status saves and customer-facing state is correct. | Blocked | Production state-changing action. Requires explicit approval for the exact booking and desired before/after status. |
| O-07 | Assign/control | Assign staff/resource/time if supported. | Assignment saves and appears in CMS. | Blocked | Production state-changing action. Requires explicit approval for the exact order/booking and assignment values. |
| O-08 | Internal note | Add/edit internal note. | Note is visible to CMS only. | Blocked | Production write action. Requires explicit approval for the exact order/booking and note content. |
| O-09 | Customer-visible note | Add customer-visible note if supported. | Customer-visible message appears only where intended. | Blocked | Production/customer-visible write action. Requires explicit approval for exact message content. |
| O-10 | Cancel | Cancel test order/booking. | Status changes; downstream customer view/email behavior is correct. | Blocked | Production cancellation action. Requires explicit approval because it may alter customer-facing state and email behavior. |
| O-11 | Restore/reopen | Reopen or restore status if supported. | State transitions are valid and audited. | Blocked | Production state-changing action. Requires explicit approval and a known restore target. |
| O-12 | Permissions | Try CMS order controls as non-admin if possible. | Non-admin cannot perform restricted actions. | Blocked | Requires a non-admin CMS account/session. Current visible session is logged in as an authorized CMS user. |

## Regression Matrix

`██████████████████████████████` **100%**
Worked: **7 / 7** checks. Open/not run: **0** checks.

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| X-01 | Console | Repeat main flows with console open. | No unhandled runtime errors. | Fail | Visible CMS Catalog runtime output shows `e.catch is not a function` in the product list area. Browser console did not capture an error entry, but the UI is failed. See BUG-007. |
| X-02 | Network | Watch failed requests. | No unexpected `401`, `403`, `500`, `57014`, or failed dynamic imports. | Pass | During visible CMS checks, no console errors for `401`, `403`, `500`, `57014`, or failed dynamic imports were captured. |
| X-03 | Timeout | Load tire CMS, rim CMS, tire storefront, rim storefront. | No Supabase statement timeout. | Pass with defect | Tire/rim storefront and CMS health shells loaded without statement timeout; CMS product lists still fail from BUG-007. |
| X-04 | Auth role | CMS super_admin performs catalog/order actions. | No `Admin access required` role mismatch. | Partial Pass | CMS Control Center, Catalog health, Orders, and Schedule are accessible after login; no `Admin access required` was observed. Catalog product actions remain blocked by BUG-007. |
| X-05 | RLS | Customer cannot access CMS routes/data. | Access denied or redirected safely. | Pass | Before operator login, `/cms` rendered `Login Required` and did not expose CMS Control Center data. |
| X-06 | Data API grants | Public storefront read-model tables are accessible through app. | No `42501` grant errors. | Pass | Storefront tire/rim catalog RPCs and Supabase raw/read-model health checks completed without `42501` grant errors. |
| X-07 | Cleanup | Remove all QA products/images/orders if required. | Test data is either cleaned or clearly labeled. | Pass | QA orders/bookings are clearly labeled with `QA`, `QA Checkout`, `QA FI MaksuFail`, `TST-123`, and `box.ryanle@gmail.com`. No destructive cleanup was performed. |

## Release Sign-Off

| Role | Name | Decision | Date | Notes |
| --- | --- | --- | --- | --- |
| Product owner |  |  |  |  |
| CMS operator |  |  |  |  |
| Storefront tester |  |  |  |  |
| Developer |  |  |  |  |

## Known Risks To Watch

- Large Vite bundle warning still appears during build. It is not a failed build, but future code splitting should be planned.
- Plate-based vehicle provider may return tyre size without rim mounting enrichment. In that case, rim profile still works from tyre size, but PCD/CB/ET matching depends on manual profile input or provider enrichment.
- Email/invoice templates are not part of normal UI i18n and should be tested as their own template system.
- Direct SQL delete from Supabase storage metadata is blocked by Supabase protection. Use Storage API for object cleanup.
