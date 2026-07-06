# Exchange Suggestions Implementation Audit — Phase 4F

**Date:** 2026-07-06  
**Scope:** Resolver, API, read-only UI surfaces

---

## Summary

Phase 4F implements the 4E architecture as **read-only contextual modules** powered exclusively by `lib/marketplace/exchange/` (4D). No discovery ranking, feed reorder, sponsored slots, notifications, or chain matching.

---

## Module map

| File | Role |
|------|------|
| `exchange-suggestion-contract.ts` | Types, forbidden signals, active vs future types |
| `resolve-exchange-suggestions.ts` | Classifier + 4D `findExchangeMatchesForListing` |
| `exchange-suggestion-caps.ts` | 4E caps (page, session, seller) |
| `exchange-suggestion-copy.ts` | i18n key helpers |
| `exchange-suggestion-surface.ts` | Surface allowlist + min scores |
| `exchange-suggestion-profile-mapper.ts` | Product → `ExchangeListingProfile` |
| `exchange-suggestion-client-storage.ts` | Session/dismiss localStorage |

---

## Suggestion types (active)

| Type | Implemented |
|------|-------------|
| `DIRECT_EXCHANGE` | Yes |
| `REVERSE_EXCHANGE` | Yes |
| `MUTUAL_EXCHANGE` | Yes |
| `LOCAL_EXCHANGE` | Yes (modifier) |
| `COMMUNITY_EXCHANGE` | Yes |
| `MULTI_STEP_EXCHANGE` | **No** — `FUTURE_EXCHANGE_SUGGESTION_TYPES` only |

---

## Surface compliance

| Surface | 4E rule | 4F status |
|---------|---------|-----------|
| Tile browse | Forbidden | ✅ Not implemented |
| Detail | After value exchange | ✅ `ExchangeSuggestionsDetailBlock` |
| Profile owner | Tabs outbound/inbound | ✅ `ExchangeSuggestionsProfileModule` |
| Sidebar | Compact, max 2 | ✅ `ExchangeSuggestionsSidebarModule` |
| Mobile feed insert | 4G | ⏳ Deferred |
| Notifications | 4H | ⏳ Deferred |
| Sponsored | Forbidden | ✅ Separate module kind |

---

## Data rules audit

### Allowed (used)

- Exchange score (4D `computeExchangeMatchScore`)
- Distance (`distanceKm` / `distanceScore`)
- Availability (via 4D eligibility)
- Accepted categories / taxonomy overlap
- Desired exchange overlap
- Trust eligibility (`trustEligibilityScore`)

### Forbidden (excluded)

Validated via `EXCHANGE_SUGGESTION_FORBIDDEN_SIGNALS` + `suggestionPayloadIsClean()`:

- `viewCount`, `hcpPoints`, `followerCount`, `fansCount`
- `workspacePropsCount`, `itemPropsCount`
- `blendedRating`, `averageRating`, `reputationScore`
- `feedRankBoost`, `sponsoredBoost`

Suggestion cards do **not** include these fields.

---

## Caps (4E → 4F)

| Cap | Value | Enforced in |
|-----|-------|-------------|
| Per detail page | 3 | `applyExchangeSuggestionCaps` |
| Per profile tab | 5 | `splitProfileTabs` |
| Per sidebar | 2 | `applyExchangeSuggestionCaps` |
| Per session impressions | 8 | `applyExchangeSuggestionCaps` + client storage |
| Per seller / day | 3 | `applyExchangeSuggestionCaps` + client storage |
| Dismiss cooldown | 14 days | `exchange-suggestion-client-storage` |

---

## API

`GET /api/marketplace/exchange-suggestions`

| Param | Values |
|-------|--------|
| `surface` | `detail`, `profile_owner`, `sidebar` |
| `listingId` | Required for `detail` |
| `capState` | Optional JSON from client storage |

Auth required (401 for guests). Candidates: active products with barter openness or `REQUEST` intent.

---

## UI wiring

| Location | File |
|----------|------|
| Product detail | `app/product/[id]/page.tsx` |
| Profile overview (owner) | `components/profile/v2/ProfileV2TabPanels.tsx` |
| Desktop sidebar | `components/discovery/surfaces/DesktopRightSidebarSurfaceStack.tsx` |

Detail placement: after `ProductAcceptedBadgesSection`, before `ProductSaleAboutSection` / trust — aligns with 4E slot between value exchange and trust.

---

## Known gaps (acceptable for 4F)

| Gap | Follow-up |
|-----|-----------|
| Distance not geo-computed in API | Uses null / future geo pass |
| Desired exchange only from REQUEST `specializations` | API field for barter wants |
| ProfileSurfaceStack not wired | ProfileV2 is canonical |
| No mobile feed band | Phase 4G |

---

## References

- [MARKETPLACE_EXCHANGE_SUGGESTIONS.md](../architecture/MARKETPLACE_EXCHANGE_SUGGESTIONS.md)
- [EXCHANGE_SURFACE_MATRIX.md](./EXCHANGE_SURFACE_MATRIX.md)
- [MARKETPLACE_EXCHANGE_PHASE4F.md](../progress/MARKETPLACE_EXCHANGE_PHASE4F.md)
