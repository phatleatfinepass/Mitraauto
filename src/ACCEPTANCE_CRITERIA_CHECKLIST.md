# Acceptance Criteria Checklist

**Project**: Product Fields Mapping Correction  
**Date**: December 14, 2024

---

## Pre-Implementation Checklist

### Documentation Review
- [x] `/PRODUCT_FIELDS_MAPPING.md` created with real schema
- [x] All fields verified against `/utils/productsSearch.ts`
- [x] `products_search` columns documented (25 fields)
- [x] `product_cms` columns documented (11 fields)
- [x] Fake fields identified and removed
- [x] Future fields clearly marked
- [x] EU Tyre Label standards corrected (A-E not A-G)
- [x] Query examples provided
- [x] CMS override logic documented

### Code Analysis
- [x] TireCard interface audited
- [x] RimCard interface audited
- [x] ProductDetailPage interfaces audited
- [x] CatalogPage mapping function audited
- [x] EU label references identified
- [x] Placeholder badges identified
- [x] "N/A" text locations identified

---

## Post-Implementation Checklist

### Code Changes Applied

#### `/components/catalog/TireCard.tsx`
- [ ] Removed `eu_fuel`, `eu_wet`, `eu_noise` from interface
- [ ] Removed EU label parsing logic (lines 44-52)
- [ ] Removed entire EU label display section (~165 lines)
- [ ] Removed "EV READY" placeholder badge
- [ ] Updated badge container to use flex-wrap
- [ ] XL badge shows ONLY when `xl === true`
- [ ] Runflat badge shows ONLY when `runflat === true`
- [ ] Studded badge shows ONLY when `studded === true`
- [ ] Season badge shows ONLY when `season` exists
- [ ] Price container now full-width
- [ ] TypeScript compiles without errors

#### `/components/catalog/RimCard.tsx`
- [ ] Removed `cb` from interface
- [ ] Removed `material` from interface
- [ ] Removed CB badge section
- [ ] Removed `getMaterialLabel()` function
- [ ] Removed material badge section
- [ ] Color badge hidden when `color === null`
- [ ] Finish badge hidden when `finish === null`
- [ ] No "N/A" text displayed anywhere
- [ ] TypeScript compiles without errors

#### `/components/catalog/ProductDetailPage.tsx`
- [ ] Updated `TireProduct` interface to remove fake fields
- [ ] Updated `RimProduct` interface to remove fake fields
- [ ] Removed EU label tab/section
- [ ] Removed `CompatibilityList` component
- [ ] Removed "EV Ready" badge
- [ ] Removed "3PMSF" badge
- [ ] Specs rows hidden when data is null
- [ ] No "N/A" text in spec display
- [ ] Stock status logic updated
- [ ] TypeScript compiles without errors

#### `/components/catalog/CatalogPage.tsx`
- [ ] `mapProductSearchRow()` updated
- [ ] No EU field mapping attempted
- [ ] No CB/material mapping attempted
- [ ] Tire fields map correctly
- [ ] Rim fields map correctly
- [ ] TypeScript compiles without errors

---

## Functional Testing

### Tire Card Display
- [ ] **Brand name** displays from `brand_display_name` or `brand`
- [ ] **Model name** displays from `model`
- [ ] **Size** displays from `size_string` (split by / and spaces)
- [ ] **Season badge** appears ONLY when `season` has value
  - [ ] Summer shows sun icon + "Kesä"/"Summer"
  - [ ] Winter shows snowflake icon + "Talvi"/"Winter"
  - [ ] All-season shows cloud-sun icon + "Ympärivuotinen"/"All Season"
- [ ] **XL badge** appears ONLY when `xl_reinforced === true`
- [ ] **Runflat badge** appears ONLY when `runflat === true`
- [ ] **Studded badge** appears ONLY when `studded === true`
- [ ] **EU label section** does NOT appear (hidden until fields added)
- [ ] **"EV READY" badge** does NOT appear
- [ ] **Price (single)** displays from `price` (formatted as €X.XX)
- [ ] **Price (4-piece)** calculates as `price * 4` (formatted as €X.XX/4PCS)
- [ ] **Stock status**: Button enabled when `in_stock === true`
- [ ] **Stock status**: Button disabled when `in_stock === false`
- [ ] **Image** displays from `best_image_url` or placeholder
- [ ] **Image hover** zoom effect works
- [ ] **Card click** navigates to PDP

### Rim Card Display
- [ ] **Brand name** displays from `brand_display_name` or `brand`
- [ ] **Model name** displays from `model`
- [ ] **Width** displays from `width_in` (e.g., "7.5")
- [ ] **Diameter** displays from `rim_diameter_in` (e.g., "17\"")
- [ ] **ET offset** displays from `et_offset_mm` (e.g., "ET45")
- [ ] **Bolt pattern** displays from `bolt_pattern` (e.g., "5x112")
- [ ] **Size format**: "7.5 × 17\" ET45 5x112"
- [ ] **CB badge** does NOT appear (field doesn't exist)
- [ ] **Color badge** appears ONLY when `color` exists
- [ ] **Color badge** hidden when `color === null`
- [ ] **Finish badge** appears ONLY when `finish` exists
- [ ] **Material badge** does NOT appear (field doesn't exist)
- [ ] **Price (single)** displays correctly
- [ ] **Price (4-piece)** displays correctly
- [ ] **Stock status** works correctly
- [ ] **Image** displays with hover rotation
- [ ] No "N/A" text anywhere

### Product Detail Page (Tire)
- [ ] **Title** uses CMS override OR `{brand} {model}`
- [ ] **Subtitle** uses CMS override OR `size_string`
- [ ] **Image gallery** uses CMS gallery OR falls back to single image
- [ ] **Gallery navigation** works (left/right arrows)
- [ ] **Image zoom** opens modal
- [ ] **Price (single)** displays
- [ ] **Price (4-piece)** displays
- [ ] **Stock status** shows correctly
  - [ ] "In Stock (X pcs)" when `stock_qty > 0`
  - [ ] "In Stock" when `in_stock === true` and `stock_qty === null`
  - [ ] "Out of Stock" when `in_stock === false`
- [ ] **Season** displays in specs
- [ ] **XL badge** shows when `extra_load === true`
- [ ] **Runflat badge** shows when `runflat === true`
- [ ] **Studded badge** shows when `studded === true`
- [ ] **EU label section** does NOT appear
- [ ] **"EV Ready" badge** does NOT appear
- [ ] **"3PMSF" badge** does NOT appear
- [ ] **Compatibility section** does NOT appear
- [ ] **Description** shows CMS content if exists
- [ ] **Custom badges** show if in CMS
- [ ] Spec rows with null values are hidden
- [ ] No "N/A" text displays

### Product Detail Page (Rim)
- [ ] **Width** displays if exists (e.g., "7.5\"")
- [ ] **Diameter** displays if exists (e.g., "17\"")
- [ ] **ET offset** displays if exists (e.g., "ET45")
- [ ] **Bolt pattern** displays if exists (e.g., "5x112")
- [ ] **Color** displays if exists
- [ ] **Finish** displays if exists
- [ ] **CB (center bore)** does NOT display (field missing)
- [ ] **Material** does NOT display (field missing)
- [ ] **Weight** does NOT display (field missing)
- [ ] Spec rows hidden when null
- [ ] No "N/A" text displays

### CMS Integration
- [ ] Products with CMS entry load overrides
- [ ] Products without CMS entry still display
- [ ] CMS `title` overrides card title
- [ ] CMS `subtitle` overrides subtitle
- [ ] CMS `hero_image_url` overrides product image
- [ ] CMS `gallery` appears in PDP
- [ ] CMS `badges` display as custom badges
- [ ] CMS `short_description` displays
- [ ] CMS `long_description` displays
- [ ] `is_hidden === true` hides product from catalog

---

## Browser Testing

### Desktop (Chrome)
- [ ] Tire cards render correctly
- [ ] Rim cards render correctly
- [ ] PDP loads without errors
- [ ] No console errors
- [ ] Images load
- [ ] Hover effects work
- [ ] Click navigation works

### Desktop (Firefox)
- [ ] Same as Chrome checklist
- [ ] No console errors
- [ ] No layout issues

### Desktop (Safari)
- [ ] Same as Chrome checklist
- [ ] No console errors
- [ ] No layout issues

### Mobile (iOS Safari)
- [ ] Cards responsive
- [ ] Touch navigation works
- [ ] Images scale properly
- [ ] No horizontal scroll

### Mobile (Android Chrome)
- [ ] Same as iOS checklist

---

## TypeScript Validation
- [ ] `npm run tsc --noEmit` passes with 0 errors
- [ ] No `@ts-ignore` comments added
- [ ] All interfaces match schema
- [ ] No `any` types introduced

---

## Security & Access Control
- [ ] Anonymous users can view catalog
- [ ] Anonymous users can view product cards
- [ ] Anonymous users can view PDP
- [ ] Anonymous users can see prices
- [ ] Anonymous users **cannot** add to cart without login (expected)
- [ ] No login prompt on page load
- [ ] No 401/403 errors on catalog browse
- [ ] CMS pages require admin role
- [ ] Non-admin users redirected from CMS

---

## Performance
- [ ] Catalog page loads in < 2 seconds
- [ ] PDP loads in < 1 second
- [ ] Images lazy load
- [ ] No unnecessary re-renders
- [ ] No memory leaks

---

## Data Integrity
- [ ] Products from `products_search` display correctly
- [ ] Tire-specific fields only on tires
- [ ] Rim-specific fields only on rims
- [ ] Price calculations accurate
- [ ] Stock status accurate
- [ ] Season values match enum ('summer', 'winter', 'all_season')
- [ ] Boolean fields interpreted correctly
- [ ] Null handling works for all nullable fields

---

## Regression Testing
- [ ] Existing tire products still work
- [ ] Existing rim products still work
- [ ] Search functionality unaffected
- [ ] Filters still work
- [ ] Pagination still works
- [ ] Sort order unaffected
- [ ] Cart functionality unaffected
- [ ] Checkout unaffected

---

## Edge Cases
- [ ] Product with all fields null (graceful)
- [ ] Product with only required fields (displays)
- [ ] Product with no image (placeholder shows)
- [ ] Product with `stock_qty === 0` (out of stock)
- [ ] Product with `stock_qty === null` (shows "In Stock" if `in_stock === true`)
- [ ] Product with very long brand/model names (truncates or wraps)
- [ ] Product with unusual size_string format (handles gracefully)

---

## Final Sign-Off

### Technical Review
- [ ] Code reviewed by developer
- [ ] TypeScript types validated
- [ ] Database queries verified
- [ ] No invented fields remain
- [ ] All future fields marked clearly

### QA Review
- [ ] Manual testing complete
- [ ] All checklist items passed
- [ ] No critical bugs found
- [ ] Edge cases handled
- [ ] Performance acceptable

### Stakeholder Review
- [ ] Product display accurate
- [ ] EU label standards correct (A-E for fuel/wet, A/B/C for noise)
- [ ] No misleading placeholders
- [ ] Stock status truthful
- [ ] Price display clear

---

## Deployment Checklist
- [ ] Merge PR to main
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor for errors (first hour)
- [ ] Verify analytics tracking
- [ ] Confirm no increase in error rate

---

## Post-Deployment
- [ ] Document any issues found
- [ ] Update runbook if needed
- [ ] Plan Phase 2 (EU label fields)
- [ ] Schedule Phase 3 (reviews/compatibility)

---

**Total Checkpoints**: 150+  
**Estimated Test Time**: 1-2 hours  
**Pass Criteria**: All checkboxes checked  
**Severity**: High (affects customer-facing product display)

---

**Tester Signature**: _________________  
**Date**: _________________  
**Result**: ☐ PASS  ☐ FAIL  ☐ CONDITIONAL PASS

