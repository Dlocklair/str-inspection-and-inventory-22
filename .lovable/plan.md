

# Fix PWA Build Error + Google OAuth Credentials Guide

## Build Error Fix

The error is because the main JS bundle (3 MB) exceeds the default 2 MB service worker cache limit. One line needs to be added to the PWA config.

**`vite.config.ts`** -- Add `maximumFileSizeToCacheInBytes` to the workbox config:

```ts
workbox: {
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
  navigateFallbackDenylist: [/^\/~oauth/, /^\/auth\/v1/],
  globPatterns: ['**/*.{js,css,html,ico,png,svg}']
}
```

---

## Where to Find Your Google Client ID and Secret

Since you already have Google OAuth set up for another app, here's where to find the credentials:

1. Go to **[Google Cloud Console](https://console.cloud.google.com)**
2. Select the project where your existing OAuth is configured (top-left project selector)
3. Navigate to **APIs and Services** > **Credentials** (left sidebar)
4. Under **OAuth 2.0 Client IDs**, click on your existing Web Application credential
5. You'll see **Client ID** and **Client Secret** on that page

**Before copying them to Supabase, add these URLs to the existing credential:**

- Under **Authorized JavaScript origins**, click "Add URI" and add:
  `https://str-inspection-and-inventory-22.lovable.app`

- Under **Authorized redirect URIs**, click "Add URI" and add:
  `https://ckgjsgmsbszplcivxfls.supabase.co/auth/v1/callback`

- Click **Save**

**Then paste them into Supabase:**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/ckgjsgmsbszplcivxfls/auth/providers)
2. Expand the **Google** provider
3. Toggle it **Enabled**
4. Paste the **Client ID** and **Client Secret**
5. Click **Save**

