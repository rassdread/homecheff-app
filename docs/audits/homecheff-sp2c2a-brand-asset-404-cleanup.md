# SP.2C.2a — HomeCheff brand asset 404 cleanup

**Date:** 2026-08-14  
**Repo:** `homecheff-app`  
**Architecture:** [homecheff-app-branding.md](../architecture/homecheff-app-branding.md)

## Before (Production)

| Path | Status | X-Matched-Path |
|------|--------|----------------|
| `/logo.png` | 404 HTML | `/hc-http-404` |
| `/homecheff-globeman.png` | 404 HTML | `/hc-http-404` |
| `/brand/homecheff-logo-primary.png` | 404 HTML | `/hc-http-404` |
| `/og-brand.png` | 404 HTML | `/hc-http-404` |
| `/avatar-placeholder.png` | 404 HTML | `/hc-http-404` |
| `/icon-192.png` | 200 PNG | `/icon-192.png` |

Production SHA at investigation: `c882f97c` (post–SP.2C.2 merge line).

## Root cause

Files **exist** in git under `public/` and were **committed**. They were **not** gitignored or missing from the deploy artifact.

LEGAL-0 middleware (`middleware.ts`) rewrites unknown first path segments to `/hc-http-404` via `isKnownHomecheffRootPath()`.

`ROOT_FILE_SEGMENTS` / `isPublicIconOrManifestPath` allowlisted favicons and `/icon-*` only. Brand contract paths (`logo.png`, `homecheff-globeman.png`, `og-brand.png`, `/brand/*`, `avatar-placeholder.png`) were treated as unknown SEO slugs → rewrite 404.

**Classification:** NOT DEPLOYED (served) — EXISTS in repo — blocked by middleware routing.

## Decisions

| Path | Decision |
|------|----------|
| `/logo.png` | **OPTION A** — stable compatibility alias; byte-identical to full master; Organization JSON-LD contract |
| `/homecheff-globeman.png` | **OPTION A** — restore canonical full-resolution master path (hero + docs) |
| `/og-brand.png` | Restore (same bug class; live OG metadata) |
| `/brand/*` | Restore archive path |
| `/avatar-placeholder.png` | Allowlist + replace **empty 0-byte** file with valid neutral 128×128 PNG |

## Fix

1. Export `isPublicStaticAssetPath()` from `lib/seo/known-root-path-segments.ts` (root static extensions + `/brand/*`).
2. Call it from `isKnownHomecheffRootPath` and from middleware `isPublicIconOrManifestPath` (skip CSP/404 rewrite).
3. Extend `validate-app-brand-icons` + LEGAL-0 integrity assertions.
4. Docs: hierarchy + middleware note.

`CANONICAL_LOGO_VERSION` remains `hc8a2` (install icons unchanged).

## References

- Live required: `canonicalLogoUrl('organization')` → `/logo.png` (JSON-LD)
- Live required: `canonicalLogoPath('heroMascot')` → `/homecheff-globeman.png` (homepage hero)
- Live required: `canonicalLogoUrl('ogBrand')` → `/og-brand.png`
- External contract evidence: internal SEO/JSON-LD docs + schema builders; no third-party systems queried
