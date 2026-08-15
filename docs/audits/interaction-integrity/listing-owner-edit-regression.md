# Listing owner action integrity — Edit click regression

**Before main:** `6b5609cf00bb59a179a66282c780e1e5f54e9989`  
**Before production:** `dpl_4CEBzpq7xYttK8cirrPLQdVsYcd6`

## Reproduction (production, real browser)

1. Navigate to `https://homecheff.eu/product/{uuid}/edit`  
   (same destination Profile Aanbod “Bewerken” used)
2. Final URL became `/product/{seo-slug}` — **public listing detail**
3. `/edit` was stripped

## Root cause

**E/F — wrong SEO redirect destination (not event bubbling).**

`app/product/[id]/layout.tsx` redirected bare UUID → slug **without** preserving `/edit`.  
That layout wraps both public detail and edit. Owner Edit used `/product/{uuid}/edit`.

Classification: layout SEO redirect applied to edit child route.

## Fix

1. Remove bare-UUID / REQUEST public redirects from shared product **layout**
2. Own those redirects only in `app/product/[id]/page.tsx` (public detail)
3. Add `buildProductEditPath` / `buildProductDetailPath` / `isProductEditPathname`
4. Profile + detail Edit use edit path helpers
5. Shared `cardActionBoundaryProps` for owner action toolbars
6. Probe + `validate:listing-owner-edit-integrity` regression

## Owner actions inventory (this surface)

| Control | Surface | Expected | Before | After |
|---|---|---|---|---|
| Bewerken / Edit | Profile Aanbod card | `/product/.../edit` | Public detail | Edit route |
| Card body click | Profile Aanbod | Edit (card is edit-primary) | Same redirect bug | Edit route |
| View on marketplace | Profile Aanbod | Public listing | OK (stopPropagation) | OK + boundary |
| Delete | Profile Aanbod | Confirm delete | OK | OK + boundary |
| Product bewerken | Listing detail owner CTA | slug/edit | Already slug | `buildProductEditPath` |
| Inspiratie owner Edit | Public item detail | Profile edit | Separate flow | Boundary props |

Feed tiles have no owner Edit control (preview shell only).

## Feed / payment / legal

No semantic changes. Redirect ownership moved; no Stripe/proposal/LEGAL/TRUST changes.
