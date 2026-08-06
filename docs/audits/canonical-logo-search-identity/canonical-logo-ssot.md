# Canonical Logo SSOT

**Source file:** `lib/brand/canonical-logo.ts`  
**Version token:** `hc8`  
**Regeneration script:** `npm run generate-canonical-logo-assets`

## Approved primary asset

| Field | Value |
|-------|-------|
| Archive path | `public/brand/homecheff-logo-primary.png` |
| Operator source | Operator-supplied JPEG (886×886 Globeman mascot) |
| Format | PNG (converted, lossless resize only) |

## Path map

| SSOT key | Public path | Purpose |
|----------|-------------|---------|
| `primary` | `/brand/homecheff-logo-primary.png` | Operator archive / regeneration source |
| `organization` | `/logo.png` | Google Organization JSON-LD logo |
| `square` | `/icon-192.png` | Navbar, footer, UI `<Logo />` |
| `square512` | `/icon-512.png` | PWA maskable / large install icon |
| `notification` | `/icon.png` | FCM, verification email header |
| `faviconIco` | `/favicon.ico` | Browser tab (16/32/48 multi-size ICO) |
| `favicon48` | `/favicon-48.png` | PWA manifest, notification badge |
| `favicon32` | `/favicon-32.png` | Optional explicit PNG favicon |
| `appleTouch` | `/apple-touch-icon.png` | iOS add-to-home-screen |
| `heroMascot` | `/homecheff-globeman.png` | Homepage hero orbit center |
| `ogBrand` | `/og-brand.png` | Default social preview brand card |

## URL helpers

```typescript
canonicalLogoPath('square')           // → '/icon-192.png'
canonicalLogoUrl('organization')      // → 'https://homecheff.eu/logo.png?v=hc8'
FAVICON_ASSET_Q                       // → '?v=hc8'
```

## Dark-background variant

Not required: approved artwork uses dark navy outlines; readable on white (Organization requirement) and on emerald nav/footer backgrounds via `object-contain` without stretching.

## Consumers wired to SSOT

- `components/Logo.tsx`
- `lib/seo/schema-builders.ts`
- `app/layout.tsx` (OG + favicon links)
- `lib/seo/buildAuthorityLandingMetadata.ts`
- `lib/verification-email-content.ts`
- `lib/notifications/notification-service.ts`
- `lib/admin/admin-broadcast-fcm.ts`
- `components/Preloader.tsx`
- `components/home/HomeHeroVisualCluster.tsx`
- `components/inspiratie/InspiratiePrintView.tsx`
- `components/delivery/DeliveryNotificationListener.tsx`
- `components/notifications/NotificationProvider.tsx`
