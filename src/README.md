# Mitra Auto

**Luotettavaa autopalvelua vuodesta 1985** | *Reliable automotive service since 1985*

A complete responsive website for Mitra Auto, a Finnish automotive service and tire retailer.

## Overview

Mitra Auto is a modern, bilingual (Finnish/English) e-commerce and service booking platform built with cutting-edge web technologies. The website features a clean Apple-inspired aesthetic with minimal white/black color schemes, generous white space, and the distinctive Mitra Auto orange (#FF6B35) brand color.

## Features

### 🛒 E-Commerce
- **Product Catalog**: Dual-page catalog for Tires and Rims with advanced filtering
- **Dark Minimalism Design**: Glassmorphism effects, subtle neon-blue highlights, and balanced geometric layouts
- **Shopping Cart**: Full cart system with CartContext, CartDrawer, and persistent storage
- **Checkout Flow**: Complete checkout with Paytrail payment integration
- **Product Detail Pages**: Enhanced PDP with image previews, zoom, and detailed specifications

### 📅 Service Booking
- **Online Booking**: Multi-step booking modal for tire changes, storage, and services
- **Time Slot Selection**: Interactive calendar with available time slots
- **Tire Hotel**: Seasonal tire storage service management
- **Emergency Tow (Rescue 24/7)**: 24/7 emergency roadside assistance booking

### 🔐 Authentication
- **Role-Based Access**: Customer and admin authentication
- **User Profiles**: Account management and order history
- **Secure Sessions**: JWT-based authentication with Supabase

### 🌍 Internationalization
- **Bilingual Support**: Full Finnish and English translations
- **Language Toggle**: Seamless language switching throughout the site
- **Locale-Aware**: Currency, date, and number formatting based on locale

### ♿ Accessibility
- **WCAG AA Compliance**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Friendly**: Semantic HTML and ARIA labels
- **High Contrast**: Readable color schemes in both light and dark modes

### 💳 Payment Integration
- **Paytrail Gateway**: Secure Finnish payment provider integration
- **Multiple Payment Methods**: Cards, bank transfers, mobile payments
- **Order Management**: Complete order tracking and history
- **VAT Handling**: Automated 25.5% Finnish VAT calculations

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Enhanced mobile interactions
- **Progressive Enhancement**: Works on all modern browsers
- **Performance Optimized**: Fast loading and smooth animations

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Motion (Framer Motion)** - Smooth animations
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Edge Functions (Deno)
  - Storage
- **Hono** - Web server framework
- **Key-Value Store** - Simple data persistence

### External APIs
- **Paytrail** - Payment processing
- **RD API** - Tire and rim product data
- **VT Feed** - Vehicle and tire specifications

## Project Structure

```
├── App.tsx                    # Main application component
├── main.tsx                   # Application entry point
├── index.html                 # HTML template
├── components/                # React components
│   ├── catalog/              # Product catalog components
│   ├── legal/                # Legal document versions
│   ├── ui/                   # shadcn/ui components
│   ├── BookingModal.tsx      # Service booking system
│   ├── CartContext.tsx       # Shopping cart state
│   ├── CheckoutPage.tsx      # Checkout flow
│   └── ...                   # Other components
├── lib/                      # Utility libraries
│   ├── paytrailClient.ts     # Payment API client
│   └── paytrailContract.ts   # Payment contract types
├── styles/                   # Global styles
│   └── globals.css           # Tailwind and custom CSS
├── supabase/                 # Backend functions
│   └── functions/
│       └── server/           # Edge function server
└── utils/                    # Utility functions
    └── supabase/             # Supabase helpers
```

## Configuration

### Environment Variables

The application requires the following environment variables:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Paytrail
PAYTRAIL_MERCHANT_ID=your_merchant_id
PAYTRAIL_MERCHANT_SECRET=your_merchant_secret
PAYTRAIL_API_BASE=https://services.paytrail.com
PAYTRAIL_ENVIRONMENT=test

# Product Data APIs
RD_BASE_URL=your_rd_api_url
RD_API_KEY=your_rd_api_key
VT_FEED_URL=your_vt_feed_url

# App Configuration
VITE_APP_URL=https://www.mitra-auto.fi
```

### Application Config

Centralized configuration is available in `/components/appConfig.ts`:
- API endpoints
- Payment settings
- Brand colors and styling
- Feature flags
- Business settings (VAT, currency, contact info)

## Legal Compliance

### GDPR Compliance
- **Article 13 Compliance**: Full transparency in data collection
- **Data Protection**: Secure handling of personal data
- **User Rights**: Easy access, correction, and deletion of data
- **Cookie Consent**: Compliant cookie management

### Finnish Regulations
- **VAT**: 25.5% (Arvonlisävero)
- **Consumer Protection**: Aligned with Finnish consumer law
- **Trade Marks Act**: Proper trademark references
- **Data Retention**: 10-year legal document retention

### Version History
Dynamic version history system for:
- Privacy Policy
- Terms and Conditions
- Cookie Policy
- Legal notices

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Key Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

The application is designed to be deployed on modern hosting platforms:

- **Frontend**: Vercel, Netlify, or similar
- **Backend**: Supabase (pre-configured)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage

## Testing

### Paytrail Integration Testing

See `/PAYTRAIL_TESTING_GUIDE.md` for detailed testing instructions.

Key test scenarios:
1. Cart workflow (add to cart → checkout)
2. Payment creation (form validation → API call)
3. Payment redirect (Paytrail hosted page)
4. Success/cancel flows (return URLs)
5. Error handling (network issues, API errors)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Lighthouse Score**: 90+ across all metrics
- **Core Web Vitals**: Optimized
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Lazy loading and responsive images

## Accessibility

- **WCAG AA**: Compliant
- **Keyboard Navigation**: Full support
- **Screen Readers**: NVDA, JAWS, VoiceOver compatible
- **Color Contrast**: Meets AAA standards where possible

## Contributing

This is a production application for Mitra Auto. For internal development:

1. Follow the existing code style
2. Maintain TypeScript type safety
3. Ensure WCAG AA compliance
4. Test on multiple devices
5. Update documentation

## License

Proprietary - © 2025 Mitra Auto. All rights reserved.

## Support

For technical support or questions:
- **Email**: dev@mitra-auto.fi
- **Documentation**: See `/docs` and individual `.md` files

## Changelog

See individual documentation files:
- `/PAYTRAIL_INTEGRATION_COMPLETE.md` - Payment integration
- `/PDP_REDESIGN_SUMMARY.md` - Product page updates
- `/BOOKING_MODAL_DOCUMENTATION.md` - Booking system
- `/CART_INTEGRATION_FIX.md` - Shopping cart improvements

---

**Built with ❤️ for Mitra Auto** | Luotettavaa autopalvelua vuodesta 1985
