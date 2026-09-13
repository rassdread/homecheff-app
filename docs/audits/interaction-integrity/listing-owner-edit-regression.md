# Listing owner Edit flow — loop + integrity regressions

## Incident A (Aug 2026) — SEO strip

**Symptom:** Bewerken opened public listing detail (`/product/{slug}`), `/edit` stripped.

**Cause:** Shared `app/product/[id]/layout.tsx` bare-UUID SEO redirect did not preserve `/edit`.

**Fix:** Public redirects only on `app/product/[id]/page.tsx`. Canonical edit via `buildProductEditPath`.

## Incident B (Sep 2026) — edit fetch / form reset loop

**Symptom (production):** Profile → own listing → Bewerken → edit flow stuck / looping; cannot stably edit or save.

### Trace

Profile Aanbod card `Bewerken`
→ `handleEdit` → `router.push(buildProductEditPath(...))`
→ `/product/{slug-or-uuid}/edit`
→ `EditProductPage` `useEffect` fetch `/api/products/{id}`
→ `setProduct` → `MarketplaceOfferForm` hydrate

### ROOT_CAUSE

`EditProductPage` fetch `useEffect` depended on unstable `t` from `useTranslation()` (new function identity every render):

```
}, [productId, routeParam, router, t]);
```

### LOOP_TRIGGER

1. Effect runs → `setIsLoading(true)` → fetch → `setProduct` → `setIsLoading(false)`
2. Re-render creates new `t`
3. Effect re-runs → infinite fetch / loading flicker / form remount+reset

Amplifier: `MarketplaceOfferForm` hydrate effect depended on `[editMode, existingProduct, marketplaceCategory]`, so each new `existingProduct` object identity reset form fields (including `setMarketplaceCategory`).

### Canonical edit route

`/product/{seo-slug-hcid-{uuid}}/edit` via `buildProductEditPath(title, place, id)`.

Bare UUID `/product/{uuid}/edit` may `router.replace` to canonical **once** when path actually differs.

### Contract (unchanged)

| Control | Destination |
|---|---|
| Card body | Public listing `/product/{id}` |
| Bewerken | Edit only — `stopPropagation` + `preventDefault` |
| Cancel/Back | Profile `?tab=aanbod` |

### ACCOUNT / Stripe

Open-edit does not gate on `ACCOUNT_REQUIREMENTS_MISSING`. Save still validates when changed data creates new requirements.

## Automated coverage

- `npm run validate:listing-owner-edit-integrity`
- `npm run probe:interaction-integrity` (ownerEditPathIntegrity + card source contract)
