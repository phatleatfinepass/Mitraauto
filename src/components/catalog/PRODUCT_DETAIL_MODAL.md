# Product Detail Modal Documentation

## Overview
A premium, immersive Product Detail Modal for tires and rims following Apple x Porsche aesthetic with golden ratio layout, glassmorphism, and full bilingual support (Finnish/English).

## Component Location
`/components/catalog/ProductDetailModal.tsx`

## Features

### 🎨 Design
- **Golden Ratio Layout**: 55% image area / 45% product details on desktop
- **Responsive**: Two-column on desktop, single stacked column on mobile
- **Glassmorphism**: Blurred backdrop with subtle shadows
- **24px Border Radius**: Consistent with card design
- **Theme Support**: Full dark/light mode integration

### 📸 Left Panel - Product Visual (55%)
- **16:9 Aspect Ratio**: Consistent image container
- **Image Carousel**: Support for multiple product images with prev/next controls
- **Smooth Animations**: Fade and scale transitions between images
- **Image Indicators**: Dot navigation showing current image
- **Floating Badge**: EU Label badge for tires (top-left)
- **Gradient Background**: Subtle vignette effect to make product pop

### 📋 Right Panel - Product Details (45%)

#### 1. Product Header
- Brand name (uppercase, small)
- Model name (large display text)
- Optional subtitle/description line

#### 2. Size & Spec Badges
**For Tires:**
- Full tire size (205/55 R16 91V)
- Season badge (Summer/Winter/All Season)
- Feature tags: XL, Runflat, Studded
- Color-coded by category (blue for season, orange for XL, etc.)

**For Rims:**
- Rim size (8.0J × 18")
- ET offset (ET35)
- PCD pattern (5x112)
- CB measurement (CB 66.6mm)
- Material (Aluminum/Steel)
- Color (if available)

#### 3. EU Label Section (Tires Only)
- **Three Metrics Grid**: 1:1 aspect ratio boxes
  - Fuel Efficiency (A-G rating)
  - Wet Grip (A-G rating)
  - Noise Level (dB measurement)
- Icon-based display
- Tooltip-ready design

#### 4. Description & Highlights
- Product description paragraph
- Bullet-point highlights (3-4 key features)
- Orange accent bullets for visual consistency

#### 5. Stock & Supplier Info
- Stock status (In Stock / Out of Stock) with color indicators
- Delivery estimate (1-2 business days)
- Supplier name display
- Icon-based layout (Package, Truck icons)

#### 6. Sticky Footer - Pricing & Actions
- **Large Price Display**: €159.00 format
- **Price Details**: "per each" and "incl. VAT" labels
- **Quantity Selector**: +/- buttons with min 1, max 99
- **Total Price**: Shows when quantity > 1
- **Add to Cart Button**: 
  - Orange background (#FF6B35)
  - Shopping cart icon
  - Disabled state for out-of-stock
  - Hover shadow effects
- **Book Installation Button**: 
  - Secondary style
  - Opens booking modal

## Usage Example

```tsx
import { ProductDetailModal } from './components/catalog/ProductDetailModal';

const [selectedProduct, setSelectedProduct] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// In TireCard or RimCard
<TireCard
  product={product}
  onClick={() => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }}
/>

// Modal
<ProductDetailModal
  product={selectedProduct}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onAddToCart={(product, quantity) => {
    console.log('Add to cart:', product, quantity);
  }}
  onBookInstallation={(product) => {
    console.log('Book installation:', product);
  }}
/>
```

## Integration with Cards

Both `TireCard` and `RimCard` now support an `onClick` prop:

```tsx
interface TireCardProps {
  product: TireProduct;
  index?: number;
  onClick?: () => void;  // NEW
}
```

When clicked, cards trigger the modal to open with full product details.

## Responsive Behavior

### Desktop (≥1024px)
- Modal: 90vw width, 90vh max height
- Two-column layout: 55% image / 45% details
- Centered on screen
- Scrollable content area
- Click outside or ESC to close

### Mobile (<1024px)
- Full-screen slide-up animation
- Single column: Image on top, stacked content
- Sticky footer with pricing and actions
- Swipe or tap X to close

## Keyboard & Accessibility
- ESC key closes modal
- Focus trap within modal
- ARIA labels for screen readers
- Keyboard navigation for carousel
- Disabled state management

## Animation Details
- **Modal Open**: 0.3s ease-in-out fade + scale
- **Image Carousel**: 0.3s opacity fade + scale transition
- **Quantity Buttons**: Instant feedback
- **Hover Effects**: Subtle shadow increases

## Theme Integration
All colors adapt to dark/light theme:
- Background: `#1C1C1E` (dark) / `white` (light)
- Text: `white` (dark) / `#101828` (light)
- Borders: `white/10` (dark) / `gray-200` (light)
- Badges: Theme-aware background and border colors
- Orange accent (#FF6B35) remains constant

## Data Structure

### Tire Product
```typescript
{
  type: 'tire',
  id: string,
  brand: string,
  model: string,
  subtitle?: string,
  tire_width: number,
  aspect_ratio: number,
  construction: string,
  rim_diameter: number,
  load_index?: number,
  speed_rating?: string,
  season: string,
  extra_load?: boolean,
  runflat?: boolean,
  studded?: boolean,
  fuel_efficiency?: string,
  wet_grip?: string,
  noise_level?: number,
  best_price_eur?: number,
  best_image_url: string,
  images?: string[],
  description?: string,
  highlights?: string[],
  in_stock: boolean,
  supplier_name?: string,
  delivery_days?: string,
}
```

### Rim Product
```typescript
{
  type: 'rim',
  id: string,
  brand: string,
  model: string,
  subtitle?: string,
  rim_width?: number,
  rim_diameter?: number,
  pcd?: string,
  et_offset?: number,
  cb?: number,
  color?: string,
  material?: string,
  best_price_eur?: number,
  best_image_url: string,
  images?: string[],
  description?: string,
  highlights?: string[],
  in_stock: boolean,
  supplier_name?: string,
  delivery_days?: string,
}
```

## Next Steps
- Connect to shopping cart functionality
- Integrate with BookingModal for installation
- Add related products carousel (future)
- Add breadcrumb navigation (if full page)
- CMS integration for product images and descriptions
