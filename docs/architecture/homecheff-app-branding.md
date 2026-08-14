# HomeCheff App / PWA Branding (SP.2C.2)

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

## Canonical masters

| Role | Path | Dimensions | Notes |
|------|------|------------|-------|
| Full artwork master | `public/homecheff-globeman.png` (= `public/brand/homecheff-logo-primary.png`) | 886×886 | Derivation master for hero / OG |
| Certified square mark | `public/icon-192.png` | 192×192 | SHA-256 `7f84f4c479fd7bc50d62e997cd47d0356970d8748d3de13a89ab2f23eead37de` — Studio/Growth sync source |
| Large any icon | `public/icon-512.png` | 512×512 | Same artwork family |
| Maskable | `public/icon-maskable-512.png` | 512×512 | White plate + ~14% padding (safe zone) |

Do **not** invent a separate PWA/Android/iOS logo. Technical crops only.

## Derived surfaces

| Surface | Asset |
|---------|-------|
| favicon.ico | `public/favicon.ico` (16/32/48) |
| favicon 16/32/48 | `public/favicon-*.png` |
| Apple touch | `public/apple-touch-icon.png` (180×180, opaque white) |
| PWA any | `icon-192.png`, `icon-512.png` |
| PWA maskable | `icon-maskable-512.png` only |
| Android launcher | `android/.../mipmap-*/ic_launcher*.png` (synced from certified square) |
| Android 12 splash icon | `splash_a12_safe_icon` ← `icon-192.png` via `npm run sync-android-splash` |
| Native splash portrait | `public/homecheff-native-splash.png` (1080×2400) |

## Manifest

- `name` / `short_name`: **HomeCheff**
- `theme_color`: `#10b981`
- `background_color`: `#ffffff`
- `start_url`: `/`
- `display`: `standalone`
- Cache version query on icon `src`: `?v=hc8a2` (matches `CANONICAL_LOGO_VERSION`)

## Splash / startup law

- Web: no branded blocking splash (`Preloader` only warms local assets).
- Capacitor: `launchShowDuration: 0` — **no artificial delay**. OS `Theme.SplashScreen` may still show during cold start.
- Content shows when ready.

## Cache bust

Bump `CANONICAL_LOGO_VERSION` in `lib/brand/canonical-logo.ts` when replacing icon bytes. Layout favicon/apple links and manifest icon URLs use the same token.

## Validation

```bash
npm run validate-app-brand-icons
```

## Studio / Growth

Independent PWAs (if any) should use the **same** certified square mark plus product name differentiation — not a mutated chef.

## Future scope

- iOS Capacitor / native asset catalogs (not in repo today)
- Optional product-differentiated installed-app badges for Studio/Growth after audit
