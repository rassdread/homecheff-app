# Discovery Social Signal Debt

**Version:** V1 (Phase 1B)  
**Last updated:** 2026-07-06

## Phase 0 canonical semantics (unchanged)

| Signal | Meaning | Entity |
|--------|---------|--------|
| **favoriteCount** | Saves (Favorite table) | Product + Dish |
| **fansCount** | Followers (Follow table) | User / seller |
| **workspacePropsCount** | Studio props | WorkspaceContent only |
| **Item props** | ❌ Deprecated | Must not appear as social signal |

---

## DiscoveryReadModel compliance

| Field | Source | Compliant |
|-------|--------|-----------|
| `social.favoriteCount` | Favorite / dish saves | ✅ |
| `social.fansCount` | Seller-level (optional enrichment) | ✅ default 0 at listing |
| `social.workspacePropsCount` | Workspace props only | ✅ default 0 at listing |
| No item props field | — | ✅ |

---

## Violations (legacy fields still on payloads)

| Location | Field | Issue | Severity |
|----------|-------|-------|----------|
| Feed API / GeoFeed | `propsCount` on dishes | Legacy name for favorites | Medium — maps to favoriteCount in discovery |
| `getInspiratieItems` | `propsCount` | Counts Favorite on dish | Medium — legacy field name |
| GeoFeed cards | `propsCount` display | May show as "props" | Low — UI not changed in 1B |
| Products API | `averageRating` | Not social but legacy blended | Low |

---

## Verified clean (Phase 0)

- Stats API: `totalProps` = workspace only
- UserStatsTile: props = workspace props
- Product favorites: Favorite table, not WorkspaceContentProp

---

## Recommendations

1. UI: rename remaining `propsCount` labels to favorites (Phase 2 UI)
2. API: deprecate `propsCount` in favor of `favoriteCount` on dish payloads
3. Discovery ranking: read `discovery.social.*` only
