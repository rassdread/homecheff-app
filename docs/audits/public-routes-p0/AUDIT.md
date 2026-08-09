# P0 Public Listing + Profile Routes — Audit Evidence

**Date:** 2026-08-09  
**Production deploy probed:** `dpl_8pnHiXeBqtbV5hu2kCRRFDwWKGuz`  
**Repo branch (fix):** `fix/public-routes-p0`

## Phase 1 — Architecture (discovery)

### Canonical listing routes
| Route | Role |
|-------|------|
| `/product/[id\|slug]` | Sale / service / barter listing detail (`ListingDetailPage`) |
| `/request/[slug]` | Request listing detail (same page) |
| `/recipe\|garden\|design\|inspiratie/[id]` | Inspiration / dish detail |
| `/listing/[id]` | Legacy redirect → SEO product/request (new) |

### Canonical public profile routes
| Route | Role |
|-------|------|
| `/user/[username\|uuid]` | Canonical public profile (Profile V2) |
| `/profile/[userId]` | Legacy redirect → `/user/...` (new) |
| `/seller/[sellerId]` | Legacy seller surface; userId now redirects to `/user` |

### Href SSOT
- `lib/routing/public-hrefs.ts` → `getListingHref`, `getFeedItemHref`, `getPublicProfileHref`
- `lib/seo/listing-routes.ts` → `buildListingDetailHref`
- `lib/feed/feed-item-href.ts` → taxonomy-aware feed hrefs
- `lib/user/public-profile.ts` → profile href + temp-username guard

### Middleware
Does **not** rewrite product/user/request; host canonicalization + headers only.

## Phase 2 — Production reproduction

### Smoking gun (client crash)
Browser console on production listing navigation:

```
ReferenceError: hasPublicDisplayPrice is not defined
```

in `ProductSaleCommerceZone` (chunk `common-*.js`).  
SSR/layout still returned HTTP 200 + SEO title, but client commerce zone crashed → users saw a broken/error experience (“error page”) after feed → listing.

Evidence: `browser-probe-summary.json`, consoleErrors.

### Secondary production gaps
| Path | Prod result | Cause |
|------|-------------|-------|
| `/listing/{validProductId}` | HTTP 404 | Redirect page not deployed yet |
| `/profile/{userId}` | HTTP 404 | Redirect page not deployed yet |
| `/seller/{userId}` | “Seller Not Found” | Lookup by sellerProfile.id only; feed/UI often passed userId |
| Feed `/user/temp_*` | Linked temp username | TilePersonRow did not use `getPublicProfileHref` |

### Feed hrefs (DOM sample)
Feed correctly emitted SEO product slugs, e.g.:
- `/product/k-s-berkel-rodenrijs-hcid-3b85deeb-…`
- `/product/kunstschilderijen-grotestraat-hcid-4f822286-…`

Inspiration dishes correctly use `/recipe|/garden|/design/{id}` when `type=dish`.

## Media architecture (Phase 10C discovery)

- Storage: **Vercel Blob** (`@vercel/blob` `put`) for profile/recipe/garden/delivery uploads
- Listing images: product `Image` / listing media + `app/api/upload`
- Display: `SafeImage` with `onError` fallback; next.config `images.remotePatterns`
- Max sizes vary by route (e.g. delivery profile notes 50MB client-compressed)

Full upload E2E matrix remains a follow-up; renderer must not crash on missing/broken assets (SafeImage + listing unavailable UI).
