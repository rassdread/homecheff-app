# HOMECHEFF MARKETPLACE — SINGLE COMPACT HEADER CLOSEOUT REPORT

**Date:** 2026-09-01  
**Repo:** HomeCheff-app (`homecheff.eu`)

---

## 1. Why two header layers were visible

`app/page.tsx` rendered **HomepageEcosystemSignal** (white ecosystem band) **above** `HomeHeroSection` (green dorpsplein band). Both carried marketplace/ecosystem explanation → stacked intro before feed.

## 2. Composition before

1. Global NavBar  
2. **HomepageEcosystemSignal** — Everybody Eats + ecosystem paragraph + Marketplace/Studio/Growth/Affiliate  
3. **HomeHeroSection** — Digitale buurtmarkt badge + long title + second paragraph + CTAs  
4. Feed chrome

## 3. Composition after

1. Global NavBar  
2. **Single HomeHeroSection** — identity line + ecosystem nav + one title + one support line + labeled CTAs  
3. Feed chrome

## 4. Copy removed/merged

| Removed | Kept |
|---------|------|
| Separate ecosystem body paragraph | `orientationIdentity` eyebrow |
| `orientationTitle` long h1 | `orientationExplainUltra` as h1 |
| `orientationExplainCompactPrimary` second paragraph | `homeCompactHeader.supportLine` (one line) |
| HeroVisualCluster, HeroPlatformStrip | Ecosystem nav links inline |
| HomepageEcosystemSignal standalone band | `data-hc-ecosystem-participation-signal` on merged section |

## 5. Header height strategy

One green rounded band (`py-2`–`py-3`), no second white band, no desktop-only mega-hero. Feed-first padding on page shell unchanged.

## 6. Mystery CTA root cause

**Compass “Ontdek” button** (`homePhase1.ctaDiscover`) — scroll to feed / guest discover panel. Label was hidden in some mobile/landscape CSS (`max-[900px]:landscape:hidden`, Share used `sr-only` in landscape). **BUG_MISSING_LABEL** at certain widths.

## 7. CTA final action/label

| Control | Action | NL label |
|---------|--------|----------|
| Secondary | `scrollToHomeFeed` / guest discover | **Ontdek in je buurt** |
| Primary | `openCreateFlow` / guest create | **Verkoop of deel** |

Both always show icon + visible text.

## 8–10. Responsive / mobile / desktop

- **One** responsive header component (no parallel mobile/desktop hero split)
- **xl** nav split preserved in NavBar + bottom nav (unchanged)
- Mobile: shorter single band, no duplicate layers

## 11. Feed-position before/after (estimated)

| Viewport | Before | After | Δ |
|----------|--------|-------|---|
| 390 | ~380px | ~240px | **−140px** |
| 768 | ~340px | ~220px | **−120px** |
| 860 | ~320px | ~200px | **−120px** |
| 1280 | ~400px | ~260px | **−140px** |

## 12–14. i18n / auth / SEO

- **i18n:** `homeCompactHeader.supportLine` NL/EN; `CACHE_VERSION` 2.41  
- **auth:** unchanged  
- **SEO:** `data-hc-ecosystem-participation-signal` + crawlable nav links + sr-only Everybody Eats

## 15–17. tests / build

- `validate-marketplace-compact-header.ts` — PASS  
- `validate-marketplace-responsive-nav-cleanup.ts` — PASS  
- `seo-one-ecosystem.test.ts` — 7/7  
- `test:nav-preservation-1b4` — PASS  
- `npm run build` — PASS  

## 18–19. Production

*(Updated after deploy)*

## 20. Remaining issues

None blocking. Formal viewport screenshots optional archive.

---

## Matrix

| Gate | Status |
|------|--------|
| SINGLE_MARKETPLACE_HEADER | **PASS** |
| DUPLICATE_HEADER_REMOVED | **PASS** |
| HEADER_COMPACT | **PASS** |
| FEED_PRIORITY | **PASS** |
| PRIMARY_CTA_CLEAR | **PASS** |
| NO_UNLABELED_CTA | **PASS** |
| MOBILE_HEADER | **PASS** |
| TABLET_HEADER | **PASS** |
| DESKTOP_HEADER | **PASS** |
| RESPONSIVE_NAV_REGRESSION | **PASS** |
| BOTTOM_NAV_REGRESSION | **PASS** |
| I18N_REGRESSION | **PASS** |
| LOCALE_ARCHITECTURE_REGRESSION | **PASS** |
| AUTH_REGRESSION | **PASS** |
| SEO_REGRESSION | **PASS** |
