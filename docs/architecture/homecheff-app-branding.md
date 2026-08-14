# HomeCheff App / PWA Branding (SP.2C.2 / SP.2C.2a)

**Status:** `CANONICAL`  
**As of:** 2026-08-14  
**Repo:** `homecheff-app` · Production: https://homecheff.eu

## Platform type

| Surface | Status |
|---------|--------|
| Web | Yes |
| Installable PWA | Yes (`public/manifest.json` + service workers) |
| Capacitor Android wrapper | Yes (`capacitor.config.ts`, `android/`) |
| iOS native wrapper | **Not present** (Add to Home Screen / Safari PWA only) |
| TWA | Not present |

## Canonical hierarchy

| Role | Path | Dimensions | Notes |
|------|------|------------|-------|
| Full-resolution master | `public/homecheff-globeman.png` | 886×886 | SHA-256 `6e57431c195228d6d790bc85a8ff2a1570e65bbc14220f1901c3062adfbbbf74` |
| Archive copy (same bytes) | `public/brand/homecheff-logo-primary.png` | 886×886 | Regeneration source; not a second mark |
| Compatibility logo URL | `public/logo.png` | 886×886 | **Same bytes** as full master — Organization JSON-LD / legacy public contract |
| Square app/icon master | `public/icon-192.png` | 192×192 | SHA-256 `7f84f4c479fd7bc50d62e997cd47d0356970d8748d3de13a89ab2f23eead37de` |
| Large any icon | `public/icon-512.png` | 512×512 | Same artwork family |
| Maskable | `public/icon-maskable-512.png` | 512×512 | White plate + ~14% padding |
| OG brand card | `public/og-brand.png` | 1200×630 | Social/metadata |

Do **not** invent a separate PWA/Android/iOS logo. Technical crops only.

## Middleware / static routing (SP.2C.2a)

LEGAL-0 middleware rewrites unknown first path segments to `/hc-http-404`.

Brand and other `public/` static files must pass `isPublicStaticAssetPath()` in `lib/seo/known-root-path-segments.ts` (root `*.png`/`*.ico`/… and `/brand/*`). Without that allowlist, files that **exist on disk and in git** still return Production 404.

## Derived surfaces

| Surface | Asset |
|---------|-------|
| favicon.ico | `public/favicon.ico` (16/32/48) |
| favicon 16/32/48 | `public/favicon-*.png` |
| Apple touch | `public/apple-touch-icon.png` (180×180, opaque white) |
| PWA any | `icon-192.png`, `icon-512.png` |
| PWA maskable | `icon-maskable-512.png` only |
| Android launcher | `android/.../mipmap-*/ic_launcher*.png` |
| Native splash portrait | `public/homecheff-native-splash.png` (1080×2400) |

## Manifest

- `name` / `short_name`: **HomeCheff**
- `theme_color`: `#10b981`
- `background_color`: `#ffffff`
- Cache version query: `?v=hc8a2` (`CANONICAL_LOGO_VERSION`)

## Splash / startup law

- Web: no branded blocking splash.
- Capacitor: `launchShowDuration: 0`.
- Content shows when ready.

## Validation

```bash
npm run validate-app-brand-icons
```

## Future scope

- iOS Capacitor / native asset catalogs
- Optional Studio/Growth installable PWA differentiation
