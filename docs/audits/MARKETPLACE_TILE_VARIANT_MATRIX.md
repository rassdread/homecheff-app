# Marketplace Tile Variant Matrix

**Status:** Audit only  
**Last updated:** 2026-07-06  
**Companion:** [MARKETPLACE_PRESENTATION_MATRIX.md](./MARKETPLACE_PRESENTATION_MATRIX.md)

Defines **which variant** shows **which fields** per `ListingKind`. Implementation target: `MarketplaceTileRouter` + `lib/marketplace/tiles/`.

---

## Variant inventory

| Variant | ID | Primary surfaces | Media ratio | Max badges | Trust segments | Share | CTA |
|---------|-----|------------------|-------------|------------|----------------|-------|-----|
| **Compact** | `MarketplaceTileCompact` | Mobile GeoFeed, discover grid, search mobile | 4:5 (grid 1:1) | 2 | 1 | No | No |
| **Standard** | `MarketplaceTileStandard` | Desktop feed, discovery section rows | 4:3 | 3 | 2 | Yes | No |
| **Mini** | `MarketplaceTileMini` | Profile public aanbod / inspiratie (T2) | 1:1 thumb | 1 | 0 | No | No |
| **Sidebar** | `MarketplaceTileSidebar` | Future sponsored / shell (T2, unmounted) | 16:9 strip | 1 | 0 | No | No |

**Inspiration** uses Compact / Standard with `mode="inspiration"` — same variants, different field rules.

---

## Field visibility matrix (OFFER kinds)

Legend: **●** always · **○** conditional · **—** never · **P** preview only

### PRODUCT

| Field | Compact | Standard | Mini | Sidebar |
|-------|---------|----------|------|---------|
| Cover media | ● | ● | ● | ● |
| Title | ● | ● | ● | ● |
| Seller person row | ● | ● | ○ name only | ○ avatar+name |
| Price | ● | ● | ● | ● |
| Kind cue (`· Product`) | — | — | — | — |
| Specialization badge | ○ 1 | ○ 2 | ○ 1 | — |
| Trust cue | ○ 1 | ○ 2 | — | — |
| Fulfillment hint | — | ○ icon | — | — |
| Favorite | ● | ● | — | — |
| Share | — | ● | — | — |
| Description | P | P | — | — |
| Accepted values row | — | — | — | — |

### SERVICE

| Field | Compact | Standard | Mini | Sidebar |
|-------|---------|----------|------|---------|
| Cover media | ● | ● | ● | ● |
| Title | ● | ● | ● | ● |
| Provider person row | ● | ● | ○ | ○ |
| Price + `· Dienst` | ● | ● | ● | ● |
| Service spec badge | ○ | ○ | ○ | — |
| Deal trust cue | ○ | ○ | — | — |
| Fulfillment | — | ○ | — | — |
| Favorite / Share | ● / — | ● / ● | — | — |

### TASK

| Field | Compact | Standard | Mini | Sidebar |
|-------|---------|----------|------|---------|
| Cover media | ● | ● | ● | — |
| Title | ● | ● | ● | ● |
| Offerer person row + distance | ● | ● | ○ | ○ |
| Price + `· Taak` | ● | ● | ● | ● |
| Practical spec badge | ○ | ○ | ○ | — |
| Deal trust | ○ | ○ | — | — |
| Favorite / Share | ● / — | ● / ● | — | — |

### WORKSHOP

| Field | Compact | Standard | Mini | Sidebar |
|-------|---------|----------|------|---------|
| Cover media | ● | ● | ● | ● |
| Title | ● | ● | ● | ● |
| Host person row | ● | ● | ○ | ○ |
| Price | ● | ● | ● | ● |
| **Date badge** | ● if date | ● if date | ○ short | ● |
| Workshop kind badge | ○ if no date badge | ○ | — | — |
| Topic spec | ○ | ○ | — | — |
| Deal trust | ○ | ○ | — | — |
| Favorite / Share | ● / — | ● / ● | — | — |

### COACHING

| Field | Compact | Standard | Mini | Sidebar |
|-------|---------|----------|------|---------|
| Cover media | ● | ● | ● | — |
| Title | ● | ● | ● | ● |
| Coach person row | ● | ● | ○ | ○ |
| Price + `· Coaching` | ● | ● | ● | ● |
| Domain spec badge | ○ | ○ | ○ | — |
| Deal trust | ○ | ○ | — | — |
| Favorite / Share | ● / — | ● / ● | — | — |

### REQUEST

| Field | Compact | Standard | Mini | Sidebar |
|-------|---------|----------|------|---------|
| Cover media | ○ optional | ○ | — | — |
| Title | ● | ● | ● | — |
| **Requester** person row | ● | ● | ○ | — |
| `Gezocht` badge | ● | ● | ● | — |
| Budget / voorstel line | ○ | ○ | — | — |
| Skill spec badge | ○ | ○ | — | — |
| Requester deal trust | ○ | ○ | — | — |
| Seller-style product trust | — | — | — | — |
| Favorite / Share | ● / — | ○ / ○ | — | — |

---

## INSPIRATION variant matrix

| Field | Compact | Standard | Mini |
|-------|---------|----------|------|
| Cover media | ● | ● | ● |
| Title | ● | ● | ● |
| Creator person row | ● | ● | ○ |
| Category label (not price) | ● | ● | ○ |
| Vertical badge | ○ 1 | ○ 2 | ○ 1 |
| Trust cues | — | — | — |
| Price / € | — | — | — |
| Favorite | ● | ● | — |
| Share | — | ● | — |
| Description | P | P | — |

---

## Variant selection rules (router)

```text
if mode === 'inspiration' → inspiration field rules
else if surface === 'profile-mini' → Mini
else if surface === 'sidebar' → Sidebar (future)
else if viewport < md OR surface === 'discover-grid' → Compact
else → Standard
```

| Surface | Component | `mediaRatio` |
|---------|-----------|--------------|
| `GeoFeed` mobile list | Compact | `4:5` |
| `GeoFeed` mobile discover | Compact | `1:1` |
| `GeoFeed` desktop | Standard | `4:3` |
| `DiscoveryFeedSection` row | Standard | `4:3` |
| Search results mobile | Compact | `4:5` |
| Search results desktop | Standard | `4:3` |
| Profile aanbod grid | Mini | `1:1` |

**No variant changes by `ListingKind`** — only field population differs.

---

## Density budget (enforced)

| Variant | Media min height share | Max text lines below media |
|---------|------------------------|----------------------------|
| Compact | ≥ 60% card height | 5 (title 2 + person 1 + price 1 + trust 1) |
| Standard | ≥ 55% | 6 |
| Mini | ≥ 50% | 3 |
| Sidebar | ≥ 40% strip | 2 |

---

## Badge slot allocation by variant

| Variant | Slot 1 | Slot 2 | Slot 3 |
|---------|--------|--------|--------|
| Compact | Global priority 1–2 | Kind/spec | — |
| Standard | Global 1–2 | Kind/spec | Spec/trust |
| Mini | Highest priority only | — | — |
| Sidebar | Date or Gezocht or spec | — | — |

Global priority order: [MARKETPLACE_PRESENTATION_MATRIX.md](./MARKETPLACE_PRESENTATION_MATRIX.md) § per kind.

---

## Trust cue formatter by kind

| Kind | Compact (1 segment) | Standard (2 segments max) |
|------|---------------------|---------------------------|
| PRODUCT | Product reviews → else deal | Product · deal |
| SERVICE | Deal | Deal · tier |
| TASK | Deal | Deal |
| WORKSHOP | Deal | Deal |
| COACHING | Deal | Deal |
| REQUEST | Requester deal (if any) | Same |
| INSPIRATION | — | — |

---

## Price formatter by kind

All formatters live in `lib/marketplace/tiles/build-tile-price-line.ts` (planned).

| Kind | Suffix on price line |
|------|---------------------|
| PRODUCT | — |
| SERVICE | ` · Dienst` |
| TASK | ` · Taak` |
| WORKSHOP | ` · Workshop` OR date in badge (not both redundant) |
| COACHING | ` · Coaching` |
| REQUEST | `Gezocht` / budget line — not € checkout |
| INSPIRATION | category label component — not price formatter |

---

## Migration mapping (current → variant)

| Legacy | Target variant |
|--------|----------------|
| `FeedSaleCard` mobile | Compact |
| `FeedSaleCard` desktop | Standard |
| `DiscoverGridTile` | Compact `1:1` |
| `FeedInspirationCard` | Compact/Standard `mode=inspiration` |
| `MyDishesManager` grid | Mini (T2) |

---

## Related documents

- [MARKETPLACE_TILE_ARCHITECTURE.md](./MARKETPLACE_TILE_ARCHITECTURE.md)
- [MARKETPLACE_DISCOVERY_CARD_RULES.md](./MARKETPLACE_DISCOVERY_CARD_RULES.md)
- [MARKETPLACE_TILE_MIGRATION_PLAN.md](./MARKETPLACE_TILE_MIGRATION_PLAN.md)
