# Phase 13I P0 Audit — Mobile Detail Navigation Crash

**Date:** 2026-07-10  
**Severity:** P0  
**Reporter:** Android Capacitor — tap product → error (web may work)

---

## Root cause

### Primary: React Rules of Hooks violation (`ListingDetailPage`)

`components/product/ListingDetailPage.tsx` returned early when `routeParam` was missing **before** calling `useState` / `useEffect`. On client navigation (Capacitor WebView), param availability can differ between renders → **“Rendered more hooks than during the previous render”** → white screen / React error overlay. This matches “works on web sometimes, crashes in app”.

### Secondary: Fail-hard navigation on API errors

On 404/500/invalid JSON, the page called `router.push('/')` instead of showing unavailable/retry UI. Users perceived this as a crash (sudden ejection to home).

### Tertiary (13I earlier): Native media tap intercept

`FeedCardPrimaryMedia` opened lightbox on Capacitor instead of navigating — fixed in 13I (`lightboxEligible = coarsePointer && !nativeMounted`).

### Not root cause (verified)

| Checked | Result |
|---------|--------|
| Slug → UUID resolution | ✅ `resolveProductIdFromParam` in API + client SSOT |
| Legacy listing API fallback | ✅ `/api/products/[id]` falls back to `listing` model |
| Request vs product redirect | ✅ Server layouts redirect cross-intent |
| Business DNA render | ✅ No throw path found |
| `safeRoute` allowlist | ✅ `/product/`, `/request/`, inspiration paths |

---

## Affected files

| File | Change |
|------|--------|
| `components/product/ListingDetailPage.tsx` | Hooks order; `loadError`; no `router.push('/')`; encoded fetch |
| `lib/marketplace/detail/listing-detail-route.ts` | Route param + API path SSOT |
| `components/product/ListingDetailUnavailable.tsx` | Retry / not found / network UI |
| `app/product/[id]/error.tsx` | Route error boundary |
| `app/request/[slug]/error.tsx` | Route error boundary |
| `components/product/detail/ProductSaleSecondaryContact.tsx` | Safe optional seller id |
| `public/i18n/en.json`, `nl.json` | `product.detailError.*` |
| `components/feed/feedMedia.tsx` | Native tap → Link (13I) |
| `lib/native/safeRoute.ts` | Inspiration + request paths (13I) |

---

## Listing type matrix (code audit)

| Type | Route | Detail component | API fallback | Crash guard |
|------|-------|------------------|--------------|-------------|
| Product (new) | `/product/[slug]` | `ListingDetailPage` | Product model | ✅ |
| Service | `/product/[slug]` | same | same | ✅ |
| Request / Gezocht | `/request/[slug]` | same | same | ✅ |
| Barter / money | `/product/[slug]` | same | settlement SSOT | ✅ |
| Business (KVK) | `/product/[slug]` | same + BusinessBadge | same | ✅ |
| Legacy listing | `/product/[uuid]` or slug | same | Listing → product shape | ✅ |
| Legacy dish (inspiration) | `/recipe/`, `/garden/`, `/design/` | `InspiratieDetail` | separate loader | ⚠️ not ListingDetailPage |
| Feed inspiration API | `/inspiratie/[id]` | inspiratie routes | separate | ⚠️ separate audit |

**Note:** Inspiration paths use a different stack; feed correctly routes via `feed-item-href.ts`.

---

## Fix summary

1. **Never conditional hooks** — all state/effects run unconditionally; missing param handled in render only.
2. **Graceful load failures** — `ListingDetailUnavailable` with retry (network) / back (not found).
3. **Encoded fetch** — `listingDetailApiPath()` uses `encodeURIComponent`.
4. **Error boundaries** — `error.tsx` on product + request routes catches render throws.
5. **Dev logging** — `navDebug('listing-detail:fetch', { routeParam, resolvedId })`.

---

## Validation report

### Automated

```bash
npx tsx scripts/validate-mobile-detail-navigation-phase13i.ts
npx tsx scripts/validate-mobile-tile-consistency-phase13i.ts
npm run lint
npm run build
```

### Static checks (validator)

- Hooks before conditional return
- No `router.push('/')` on fetch failure
- Slug `-hcid-` UUID round-trip
- Feed href generation for legacy product row
- Native lightbox disabled in Capacitor
- i18n unavailable strings

### Manual matrix (device QA)

| Surface | Product | Request | Service | Legacy UUID | Slug URL |
|---------|---------|---------|---------|-------------|----------|
| Android Capacitor | ☐ | ☐ | ☐ | ☐ | ☐ |
| Mobile web | ☐ | ☐ | ☐ | ☐ | ☐ |
| Desktop | ☐ | ☐ | ☐ | ☐ | ☐ |

**Expected:** zero React errors; unavailable UI for deleted/inactive; retry on offline.

### Sample size target

Open ≥20 random feed tiles across food / garden / designer / services / requests / barter / business before pilot sign-off.

---

## Detail UI consistency (Step 5 snapshot)

| Element | Status |
|---------|--------|
| Settlement icons | ✅ `ProductDetailSettlementSection` SSOT |
| Value / price row | ✅ `ProductValueExchangeSection` |
| Business badge | ✅ commerce zone |
| CTA hierarchy | ✅ `settlement-router` |
| Mobile sticky CTA | ✅ safe-area padding |
| Legacy listing data gaps | ✅ optional chaining + empty seller guard |

---

## Verdict

**Fixed (code)** — P0 hooks violation and fail-hard redirects removed. **Requires device QA** to confirm zero crashes on Android with 20+ listings.
