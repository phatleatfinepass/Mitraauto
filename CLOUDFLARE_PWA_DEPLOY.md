## Cloudflare Pages deploy for `pwa.mitra-auto.fi`

This repo stays aligned with Figma Make for product and design work.
Cloudflare Pages is only the runtime host for the mobile PWA.

### Canonical PWA routes

- `/cms`
- `/cms/booking`
- `/cms/order`
- `/cms/tools`

The PWA host should be:

- `https://pwa.mitra-auto.fi/cms`

The main marketing site stays separate.

### Branch model

- Figma Make remains the editing source
- mirror those changes into this repo
- keep Cloudflare-specific glue minimal
- point Cloudflare Pages at the dedicated PWA branch only

### Cloudflare Pages settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `build`

### Required environment variables

- `VITE_DEPLOY_TARGET=pwa`
- `VITE_PUBLIC_SITE_URL=https://www.mitra-auto.fi`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

### Files that must exist in the build

- `build/sw.js`
- `build/manifest.webmanifest`
- `build/icons/app-icon.svg`
- `build/_redirects`
- `build/_headers`

### Cloudflare checks after deploy

Verify these URLs directly on the deployed host:

- `/manifest.webmanifest`
- `/sw.js`
- `/icons/app-icon.svg`
- `/cms`
- `/cms/booking`
- `/cms/order`
- `/cms/tools`

Expected:

- `manifest.webmanifest` returns JSON
- `sw.js` returns JavaScript
- icon URL returns the icon file
- `/cms*` routes load the app and do not fall through to HTML 404

### iPhone verification

1. Open `https://pwa.mitra-auto.fi/cms` in Safari.
2. Add to Home Screen.
3. Open the installed app.
4. In push diagnostics, verify:
   - `Permission: granted`
   - `Service worker: ready`
   - `Local subscription: yes`
   - `Saved to backend: yes`
5. Create a booking and verify badge and notifications.

### Notes

- The current icon is SVG-based. That is acceptable for Cloudflare validation.
- Apple-specific PNG icons can be added later if install behavior still needs refinement.
- Keep product UI changes in Figma Make first. Use this repo as the mirrored deploy bridge.
