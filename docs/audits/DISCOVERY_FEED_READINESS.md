# Discovery Feed Integration Readiness — Phase 2E

**Date:** 2026-07-06

---

## Visible to users (now)

| Surface | What users see |
|---------|----------------|
| **Feed — default sort (newest)** | Discovery section headings: In je buurt, Trending, Betrouwbare makers, Best beoordeeld, Nieuwe makers |
| **Section cards** | Marketplace listings ranked by trust-aware profiles (no view/HCP/follower sort) |
| **Nearby scope** | Nearby section populated when geo + radius allow |
| **National scope** | All eligible sections; legacy client smart rank disabled when API returns `discovery` |

---

## Hidden / not yet visible

| Feature | Status |
|---------|--------|
| Activity Cards | `futureSlots.activity_cards.enabled: false` |
| Recommendations | `futureSlots.recommendations.enabled: false` |
| Personalization (`recommended_for_you`) | Not in registry rollout |
| Section carousels / horizontal scroll | Minimal heading + grid only (no redesign) |
| Gezocht UX redesign | Unchanged |
| Sidebar redesign | Unchanged |

---

## Remaining blockers

### Activity Cards phase
- Feed contract reserves `activity_cards` slot
- Needs: card content source, insertion frequency, logged-in gates

### Personalization
- `accepts_your_values` section defined in eligibility doc but not in registry
- Viewer specialization overlap not wired

### Recommendations
- `/api/recommendations/smart` still deprecated/orphan
- Collaborative filtering explicitly out of scope

### Gezocht UX
- Search results use separate `/api/products` path — not section-powered yet

### Sidebar redesign
- `FeedSidebarFilters` unchanged; section toggles not added

---

## Legacy paths — post-2E status

| Path | Status |
|------|--------|
| `local-discovery.ts` | Local bucket uses **distance sort** (no `computeSaleScore`) |
| `feedSaleRanking.ts` | **Deprecated** — fallback only when API omits `discovery` |
| `feed-client-sort.ts` | Price/distance/views sorts retained; `isDiscoverySmartFeedSort` defers to server |

---

## Acceptance checklist

- [x] Discovery sections in feed pipeline (`/api/feed` → `discovery` payload)
- [x] GeoFeed renders section headings + cards
- [x] Dedup strategy implemented
- [x] Trust tiers drive section eligibility
- [x] No HCP / follower / view influence in section ranking
- [x] Ready for Activity Cards slot in contract
