# Mitra Auto - Bilingual Automotive Service Website

A modern, bilingual (Finnish/English) automotive service website built with React, TypeScript, Tailwind CSS, and Supabase. Features a full-featured PWA for mobile operations management.

## 🚀 Features

### Public Website
- **Bilingual Support**: Finnish (canonical) and English (mirror) routes
- **Service Catalog**: Car services, tire changes, diagnostics, car wash
- **Product Catalog**: Tire and rim browsing with detailed specifications
- **Booking System**: Multi-step booking flow with time slot selection
- **Emergency Services**: 24/7 roadside assistance request system
- **Legal Pages**: Privacy policy, terms of service with version history
- **SEO Optimized**: Helsinki-focused, service-first architecture

### Admin CMS
- **Product Management**: Single `/cms` route with hash-based tabs
- **Tire & Rim Catalogs**: Full CRUD operations with EU label overrides
- **Order Management**: View and process customer orders
- **Schedule Management**: Admin booking calendar and availability
- **Authentication**: Supabase-powered admin login

### PWA Mobile App (`/pwa/cms`)
- **Installable**: Add to Home Screen on iPhone and Android
- **Offline Support**: Service worker caching
- **Push Notifications**: Web push for booking updates
- **Mobile Optimized**: Touch-friendly interface for field operations

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI components
- **Build Tool**: Vite 6
- **Backend**: Supabase (Database, Auth, Storage, RPC)
- **Routing**: Client-side routing with hash navigation
- **Payments**: Paytrail integration (Finnish payment gateway)
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mitra-auto-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## 🚢 Deployment to Vercel

This project is optimized for Vercel deployment with full PWA support.

### Quick Deploy

1. **Push to Git**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your repository
   - Add environment variables (see `.env.example`)
   - Deploy

3. **Verify PWA**
   - Visit `https://your-domain.vercel.app/pwa/cms`
   - Test "Add to Home Screen" on iPhone

**For detailed deployment instructions, see:**
- [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md) - Complete deployment guide
- [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist

## 📁 Project Structure

```
/
├── components/           # React components
│   ├── admin/           # Admin schedule and management
│   ├── catalog/         # Product catalog (tires, rims)
│   ├── cms/             # CMS pages and tools
│   ├── cms-pwa/         # PWA mobile app components
│   ├── legal/           # Privacy policy, terms versions
│   └── ui/              # Reusable UI components (Radix)
├── lib/                 # Shared libraries
│   ├── supabase/        # Supabase utilities
│   └── types/           # TypeScript type definitions
├── utils/               # Utility functions
│   ├── supabase/        # Supabase client setup
│   └── *.ts             # Various helpers
├── public/              # Static assets
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # App icons
├── supabase/            # Supabase backend
│   └── functions/       # Edge functions (Hono server)
├── styles/              # Global CSS
├── App.tsx              # Main application component
├── CmsPwaApp.tsx        # PWA mobile app entry
├── main.tsx             # Application entry point
├── vite.config.ts       # Vite configuration
└── vercel.json          # Vercel deployment config
```

## 🔑 Key Routes

### Public Routes
- `/` - Home page (Finnish)
- `/en` - Home page (English)
- `/yhteystiedot` - Contact page (Finnish)
- `/en/contact` - Contact page (English)
- `/catalog/tires` - Tire catalog
- `/catalog/rims` - Rim catalog
- `/privacy` - Privacy policy
- `/terms` - Terms of service

### Admin Routes
- `/admin/login` - Admin login
- `/admin/schedule` - Booking schedule management
- `/cms` - CMS dashboard
  - `#tires` - Tire management
  - `#rims` - Rim management
  - `#orders` - Order management

### PWA Routes
- `/pwa/cms` - Mobile PWA app (installable)

## 🔧 Configuration Files

### `vercel.json`
- SPA routing configuration
- Service worker headers
- Manifest headers
- Icon caching rules

### `vite.config.ts`
- Build settings (output: `build/`)
- Public directory (`public/`)
- React + Tailwind plugins
- Figma asset resolver

### `package.json`
- All dependencies
- Build scripts
- Project metadata

### `tsconfig.json`
- TypeScript compiler options
- Path mappings
- Type checking rules

## 🗄️ Supabase Schema

### Tables
- `products_search` (view) - Read-only product catalog
- `product_cms` (table) - CMS product management
- `kv_store_bdaaf773` - Key-value storage for misc data

### RPC Functions
- Emergency service requests
- Product search and filtering
- Order processing

### Authentication
- Email/password auth
- Admin role-based access control

## 🔐 Environment Variables

Required for deployment:

```bash
# Supabase
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY

# Payments (optional)
VITE_PAYTRAIL_MERCHANT_ID
VITE_PAYTRAIL_MERCHANT_SECRET

# Push Notifications (optional)
VITE_WEB_PUSH_VAPID_PUBLIC_KEY
VITE_WEB_PUSH_VAPID_PRIVATE_KEY
```

See `.env.example` for complete list.

## 📱 PWA Features

### Service Worker (`/public/sw.js`)
- Install and activate lifecycle
- Push notification handling
- Notification click actions
- App badge updates

### Manifest (`/public/manifest.webmanifest`)
- App name and description
- Start URL: `/pwa/cms`
- Display: standalone
- Theme colors
- Icon configuration

### Icons (`/public/icons/`)
- `app-icon.svg` - Scalable app icon (works on all devices)

## 🧪 Testing

### Local Testing
```bash
npm run dev
# Test at http://localhost:3000
```

### Production Build Testing
```bash
npm run build
npm run preview
# Test at http://localhost:4173
```

### PWA Testing
1. Deploy to Vercel (service workers require HTTPS)
2. Test on real device:
   - iPhone: Safari → Share → Add to Home Screen
   - Android: Chrome → Install app prompt

## 📚 Documentation

- [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md) - Deployment guide
- [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) - Deployment steps
- [`guidelines/Guidelines.md`](./guidelines/Guidelines.md) - Design guidelines
- [`components/catalog/README.md`](./components/catalog/README.md) - Catalog docs
- [`components/admin/README.md`](./components/admin/README.md) - Admin docs

## 🐛 Troubleshooting

### Service Worker Issues
- Service workers require HTTPS (use Vercel for testing)
- Check browser DevTools → Application → Service Workers
- Verify `/sw.js` returns correct headers

### Build Errors
- Run `npm install` to ensure dependencies are installed
- Check TypeScript errors: `npm run type-check`
- Clear cache: `rm -rf node_modules build && npm install`

### Routing Issues
- SPA routing requires Vercel's rewrite rules (see `vercel.json`)
- Ensure all routes redirect to `index.html`

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test locally
4. Submit pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For deployment or configuration issues, see:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vite.dev)
- [Supabase Documentation](https://supabase.com/docs)

---

**Built with ❤️ for Mitra Auto**
