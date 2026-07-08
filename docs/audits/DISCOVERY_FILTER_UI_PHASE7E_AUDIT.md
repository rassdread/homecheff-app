# Discovery Filter UI Audit — Phase 7E

Date: 2026-07-08
Scope: Rewire discovery VIEW/CATEGORY filter UI to match Phase 7D canonical
model. Fix mobile tile whitespace. No backend, ranking, payment, or fetch changes.

---

## 1. View row changes

**Before:** All / Te koop / Gezocht / **Diensten** / Inspiratie (services mixed into intent).

**After:** All / Aangeboden / Gezocht / Inspiratie — driven by
`DISCOVERY_VIEW_CHIP_OPTIONS` from `lib/marketplace/canonical-model.ts`.

- `GeoFeed` view chips and `FeedMobileToolbar` view row use canonical label keys.
- `FeedViewFilterId` no longer includes `'services'` as an active value.
- `matchesFeedViewFilter` no longer has a services branch.

---

## 2. Category row changes

**Before:** All / Eten / Tuin / Creaties (no Services).

**After:** All / Eten / Tuin / Creaties / **Diensten** — driven by
`DISCOVERY_CATEGORY_CHIP_OPTIONS`.

- Uses existing `appliedCategory` state (`cheff`, `garden`, `designer`, `services`).
- Category filter uses `itemMatchesDiscoveryCategorySlug()` (single canonical matcher).
- Services category filters via `isMarketplaceServiceItem` (no extra API).

---

## 3. Legacy services chip handling

| Entry point | Migration |
|-------------|-----------|
| `?chip=services` / `?chip=diensten` | → `chip=sale` + `vertical=services` |
| Persisted `feedChip: 'services'` | → `sale` + `category: services` on restore |
| `HomeMobileEcosystemStrip` link | Updated to `/?chip=sale&vertical=services` |
| Native feed prefs | `normalizeFeedChipState` maps services → sale |

Backward compatibility preserved; no data migration required.

---

## 4. Offered semantics

Unchanged. `isMarketplaceSaleItem` still classifies all offer forms as sale/Offered:
fixed, on-request, voluntary, barter-only, accepted-values-only, direct-contact-only,
services, products. Category=services narrows within Offered; it does not change intent.

---

## 5. Mobile tile whitespace fix

**Root cause:** `flex-1` on tile content inside grid/flex columns stretched cards to
row height, pushing maker/title/trust below a large empty gap under the image.

**Fix:**
- `MarketplaceTileCompact` / `Standard` / `Mini`: `h-auto self-start`, content `shrink-0` (no `flex-1`).
- `globals.css`: `.hc-feed-cards-column` and `.hc-discover-feed-grid` cards use `align-self: start`.

---

## 6. Universal tile order

Trust now renders **before** settlement (7D spec compliance):

1. Category badge (on media)
2. Image
3. Maker + location
4. Title
5. Price + accepted-value icons
6. Trust
7. Settlement row

Implemented by splitting settlement out of `TileValueExchangeBlock` in Standard/Compact.

---

## 7. Tile information completeness

No regression. All fields remain visible on standard/compact tiles; mini/sidebar reduce
per 7D rules.

---

## 8. i18n

`marketplace.canonical.view.offered` → NL **Aangeboden**, EN **Offered**.

Category NL: **Eten / Tuin / Creaties / Diensten**. EN: Food / Garden / Creations / Services.

---

## 9. Performance

- No new fetch, API, remount, or SWR change.
- Removed separate `sortedServices` pool; services filtering reuses `filteredSaleBase`.

---

## 10. Deferred items

- Rename category slugs (`cheff` → `food`) — deferred to avoid breaking persisted URLs/state.
- `feed.chipServices` i18n key kept for legacy references but no longer rendered in view row.
