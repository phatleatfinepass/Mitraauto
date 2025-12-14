# Frontend Patches Required

**Status**: Ready for implementation  
**Date**: December 14, 2024

---

## Summary

Remove all references to non-existent database fields from frontend components. The main issues:

1. **EU Label fields** (`eu_fuel`, `eu_wet`, `eu_noise`) - Don't exist in schema
2. **"EV READY" placeholder badge** - No field to support it
3. **CB (center bore) for rims** - `cb_mm` field doesn't exist
4. **Material badge for rims** - `material` field doesn't exist

---

## File 1: `/components/catalog/TireCard.tsx`

### Changes Required:

#### A. Update Interface (Line 15-32)
```typescript
// REMOVE these non-existent fields from interface:
eu_fuel?: string;          // ❌ Remove
eu_wet?: string;           // ❌ Remove
eu_noise?: number;         // ❌ Remove

// KEEP only these actual fields:
interface TireCardProps {
  product: {
    id: string;
    brand: string;
    model: string;
    size_text?: string;
    season?: string;
    runflat?: boolean;
    xl?: boolean;
    studded?: boolean;
    best_price_eur?: number;
    best_image_url: string;
    in_stock: boolean;
  };
  index?: number;
  onClick?: () => void;
  onAddToCart?: (e: React.MouseEvent) => void;
}
```

#### B. Remove EU Label Parsing Logic (Lines 44-52)
```typescript
// DELETE these lines:
const euFuel = product.eu_fuel ? product.eu_fuel.toString().trim().toUpperCase() : undefined;
const euWet = product.eu_wet ? product.eu_wet.toString().trim().toUpperCase() : undefined;
const parsedNoise = typeof product.eu_noise === 'number'
  ? product.eu_noise
  : Number.parseFloat(String(product.eu_noise ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.'));
const euNoise = Number.isFinite(parsedNoise) ? parsedNoise : undefined;
const hasEuLabel = euFuel !== undefined || euWet !== undefined || euNoise !== undefined;
```

#### C. Remove Entire EU Label Section (Lines ~207-372)
**DELETE** the entire block that starts with:
```tsx
{/* EU Label */}
{hasEuLabel && (
  <div className="basis-0 grow...">
    {/* Fuel, Wet, Noise sections */}
  </div>
)}
```

**Result**: The price container should now take full width (remove the gap-[12px] parent if needed)

#### D. Remove "EV READY" Placeholder Badge (Lines ~430-452)
**DELETE** this entire badge:
```tsx
{/* EV Ready - placeholder badge */}
<div className={`box-border content-stretch flex gap-[8px]...`}>
  ...
  <p>
    {language === 'fi' ? 'EV VALMIS' : 'EV READY'}
  </p>
</div>
```

#### E. Update Badge Container Layout
After removing EV READY, update the badges container to use `gap-[8px]` and `flex-wrap`:
```tsx
<div className="content-stretch flex flex-wrap gap-[8px] items-start relative shrink-0 w-full">
  {/* XL Badge - only if xl === true */}
  {product.xl && (
    <div className="...">XL</div>
  )}
  
  {/* Runflat Badge - only if runflat === true */}
  {product.runflat && (
    <div className="...">RUNFLAT</div>
  )}
  
  {/* Studded Badge - only if studded === true */}
  {product.studded && (
    <div className="...">{language === 'fi' ? 'NASTOITETTU' : 'STUDDED'}</div>
  )}
</div>
```

---

## File 2: `/components/catalog/RimCard.tsx`

### Changes Required:

#### A. Update Interface (Lines 8-27)
```typescript
// REMOVE these non-existent fields:
material?: string;         // ❌ Remove (not in schema)
cb?: number;              // ❌ Remove (cb_mm doesn't exist yet)

// KEEP only actual fields:
interface RimCardProps {
  product: {
    id: string;
    brand: string;
    model: string;
    rim_width?: number;
    rim_diameter?: number;
    pcd?: string;
    et_offset?: number;
    color?: string;
    finish?: string;
    best_price_eur?: number;
    best_image_url: string;
    in_stock: boolean;
  };
  index?: number;
  onClick?: () => void;
  onAddToCart?: (e: React.MouseEvent) => void;
}
```

#### B. Remove CB Badge (Lines ~127-140)
**DELETE** the entire CB badge block:
```tsx
{/* CB Badge */}
{product.cb && (
  <div className="...">
    CB: {product.cb}<span className="lowercase">mm</span>
  </div>
)}
```

#### C. Remove Material Label Function (Lines 48-55)
**DELETE**:
```typescript
const getMaterialLabel = (material?: string) => {
  if (!material) return '';
  const labels = {
    alloy: language === 'fi' ? 'Alumiini' : 'Aluminum',
    steel: language === 'fi' ? 'Teräs' : 'Steel',
  };
  return labels[material.toLowerCase() as keyof typeof labels] || material;
};
```

#### D. Update Material Badge (Lines ~227-242)
**DELETE** the material badge entirely:
```tsx
{/* Material Badge - Always rendered, opacity 0 if no material */}
<div className={`... ${!product.material ? 'opacity-0' : 'opacity-100'}`}>
  ...
  {getMaterialLabel(product.material) || 'N/A'}
</div>
```

#### E. Update Color Badge
Change from "N/A" to hide when missing:
```tsx
{/* Color Badge - ONLY show if color exists */}
{product.color && (
  <div className="...">
    <p>{language === 'fi' ? 'Väri' : 'Color'}: {product.color}</p>
  </div>
)}
```

#### F. Add Finish Badge (if not already conditional)
```tsx
{/* Finish Badge - ONLY show if finish exists */}
{product.finish && (
  <div className="...">
    <p>{language === 'fi' ? 'Viimeistely' : 'Finish'}: {product.finish}</p>
  </div>
)}
```

---

## File 3: `/components/catalog/ProductDetailPage.tsx`

### Changes Required:

#### A. Update TireProduct Interface (Lines 39-72)
```typescript
export interface TireProduct {
  type: 'tire';
  id: string;
  brand: string;
  model: string;
  // Parse from size_string (FUTURE - not separate fields yet)
  // tire_width: number;
  // aspect_ratio: number;
  // construction: string;
  // rim_diameter: number;
  // load_index?: number;
  // speed_rating?: string;
  season: 'summer' | 'winter' | 'all_season';
  extra_load?: boolean;       // Mapped from xl_reinforced
  runflat?: boolean;
  studded?: boolean;
  // EU labels - FUTURE
  // fuel_efficiency?: string;
  // wet_grip?: string;
  // noise_level?: number;
  // noise_class?: string;
  // Flags - FUTURE
  // ev_ready?: boolean;
  // three_pmsf?: boolean;
  best_price_eur?: number;
  best_image_url: string;
  images?: string[];          // From CMS gallery
  description?: string;       // From CMS
  in_stock: boolean;
  stock_quantity?: number;    // From stock_qty
  // FUTURE fields
  // supplier_name?: string;
  // delivery_days?: string;
  // weight?: number;
  // warranty_years?: number;
  // rating?: number;
  // review_count?: number;
}
```

#### B. Update RimProduct Interface (Lines 74-100)
```typescript
export interface RimProduct {
  type: 'rim';
  id: string;
  brand: string;
  model: string;
  rim_width?: number;          // width_in
  rim_diameter?: number;       // rim_diameter_in
  pcd?: string;                // bolt_pattern
  et_offset?: number;          // et_offset_mm
  // cb?: number;              // FUTURE: cb_mm
  color?: string;
  // material?: string;        // FUTURE
  finish?: string;
  // weight?: number;          // FUTURE
  best_price_eur?: number;
  best_image_url: string;
  images?: string[];
  description?: string;
  in_stock: boolean;
  stock_quantity?: number;
  // FUTURE fields
  // supplier_name?: string;
  // delivery_days?: string;
  // compatible_vehicles?: string[];
  // warranty_years?: number;
  // rating?: number;
  // review_count?: number;
}
```

#### C. Remove EU Label Tab/Section
Find and **DELETE** any EU label display sections.

Search for:
- "EU Label"
- "Fuel Efficiency"
- "Wet Grip"
- "Noise Level"

#### D. Remove Compatibility Section
Find and **DELETE** the `CompatibilityList` component and any vehicle compatibility displays.

**DELETE** lines ~112-224 (the entire Compatibility function component)

#### E. Remove "EV Ready" and "3PMSF" Badges
Search for and **DELETE**:
- Any badge showing "EV Ready" / "EV VALMIS"
- Any badge showing "3PMSF" or winter certification symbol

#### F. Update Specifications Display
Ensure all spec rows check for null and hide if missing:

```tsx
{/* Tire Specs */}
{product.type === 'tire' && (
  <>
    {product.season && (
      <div className="spec-row">
        <span>Season:</span>
        <span>{getSeasonLabel(product.season)}</span>
      </div>
    )}
    {product.extra_load && (
      <div className="spec-row">
        <span>Extra Load (XL):</span>
        <span>Yes</span>
      </div>
    )}
    {product.runflat && (
      <div className="spec-row">
        <span>Run-flat:</span>
        <span>Yes</span>
      </div>
    )}
    {product.studded && (
      <div className="spec-row">
        <span>Studded:</span>
        <span>Yes</span>
      </div>
    )}
  </>
)}

{/* Rim Specs */}
{product.type === 'rim' && (
  <>
    {product.rim_width && (
      <div className="spec-row">
        <span>Width:</span>
        <span>{product.rim_width}"</span>
      </div>
    )}
    {product.rim_diameter && (
      <div className="spec-row">
        <span>Diameter:</span>
        <span>{product.rim_diameter}"</span>
      </div>
    )}
    {product.et_offset && (
      <div className="spec-row">
        <span>ET Offset:</span>
        <span>ET{product.et_offset}</span>
      </div>
    )}
    {product.pcd && (
      <div className="spec-row">
        <span>Bolt Pattern:</span>
        <span>{product.pcd}</span>
      </div>
    )}
    {product.color && (
      <div className="spec-row">
        <span>Color:</span>
        <span>{product.color}</span>
      </div>
    )}
    {product.finish && (
      <div className="spec-row">
        <span>Finish:</span>
        <span>{product.finish}</span>
      </div>
    )}
  </>
)}
```

#### G. Update Stock Display
```tsx
const stockStatus = product.in_stock && (product.stock_quantity === null || product.stock_quantity > 0);
const stockMessage = stockStatus
  ? (product.stock_quantity
      ? `${language === 'fi' ? 'Varastossa' : 'In Stock'} (${product.stock_quantity} ${language === 'fi' ? 'kpl' : 'pcs'})`
      : (language === 'fi' ? 'Varastossa' : 'In Stock'))
  : (language === 'fi' ? 'Loppu varastosta' : 'Out of Stock');
```

---

## File 4: `/components/catalog/CatalogPage.tsx`

### Update Product Mapping (Lines 454-480)

```typescript
function mapProductSearchRow(row: ProductSearchRow, productType: 'tire' | 'rim'): CatalogProduct {
  const priceEur = row.price !== null && row.price !== undefined ? row.price : undefined;

  return {
    id: row.variant_id,
    brand: row.brand_display_name || row.brand,
    model: row.model,
    size_text: row.size_string ?? undefined,
    best_price_eur: priceEur,
    best_image_url: row.best_image_url || getFallbackImage(row.brand, row.model),
    in_stock: row.in_stock ?? false,
    product_type: productType,
    // Tire-specific fields
    season: productType === 'tire' ? row.season ?? undefined : undefined,
    runflat: productType === 'tire' ? row.runflat ?? undefined : undefined,
    xl: productType === 'tire' ? row.xl_reinforced ?? undefined : undefined,
    studded: productType === 'tire' ? row.studded ?? undefined : undefined,
    // DO NOT map EU label fields (they don't exist)
    // Rim-specific fields
    rim_width: productType === 'rim' ? row.width_in ?? undefined : undefined,
    rim_diameter: productType === 'rim' ? row.rim_diameter_in ?? undefined : undefined,
    et_offset: productType === 'rim' ? row.et_offset_mm ?? undefined : undefined,
    pcd: productType === 'rim' ? row.bolt_pattern ?? undefined : undefined,
    color: productType === 'rim' ? row.color ?? undefined : undefined,
    finish: productType === 'rim' ? row.finish ?? undefined : undefined,
    // DO NOT map cb or material (they don't exist)
  };
}
```

---

## File 5: `/utils/productsSearch.ts`

**NO CHANGES REQUIRED** ✅

This file is already correct and matches the actual schema.

---

## Acceptance Testing Checklist

After applying patches:

### Tire Cards
- [ ] No EU label section displays
- [ ] No "EV READY" badge shows
- [ ] XL badge shows ONLY when `xl_reinforced === true`
- [ ] Studded badge shows ONLY when `studded === true`
- [ ] Run-flat badge shows ONLY when `runflat === true`
- [ ] Season badge shows ONLY when `season` has value
- [ ] Price shows both single and 4-piece
- [ ] Out of stock disables "Add" button

### Rim Cards
- [ ] No CB badge (field doesn't exist)
- [ ] No material badge (field doesn't exist)
- [ ] Color badge shows ONLY when `color` exists
- [ ] Finish badge shows ONLY when `finish` exists
- [ ] Price shows both single and 4-piece
- [ ] Size displays correctly from individual fields

### Product Detail Pages
- [ ] No EU label tab/section
- [ ] No compatibility section
- [ ] No "EV Ready" badge
- [ ] No "3PMSF" badge
- [ ] Specs hide rows with null values
- [ ] Never shows "N/A" text
- [ ] Image gallery works with CMS override
- [ ] Stock status displays correctly

### General
- [ ] No console errors about missing properties
- [ ] TypeScript compiles without errors
- [ ] Anonymous users can browse without login prompts
- [ ] CMS overrides apply correctly where they exist

---

## Estimated Effort

- **TireCard.tsx**: 30 minutes (remove EU section, update badges)
- **RimCard.tsx**: 15 minutes (remove CB/material)
- **ProductDetailPage.tsx**: 45 minutes (remove EU/compatibility, update interfaces)
- **CatalogPage.tsx**: 10 minutes (update mapping)
- **Testing**: 30 minutes

**Total**: ~2 hours

---

## Next Steps

1. Apply all patches to frontend components
2. Run TypeScript compiler to check for errors
3. Test in browser with real data
4. Verify no console errors
5. Test both tire and rim products
6. Confirm CMS integration still works
7. Merge to main branch

---

**Document Version**: 1.0  
**Status**: Ready for implementation
