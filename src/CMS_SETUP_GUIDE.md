# Mitra Auto CMS V2 - Setup Guide

## Quick Start (5 Minutes)

### Step 1: Database Setup

Run in Supabase SQL Editor:

```sql
-- Create product_cms table
CREATE TABLE IF NOT EXISTS product_cms (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_cms_variant_id ON product_cms(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_cms_hidden ON product_cms(is_hidden);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_cms_updated_at
BEFORE UPDATE ON product_cms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: Storage Bucket Setup

Run in Supabase SQL Editor:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
```

Then go to Supabase Dashboard → Storage → `product-images` → Policies:

**Policy 1: Public Read**
```sql
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
```

**Policy 3: Authenticated Delete**
```sql
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

### Step 3: Create Admin User

```sql
-- Set admin role for user
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin@email.com';
```

### Step 4: Access CMS

1. Login to the site with admin credentials
2. Navigate to `/cms/tires` or `/cms/rims`
3. Start managing products!

---

## Verify Setup

### ✅ Checklist

- [ ] `product_cms` table exists
- [ ] `product-images` bucket exists and is public
- [ ] Storage policies created (3 policies)
- [ ] Admin user has `role: "admin"` in metadata
- [ ] Can login and see CMS pages
- [ ] Can upload images
- [ ] Can save product edits

---

## Sample Data (Optional)

### Insert test CMS entry:

```sql
-- Example tire with EU override
INSERT INTO product_cms (
  variant_id,
  title,
  subtitle,
  short_description,
  spec_overrides,
  is_hidden
)
VALUES (
  'your-tire-variant-id-here',
  'Michelin Pilot Sport 4 Summer Tire',
  'High-performance summer tire for sports cars',
  'Engineered for maximum grip and handling in dry and wet conditions.',
  '{
    "eu": {
      "fuel": "B",
      "wet": "A",
      "noise_db": 71,
      "noise_class": "B"
    }
  }'::jsonb,
  false
);
```

---

## Troubleshooting

### Error: "Failed to upload images"
**Solution**: Check storage policies are created and bucket is public.

```sql
-- List current policies
SELECT * FROM storage.policies WHERE bucket_id = 'product-images';
```

### Error: "Access denied to CMS"
**Solution**: Check user has admin role.

```sql
-- Check user role
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'your@email.com';
```

### Error: "Table product_cms does not exist"
**Solution**: Run Step 1 SQL in Supabase Editor.

### Images upload but don't appear
**Solution**: Check bucket is public.

```sql
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';
```

---

## Migration from Old CMS

If you have existing data in the old TiresCMSPage/RimsCMSPage:

### Step 1: Backup existing data
```sql
-- Backup to CSV
COPY (SELECT * FROM product_cms) TO '/tmp/product_cms_backup.csv' CSV HEADER;
```

### Step 2: No changes needed!
The new V2 CMS uses the same `product_cms` table structure. Your existing data is compatible.

### Step 3: Update imports in App.tsx
Already done! The V2 components are now imported.

---

## Production Checklist

### Before Launch

- [ ] Row-Level Security (RLS) enabled on `product_cms`
- [ ] Only admins can write to `product_cms`
- [ ] Storage bucket has size limits configured
- [ ] Image upload rate limiting enabled
- [ ] Admin users documented
- [ ] Backup strategy in place

### RLS Policies for product_cms

```sql
-- Enable RLS
ALTER TABLE product_cms ENABLE ROW LEVEL SECURITY;

-- Allow public read (for storefront)
CREATE POLICY "Public can view product CMS data"
ON product_cms FOR SELECT
TO public
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage product CMS data"
ON product_cms FOR ALL
TO authenticated
USING (
  (auth.jwt()->>'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt()->>'role')::text = 'admin'
);
```

---

## Testing

### Manual Test Cases

1. **EU Label Override**
   - [ ] Edit tire, set fuel to "A"
   - [ ] Save and reload
   - [ ] Verify "Final" shows "A"
   - [ ] Clear override
   - [ ] Verify "Final" reverts to base

2. **Image Upload**
   - [ ] Upload 3 images
   - [ ] Verify hero badge on first
   - [ ] Drag second image to first position
   - [ ] Verify hero badge moved
   - [ ] Remove an image
   - [ ] Save and reload
   - [ ] Verify images persisted

3. **Visibility Toggle**
   - [ ] Hide product
   - [ ] Check storefront (should not appear)
   - [ ] Show product
   - [ ] Check storefront (should appear)

4. **Content & SEO**
   - [ ] Edit title, subtitle, descriptions
   - [ ] Save
   - [ ] Reload CMS
   - [ ] Verify fields persisted
   - [ ] Check storefront displays updates

---

## Performance Optimization

### Image Upload
- Compress images before upload
- Use WebP format when possible
- Implement upload queue for bulk operations

### Database
```sql
-- Add partial indexes for faster queries
CREATE INDEX idx_cms_visible_products 
ON product_cms(variant_id) 
WHERE is_hidden = false;

CREATE INDEX idx_cms_eu_overrides 
ON product_cms(variant_id) 
WHERE spec_overrides IS NOT NULL;
```

### Caching
- Cache product_cms data in frontend
- Use React Query or SWR for automatic refetching
- Invalidate cache on save

---

## Security Best Practices

1. **Admin Access**
   - Use strong passwords
   - Enable 2FA in Supabase
   - Limit admin users to minimum necessary

2. **Storage**
   - Set max file size (5MB)
   - Validate file types server-side
   - Scan uploads for malware (enterprise)

3. **Database**
   - Enable RLS on all tables
   - Audit admin actions
   - Regular backups

4. **API Keys**
   - Never expose service role key to frontend
   - Use anon key for public operations
   - Rotate keys regularly

---

## Monitoring

### Key Metrics to Track

- Image upload success rate
- CMS save errors
- Storage bucket size
- Average edit time per product
- Number of EU overrides active

### Logging

```typescript
// Add to CMS save function
console.log('CMS Save:', {
  variant_id,
  has_eu_override: !!spec_overrides?.eu,
  image_count: gallery?.length || 0,
  is_hidden,
  timestamp: new Date().toISOString()
});
```

---

## Support & Documentation

- **Main Guide**: `/CMS_V2_README.md`
- **Field Mapping**: `/PRODUCT_FIELDS_MAPPING.md`
- **Architecture**: Review component files in `/components/cms/`

---

**Setup Time**: 5 minutes  
**Difficulty**: Easy  
**Prerequisites**: Supabase project, admin access

✅ **Ready to use after completing Steps 1-4!**
