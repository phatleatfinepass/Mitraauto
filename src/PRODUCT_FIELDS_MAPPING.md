# Product Fields Mapping Guide (ACTUAL SCHEMA)

**Last Updated**: December 14, 2024  
**Schema Source**: Real database introspection via `/utils/productsSearch.ts` and CMS component queries

---

## ⚠️ CRITICAL RULES

### EU Tyre Label Standards (Regulation (EU) 2020/740)
- **Fuel Efficiency**: A (best) to E (worst) — **NOT A-G**
- **Wet Grip**: A (best) to E (worst) — **NOT A-G**
- **Noise Class**: A (quiet), B (moderate), C (loud)
- **Noise dB**: Numeric value (e.g., 68, 71, 74)

### Display Rules
1. **Hide panels if fields missing** - No "N/A" placeholders
2. **EU label** - Hide entire section if `fuel`, `wet`, OR `noise_db` missing
3. **Badges** - Only show if field exists AND is `true`
4. **Stock** - If `stock_qty` missing/null → treat as out-of-stock
5. **Images** - If missing → use placeholder, never break layout
6. **4-piece pricing** - Always show for both tires and rims (industry standard)

### Authentication
- **NEVER trigger login** for anonymous catalog/PDP browsing
- Only require auth for: cart, checkout, favorites, CMS admin

---

## DATABASE SCHEMA

### Table 1: `products_search` (VIEW - Read-only)

**Purpose**: Normalized product data from all suppliers, refreshed automatically

| Column Name | Data Type | Nullable | Applies To | Notes |
|-------------|-----------|----------|------------|-------|
| `variant_id` | text | NO | Both | Primary key |
| `product_type` | text | NO | Both | 'tire' or 'rim' |
| `brand` | text | NO | Both | Internal brand code |
| `brand_display_name` | text | YES | Both | Human-readable brand |
| `brand_logo_url` | text | YES | Both | Brand logo image |
| `model` | text | NO | Both | Model name |
| `size_string` | text | YES | Both | Display size (e.g., "205/55 R16") |
| **TIRE FIELDS** |
| `season` | text | YES | Tire | 'summer', 'winter', 'all_season' |
| `studded` | boolean | YES | Tire | Studded tires |
| `runflat` | boolean | YES | Tire | Run-flat technology |
| `xl_reinforced` | boolean | YES | Tire | Extra load (XL) |
| **RIM FIELDS** |
| `width_in` | numeric | YES | Rim | Width in inches (e.g., 7.5) |
| `rim_diameter_in` | numeric | YES | Rim | Diameter in inches (e.g., 17) |
| `et_offset_mm` | numeric | YES | Rim | ET offset in mm (e.g., 45) |
| `bolt_pattern` | text | YES | Rim | PCD (e.g., "5x112") |
| `color` | text | YES | Rim | Color name |
| `finish` | text | YES | Rim | Surface finish type |
| **PRICING & STOCK** |
| `price` | numeric | YES | Both | Price per single item (EUR) |
| `currency` | text | YES | Both | Currency code (default: EUR) |
| `in_stock` | boolean | NO | Both | Stock availability flag |
| `stock_qty` | integer | YES | Both | Available quantity |
| **DISPLAY OVERRIDES** |
| `best_image_url` | text | YES | Both | Primary product image |
| `best_image_alt` | text | YES | Both | Image alt text for SEO |
| `card_title` | text | YES | Both | Override for card title |
| `subtitle` | text | YES | Both | Override for subtitle |
| `tags` | text[] | YES | Both | Product tags (array) |
| `seo_slug` | text | YES | Both | URL-friendly slug |

**MISSING FIELDS (Not in current schema)**:
- ❌ `eu_fuel`, `eu_wet`, `eu_noise_db`, `eu_noise_class` - **FUTURE: Add to products_search**
- ❌ `cb_mm` (center bore for rims) - **FUTURE: Add to products_search**
- ❌ `load_index`, `speed_rating` (tires) - **FUTURE: Parse from supplier data**
- ❌ `weight_kg`, `warranty_years`, `rating`, `review_count` - **FUTURE**
- ❌ `compatible_vehicles` - **FUTURE: Separate table**
- ❌ `delivery_days`, `supplier_name` - **FUTURE: Join from catalog_supplier_offers**

---

### Table 2: `product_cms` (TABLE - Editable via CMS)

**Purpose**: Content management overrides and enhancements

| Column Name | Data Type | Nullable | Notes |
|-------------|-----------|----------|-------|
| `variant_id` | text | NO | FK → products_search.variant_id |
| `title` | text | YES | Override card_title |
| `subtitle` | text | YES | Override subtitle |
| `short_description` | text | YES | Brief marketing copy |
| `long_description` | text | YES | Detailed description (supports markdown) |
| `hero_image_url` | text | YES | Override best_image_url |
| `gallery` | text[] | YES | Array of image URLs for PDP |
| `badges` | text[] | YES | Custom badges (e.g., ["BESTSELLER", "NEW"]) |
| `seo_slug` | text | YES | URL slug override |
| `seo_title` | text | YES | SEO meta title |
| `seo_description` | text | YES | SEO meta description |
| `is_hidden` | boolean | NO | Hide from storefront (default: false) |

---

## FIELD MAPPING: TIRE PRODUCTS

### 1. TireCard Component Mapping

#### **Display Priority**
```
Title:    CMS.title → products_search.card_title → "{brand} {model}"
Subtitle: CMS.subtitle → products_search.subtitle → size_string
Image:    CMS.hero_image_url → products_search.best_image_url → placeholder
```

#### **Field Mapping Table**

| UI Element | Database Column | Fallback | Show/Hide Rule |
|------------|----------------|----------|----------------|
| **Brand Name** | `brand_display_name` or `brand` | Required | Always show |
| **Model Name** | `model` | Required | Always show |
| **Size String** | `size_string` | - | Show if exists |
| **Season Badge** | `season` | - | Hide if null |
| **Season Icon** | `season` → icon mapping | - | Hide if null |
| **XL Badge** | `xl_reinforced` | false | Show only if true |
| **Studded Badge** | `studded` | false | Show only if true |
| **Run-flat Badge** | `runflat` | false | Show only if true |
| **Price (single)** | `price` | 0 | Format: €{price} |
| **Price (4-piece)** | `price * 4` | 0 | Format: €{total}/4PCS |
| **Stock Status** | `in_stock` AND `stock_qty > 0` | false | "Add" vs "Sold Out" |
| **Product Image** | `best_image_url` | mockup | Hover zoom effect |
| **EU Label Panel** | ❌ NOT AVAILABLE | - | **HIDE until fields added** |

#### **EU Label (FUTURE - Fields not in schema)**
```javascript
// Will require these fields in products_search:
eu_fuel: 'A' | 'B' | 'C' | 'D' | 'E'    // NOT A-G
eu_wet: 'A' | 'B' | 'C' | 'D' | 'E'     // NOT A-G  
eu_noise_db: number                      // e.g., 68, 71
eu_noise_class: 'A' | 'B' | 'C'

// Hide entire EU label panel if ANY field missing:
const showEULabel = eu_fuel && eu_wet && eu_noise_db && eu_noise_class;
```

#### **Season Mapping**
```typescript
const seasonConfig = {
  summer: { 
    fi: 'Kesä', 
    en: 'Summer', 
    icon: <Sun />, 
    color: '#F59E0B' // Amber
  },
  winter: { 
    fi: 'Talvi', 
    en: 'Winter', 
    icon: <Snowflake />, 
    color: '#60A5FA' // Blue
  },
  all_season: { 
    fi: 'Ympärivuotinen', 
    en: 'All Season', 
    icon: <CloudSun />, 
    color: '#FF6B35' // Orange
  }
};
```

---

### 2. Tire PDP (Product Detail Page) Mapping

#### **Required Fields**
```typescript
interface TirePDP {
  // From products_search
  variant_id: string;
  brand: string;
  brand_display_name: string | null;
  model: string;
  size_string: string | null;
  season: string | null;
  studded: boolean | null;
  runflat: boolean | null;
  xl_reinforced: boolean | null;
  price: number | null;
  in_stock: boolean;
  stock_qty: number | null;
  best_image_url: string | null;
  
  // From product_cms (optional)
  cms_title?: string;
  cms_subtitle?: string;
  cms_short_description?: string;
  cms_long_description?: string;
  cms_hero_image?: string;
  cms_gallery?: string[];
  cms_badges?: string[];
}
```

#### **PDP Sections**

**Hero Section**
- Title: CMS.title OR `{brand_display_name} {model}`
- Subtitle: CMS.subtitle OR size_string
- Price: Single + 4-piece total
- Stock: "In Stock ({stock_qty})" or "Out of Stock"
- Image gallery: CMS.gallery OR [best_image_url]

**Specifications Tab** (FUTURE - requires additional fields)
```
❌ Width: NOT AVAILABLE (need tire_width_mm)
❌ Aspect Ratio: NOT AVAILABLE (parse from size_string)
❌ Construction: NOT AVAILABLE (parse from size_string)
❌ Rim Diameter: NOT AVAILABLE (parse from size_string)
❌ Load Index: NOT AVAILABLE
❌ Speed Rating: NOT AVAILABLE
✅ Season: season
✅ XL Reinforced: xl_reinforced
✅ Run-flat: runflat
✅ Studded: studded
```

**Features & Badges**
- XL: Show if `xl_reinforced === true`
- Run-flat: Show if `runflat === true`
- Studded: Show if `studded === true`
- Custom badges: CMS.badges (if exists)
- ❌ EV Ready: **Do NOT show** (no field in schema)
- ❌ 3PMSF: **Do NOT show** (no field in schema)

**Description**
- Short: CMS.short_description
- Long: CMS.long_description

---

## FIELD MAPPING: RIM PRODUCTS

### 3. RimCard Component Mapping

#### **Field Mapping Table**

| UI Element | Database Column | Fallback | Show/Hide Rule |
|------------|----------------|----------|----------------|
| **Brand Name** | `brand_display_name` or `brand` | Required | Always show |
| **Model Name** | `model` | Required | Always show |
| **Width** | `width_in` | - | Show if exists |
| **Diameter** | `rim_diameter_in` | - | Show if exists |
| **ET Offset** | `et_offset_mm` | - | Show if exists |
| **Bolt Pattern** | `bolt_pattern` | - | Show if exists |
| **Color** | `color` | - | Show badge if exists |
| **Finish** | `finish` | - | Show badge if exists |
| **Center Bore (CB)** | ❌ NOT AVAILABLE | - | **FUTURE: Add cb_mm** |
| **Price (single)** | `price` | 0 | Format: €{price} |
| **Price (4-piece)** | `price * 4` | 0 | Format: €{total}/4PCS |
| **Stock Status** | `in_stock` AND `stock_qty > 0` | false | "Add" vs "Sold Out" |
| **Product Image** | `best_image_url` | mockup | Hover rotation effect |

#### **Size Display**
```typescript
// Construct size string from individual fields:
const sizeParts = [];
if (width_in) sizeParts.push(width_in);
if (rim_diameter_in) sizeParts.push(`${rim_diameter_in}"`);
if (et_offset_mm) sizeParts.push(`ET${et_offset_mm}`);
if (bolt_pattern) sizeParts.push(bolt_pattern);

// Display as: "7.5 × 17" ET45 5x112"
```

---

### 4. Rim PDP (Product Detail Page) Mapping

#### **Required Fields**
```typescript
interface RimPDP {
  // From products_search
  variant_id: string;
  brand: string;
  brand_display_name: string | null;
  model: string;
  width_in: number | null;
  rim_diameter_in: number | null;
  et_offset_mm: number | null;
  bolt_pattern: string | null;
  color: string | null;
  finish: string | null;
  price: number | null;
  in_stock: boolean;
  stock_qty: number | null;
  best_image_url: string | null;
  
  // From product_cms (optional)
  cms_title?: string;
  cms_subtitle?: string;
  cms_short_description?: string;
  cms_long_description?: string;
  cms_hero_image?: string;
  cms_gallery?: string[];
  cms_badges?: string[];
}
```

#### **PDP Sections**

**Specifications Tab**
```
✅ Width: width_in (inches)
✅ Diameter: rim_diameter_in (inches)
✅ ET Offset: et_offset_mm (mm)
✅ Bolt Pattern: bolt_pattern (e.g., "5x112")
❌ Center Bore: NOT AVAILABLE (need cb_mm)
✅ Color: color
✅ Finish: finish
❌ Weight: NOT AVAILABLE
❌ Material: NOT AVAILABLE (need material field)
```

**Show/Hide Rules**
- Hide any spec row where value is null
- Never show "N/A" text
- If all specs missing → show message "Specifications coming soon"

---

## CMS OVERRIDE LOGIC

### Priority Chain
```javascript
// Title
const displayTitle = cms?.title || products_search.card_title || `${brand_display_name} ${model}`;

// Subtitle  
const displaySubtitle = cms?.subtitle || products_search.subtitle || products_search.size_string;

// Image
const displayImage = cms?.hero_image_url || products_search.best_image_url || PLACEHOLDER;

// Gallery (PDP only)
const galleryImages = cms?.gallery?.length > 0 
  ? cms.gallery 
  : (products_search.best_image_url ? [products_search.best_image_url] : [PLACEHOLDER]);
```

### Badges Logic
```javascript
// Combine system badges + CMS badges
const systemBadges = [];
if (xl_reinforced) systemBadges.push({ key: 'xl', label: 'XL' });
if (studded) systemBadges.push({ key: 'studded', label: language === 'fi' ? 'NASTOITETTU' : 'STUDDED' });
if (runflat) systemBadges.push({ key: 'runflat', label: 'RUN-FLAT' });

const cmsBadges = cms?.badges?.map(text => ({ key: 'cms', label: text })) || [];
const allBadges = [...systemBadges, ...cmsBadges];
```

---

## STRICT SHOW/HIDE CRITERIA

### Card-Level Rules
```javascript
// EU Label Panel
const showEULabel = false; // Fields not in schema yet

// Season Badge (Tires)
const showSeason = product_type === 'tire' && season !== null;

// XL Badge
const showXL = product_type === 'tire' && xl_reinforced === true;

// Studded Badge
const showStudded = product_type === 'tire' && studded === true;

// Run-flat Badge
const showRunflat = product_type === 'tire' && runflat === true;

// CB Badge (Rims)
const showCB = false; // cb_mm not in schema

// Color Badge
const showColor = product_type === 'rim' && color !== null && color !== '';

// Finish Badge
const showFinish = product_type === 'rim' && finish !== null && finish !== '';

// Add to Cart Button
const canAddToCart = in_stock === true && (stock_qty === null || stock_qty > 0);
```

### PDP-Level Rules
```javascript
// Hide specification rows with null values
const specs = [
  { label: 'Width', value: width_in, unit: '"', show: width_in !== null },
  { label: 'Diameter', value: rim_diameter_in, unit: '"', show: rim_diameter_in !== null },
  { label: 'ET Offset', value: et_offset_mm, unit: 'mm', show: et_offset_mm !== null },
  // etc.
].filter(spec => spec.show);

// Hide entire tabs if empty
const showSpecsTab = specs.length > 0;
const showDescriptionTab = cms?.short_description || cms?.long_description;
const showCompatibilityTab = false; // No data yet
```

---

## PRICE CALCULATIONS

```typescript
// Single price
const singlePrice = price !== null ? price : 0;
const formattedSingle = `€${singlePrice.toFixed(2)}`;

// 4-piece set (ALWAYS show for both tires and rims)
const fourPiecePrice = singlePrice * 4;
const formattedFourPiece = `€${fourPiecePrice.toFixed(2)}/4PCS`;
```

---

## STOCK LOGIC

```typescript
// Determine stock status
const isInStock = in_stock === true && (stock_qty === null || stock_qty > 0);

// Display messages
const stockMessage = isInStock
  ? (stock_qty !== null 
      ? (language === 'fi' ? `Varastossa (${stock_qty} kpl)` : `In Stock (${stock_qty} pcs)`)
      : (language === 'fi' ? 'Varastossa' : 'In Stock'))
  : (language === 'fi' ? 'Loppu varastosta' : 'Out of Stock');

// Button state
const buttonText = isInStock
  ? (language === 'fi' ? 'Lisää ostoskoriin' : 'Add to Cart')
  : (language === 'fi' ? 'Loppu' : 'Sold Out');

const buttonDisabled = !isInStock;
```

---

## IMAGE HANDLING

```typescript
// Card image
const cardImage = best_image_url || '/images/product-placeholder.png';

// PDP gallery
const pdpGallery = (() => {
  // Priority 1: CMS gallery
  if (cms?.gallery && cms.gallery.length > 0) {
    return cms.gallery;
  }
  
  // Priority 2: Hero image override
  if (cms?.hero_image_url) {
    return [cms.hero_image_url];
  }
  
  // Priority 3: Best image from products_search
  if (best_image_url) {
    return [best_image_url];
  }
  
  // Fallback: Placeholder
  return ['/images/product-placeholder.png'];
})();
```

---

## ACCEPTANCE CRITERIA CHECKLIST

### ✅ Data Display
- [x] Never show "N/A" text — hide missing fields instead
- [x] Hide EU label panel entirely (fields not in schema)
- [x] Hide badges for false/null values
- [x] Show 4-piece pricing for both tires and rims
- [x] Use CMS overrides when available
- [x] Gracefully handle missing images with placeholders

### ✅ Stock Handling
- [x] Treat null/0 stock_qty as out-of-stock
- [x] Disable "Add to Cart" when out of stock
- [x] Show clear stock status messages

### ✅ Authentication
- [x] NEVER trigger login for anonymous browsing
- [x] Allow catalog/PDP access without auth
- [x] Only require auth for: cart, checkout, favorites, CMS

### ✅ Error Handling
- [x] Handle missing fields gracefully
- [x] Show placeholder images when URLs invalid
- [x] Log errors to console (not user-facing alerts)
- [x] Maintain layout integrity with missing data

---

## FUTURE ENHANCEMENTS

### Phase 1: EU Labels (HIGH PRIORITY)
Add to `products_search`:
```sql
ALTER TABLE products_search ADD COLUMN eu_fuel VARCHAR(1) CHECK (eu_fuel IN ('A','B','C','D','E'));
ALTER TABLE products_search ADD COLUMN eu_wet VARCHAR(1) CHECK (eu_wet IN ('A','B','C','D','E'));
ALTER TABLE products_search ADD COLUMN eu_noise_db INTEGER;
ALTER TABLE products_search ADD COLUMN eu_noise_class VARCHAR(1) CHECK (eu_noise_class IN ('A','B','C'));
```

### Phase 2: Technical Specs
Add to `products_search`:
```sql
-- Tires
ALTER TABLE products_search ADD COLUMN tire_width_mm INTEGER;
ALTER TABLE products_search ADD COLUMN aspect_ratio INTEGER;
ALTER TABLE products_search ADD COLUMN rim_diameter_in NUMERIC;
ALTER TABLE products_search ADD COLUMN load_index INTEGER;
ALTER TABLE products_search ADD COLUMN speed_rating VARCHAR(3);

-- Rims
ALTER TABLE products_search ADD COLUMN cb_mm NUMERIC;
ALTER TABLE products_search ADD COLUMN material VARCHAR(50);
ALTER TABLE products_search ADD COLUMN weight_kg NUMERIC;
```

### Phase 3: Reviews & Ratings
Create new table:
```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY,
  variant_id TEXT REFERENCES products_search(variant_id),
  user_id UUID,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 4: Vehicle Compatibility
Create new table:
```sql
CREATE TABLE product_vehicle_compatibility (
  variant_id TEXT REFERENCES products_search(variant_id),
  make VARCHAR(50),
  model VARCHAR(100),
  year_from INTEGER,
  year_to INTEGER,
  PRIMARY KEY (variant_id, make, model, year_from)
);
```

---

## QUERY EXAMPLES

### Fetch Tire for Card
```typescript
const { data } = await supabase
  .from('products_search')
  .select(`
    variant_id, brand, brand_display_name, model, size_string,
    season, studded, runflat, xl_reinforced,
    price, currency, in_stock, stock_qty,
    best_image_url, card_title, subtitle
  `)
  .eq('product_type', 'tire')
  .eq('variant_id', variantId)
  .single();
```

### Fetch Tire for PDP with CMS
```typescript
// Step 1: Get product data
const { data: product } = await supabase
  .from('products_search')
  .select('*')
  .eq('variant_id', variantId)
  .single();

// Step 2: Get CMS overrides
const { data: cms } = await supabase
  .from('product_cms')
  .select('*')
  .eq('variant_id', variantId)
  .maybeSingle();

// Step 3: Merge
const pdpData = { ...product, cms };
```

---

**END OF MAPPING DOCUMENT**
