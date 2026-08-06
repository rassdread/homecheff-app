# PWA & Android Review

## PWA manifest (`public/manifest.json`)

| Icon | Size | Purpose | Status |
|------|------|---------|--------|
| `/favicon-48.png` | 48×48 | any | Updated |
| `/icon-192.png` | 192×192 | any | Updated |
| `/icon-512.png` | 512×512 | any + maskable | New/updated |

Package name preserved: **`eu.homecheff.mobile`** (unchanged).

## Android native

| Asset | Source | Action |
|-------|--------|--------|
| `mipmap-*/ic_launcher.png` | Generated from approved logo + safe padding | Replaced |
| `mipmap-*/ic_launcher_foreground.png` | Adaptive foreground with 18% padding | Replaced |
| `mipmap-*/ic_launcher_round.png` | Same as launcher | Replaced |
| `drawable/splash_a12_safe_icon.png` | `public/icon-192.png` | Synced |
| `drawable*/splash.png` | `public/homecheff-native-splash.png` | Retained (portrait splash) |

## New Android build required

**Yes** — launcher icons and A12 splash icon changed. Operator must run:

```bash
npm run cap:sync
# then rebuild/sign AAB for Play Store
```

## Notification icon

FCM uses `/icon.png` (96×96) via `canonicalLogoUrl('notification')` — suitable for monochrome notification tray on Android when system tints icon.

## Maskable note

512×512 maskable uses 12–18% padding in launcher generation script to respect adaptive safe zone.
