# Full System QA Report

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

## Global Pre-Checks

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| G-01 | App boot | Open the storefront home page. | Page loads without blank screen. |  |  |
| G-02 | App boot | Open browser console and reload. | No blocking Vite/runtime/import errors. Non-blocking known logs are acceptable. |  |  |
| G-03 | Auth | Sign in as CMS admin/super_admin. | CMS access succeeds and user can open CMS Control Center. |  |  |
| G-04 | Theme/i18n | Toggle language and theme if available. | Text remains consistent; no mixed EN/FI labels in primary flows. |  |  |
| G-05 | Network | Use normal customer browser session and CMS browser session separately. | Customer and CMS sessions do not conflict. |  |  |

## Raw Refresh And Pipeline Health

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| R-01 | Tire raw RD | Check latest RD tire raw sync timestamp. | Latest RD tire raw is fresh for the expected schedule. |  |  |
| R-02 | Tire raw VT | Check latest VT tire raw sync timestamp. | Latest VT tire raw is fresh for the expected schedule. |  |  |
| R-03 | Rim raw RD | Check latest RD rim raw sync timestamp. | Latest RD rim raw is fresh for the expected schedule. |  |  |
| R-04 | Rim raw VT | Check latest VT rim raw sync timestamp. | Latest VT rim raw is fresh for the expected schedule. |  |  |
| R-05 | Tire selected | Check selected tire rebuild status. | Latest selected tire rebuild is completed and recent. |  |  |
| R-06 | Rim selected | Check selected rim rebuild status. | Latest selected rim rebuild is completed and recent. |  |  |
| R-07 | Tire publish | Check latest tire webshop publish run. | Status `completed`, processed equals total, no error. |  |  |
| R-08 | Rim publish | Check latest rim webshop publish run. | Status `completed`, processed equals total, no error. |  |  |
| R-09 | Stale jobs | Check stale running tire/rim publish jobs. | No running publish job older than allowed threshold. |  |  |
| R-10 | Readiness | Compare ready/not-ready counts for tires and rims. | Counts are explainable by readiness reasons. |  |  |
| R-11 | Read model | Check tire and rim search indexes. | Public ready counts match public catalog counts. |  |  |
| R-12 | Recovery | Start Apply Sync when no changes are pending. | Sync either completes cleanly or reports no destructive error. |  |  |

## CMS Catalog - Tires

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| CT-01 | Navigation | Open CMS -> Catalog -> Tires. | Tires catalog opens in shared Catalog shell. |  |  |
| CT-02 | Layout | Inspect toolbar, table, drawer, pagination, health panels. | Layout matches current CMS design; no overflow or broken controls. |  |  |
| CT-03 | View settings | Open View Settings drawer. | Drawer opens, settings are readable, close works. |  |  |
| CT-04 | Pagination | Move to next page and back. | Rows change correctly; no timeout; cached page behavior is smooth. |  |  |
| CT-05 | Search brand | Search by a known brand. | Results filter to matching brand. |  |  |
| CT-06 | Search model | Search by a known model. | Results filter to matching model. |  |  |
| CT-07 | Search EAN | Search by a known EAN. | Exact product appears or clear empty state appears. |  |  |
| CT-08 | Filter missing image | Open missing image queue/filter. | Rows match missing image readiness reason. |  |  |
| CT-09 | Filter missing SEO | Open missing SEO queue/filter. | Rows match missing SEO readiness reason. |  |  |
| CT-10 | Filter EU label | Open EU label queue/filter. | Rows match expected EU label state. |  |  |
| CT-11 | Edit content | Open a controlled tire, edit title/short description/SEO. | Save succeeds; overlay is visible in CMS. |  |  |
| CT-12 | Upload image | Upload/replace a controlled tire image. | Upload succeeds; preview/public URL works. |  |  |
| CT-13 | Apply Sync | Click Apply Sync for tires. | Sync completes, processed equals total, no timeout. |  |  |
| CT-14 | Verify publish | Open the tire on storefront detail page. | CMS title/image/SEO changes appear after publish. |  |  |
| CT-15 | Restore | Restore original tire content/image. | Restore saves, publish completes, storefront returns to original state. |  |  |
| CT-16 | Error handling | Temporarily search impossible value. | Empty state is clear and page remains usable. |  |  |

## CMS Catalog - Rims

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| CR-01 | Navigation | Open CMS -> Catalog -> Rims. | Rims catalog opens in shared Catalog shell. |  |  |
| CR-02 | Layout | Compare Rims with Tires CMS layout. | Rims uses the same design pattern and workflow depth as Tires. |  |  |
| CR-03 | View settings | Open View Settings drawer. | Drawer opens, settings work, close works. |  |  |
| CR-04 | Apply Sync button | Inspect Apply Sync button. | Button has no icon, per requested design. |  |  |
| CR-05 | Pagination | Move through rim pages. | No statement timeout; cached page/background refresh behavior works. |  |  |
| CR-06 | Search brand | Search by a known rim brand. | Results filter correctly. |  |  |
| CR-07 | Search model | Search by a known rim model. | Results filter correctly. |  |  |
| CR-08 | Search EAN | Search by known rim EAN. | Exact product appears or clear empty state appears. |  |  |
| CR-09 | Search PCD | Search/filter by `5x112` or known PCD. | Matching rims appear. |  |  |
| CR-10 | Missing image | Open missing image queue/filter. | Rows match missing image readiness reason. |  |  |
| CR-11 | Missing specs | Open missing specs queue/filter. | Rows match missing mounting/spec readiness reason. |  |  |
| CR-12 | Edit content | Open a controlled rim, edit title/short description/SEO. | Save succeeds; overlay is visible in CMS. |  |  |
| CR-13 | Edit specs | Edit rim spec override such as PCD/CB/ET/color on a controlled rim. | Save succeeds; changed specs show in CMS and publish layer after sync. |  |  |
| CR-14 | Upload image | Upload/replace a controlled rim image. | Upload succeeds; preview/public URL works. |  |  |
| CR-15 | Apply Sync | Click Apply Sync for rims. | Sync completes; processed equals total; search index refresh completes. |  |  |
| CR-16 | Verify publish | Open the rim storefront detail page. | CMS title/image/spec changes appear after publish. |  |  |
| CR-17 | Restore | Restore original rim content/image/specs. | Restore saves, publish completes, storefront returns to original state. |  |  |
| CR-18 | Timeout safety | Refresh rim CMS list after Apply Sync. | No statement timeout; list remains usable. |  |  |

## Webstore - Tire Catalog

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| WT-01 | Navigation | Open Storefront -> Catalog -> Tires. | Tire list loads quickly. |  |  |
| WT-02 | Size search | Search exact size, e.g. `205/55R16`. | Relevant tire results appear. |  |  |
| WT-03 | Brand filter | Use Filter by brand. | Selected brands apply and chips/count update. |  |  |
| WT-04 | Vehicle type | Use Filter by vehicle. | Passenger/van/SUV segment filters work if options are present. |  |  |
| WT-05 | Season | Filter summer/winter/all-season. | Results match selected season. |  |  |
| WT-06 | Advanced toggles | Toggle RunFlat, XL, Studded, In Stock, Retreaded, EV, Sound Absorber. | Each toggle updates results or shows clear empty state. |  |  |
| WT-07 | Sort | Sort by price asc/desc, wet grip, noise. | Sort order changes correctly and does not timeout. |  |  |
| WT-08 | EAN | Search by EAN in advanced filter. | Matching product appears. |  |  |
| WT-09 | Detail page | Open tire detail page. | Product title, price, image, specs, stock, delivery, and labels render. |  |  |
| WT-10 | Add cart | Add tire to cart. | Cart count updates; cart item has correct quantity/product/price. |  |  |
| WT-11 | Mobile | Repeat list/detail/add-to-cart on mobile viewport. | No overlapping text, controls are usable. |  |  |

## Webstore - Rim Catalog

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| WR-01 | Navigation | Open Storefront -> Catalog -> Rims. | Rim list loads quickly. |  |  |
| WR-02 | Dimension search | Search by rim diameter/width. | Matching rims appear. |  |  |
| WR-03 | PCD | Filter/search by PCD, e.g. `5x112`. | Matching rims appear. |  |  |
| WR-04 | Brand | Use Filter by brand. | Results filter correctly. |  |  |
| WR-05 | Vehicle/profile | Search by known profile or approved plate. | Fitment profile generates and rim filters apply. |  |  |
| WR-06 | Detail page | Open rim detail page. | Product title, price, image, specs, stock, delivery, and fitment info render. |  |  |
| WR-07 | Add cart | Add rim to cart. | Cart count updates; rim quantity defaults as expected. |  |  |
| WR-08 | Readiness | Open a product that should be blocked/not ready if accessible from CMS only. | Blocked product does not appear publicly. |  |  |
| WR-09 | Mobile | Repeat list/detail/add-to-cart on mobile viewport. | No overlapping text, controls are usable. |  |  |

## Cart And Checkout

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| CC-01 | Cart | Add one tire product. | Cart contains tire item with correct price and quantity. |  |  |
| CC-02 | Cart | Add one rim product. | Cart contains rim item with correct price and quantity. |  |  |
| CC-03 | Cart edit | Increase/decrease quantity. | Totals update correctly. |  |  |
| CC-04 | Cart remove | Remove item. | Item disappears and totals update. |  |  |
| CC-05 | Checkout start | Proceed to checkout with valid cart. | Checkout page opens. |  |  |
| CC-06 | Customer info | Fill customer name/email/phone. | Form validates correctly. |  |  |
| CC-07 | Checkout submit | Submit order using test customer details. | Order is created; success page or confirmation state appears. |  |  |
| CC-08 | Empty cart | Try checkout with empty cart. | User is blocked or redirected safely. |  |  |

## Customer Booking

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| B-01 | Booking entry | Open booking flow. | First step loads without errors. |  |  |
| B-02 | Service selection | Select tire/rim-related service. | Selected service is retained across steps. |  |  |
| B-03 | Vehicle | Enter valid license plate/test vehicle info. | Vehicle field validates; booking can continue. |  |  |
| B-04 | Date/time | Pick available date/time. | Slot selection works and persists. |  |  |
| B-05 | Customer details | Enter name/email/phone. | Form validates required fields. |  |  |
| B-06 | Notes | Add customer notes. | Notes save into booking/order record. |  |  |
| B-07 | Submit booking | Submit booking. | Booking confirmation appears and booking row is created. |  |  |
| B-08 | Duplicate prevention | Submit twice quickly or reload confirmation. | No duplicate booking/order is created. |  |  |
| B-09 | Customer manage | Open manage booking link/page if available. | Customer can view the booking state. |  |  |
| B-10 | Mobile booking | Complete booking on mobile viewport. | No broken layout; submit works. |  |  |

## Customer Email

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| E-01 | Booking email | Complete a booking with test customer email. | Customer receives booking confirmation email. |  |  |
| E-02 | Order email | Complete checkout/order with test customer email. | Customer receives order confirmation email if configured. |  |  |
| E-03 | Email content | Inspect subject, customer name, date/time, service, products, totals. | Content is accurate and no template variables leak. |  |  |
| E-04 | Language | Repeat with FI and EN language settings. | Email language matches customer/app language where supported. |  |  |
| E-05 | Links | Click any email manage/order links. | Links open expected page and do not expose unauthorized data. |  |  |
| E-06 | Sender | Check sender/reply-to. | Sender identity is correct for Mitra Auto. |  |  |
| E-07 | Spam basics | Check email rendering in Gmail/Outlook/mobile. | Email is readable; no broken layout. |  |  |

## CMS Orders And Control

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| O-01 | Order list | Open CMS Orders. | Latest test order appears. |  |  |
| O-02 | Booking list | Open CMS Schedule/Bookings. | Latest test booking appears. |  |  |
| O-03 | Search | Search by customer name, email, phone, plate, or order ID. | Matching order/booking appears. |  |  |
| O-04 | Detail | Open order detail. | Customer, products, totals, booking/service details are correct. |  |  |
| O-05 | Status change | Change order status through CMS. | Status saves and list/detail update. |  |  |
| O-06 | Booking status | Change booking status through CMS. | Status saves and customer-facing state is correct. |  |  |
| O-07 | Assign/control | Assign staff/resource/time if supported. | Assignment saves and appears in CMS. |  |  |
| O-08 | Internal note | Add/edit internal note. | Note is visible to CMS only. |  |  |
| O-09 | Customer-visible note | Add customer-visible note if supported. | Customer-visible message appears only where intended. |  |  |
| O-10 | Cancel | Cancel test order/booking. | Status changes; downstream customer view/email behavior is correct. |  |  |
| O-11 | Restore/reopen | Reopen or restore status if supported. | State transitions are valid and audited. |  |  |
| O-12 | Permissions | Try CMS order controls as non-admin if possible. | Non-admin cannot perform restricted actions. |  |  |

## Regression Matrix

| ID | Area | Test Case | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| X-01 | Console | Repeat main flows with console open. | No unhandled runtime errors. |  |  |
| X-02 | Network | Watch failed requests. | No unexpected `401`, `403`, `500`, `57014`, or failed dynamic imports. |  |  |
| X-03 | Timeout | Load tire CMS, rim CMS, tire storefront, rim storefront. | No Supabase statement timeout. |  |  |
| X-04 | Auth role | CMS super_admin performs catalog/order actions. | No `Admin access required` role mismatch. |  |  |
| X-05 | RLS | Customer cannot access CMS routes/data. | Access denied or redirected safely. |  |  |
| X-06 | Data API grants | Public storefront read-model tables are accessible through app. | No `42501` grant errors. |  |  |
| X-07 | Cleanup | Remove all QA products/images/orders if required. | Test data is either cleaned or clearly labeled. |  |  |

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
