# Figma Skeleton Re-import Checklist

Source repo root: `/Users/chandler/code/Mitraauto-main/src`

Figma skeleton root: `/Users/chandler/code/Mitraauto-main/Skeleton/src/app`

This list is intentionally scoped to the Figma app surface. Do not blindly replace generated Figma assets/import files unless they are listed here.

## 1. Root app and providers

Re-import these first. They define the new app-level paths for `i18n`, `theme`, `site`, and shared UI.

- [ ] `src/SiteApp.tsx` -> `Skeleton/src/app/SiteApp.tsx`
- [ ] `src/CmsPwaApp.tsx` -> `Skeleton/src/app/CmsPwaApp.tsx`
- [ ] `src/i18n/LanguageContext.tsx` -> `Skeleton/src/app/i18n/LanguageContext.tsx`
- [ ] `src/i18n/types.ts` -> `Skeleton/src/app/i18n/types.ts`
- [ ] `src/i18n/dictionaries/auth.ts` -> `Skeleton/src/app/i18n/dictionaries/auth.ts`
- [ ] `src/i18n/dictionaries/booking.ts` -> `Skeleton/src/app/i18n/dictionaries/booking.ts`
- [ ] `src/i18n/dictionaries/catalog.ts` -> `Skeleton/src/app/i18n/dictionaries/catalog.ts`
- [ ] `src/i18n/dictionaries/cms.ts` -> `Skeleton/src/app/i18n/dictionaries/cms.ts`
- [ ] `src/i18n/dictionaries/common.ts` -> `Skeleton/src/app/i18n/dictionaries/common.ts`
- [ ] `src/i18n/dictionaries/emergency.ts` -> `Skeleton/src/app/i18n/dictionaries/emergency.ts`
- [ ] `src/i18n/dictionaries/index.ts` -> `Skeleton/src/app/i18n/dictionaries/index.ts`
- [ ] `src/i18n/dictionaries/legal.ts` -> `Skeleton/src/app/i18n/dictionaries/legal.ts`
- [ ] `src/i18n/dictionaries/site.ts` -> `Skeleton/src/app/i18n/dictionaries/site.ts`
- [ ] `src/theme/ThemeContext.tsx` -> `Skeleton/src/app/theme/ThemeContext.tsx`
- [ ] `src/components/shared/BrokenCar404.tsx` -> `Skeleton/src/app/components/shared/BrokenCar404.tsx`
- [ ] `src/components/shared/Toaster.tsx` -> `Skeleton/src/app/components/shared/Toaster.tsx`

## 2. Site folders

These are website-facing folders and should stay under `components/site`.

- [ ] `src/components/site/booking/` -> `Skeleton/src/app/components/site/booking/`
- [ ] `src/components/site/cart/` -> `Skeleton/src/app/components/site/cart/`
- [ ] `src/components/site/checkout/` -> `Skeleton/src/app/components/site/checkout/`
- [ ] `src/components/site/layout/` -> `Skeleton/src/app/components/site/layout/`
- [ ] `src/components/site/modals/` -> `Skeleton/src/app/components/site/modals/`
- [ ] `src/components/site/pages/` -> `Skeleton/src/app/components/site/pages/`
- [ ] `src/components/site/sections/` -> `Skeleton/src/app/components/site/sections/`
- [ ] `src/components/site/services/` -> `Skeleton/src/app/components/site/services/`

## 3. Catalog and missing fitment utility

Re-import the full catalog folder because the old skeleton still imports `../LanguageContext` and `../ThemeContext`.

- [ ] `src/components/catalog/` -> `Skeleton/src/app/components/catalog/`
- [ ] `src/utils/etrtoFitment.ts` -> `Skeleton/src/app/utils/etrtoFitment.ts`

The `etrtoFitment.ts` file is required by:

- `Skeleton/src/app/components/catalog/CatalogPage.tsx`
- `Skeleton/src/app/components/catalog/TireFilters.tsx`
- `Skeleton/src/app/utils/etrtoFitmentClient.ts`
- `Skeleton/src/app/utils/fitmentRecommendations.ts`
- `Skeleton/src/app/utils/rimFitmentClient.ts`

## 4. CMS folders

Re-import the CMS folders that were refactored in the repo. These currently have stale `../../LanguageContext` and `../../ThemeContext` imports in the skeleton.

- [ ] `src/components/cms/core/` -> `Skeleton/src/app/components/cms/core/`
- [ ] `src/components/cms/layout/` -> `Skeleton/src/app/components/cms/layout/`
- [ ] `src/components/cms/shared/` -> `Skeleton/src/app/components/cms/shared/`
- [ ] `src/components/cms/tires/` -> `Skeleton/src/app/components/cms/tires/`
- [ ] `src/components/cms/rims/` -> `Skeleton/src/app/components/cms/rims/`
- [ ] `src/components/cms/orders/` -> `Skeleton/src/app/components/cms/orders/`
- [ ] `src/components/cms/invoices/` -> `Skeleton/src/app/components/cms/invoices/`
- [ ] `src/components/cms/rescue/` -> `Skeleton/src/app/components/cms/rescue/`
- [ ] `src/components/cms/account-customer/` -> `Skeleton/src/app/components/cms/account-customer/`

## 5. CMS PWA

This is part of the Figma skeleton, but it must use the repo's new i18n path.

- [ ] `src/components/cms-pwa/` -> `Skeleton/src/app/components/cms-pwa/`

## 6. Admin schedule and communication

Use the repo's folderized schedule structure. The skeleton currently has extra old top-level schedule files under `components/admin`.

- [ ] `src/components/admin/AdminAuthContext.tsx` -> `Skeleton/src/app/components/admin/AdminAuthContext.tsx`
- [ ] `src/components/admin/AdminBookingEditPanel.tsx` -> `Skeleton/src/app/components/admin/AdminBookingEditPanel.tsx`
- [ ] `src/components/admin/AdminLoginPage.tsx` -> `Skeleton/src/app/components/admin/AdminLoginPage.tsx`
- [ ] `src/components/admin/AdminPasswordChangePage.tsx` -> `Skeleton/src/app/components/admin/AdminPasswordChangePage.tsx`
- [ ] `src/components/admin/AdminSchedulePage.tsx` -> `Skeleton/src/app/components/admin/AdminSchedulePage.tsx`
- [ ] `src/components/admin/bookingCompletion.ts` -> `Skeleton/src/app/components/admin/bookingCompletion.ts`
- [ ] `src/components/admin/schedule/` -> `Skeleton/src/app/components/admin/schedule/`
- [ ] `src/components/admin/communication/BookingCommunicationModal.tsx` -> `Skeleton/src/app/components/admin/communication/BookingCommunicationModal.tsx`
- [ ] `src/components/admin/communication/BookingCommunicationPanel.tsx` -> `Skeleton/src/app/components/admin/communication/BookingCommunicationPanel.tsx`
- [ ] `src/components/admin/communication/BookingComposerRail.tsx` -> `Skeleton/src/app/components/admin/communication/BookingComposerRail.tsx`
- [ ] `src/components/admin/communication/BookingThreadList.tsx` -> `Skeleton/src/app/components/admin/communication/BookingThreadList.tsx`
- [ ] `src/components/admin/communication/BookingThreadViewer.tsx` -> `Skeleton/src/app/components/admin/communication/BookingThreadViewer.tsx`
- [ ] `src/components/admin/communication/types.ts` -> `Skeleton/src/app/components/admin/communication/types.ts`
- [ ] `src/components/admin/communication/useBookingConversation.ts` -> `Skeleton/src/app/components/admin/communication/useBookingConversation.ts`

After this, remove or ignore these obsolete skeleton-only duplicates if Figma still shows them:

- [ ] `Skeleton/src/app/components/admin/AdminArchivedBookingDialog.tsx`
- [ ] `Skeleton/src/app/components/admin/AdminSchedule.types.ts`
- [ ] `Skeleton/src/app/components/admin/AdminScheduleBookingPanel.tsx`
- [ ] `Skeleton/src/app/components/admin/AdminScheduleDrawer.tsx`
- [ ] `Skeleton/src/app/components/admin/AdminScheduleGrid.tsx`
- [ ] `Skeleton/src/app/components/admin/AdminScheduleSearchDialog.tsx`
- [ ] `Skeleton/src/app/components/admin/AdminScheduleSidebar.tsx`
- [ ] `Skeleton/src/app/components/admin/useBookingEditorState.ts`
- [ ] `Skeleton/src/app/components/admin/useBookingReservationState.ts`
- [ ] `Skeleton/src/app/components/admin/communication/type.ts`

## 7. Figma imports

Do not replace the whole `imports` folder. Only re-import this file because it uses `ThemeContext`.

- [ ] `src/imports/MapContainer.tsx` -> `Skeleton/src/app/imports/MapContainer.tsx`

Leave generated Figma import files alone unless a specific build error names them.

## 8. Do not re-import blindly

Keep these as Figma/skeleton-owned unless a specific error points to them:

- [ ] `Skeleton/src/assets/`
- [ ] Figma asset imports such as `figma:asset/...`
- [ ] Generated visual files under `Skeleton/src/app/imports/` except `MapContainer.tsx`
- [ ] `Skeleton/src/app/supabase/functions/server/` unless the error is inside Supabase edge code
- [ ] Public/Vite files outside `Skeleton/src/app`

## 9. Verification after each patch batch

Run these checks after importing each batch:

```bash
rg "from ['\"][^'\"]*(LanguageContext|ThemeContext|Toaster)['\"]" Skeleton/src/app -g '*.ts' -g '*.tsx'
```

Allowed results after the patch:

- `Skeleton/src/app/SiteApp.tsx` may import `./i18n/LanguageContext`, `./theme/ThemeContext`, and `./components/shared/Toaster`.
- Any component under `components/*` should import context from `../../i18n`, `../../../i18n`, `../../theme`, or `../../../theme` depending on depth.
- There should be no imports from `../LanguageContext`, `../../LanguageContext`, `../ThemeContext`, or `../../ThemeContext` pointing inside `components`.

Then check missing local imports with Vite or your Figma preview. The current known missing files from the skeleton audit are:

- `Skeleton/src/app/utils/etrtoFitment.ts`
- `Skeleton/src/app/components/admin/communication/types.ts`

