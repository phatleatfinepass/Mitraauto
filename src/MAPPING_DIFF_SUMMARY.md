# Product Fields Mapping - Diff Summary

## What Changed and Why

### 1. **Removed Invented Fields**

#### ❌ Removed from Original (Not in Schema):
- `eu_fuel`, `eu_wet`, `eu_noise`, `eu_noise_class` → Marked as **FUTURE**
- `tire_width`, `aspect_ratio`, `construction`, `rim_diameter` (as separate fields) → Parse from `size_string`
- `load_index`, `speed_rating` → **FUTURE**
- `three_pmsf`, `ev_ready` → **FUTURE** (no flags in schema)
- `cb` (center bore for rims) → **FUTURE: Add as `cb_mm`**
- `material` (rims) → **FUTURE**
- `weight`, `warranty_years` → **FUTURE**
- `rating`, `review_count`, `compatible_vehicles` → **FUTURE** (separate tables needed)
- `delivery_days`, `supplier_name` → **FUTURE** (join from other tables)
- `description` → Use CMS fields instead

#### ✅ Actual Fields from `products_search`:
```
variant_id, product_type, brand, brand_display_name, brand_logo_url, model, size_string
season, studded, runflat, xl_reinforced (tires)
width_in, rim_diameter_in, et_offset_mm, bolt_pattern, color, finish (rims)
price, currency, in_stock, stock_qty
best_image_url, best_image_alt, card_title, subtitle, tags, seo_slug
```

#### ✅ Actual Fields from `product_cms`:
```
variant_id, title, subtitle, short_description, long_description
hero_image_url, gallery, badges
seo_slug, seo_title, seo_description, is_hidden
```

---

### 2. **Corrected EU Tyre Label Standards**

#### Before (WRONG):
- Fuel: A-G
- Wet Grip: A-G
- Noise: A-G or numeric

#### After (CORRECT - EU Regulation 2020/740):
- **Fuel Efficiency**: A, B, C, D, E (NOT A-G)
- **Wet Grip**: A, B, C, D, E (NOT A-G)
- **Noise Class**: A, B, C (letters for sound level)
- **Noise dB**: Numeric value (e.g., 68, 71, 74)

**Action**: Hide EU label panel entirely until fields added to schema

---

### 3. **Removed "EV Ready" Placeholder Badge**

#### Before:
- Showed "EV READY" badge on all tire cards as placeholder

#### After:
- **Do NOT show** "EV Ready" badge
- No `ev_ready` field in schema
- No business logic to determine EV compatibility

**Reason**: Misleading to users; requires explicit field or supplier data flag

---

### 4. **Clarified 4-Piece Pricing**

#### Before:
- "OFF by default unless business flag exists"

#### After:
- **ALWAYS show** 4-piece pricing for both tires and rims
- Industry standard for B2C automotive parts
- Format: `€89.99 (€359.96/4PCS)`

**Reason**: Customers expect to see set pricing (4 tires or 4 rims)

---

### 5. **Changed "N/A" Handling**

#### Before:
- Showed "N/A" for missing fields in some places

#### After:
- **NEVER show "N/A"**
- Hide entire rows/badges/panels if data missing
- Maintain clean, data-driven UI

**Example**:
```typescript
// WRONG:
<div>Color: {color || 'N/A'}</div>

// CORRECT:
{color && <div>Color: {color}</div>}
```

---

### 6. **Removed Fake Compatibility Data**

#### Before:
- Had mock compatibility lists in PDP
- Showed Audi, BMW, Mercedes models

#### After:
- **Hide compatibility section**
- No `compatible_vehicles` field or table
- Marked as **FUTURE** enhancement

**Reason**: Displaying fake fitment data is legally risky

---

### 7. **Fixed Season Values**

#### Before:
- Unclear season enum values

#### After:
- Exact values: `'summer'`, `'winter'`, `'all_season'`
- Lowercase in database
- Bilingual labels in UI

---

### 8. **Clarified Stock Logic**

#### Before:
- Ambiguous stock handling

#### After:
```typescript
const isInStock = in_stock === true && (stock_qty === null || stock_qty > 0);
```

**Rules**:
- `in_stock = false` → Out of Stock
- `in_stock = true` AND `stock_qty = 0` → Out of Stock
- `in_stock = true` AND `stock_qty = null` → In Stock (unknown quantity)
- `in_stock = true` AND `stock_qty > 0` → In Stock (show quantity)

---

### 9. **Authentication Scope**

#### Before:
- Unclear when to require auth

#### After:
**Never require login for**:
- Catalog browsing
- Product cards
- Product detail pages
- Price viewing

**Require login for**:
- Adding to cart
- Checkout
- Saving favorites
- CMS admin access

---

### 10. **Image Fallback Priority**

#### Before:
- Multiple undefined image sources

#### After:
```
Card: CMS.hero_image_url → products_search.best_image_url → placeholder
PDP: CMS.gallery → CMS.hero_image_url → products_search.best_image_url → placeholder
```

---

## Key Architectural Decisions

### 1. **products_search is Source of Truth**
- View maintained by backend ETL
- Frontend reads only, never writes
- CMS overrides applied at display time

### 2. **product_cms is Optional Enhancement**
- Not all products have CMS entries
- Use `.maybeSingle()` not `.single()`
- Merge with product data before display

### 3. **Strict Type Safety**
```typescript
// All nullable fields explicitly typed
type ProductSearchRow = {
  variant_id: string;              // NOT NULL
  product_type: 'tire' | 'rim';    // NOT NULL
  brand: string;                   // NOT NULL
  model: string;                   // NOT NULL
  season: string | null;           // NULLABLE
  price: number | null;            // NULLABLE
  // ...
};
```

### 4. **No Placeholder Data in Production**
- Mockup images for development only
- Real products use real images or placeholders
- Never show fake reviews, ratings, or compatibility

---

## Migration Path

### Phase 1 (Immediate - This PR)
- [x] Update mapping document with real fields
- [x] Remove invented fields
- [x] Hide EU label (not in schema)
- [x] Remove "EV Ready" placeholder
- [x] Fix "N/A" display logic
- [x] Correct authentication scope

### Phase 2 (Next Sprint)
- [ ] Add EU label fields to `products_search`
- [ ] Add `cb_mm` for rims
- [ ] Parse tire dimensions from `size_string`
- [ ] Add load index and speed rating

### Phase 3 (Future)
- [ ] Build `product_reviews` table
- [ ] Build `product_vehicle_compatibility` table
- [ ] Add supplier join fields
- [ ] Implement advanced filtering

---

## Frontend Updates Required

### Files to Modify:
1. `/components/catalog/TireCard.tsx`
   - Remove EU label section (fields don't exist)
   - Remove "EV Ready" badge
   - Fix "N/A" text → hide missing fields
   - Ensure 4-piece pricing always shows

2. `/components/catalog/RimCard.tsx`
   - Remove CB badge (field doesn't exist)
   - Fix material badge (field doesn't exist)
   - Hide missing color/finish badges properly

3. `/components/catalog/ProductDetailPage.tsx`
   - Remove EU label tab
   - Remove compatibility section
   - Hide missing spec rows
   - Use CMS gallery properly

4. `/utils/productsSearch.ts`
   - Already correct ✅
   - Type definitions match schema

5. `/components/cms/TiresCMSPage.tsx`
   - Already correct ✅
   - Queries match schema

6. `/components/cms/RimsCMSPage.tsx`
   - Already correct ✅
   - Queries match schema

---

## Testing Checklist

### Card Display
- [ ] Tire card shows correct fields only
- [ ] Rim card shows correct fields only
- [ ] No "N/A" text anywhere
- [ ] Missing images use placeholder
- [ ] Out of stock disables button
- [ ] 4-piece pricing always visible
- [ ] Season badge only for tires with season
- [ ] XL/Studded/Runflat only when true

### PDP Display
- [ ] Image gallery works with CMS override
- [ ] Falls back to single image if no gallery
- [ ] Specs tab hides missing rows
- [ ] No EU label section
- [ ] No compatibility section
- [ ] CMS description renders if exists
- [ ] Stock status accurate

### CMS Integration
- [ ] CMS overrides apply correctly
- [ ] Products without CMS entry still display
- [ ] Gallery images load properly
- [ ] Custom badges display
- [ ] is_hidden hides products

### Anonymous Access
- [ ] Can browse catalog without login
- [ ] Can view PDP without login
- [ ] Can see prices without login
- [ ] Only blocks cart/checkout

---

## Summary

**Before**: 45+ fields with many invented/placeholder fields  
**After**: 25 real fields + 11 CMS fields + clear future roadmap

**Result**: Accurate, maintainable, legally compliant product display system

**Next Action**: Apply frontend patches to enforce these mappings

---

**Document Version**: 1.0  
**Date**: December 14, 2024
