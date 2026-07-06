# Discovery Contract Coverage

**Version:** V1 (Phase 1C)  
**Last updated:** 2026-07-06

## Field usage matrix

| Field | Feed | Dorpsplein | Profile Aanbod | Search | Inspiratie |
|-------|------|------------|----------------|--------|------------|
| `listingKind` | ✅ | ✅ wire | ✅ filter | ✅ search haystack | ✅ wire |
| `listingIntent` | ✅ | ✅ wire | ✅ filter | ✅ search haystack | — |
| `marketplaceCategory` | ✅ badges | ✅ badges | ✅ filter | ✅ haystack | — |
| `specializations` | ✅ | ✅ | ✅ filter | ✅ haystack | — |
| `trust.productReviewCount` | — | ✅ display | — | — | ✅ sort/filter |
| `trust.dealReviewCount` | — | — | — | — | — |
| `trust.courierReviewCount` | — | — | — | — | — |
| `trust.trustBadges` | — | — | — | — | — |
| `social.favoriteCount` | ✅ | ✅ | — | — | ✅ |
| `social.fansCount` | — | — | — | — | — |
| `social.workspacePropsCount` | — | — | — | — | — |
| `capability.*` | — | — | — | — | — |
| `slug` | — | — | — | — | — |
| `distanceKm` | legacy + discovery | legacy | — | — | legacy |

---

## Ignored (ready for Phase 2)

- `trust.dealReviewCount`, `trust.courierReviewCount` — no item-card UI yet
- `trust.completedDeals`, `trust.completedDeliveries` — profile trust only
- `trust.trustBadges` — not on listing cards
- `capability.*` — not on listing cards
- `social.fansCount` — seller-level only (UserStatsTile)
- `barterOpenness`, `acceptedSpecializations` — still read from legacy on cards (same values as discovery)

---

## Missing consumers

| Surface | Gap |
|---------|-----|
| Unified Discovery API | Not built (Phase 2+) |
| Ranking layer | Not built |
| MyDishesManager public grid | No discovery |
| Product detail trust strip | Legacy stats API |
| Workspace content in feed | Not in read model feed pool |

---

## Readiness for Phase 2 (Ranking)

| Prerequisite | Status |
|--------------|--------|
| All major APIs emit `discovery` | ✅ |
| Feed/Dorpsplein/Profile/Search read kind from discovery | ✅ |
| No item-level blended trust on migrated cards | ✅ |
| Single ranking input shape available | ✅ (`DiscoveryReadModel`) |
| All surfaces consume discovery exclusively | ⚠️ seller tiles + MyDishesManager remain |

**Verdict:** Phase 2 ranking can build on `item.discovery` for Feed, Dorpsplein, Profile Aanbod, and Search. Seller-level stats and MyDishesManager should be migrated before trust-gating at card level.
