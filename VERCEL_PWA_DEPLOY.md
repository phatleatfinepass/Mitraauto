# Vercel PWA Deploy

This repo is the deployment source for the mobile ops PWA.

## Intended split

- `www.mitra-auto.fi`: main website, still managed separately
- Vercel app: dedicated PWA deployment

Recommended custom domain:

- `pwa.mitra-auto.fi`

## Required Vercel environment variables

- `VITE_DEPLOY_TARGET=pwa`
- `VITE_PUBLIC_SITE_URL=https://www.mitra-auto.fi`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

If booking push is enabled through Supabase functions, also keep the Supabase function secrets configured in Supabase. Those are not Vercel variables.

## Route behavior in PWA deploy mode

- `/` -> Rescue
- `/booking` -> Booking
- `/order` -> Order
- `/tools` -> Future Tools

Legacy aliases kept for transition:

- `/pwa/cms`
- `/pwa/cms/booking`
- `/pwa/cms/order`
- `/pwa/cms/tools`

## Verify after deploy

Check these URLs directly:

- `/manifest.webmanifest`
- `/sw.js`
- `/icons/app-icon.svg`

Then check the app:

- install from iPhone Safari
- service worker becomes ready
- push diagnostics show local subscription saved
- booking push works while the app is closed
