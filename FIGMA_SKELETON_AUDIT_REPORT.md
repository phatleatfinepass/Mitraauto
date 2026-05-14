# Figma Skeleton Audit Report

Date: 2026-05-14

## Scope

Audited Figma skeleton at:

```txt
Skeleton/src/app
```

against the local source of truth at:

```txt
src
```

Important path mapping:

```txt
repo:   src/...
Figma:  src/app/...
```

## Executive Summary

The Figma skeleton is partially updated. The new folders exist:

```txt
Skeleton/src/app/i18n
Skeleton/src/app/theme
Skeleton/src/app/components/site
Skeleton/src/app/components/shared
```

But many files still import the old removed files:

```txt
components/LanguageContext.tsx
components/ThemeContext.tsx
components/Toaster.tsx
```

Resolver audit found:

```txt
91 broken local imports
44 stale i18n imports
23 stale theme imports
8 admin communication type import problems
5 missing etrtoFitment imports
11 broken imports from obsolete top-level admin schedule duplicates
```

The current Figma failure is therefore expected until Figma fully follows the local repo.

## Critical Fix Order

Apply in this order.

### 1. Keep New App-Level Folders

These must exist in Figma exactly:

```txt
src/app/i18n/LanguageContext.tsx
src/app/i18n/types.ts
src/app/i18n/dictionaries/auth.ts
src/app/i18n/dictionaries/booking.ts
src/app/i18n/dictionaries/catalog.ts
src/app/i18n/dictionaries/cms.ts
src/app/i18n/dictionaries/common.ts
src/app/i18n/dictionaries/emergency.ts
src/app/i18n/dictionaries/index.ts
src/app/i18n/dictionaries/legal.ts
src/app/i18n/dictionaries/site.ts

src/app/theme/ThemeContext.tsx
src/app/components/shared/Toaster.tsx
src/app/components/shared/BrokenCar404.tsx
```

Delete old root component files if present:

```txt
src/app/components/LanguageContext.tsx
src/app/components/ThemeContext.tsx
src/app/components/Toaster.tsx
```

### 2. Replace These Figma Files From Local Repo

This is safer than manually fixing imports one by one.

Copy local repo files into the matching Figma `src/app` paths:

```txt
src/SiteApp.tsx
-> Skeleton/src/app/SiteApp.tsx

src/CmsPwaApp.tsx
-> Skeleton/src/app/CmsPwaApp.tsx

src/imports/MapContainer.tsx
-> Skeleton/src/app/imports/MapContainer.tsx

src/components/catalog/*
-> Skeleton/src/app/components/catalog/*

src/components/cms/*
-> Skeleton/src/app/components/cms/*

src/components/cms-pwa/*
-> Skeleton/src/app/components/cms-pwa/*

src/components/admin/*
-> Skeleton/src/app/components/admin/*

src/components/site/*
-> Skeleton/src/app/components/site/*

src/components/shared/*
-> Skeleton/src/app/components/shared/*

src/utils/*
-> Skeleton/src/app/utils/*
```

Minimum required missing utility:

```txt
src/utils/etrtoFitment.ts
-> Skeleton/src/app/utils/etrtoFitment.ts
```

## Stale Import Rules

After the copy, no file in Figma should import these:

```txt
../LanguageContext
../../LanguageContext
./components/LanguageContext
../ThemeContext
../../ThemeContext
../components/ThemeContext
./components/Toaster
```

Correct imports:

```ts
// src/app/SiteApp.tsx
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import { Toaster } from './components/shared/Toaster';

// src/app/CmsPwaApp.tsx
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

// src/app/imports/MapContainer.tsx
import { useTheme } from '../theme/ThemeContext';

// src/app/components/admin/*
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';

// src/app/components/catalog/*
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';

// src/app/components/cms/*/*
import { useLanguage } from '../../../i18n/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';

// src/app/components/cms-pwa/*
import { useLanguage } from '../../i18n/LanguageContext';

// src/app/components/site/*/*
import { useLanguage } from '../../../i18n/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';
```

## Broken Imports Found In Skeleton

### Stale i18n imports

These files still point to old `LanguageContext` paths:

```txt
CmsPwaApp.tsx
components/admin/AdminLoginPage.tsx
components/admin/AdminPasswordChangePage.tsx
components/admin/AdminSchedulePage.tsx
components/catalog/CatalogPage.tsx
components/catalog/EURating.tsx
components/catalog/LicensePlateDisplay.tsx
components/catalog/ProductDetailPage.tsx
components/catalog/RimCard.tsx
components/catalog/RimFilters.tsx
components/catalog/StockBadge.tsx
components/catalog/TireCard.tsx
components/catalog/TireFilters.tsx
components/cms/account-customer/AccountCustomerCMSPage.tsx
components/cms/core/CmsGuard.tsx
components/cms/invoices/InvoicesCMSPage.tsx
components/cms/orders/OrdersCMSPage.tsx
components/cms/rescue/RescueCMSPage.tsx
components/cms/rims/RimsCMSPage.tsx
components/cms/tires/TiresCMSPage.tsx
components/cms/tires/TiresConflictResolvePage.tsx
components/cms-pwa/CmsPwaNotFound.tsx
components/site/booking/BookingModal.tsx
components/site/cart/CartDrawer.tsx
components/site/checkout/CheckoutCancelPage.tsx
components/site/checkout/CheckoutPage.tsx
components/site/checkout/CheckoutSuccessPage.tsx
components/site/layout/Footer.tsx
components/site/layout/Navbar.tsx
components/site/modals/AuthModal.tsx
components/site/modals/EmergencyTowModal.tsx
components/site/pages/AboutPage.tsx
components/site/pages/CarServicePage.tsx
components/site/pages/CarWashPage.tsx
components/site/pages/ContactPage.tsx
components/site/pages/DiagnosticsPage.tsx
components/site/pages/FAQPage.tsx
components/site/pages/HelsinkiPage.tsx
components/site/pages/LegalPage.tsx
components/site/pages/NotFoundPage.tsx
components/site/pages/ServicesPage.tsx
components/site/pages/TireChangePage.tsx
components/site/pages/TireHotelPage.tsx
components/site/sections/ContactSection.tsx
```

### Stale theme imports

These files still point to old `ThemeContext` paths:

```txt
components/admin/AdminLoginPage.tsx
components/admin/AdminPasswordChangePage.tsx
components/admin/AdminSchedulePage.tsx
components/catalog/CatalogPage.tsx
components/catalog/LicensePlateDisplay.tsx
components/catalog/ProductDetailPage.tsx
components/catalog/RimCard.tsx
components/catalog/RimFilters.tsx
components/catalog/TireCard.tsx
components/catalog/TireFilters.tsx
components/cms/invoices/InvoicesCMSPage.tsx
components/cms/orders/OrdersCMSPage.tsx
components/cms/rims/RimsCMSPage.tsx
components/cms/shared/ImageUpload.tsx
components/cms/tires/TiresCMSPage.tsx
components/cms/tires/TiresConflictResolvePage.tsx
components/site/cart/CartDrawer.tsx
components/site/checkout/CheckoutCancelPage.tsx
components/site/checkout/CheckoutPage.tsx
components/site/checkout/CheckoutSuccessPage.tsx
components/site/layout/Navbar.tsx
components/site/pages/LegalPage.tsx
imports/MapContainer.tsx
```

## Admin Folder Mismatch

The Figma skeleton has obsolete duplicated top-level admin schedule files:

```txt
src/app/components/admin/AdminArchivedBookingDialog.tsx
src/app/components/admin/AdminSchedule.types.ts
src/app/components/admin/AdminScheduleBookingPanel.tsx
src/app/components/admin/AdminScheduleDrawer.tsx
src/app/components/admin/AdminScheduleGrid.tsx
src/app/components/admin/AdminScheduleSearchDialog.tsx
src/app/components/admin/AdminScheduleSidebar.tsx
src/app/components/admin/useBookingEditorState.ts
src/app/components/admin/useBookingReservationState.ts
```

Local repo keeps these under:

```txt
src/components/admin/schedule/
```

Recommended action:

```txt
Delete the obsolete top-level duplicates from Figma.
Keep only src/app/components/admin/schedule/*.
```

## Admin Communication Type Mismatch

Local repo has:

```txt
src/components/admin/communication/types.ts
```

Figma skeleton has:

```txt
src/app/components/admin/communication/type.ts
```

Recommended action:

```txt
Delete type.ts
Add/copy types.ts from local repo
```

Files depending on `types.ts`:

```txt
components/admin/communication/BookingCommunicationModal.tsx
components/admin/communication/BookingCommunicationPanel.tsx
components/admin/communication/BookingComposerRail.tsx
components/admin/communication/BookingThreadList.tsx
components/admin/communication/BookingThreadViewer.tsx
components/admin/communication/useBookingConversation.ts
components/admin/schedule/AdminScheduleDrawer.tsx
```

## Missing Utility

Figma skeleton is missing:

```txt
src/app/utils/etrtoFitment.ts
```

Required by:

```txt
components/catalog/CatalogPage.tsx
components/catalog/TireFilters.tsx
utils/etrtoFitmentClient.ts
utils/fitmentRecommendations.ts
utils/rimFitmentClient.ts
```

Copy from:

```txt
src/utils/etrtoFitment.ts
```

to:

```txt
Skeleton/src/app/utils/etrtoFitment.ts
```

## Extra Figma Files Not In Repo

These are present in the Figma skeleton but not in the current repo source of truth:

```txt
components/admin/AdminArchivedBookingDialog.tsx
components/admin/AdminSchedule.types.ts
components/admin/AdminScheduleBookingPanel.tsx
components/admin/AdminScheduleDrawer.tsx
components/admin/AdminScheduleGrid.tsx
components/admin/AdminScheduleSearchDialog.tsx
components/admin/AdminScheduleSidebar.tsx
components/admin/communication/AdminSlotActionDialog.tsx
components/admin/communication/type.ts
components/admin/useBookingEditorState.ts
components/admin/useBookingReservationState.ts
```

Recommended action:

```txt
Remove them from Figma unless a specific Figma-only feature still imports them.
```

## Files/Folders Confirmed Present And Matching

These folders exist in Figma skeleton and match local repo by diff:

```txt
src/app/i18n
src/app/theme
```

So the remaining i18n/theme issue is not folder presence. It is stale imports across the Figma files listed above.

## Final Verification Checklist For Figma

After applying the copy/cleanup:

1. Search Figma for:

```txt
LanguageContext
ThemeContext
components/Toaster
```

2. Valid matches should only point to:

```txt
i18n/LanguageContext
theme/ThemeContext
components/shared/Toaster
```

3. Search Figma for:

```txt
../LanguageContext
../../LanguageContext
../ThemeContext
../../ThemeContext
./components/LanguageContext
../components/ThemeContext
```

Expected result:

```txt
0 matches
```

4. Search Figma for:

```txt
communication/type
```

Expected result:

```txt
0 matches
```

5. Confirm this file exists:

```txt
src/app/utils/etrtoFitment.ts
```

6. Run Figma again. The first Vite error should no longer mention `LanguageContext`, `ThemeContext`, or `etrtoFitment`.

