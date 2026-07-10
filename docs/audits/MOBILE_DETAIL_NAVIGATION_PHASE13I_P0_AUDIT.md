# Phase 13I-P0 Audit — “Could not load listing” (Android)

**Date:** 2026-07-10  
**Severity:** P0 pilot blocker  
**Status:** Fix implemented — pending device verification before commit

---

## Root cause

### Primary: Client fetch used fragile slug path + wrong origin resolution

1. **`ListingDetailPage` fetched `/api/products/${encodeURIComponent(fullSeoSlug)}`** instead of the resolved UUID. A trailing slash on the route param (common with `trailingSlash: true`) broke `resolveProductIdFromParam`, producing API paths like `/api/products/...-hcid-uuid/` → **HTTP 404**. Other param/encoding edge cases had the same fragility.

2. **No native API base URL handling.** Relative `fetch('/api/...')` assumes `window.location.origin` is `https://homecheff.eu`. In Capacitor shells where origin is `https://localhost` or `capacitor://localhost`, the fetch hits the local shell (HTML, not JSON) → `response.json()` throws or returns non-product payload → UI shows **“Could not load listing”** (`loadError: network` / `invalid`).

### Secondary (13I, already fixed)

React Rules of Hooks violation masked the underlying fetch failure as a crash before graceful error UI existed.

### Not root cause

| Checked | Result |
|---------|--------|
| Production `/api/products/{uuid}` for feed products | ✅ 200 |
| Production `/api/products/{slug}` | ✅ 200 |
| Production `/api/products/{slug}/` (trailing slash in slug) | ❌ **404** |
| Dish/inspiration feed hrefs | ✅ `/recipe/`, `/garden/`, `/design/` — not ListingDetailPage |
| `safeRoute` allowlist | ✅ product/request/inspiration paths |

---

## Example failing item (before fix)

| Field | Value |
|-------|-------|
| Entity | Product — HomeCheff Design Studio |
| UUID | `fcc5ff2a-651a-4983-9d17-b3f1acf7ca17` |
| href | `/product/homecheff-design-studio-vlaardingen-hcid-fcc5ff2a-651a-4983-9d17-b3f1acf7ca17/` |
| Failing API (slug + `/`) | `https://homecheff.eu/api/products/homecheff-design-studio-vlaardingen-hcid-fcc5ff2a-651a-4983-9d17-b3f1acf7ca17/` |
| HTTP before fix | **404** (or fetch throw on wrong origin) |
| HTTP after fix | **200** via `https://homecheff.eu/api/products/fcc5ff2a-651a-4983-9d17-b3f1acf7ca17` |

---

## Fix summary

| File | Change |
|------|--------|
| `lib/seo/productSlug.ts` | Strip trailing slash before UUID extraction |
| `lib/marketplace/detail/listing-detail-route.ts` | Normalize param; API path uses UUID; `listingDetailFetchUrl()` |
| `lib/client/resolve-api-url.ts` | `resolveClientApiUrl()` via `getPublicAppUrl()` on untrusted origins |
| `lib/marketplace/detail/listing-detail-diag.ts` | Dev/native logcat diagnostics (no production UI) |
| `lib/marketplace/detail/listing-detail-contract.ts` | Entity → route → API SSOT |
| `components/product/ListingDetailPage.tsx` | Robust fetch, status mapping, diagnostics |
| `components/product/ListingDetailUnavailable.tsx` | `server_error` / `unavailable` reasons |
| `scripts/validate-mobile-detail-navigation-phase13i.ts` | Entity contracts + UUID API + native URL |

---

## Entity route matrix

| Feed entity | Tile href | Next route | API / loader | DB model |
|-------------|-----------|------------|--------------|----------|
| Product OFFER | `/product/[slug]` | `ListingDetailPage` | `/api/products/[uuid]` | Product (+ Listing fallback) |
| Request | `/request/[slug]` | `ListingDetailPage` | `/api/products/[uuid]` | Product |
| Service | `/product/[slug]` | `ListingDetailPage` | `/api/products/[uuid]` | Product |
| Barter | `/product/[slug]` | `ListingDetailPage` | `/api/products/[uuid]` | Product |
| Legacy Listing | `/product/[slug\|uuid]` | `ListingDetailPage` | `/api/products/[uuid]` | Listing → product shape |
| Dish / Inspiration | `/recipe/[id]` | `InspiratieDetail` | server `loadInspiratieDetail` | Dish |
| Garden | `/garden/[id]` | `InspiratieDetail` | server loader | Dish |
| Design | `/design/[id]` | `InspiratieDetail` | server loader | Dish |

No universal `/product/` fallback for DISH/INSPIRATION rows.

---

## Validation report

```bash
npx tsx scripts/validate-mobile-detail-navigation-phase13i.ts
npm run lint
npm run build
```

---

## Android / web test matrix (manual)

| Entity | id/slug | href | API path | Expected |
|--------|---------|------|----------|----------|
| Product (new) | UUID + slug | `/product/...-hcid-uuid/` | `/api/products/uuid` | 200, detail renders |
| Legacy listing | bare UUID | `/product/uuid/` | `/api/products/uuid` | 200 |
| Request | slug | `/request/.../` | `/api/products/uuid` | 200 |
| Dish | uuid | `/design/uuid/` | server loader | page renders |
| Garden | uuid | `/garden/uuid/` | server loader | page renders |

**Safe to commit:** after Android device confirms detail opens (user to verify via logcat `[listing-detail]` tags).
