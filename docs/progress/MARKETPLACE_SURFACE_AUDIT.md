# Marketplace Surface Audit — Progress

**Task:** Discovery Presentation Matrix (audit only)  
**Started:** 2026-07-06  
**Status:** ✅ Complete — documentation only, no implementation

---

## Objective

Before implementing `MarketplaceTileCompact` and `MarketplaceTileStandard`, define exactly what information each `ListingKind` shows across Discovery surfaces — primary/secondary/trust/payment/badges/preview/viewport/section behavior.

**Constraints honored:** No code, no UI changes, no ranking changes.

---

## Inputs reviewed

| Document / module | Purpose |
|-------------------|---------|
| [MARKETPLACE_TILE_ARCHITECTURE.md](../audits/MARKETPLACE_TILE_ARCHITECTURE.md) | Variant model, trust removal, density targets |
| [MARKETPLACE_TILE_PREVIEW_ARCHITECTURE.md](../audits/MARKETPLACE_TILE_PREVIEW_ARCHITECTURE.md) | Preview deferrals (T3) |
| [MARKETPLACE_TILE_MIGRATION_PLAN.md](../audits/MARKETPLACE_TILE_MIGRATION_PLAN.md) | Surface → variant mapping |
| [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md) | Per-kind semantics, payment, trust source |
| [DISCOVERY_SECTION_REGISTRY.md](../architecture/DISCOVERY_SECTION_REGISTRY.md) | Section IDs, `MARKETPLACE_KINDS` |
| [MARKETPLACE_TILE_INVENTORY.md](../audits/MARKETPLACE_TILE_INVENTORY.md) | Legacy card inventory |
| [MARKETPLACE_TILE_DENSITY_AUDIT.md](../audits/MARKETPLACE_TILE_DENSITY_AUDIT.md) | Mobile density findings |
| `lib/discovery/consumer-accessors.ts` | Trust channel accessors |
| `lib/discovery/sections/section-registry.ts` | Allowed kinds per section |

---

## Deliverables

| File | Status | Contents |
|------|--------|----------|
| [MARKETPLACE_PRESENTATION_MATRIX.md](../audits/MARKETPLACE_PRESENTATION_MATRIX.md) | ✅ | Per-kind: 10 dimensions × 7 kinds |
| [MARKETPLACE_TILE_VARIANT_MATRIX.md](../audits/MARKETPLACE_TILE_VARIANT_MATRIX.md) | ✅ | Compact / Standard / Mini / Sidebar field grid |
| [MARKETPLACE_DISCOVERY_CARD_RULES.md](../audits/MARKETPLACE_DISCOVERY_CARD_RULES.md) | ✅ | Binding rules: trust, price, badges, sections |
| `docs/progress/MARKETPLACE_SURFACE_AUDIT.md` | ✅ | This file |

---

## Key decisions

### 1. One tile, many sections

Discovery sections (`nearby`, `trusted_makers`, `top_rated`, `trending`, `new_creators`) **do not** change tile layout. Section headings provide context only. Ranking and eligibility unchanged.

### 2. Person row semantics

| Kind | Person |
|------|--------|
| OFFER kinds | Seller / provider / host / coach |
| REQUEST | **Requester** (buyer) |
| INSPIRATION | Creator |

### 3. Trust channels by kind

| Kind | Tile trust |
|------|------------|
| PRODUCT | Product reviews → deal fallback |
| SERVICE, TASK, WORKSHOP, COACHING | Deal-first |
| REQUEST | Requester deal history only |
| INSPIRATION | **None** on tile |

### 4. WORKSHOP date is first-class

`availabilityDate` occupies badge priority slot 3 or price-line suffix — never omitted when present.

### 5. REQUEST visual language

Mandatory `Gezocht` badge; amber/neutral tone; no checkout price styling.

### 6. INSPIRATION isolation

Excluded from discovery section pool; interleaved in feed via `mode=inspiration`; category label replaces price.

### 7. Density guardrails

Compact: media ≥ 60%, max 2 badges, 1 trust segment, no CTA, no accepted-values row on tile.

### 8. Preview deferred to T3

Accepted values, fulfillment detail, expanded trust — preview-only per existing preview architecture. Rules documented in discovery card rules for T1 parity.

---

## ListingKind coverage

| Kind | Matrix | Variant grid | Card rules |
|------|--------|--------------|------------|
| PRODUCT | ✅ | ✅ | ✅ |
| SERVICE | ✅ | ✅ | ✅ |
| TASK | ✅ | ✅ | ✅ |
| WORKSHOP | ✅ | ✅ | ✅ |
| COACHING | ✅ | ✅ | ✅ |
| REQUEST | ✅ | ✅ | ✅ |
| INSPIRATION | ✅ | ✅ | ✅ |
| DELIVERY_OPERATION | — | — | Out of scope (no discovery tile V1) |

---

## Out of scope (explicit)

- `MarketplaceTileCompact` / `Standard` implementation (T1)
- Preview hover/long-press (T3)
- Sponsored sidebar slots
- Ranking engine / `buildDiscoveryFeed` changes
- `/api/feed` contract changes
- REQUEST budget / urgency fields (noted as future in matrix)

---

## Recommended next step

Implement **Phase T1** per [MARKETPLACE_TILE_MIGRATION_PLAN.md](../audits/MARKETPLACE_TILE_MIGRATION_PLAN.md):

1. `lib/marketplace/tiles/` — `build-tile-price-line`, `build-tile-trust-cue`, `build-tile-badges`
2. `map-to-tile-model.ts` from `GeoFeedCardItem`
3. `MarketplaceTileRouter` + Compact + Standard
4. Replace `FeedSaleCard`, `DiscoverGridTile`, `UserStatsTile` in feed path

---

## Validation

| Check | Result |
|-------|--------|
| Code changes | None |
| UI changes | None |
| Ranking changes | None |
| Four docs created | Yes |

---

## Related prior work

- Marketplace Tile UX Audit V1 (`MARKETPLACE_TILE_INVENTORY`, `_DENSITY`, `_UX_RECOMMENDATIONS`)
- Marketplace Tile T1–T2 architecture (`MARKETPLACE_TILE_ARCHITECTURE`, `_PREVIEW`, `_MIGRATION_PLAN`, `MARKETPLACE_TILE_PHASE_T1_T2`)
