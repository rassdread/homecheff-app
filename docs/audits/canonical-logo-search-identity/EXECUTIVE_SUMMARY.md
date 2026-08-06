# Canonical Logo & Search Identity — Executive Summary

**Date:** 2026-08-06  
**Branch:** `feature/canonical-logo-identity`  
**Verdict:** `HOMECHEFF_CANONICAL_LOGO_IDENTITY_PASS` — `READY_FOR_FORMAL_REVIEW`

## What changed

HomeCheff public logo identity is consolidated around one operator-approved primary asset (`public/brand/homecheff-logo-primary.png`, derived from the supplied 886×886 Globeman artwork). All website chrome, structured data, favicons, PWA manifest icons, push-notification icons, email headers, Android launcher icons, and default Open Graph brand previews now derive from `lib/brand/canonical-logo.ts`.

## Key outcomes

| Area | Before | After |
|------|--------|-------|
| UI `<Logo />` | `/icon-192.png` (hard-coded) | SSOT `square` path + `?v=hc8` |
| Organization JSON-LD | `/logo.png` (old 367×516 art) | `/logo.png` (886×886 approved art, absolute URL) |
| Default og:image | 192×192 icon | 1200×630 `og-brand.png` brand card |
| Favicon cache bust | `?v=hc7` | `?v=hc8` (SSOT) |
| Android launcher | Previous ic_launcher set | Regenerated from approved asset |
| SW push icons | Broken `/icon-192x192.png` refs | Fixed to `/icon-192.png` + `/favicon-48.png` |

## Operator actions required post-merge

1. Deploy to production (not done in this task).
2. Request homepage re-indexing in Google Search Console.
3. Build and publish new Android APK/AAB if native store listing should show new icon (`eu.homecheff.mobile`).
4. Observe Google/Bing favicon and Knowledge Panel logo refresh (may take days).

## Evidence pack

See sibling files in this directory for inventory, validation matrices, rollback plan, and warnings.
