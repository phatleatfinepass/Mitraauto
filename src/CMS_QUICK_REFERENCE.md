# Mitra Auto CMS V2 - Quick Reference Card

## 🚀 Quick Access

| Action | URL |
|--------|-----|
| Tires CMS | `/cms/tires` |
| Rims CMS | `/cms/rims` |

---

## 🔑 Key Principles

1. **Never modifies** `catalog_tire_variants` or `catalog_rim_variants`
2. **Only writes to** `product_cms` table
3. **Final value** = CMS override OR base value

---

## 📝 EU Label Values (Tires Only)

| Field | Valid Values | Type |
|-------|--------------|------|
| **Fuel Efficiency** | A, B, C, D, E | Select |
| **Wet Grip** | A, B, C, D, E | Select |
| **Noise Class** | A, B, C | Select |
| **Noise dB** | 50-90 | Number |

**Note**: A = best, E = worst (for fuel/wet)

---

## 🖼️ Image Rules

- **Max images**: 10 per product
- **Max file size**: 5MB per image
- **Formats**: PNG, JPG, JPEG
- **First image**: Becomes hero image
- **Reorder**: Drag & drop

---

## 🎯 Edit Workflow

### Tires
1. Search/find tire
2. Click "Edit"
3. View base EU labels (gray)
4. Set overrides (dropdowns)
5. Upload/reorder images
6. Edit title, subtitle, descriptions
7. Set SEO fields
8. Toggle visibility
9. Click "Save"

### Rims
Same as tires, but **no EU label section**.

---

## 💾 Database Tables

### Read-Only (Never Edit)
- `catalog_tire_variants`
- `catalog_rim_variants`

### Editable (CMS Only)
- `product_cms`

### Storage
- Bucket: `product-images` (public)
- Path: `{product_type}s/{variant_id}/{filename}`

---

## 🔍 Search Tips

- Search by **brand** (e.g., "Michelin")
- Search by **model** (e.g., "Pilot Sport")
- Search by **EAN** (e.g., "1234567890")
- Search by **size** (tires: "205/55 R16")
- Search by **color** (rims: "silver")

---

## 🎨 UI Elements

| Icon | Meaning |
|------|---------|
| 👁️ Eye | Product visible in store |
| 👁️‍🗨️ EyeOff | Product hidden |
| ✏️ Edit | Open edit drawer |
| 💾 Save | Save changes |
| ❌ Cancel | Discard changes |
| 🗑️ Remove | Delete image |
| 🔄 Drag handle | Reorder images |

---

## 📊 CMS Sections

### Tires CMS Drawer
1. **Identity** (read-only) - Brand, model, EAN, size, season
2. **EU Labels** - Override fuel, wet, noise_db, noise_class
3. **Images** - Upload, reorder, remove (max 10)
4. **Content** - Title, subtitle, short/long descriptions
5. **SEO** - Slug, title, description
6. **Visibility** - Hide/show from store

### Rims CMS Drawer
1. **Identity** (read-only) - Brand, model, EAN, size, color
2. **Images** - Upload, reorder, remove (max 10)
3. **Content** - Title, subtitle, descriptions
4. **SEO** - Slug, title, description
5. **Visibility** - Hide/show from store

---

## ⚡ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close drawer |
| `Ctrl+S` | Save (when drawer open) |
| `Ctrl+F` | Focus search |

---

## ✅ Quick Checklist

### Before Editing
- [ ] Logged in as admin
- [ ] Product exists in base table
- [ ] Images ready (< 5MB each)

### While Editing
- [ ] Set EU overrides (tires only)
- [ ] Upload images (max 10)
- [ ] Reorder images (first = hero)
- [ ] Edit title/subtitle
- [ ] Add descriptions
- [ ] Set SEO fields
- [ ] Check visibility toggle

### After Saving
- [ ] Reload CMS to verify
- [ ] Check storefront display
- [ ] Verify EU labels (if overridden)
- [ ] Test product page

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Can't access CMS | Check admin role in Supabase |
| Images won't upload | Verify storage bucket exists & is public |
| EU override not saving | Check values are valid (A-E, A-C, 50-90) |
| Product not appearing | Check `is_hidden` is false |
| Changes not showing | Clear browser cache |

---

## 📞 Quick Help

| Issue Type | Where to Look |
|------------|---------------|
| Usage | `/CMS_V2_README.md` |
| Setup | `/CMS_SETUP_GUIDE.md` |
| Fields | `/PRODUCT_FIELDS_MAPPING.md` |
| Troubleshooting | Check browser console |

---

## 🎓 Training (2 Minutes)

### For New Admins

1. **Login** as admin user
2. **Navigate** to `/cms/tires`
3. **Click Edit** on any product
4. **Observe** sections A-F in drawer
5. **Try** setting EU override to "A"
6. **See** live "Final" preview turn green
7. **Upload** 2 test images
8. **Drag** to reorder
9. **Click Save** and verify

**Done!** You're now trained on the CMS.

---

## 💡 Pro Tips

1. **EU Overrides**: Set only what you need to override (partial OK)
2. **Images**: Upload in order - avoids reordering
3. **SEO Slug**: Use lowercase + hyphens (e.g., "michelin-pilot-sport-4")
4. **Descriptions**: Keep short description under 160 chars
5. **Visibility**: Use hidden for out-of-season products
6. **Search**: Use partial terms for faster results
7. **Save Often**: No auto-save - manual save required

---

## 🔢 Limits & Quotas

| Resource | Limit |
|----------|-------|
| Images per product | 10 |
| File size per image | 5MB |
| Title length | No limit (but < 60 chars for SEO) |
| Description length | No limit (but < 160 chars for SEO) |
| Products per page | 100 |
| Concurrent edits | 1 per product |

---

## 📈 Best Practices

### EU Labels
- Override only when supplier data is wrong
- Document reason for override (in long_description)
- Review overrides quarterly

### Images
- Use high-quality product photos
- First image = best angle
- Include multiple angles
- Compress before upload

### SEO
- Unique title per product
- Include brand + model in title
- Write compelling descriptions
- Use keywords naturally

### Content
- Keep titles concise
- Use bullet points in descriptions
- Highlight key features
- Mention compatibility

---

## 🎯 Success Checklist

- [ ] EU overrides working correctly
- [ ] Images uploading successfully
- [ ] Content saving properly
- [ ] SEO fields set
- [ ] Hidden products not showing in store
- [ ] Visible products appearing correctly
- [ ] No errors in browser console

---

**Quick Start**: Login → `/cms/tires` → Edit → Save  
**Support**: Check `/CMS_V2_README.md`  
**Status**: ✅ Production Ready

---

*Last Updated: December 14, 2024*
