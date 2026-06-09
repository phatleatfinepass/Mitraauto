# MitraAuto Product Catalog System

A luxury automotive e-commerce catalog system featuring dual-mode product browsing for Tires and Rims with Apple-level clarity and Porsche-grade precision.

## Design Language

- **Background**: Dark gradient (#0B0D10 → #161A22)
- **Accent Color**: Neon blue (#0B6BFF)
- **Typography**: Inter / SF Pro Display
- **Components**: Glassmorphic panels with blur + thin neon borders
- **Shadows**: Soft blue glow `0 0 24px rgba(11,107,255,0.25)`

## Components

### CatalogPage
Main page component with mode switching between Tires and Rims.

**Features:**
- Tabbed navigation (Tires/Rims)
- Responsive grid layout (4-col desktop, 2-col tablet, 1-col mobile)
- Pagination controls
- Loading states
- Empty state handling
- Supabase integration

### TireFilters
Tire-specific filter panel with:
- Width (155-355)
- Aspect Ratio (30-85)
- Diameter (12-24)
- Season (Summer/Winter/All)
- Advanced toggles (RunFlat, XL, Studded, In-Stock)
- Sort options (Price, Wet Grip, Noise)
- Free-text search

### RimFilters
Rim-specific filter panel with:
- Diameter (13-24)
- Width (5-12)
- PCD (bolt pattern)
- ET (offset)
- CB (center bore)
- Material (Alloy/Steel)
- Color/Finish selector
- Vehicle selector (Make/Model/Year)

### TireCard
Product card for tires displaying:
- Product image with hover zoom
- Brand + Model
- Size text (e.g., "225/45 R17 91W")
- Season badge
- Feature badges (RunFlat, XL, Studded)
- EU ratings (Fuel, Wet Grip, Noise)
- Price with VAT
- Stock badge
- Add to cart button with glow effect

### RimCard
Product card for rims displaying:
- Product image with hover rotation
- Brand + Model
- Size specification (e.g., "8×18 ET35 5×112")
- Material badge
- Color/Finish
- Specifications grid (CB, etc.)
- Price with VAT
- Stock badge
- Quick view button
- Add to cart button

### StockBadge
Stock indicator component:
- Green badge for "In Stock"
- Gray badge for "Out of Stock"
- Bilingual support

### EURating
EU tire label display component:
- Fuel efficiency rating (A-E)
- Wet grip rating (A-E)
- Noise level (dB)
- Color-coded ratings

## Data Integration

The catalog fetches list data through public Supabase RPCs backed by the published catalog layer:

- Tires: `catalog_list_tires_v1` and `catalog_count_tires_v1`
- Rims: `catalog_list_rims_v1` and `catalog_count_rims_v1`
- Published fallback: `webshop_items`

Do not reintroduce storefront reads from raw supplier tables or the old `products_search` view.

The active list/detail shape includes these fields:

### Common Fields
- `id` - Product ID
- `brand` - Brand name
- `model` - Model name
- `product_type` - 'tire' or 'rim'
- `best_price_eur` - Price in EUR
- `best_image_url` - Product image URL
- `in_stock` - Stock availability

### Tire-Specific Fields
- `size_text` - Size string (e.g., "225/45 R17")
- `width` - Tire width
- `aspect_ratio` - Aspect ratio
- `diameter` - Rim diameter
- `eu_fuel` - EU fuel rating
- `eu_wet` - EU wet grip rating
- `eu_noise` - EU noise level (dB)
- `season` - summer/winter/all_season
- `runflat` - RunFlat tire
- `xl` - Extra Load
- `studded` - Studded tire

### Rim-Specific Fields
- `rim_width` - Rim width
- `rim_diameter` - Rim diameter
- `pcd` - Bolt pattern (e.g., "5×112")
- `et_offset` - ET offset
- `cb` - Center bore (mm)
- `color` - Color/finish
- `material` - alloy/steel
- `bolts_included` - Bolts included

## Responsive Behavior

- **Desktop (1280px+)**: 4-column grid
- **Tablet (768px-1279px)**: 2-column grid
- **Mobile (<768px)**: 1-column grid
- Filter bar collapses into drawer on mobile
- Touch-optimized buttons and interactions

## Animation & Effects

- Smooth page transitions with Motion
- Card hover effects (lift + glow)
- Image zoom/rotate on hover
- Glassmorphic panels
- Glowing CTA buttons
- Loading skeletons

## Usage

Navigate to `/catalog` to access the product catalog. The page will default to showing tires, with easy switching to rims view.

```tsx
// In App.tsx
import { CatalogPage } from './components/catalog/CatalogPage';

// Add route
{currentPage === 'catalog' && <CatalogPage />}
```

## Future Enhancements

- Product detail modal (mentioned in design spec)
- Shopping cart functionality
- Wishlist/favorites
- Product comparison
- Advanced filtering (price range, brand multi-select)
- License plate lookup for tire recommendations
- Vehicle selector integration for rim compatibility
