# Vercel Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] Created `/vercel.json` with:
  - SPA routing configuration
  - Service worker headers
  - Manifest headers
  - Icon caching rules
  
- [x] Created `/package.json` with:
  - All dependencies
  - Build scripts
  - Correct version numbers

- [x] Created `/tsconfig.json` for TypeScript compilation

- [x] Created `.gitignore` to exclude:
  - `node_modules`
  - `build/`
  - `.env` files
  - `.vercel/`

- [x] Updated `/public/sw.js` to use SVG icon (`/icons/app-icon.svg`)

- [x] Static PWA assets in place:
  - `/public/manifest.webmanifest`
  - `/public/sw.js`
  - `/public/icons/app-icon.svg`

- [x] No dynamic manifest/icon code in `/main.tsx`

## 🚀 Deployment Steps

### 1. Push to Git Repository

```bash
git init
git add .
git commit -m "Initial commit - Vercel ready"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your repository
3. Configure environment variables (see below)
4. Click Deploy

**Option B: Via Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Add other environment variables as needed:
# VITE_PAYTRAIL_MERCHANT_ID=...
# VITE_PAYTRAIL_MERCHANT_SECRET=...
```

**Important**: All environment variables for the frontend must be prefixed with `VITE_`

### 4. Verify Deployment

After deployment, check:

- [ ] Build completed successfully
- [ ] Site loads at your Vercel URL
- [ ] All routes work (/, /cms, /pwa/cms, etc.)
- [ ] Service worker registers (check DevTools → Application → Service Workers)
- [ ] Manifest loads (check DevTools → Application → Manifest)
- [ ] Icons display correctly
- [ ] "Add to Home Screen" works on iPhone
- [ ] Push notifications permission can be requested

### 5. Test PWA Installation

**On iPhone:**
1. Open Safari
2. Navigate to `https://your-domain.vercel.app/pwa/cms`
3. Tap Share button
4. Tap "Add to Home Screen"
5. Verify icon appears
6. Open installed app
7. Verify it works offline (after first load)

**On Android:**
1. Open Chrome
2. Navigate to `https://your-domain.vercel.app/pwa/cms`
3. Look for "Install app" prompt
4. Install and test

## ⚠️ Known Limitations (Figma Make)

These items **cannot** be configured in Figma Make and **require** Vercel:

- ❌ Service worker headers (`Content-Type`, `Service-Worker-Allowed`)
- ❌ Manifest MIME type headers
- ❌ Environment variables for production
- ❌ Custom caching rules
- ❌ SPA routing configuration
- ❌ SSL certificates for custom domains
- ❌ Production build optimization

**Solution**: Deploy to Vercel for production, use Figma Make for design iteration only.

## 🔧 Post-Deployment

### Custom Domain

1. Vercel Dashboard → Settings → Domains
2. Add domain: `mitraauto.fi`
3. Update DNS records:
   ```
   A record: @  → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-60 minutes)
5. SSL certificate auto-provisions

### Monitoring

- Check Vercel Analytics for traffic
- Monitor Vercel Logs for errors
- Set up Vercel Alerts for build failures

### Continuous Deployment

- Every push to `main` branch auto-deploys to production
- Pull requests create preview deployments
- Rollback available in Vercel Dashboard

## 🐛 Troubleshooting

### Build Fails

Check Vercel build logs for:
- Missing dependencies
- TypeScript errors
- Environment variable issues

**Fix**: Add missing deps to `package.json`, fix TypeScript errors locally first

### Service Worker Not Registering

Check browser console:
```
Failed to register service worker: TypeError: Failed to register a ServiceWorker
```

**Fix**: Verify `/sw.js` exists in build output, check headers with:
```bash
curl -I https://your-domain.vercel.app/sw.js
```

### Manifest Not Loading

Check browser console:
```
Manifest: Line: 1, column: 1, Unexpected token.
```

**Fix**: Verify JSON syntax in `/public/manifest.webmanifest`

### Routes Return 404

**Fix**: Ensure `vercel.json` has correct rewrite rules:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vite.dev)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## ✨ Success Criteria

When all of these are true, your deployment is successful:

✅ Build completes without errors  
✅ All routes accessible (no 404s)  
✅ Service worker registered  
✅ Manifest loaded  
✅ Icons displayed  
✅ PWA installable on iPhone  
✅ Push notifications work  
✅ Offline mode functional  
✅ SSL certificate active  
✅ Custom domain configured (optional)  

---

**Current Status**: ✅ **Ready for Vercel Deployment**

All configuration files are in place. Follow the deployment steps above to go live.
