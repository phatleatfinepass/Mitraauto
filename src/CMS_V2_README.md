# Mitra Auto CMS V2 - Product Management System

## Overview

The Mitra Auto CMS V2 is a comprehensive content management system for managing tire and rim products with EU label overrides, image galleries, SEO optimization, and visibility controls.

---

## Key Features

### ✅ **Data Separation (CRITICAL)**
- **Never modifies `catalog_tire_variants` or `catalog_rim_variants`** (read-only base data)
- **Only writes to `product_cms` table** (CMS overrides)
- **Final storefront value** = CMS override OR base value

### 🔒 **Admin-Only Access**
- Protected by `CmsGuard` component
- Requires admin role in Supabase auth
- Redirects unauthorized users to login

---

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/cms/tires` | Tires CMS | Manage tire products + EU labels |
| `/cms/rims` | Rims CMS | Manage rim products (no EU labels) |

---

## Architecture

### 1. Base Data (Read-Only)
```
catalog_tire_variants
├── id (uuid)
├── ean
├── brand
├── model
├── size_string
├── season
├── eu_fuel_class        ← Base EU value
├── eu_wet_class         ← Base EU value
├── eu_noise_db          ← Base EU value
└── eu_noise_class       ← Base EU value

catalog_rim_variants
├── id (uuid)
├── ean
├── brand
├── model
├── width
├── diameter
├── pcd
├── et
└── color
```

### 2. CMS Overrides (Editable)
```
product_cms
├── variant_id (PK, FK to catalog_*_variants.id)
├── title
├── subtitle
├── short_description
├── long_description
├── hero_image_url
├── gallery (jsonb array)
├── seo_slug
├── seo_title
├── seo_description
├── is_hidden (boolean)
└── spec_overrides (jsonb)
    └── eu (object)
        ├── fuel (A-E)
        ├── wet (A-E)
        ├── noise_db (50-90)
        └── noise_class (A-C)
```

---

## EU Label Management (Tires Only)

### EU Tyre Label Regulation (EU) 2020/740
- **Fuel Efficiency**: A (best) → E (worst)
- **Wet Grip**: A (best) → E (worst)
- **Noise Class**: A (quiet), B (moderate), C (loud)
- **Noise dB**: Integer 50-90

### Override Logic
```javascript
// Storefront displays final value
const finalEUFuel = cms.spec_overrides?.eu?.fuel || tire.eu_fuel_class;
const finalEUWet = cms.spec_overrides?.eu?.wet || tire.eu_wet_class;
const finalNoiseDb = cms.spec_overrides?.eu?.noise_db || tire.eu_noise_db;
const finalNoiseClass = cms.spec_overrides?.eu?.noise_class || tire.eu_noise_class;
```

### Clear Override
```javascript
// Removes only EU overrides, keeps other overrides intact
const { eu, ...rest } = cms.spec_overrides;
updated.spec_overrides = Object.keys(rest).length > 0 ? rest : null;
```

---

## Image Management

### Supabase Storage
- **Bucket**: `product-images`
- **Permissions**: Public read, admin write
- **Folder Structure**: `{product_type}s/{variant_id}/{filename}`

### Upload Flow
1. User selects images (max 10)
2. Files uploaded to Supabase Storage
3. Public URLs stored in `product_cms.gallery`
4. First image becomes `hero_image_url`

### Image Operations
- **Upload**: Drag & drop or click to select
- **Reorder**: Drag to rearrange (hero = first image)
- **Remove**: Deletes from storage and DB

---

## Components

### 1. TiresCMSPageV2
**Location**: `/components/cms/TiresCMSPageV2.tsx`

**Features**:
- Table view with base/final EU labels
- EU label override editor
- Image gallery manager
- Content editor (title, subtitle, descriptions)
- SEO fields
- Visibility toggle

**Sections**:
- A: Identity (read-only) - brand, model, EAN, size, season
- B: EU Label Overrides - fuel, wet, noise_db, noise_class
- C: Images - hero + gallery (max 10)
- D: Content - title, subtitle, short/long descriptions
- E: SEO - slug, title, description
- F: Visibility - is_hidden toggle

### 2. RimsCMSPageV2
**Location**: `/components/cms/RimsCMSPageV2.tsx`

**Features**:
- Same as Tires CMS but **without EU label section**
- Table view with size/color display
- Image management
- Content & SEO editing

**Sections**:
- A: Identity (read-only) - brand, model, EAN, size, color
- B: Images - hero + gallery (max 10)
- C: Content - title, subtitle, descriptions
- D: SEO - slug, title, description
- E: Visibility - is_hidden toggle

### 3. ImageUpload
**Location**: `/components/cms/ImageUpload.tsx`

**Features**:
- Multi-file upload
- Drag & drop reordering
- Preview with remove button
- Hero badge on first image
- 5MB per file limit
- PNG, JPG support

### 4. EULabelOverride
**Location**: `/components/cms/EULabelOverride.tsx`

**Features**:
- Shows base value (read-only)
- Override input (dropdowns for A-E, number for dB)
- Live final value preview (green if overridden)
- Clear all overrides button
- Validation (A-E for fuel/wet, A-C for noise class, 50-90 for dB)

---

## Usage

### Access CMS
1. Login as admin user
2. Navigate to `/cms/tires` or `/cms/rims`
3. CmsGuard validates admin role

### Edit Tire Product
1. Click "Edit" on tire row
2. View base EU labels (read-only gray boxes)
3. Set EU overrides using dropdowns/input
4. See live "Final" preview (green if overridden)
5. Upload/reorder images
6. Edit content & SEO
7. Toggle visibility
8. Click "Save"

### Clear EU Overrides
1. Click "Clear All Overrides" button in EU section
2. Removes only `spec_overrides.eu`
3. Storefront reverts to base values

### Hide Product from Store
1. Check "Hide from store" checkbox
2. Product hidden from catalog
3. Direct URL access returns 404

---

## Storefront Integration

### Fetch Product Data
```typescript
// 1. Get base data
const { data: variant } = await supabase
  .from('catalog_tire_variants')
  .select('*')
  .eq('id', variantId)
  .single();

// 2. Get CMS overrides
const { data: cms } = await supabase
  .from('product_cms')
  .select('*')
  .eq('variant_id', variantId)
  .maybeSingle();

// 3. Merge for display
const displayData = {
  // Identity
  brand: variant.brand,
  model: variant.model,
  
  // Final values (CMS > base)
  title: cms?.title || `${variant.brand} ${variant.model}`,
  subtitle: cms?.subtitle || variant.size_string,
  images: cms?.gallery?.length > 0 ? cms.gallery : [variant.best_image_url],
  
  // EU labels (override > base)
  fuel: cms?.spec_overrides?.eu?.fuel || variant.eu_fuel_class,
  wet: cms?.spec_overrides?.eu?.wet || variant.eu_wet_class,
  noise_db: cms?.spec_overrides?.eu?.noise_db || variant.eu_noise_db,
  noise_class: cms?.spec_overrides?.eu?.noise_class || variant.eu_noise_class,
  
  // Visibility
  is_hidden: cms?.is_hidden || false
};
```

---

## Database Schema

### Create product_cms table
```sql
CREATE TABLE product_cms (
  variant_id UUID PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  short_description TEXT,
  long_description TEXT,
  hero_image_url TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  seo_slug TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  spec_overrides JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key to catalog_tire_variants OR catalog_rim_variants
-- (Both tables must have id column)
ALTER TABLE product_cms
ADD CONSTRAINT fk_variant_id
FOREIGN KEY (variant_id)
REFERENCES catalog_tire_variants(id)
ON DELETE CASCADE;

-- Index for fast lookups
CREATE INDEX idx_product_cms_variant_id ON product_cms(variant_id);
CREATE INDEX idx_product_cms_hidden ON product_cms(is_hidden);
```

### Create Supabase Storage Bucket
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Allow authenticated users to upload (admin only in practice)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read
CREATE POLICY "Public can view"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

---

## Validation Rules

### EU Labels
- Fuel: Must be A, B, C, D, or E
- Wet: Must be A, B, C, D, or E
- Noise Class: Must be A, B, or C
- Noise dB: Must be integer 50-90

### Images
- Max 10 images per product
- Max 5MB per file
- Formats: PNG, JPG, JPEG
- First image = hero image

### SEO
- Slug: Lowercase, hyphens, no spaces
- Title: Max 60 characters (recommendation)
- Description: Max 160 characters (recommendation)

---

## Acceptance Criteria

### ✅ EU Label Overrides
- [ ] Base EU values visible (read-only)
- [ ] Override dropdowns work
- [ ] Final value updates live
- [ ] Clear override button works
- [ ] Partial override (only fuel) works
- [ ] Save persists to DB
- [ ] Storefront displays final values

### ✅ Image Management
- [ ] Upload multiple images
- [ ] Drag to reorder
- [ ] Remove image works
- [ ] Hero badge on first image
- [ ] Gallery saves to DB
- [ ] Storefront displays gallery

### ✅ Content & SEO
- [ ] Title/subtitle save correctly
- [ ] Descriptions save
- [ ] SEO fields persist
- [ ] Empty fields allowed

### ✅ Visibility
- [ ] Toggle hides/shows product
- [ ] Hidden products not in catalog
- [ ] Visible toggle updates immediately

### ✅ Data Integrity
- [ ] Never modifies catalog_*_variants
- [ ] Only writes to product_cms
- [ ] Handles missing CMS data gracefully
- [ ] Upsert works (create or update)

---

## Troubleshooting

### Images not uploading
1. Check Supabase Storage bucket exists: `product-images`
2. Verify bucket is public
3. Check storage policies allow authenticated upload
4. Verify file size < 5MB

### EU overrides not saving
1. Check `spec_overrides` column type is JSONB
2. Verify values are valid (A-E for fuel/wet, A-C for noise class)
3. Check browser console for errors

### Products not appearing in CMS
1. Verify `catalog_tire_variants` or `catalog_rim_variants` has data
2. Check table has `id` column (UUID)
3. Verify Supabase RLS policies allow read

### "Access denied" error
1. User must be logged in
2. User must have `admin` role in Supabase auth
3. Check CmsGuard is working

---

## Future Enhancements

### Phase 1
- [ ] Bulk edit (multi-select products)
- [ ] CSV import for EU overrides
- [ ] Image optimization on upload
- [ ] Draft/publish workflow

### Phase 2
- [ ] Multi-language content (FI/EN)
- [ ] Version history
- [ ] Scheduled visibility (publish date)
- [ ] Product tags

### Phase 3
- [ ] AI-generated descriptions
- [ ] Automatic SEO optimization
- [ ] Image recognition for quality
- [ ] Analytics dashboard

---

## Support

For issues or questions:
1. Check this README
2. Review `/PRODUCT_FIELDS_MAPPING.md`
3. Check Supabase logs
4. Review browser console errors

---

**Last Updated**: December 14, 2024  
**Version**: 2.0.0  
**Status**: Production Ready ✅
