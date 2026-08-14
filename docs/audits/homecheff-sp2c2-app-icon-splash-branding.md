# SP.2C.2 — HomeCheff app icon, PWA & splash branding

**Date:** 2026-08-14  
**Repo:** `homecheff-app`  
**Architecture:** [homecheff-app-branding.md](../architecture/homecheff-app-branding.md)

## Forensic inventory (pre-change)

| Finding | Detail |
|---------|--------|
| Platform | Web + installable PWA + Capacitor Android; **no iOS native project** |
| Manifest | `public/manifest.json` (no `manifest.webmanifest`) |
| Corrupt / missing | Production `favicon-16.png` returned **HTML** (file absent from `public/`) — same class as Growth SP.2C.1 |
| Maskable misuse | `icon-512.png` listed as both `any` and `maskable` |
| Artificial delay | Capacitor `launchShowDuration: 3250` |
| Certified mark | `icon-192.png` SHA-256 `7f84f4c4…ad37de` matches Production `?v=hc8` |
| Higher-res master | `homecheff-globeman.png` 886×886 (same family; not a byte-identical upscale of 192) |

## Changes

1. Added valid `public/favicon-16.png`; refreshed 32/48 + `favicon.ico` from certified square.
2. Added dedicated `public/icon-maskable-512.png` (white plate, ~14% pad).
3. Manifest: separate maskable entry; icon URLs `?v=hc8a2`.
4. Layout: explicit 16/32 PNG favicon links + apple-touch with `FAVICON_ASSET_Q`.
5. `CANONICAL_LOGO_VERSION` → `hc8a2`; paths for `favicon16` / `maskable512`.
6. Capacitor splash duration → `0` (no artificial wait).
7. Android mipmap launchers re-synced from certified square.
8. `Logo` Next/Image: plain path (no `?v=` query — avoids Image Optimizer 400).
9. `npm run validate-app-brand-icons` deterministic checks.
10. Generator script uses repo-local primary; preserves `icon-192` when present.

## Studio / Growth app-icon audit (document only)

| Product | Installable PWA in-repo | Notes |
|---------|-------------------------|-------|
| Growth (`homecheff-leads`) | No `manifest.json` found in quick audit | Brand chrome uses local `/brand/homecheff-mark.png` (SP.2C/SP.2C.1) |
| Studio (`homecheff-motion`) | No `manifest.json` found in quick audit | Local mark for ecosystem Ontdek |

## Auth / product regression

Scope limited to brand/PWA/native splash assets and related metadata. No SSO / feed / marketplace logic changed.

## Human visual gates (APP-1…APP-7)

Remain for operator confirmation after Production deploy (hard refresh / reinstall PWA where icons are cached).

## Cache note

Deployment alone does not refresh already-installed PWA icons on every device. Users may need reinstall or OS icon cache clear; HTML/manifest version query helps new installs and tab favicons.
