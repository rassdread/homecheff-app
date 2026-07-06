# Exchange Signal Matrix — Audit

**Phase:** 4D  
**Date:** 2026-07-06

---

## Signals

| Kind | Trigger | Strength |
|------|---------|----------|
| `EXACT_DESIRED_MATCH` | `offerMatchesDesired.length > 0` | high |
| `STRONG_CATEGORY_OVERLAP` | ≥2 shared main categories OR category score ≥ 0.66 | medium–high |
| `POTENTIAL_BARTER_OPPORTUNITY` | Both barter-open + taxonomy overlap | medium |
| `MUTUAL_EXCHANGE_READINESS` | `mutualBarterReady === true` | high |
| `FUTURE_RECOMMENDATION_READY` | Score ≥ 60, trust ≥ 0.4, not blocked | medium–high |

---

## Score signal matrix (weights)

| Signal | Weight | Source |
|--------|--------|--------|
| `categoryOverlap` | 0.22 | Shared main categories / 3 |
| `subcategoryOverlap` | 0.28 | Shared ids / union size |
| `desiredExchangeOverlap` | 0.25 | Offer↔want pairs / 2 |
| `distanceScore` | 0.10 | Inverse km (cap 25 km) |
| `availabilityScore` | 0.05 | Active + future dates |
| `trustEligibilityScore` | 0.05 | `DiscoveryTrustContract.sellerTier` |
| `recencyScore` | 0.05 | Listing age |

**Output:** 0–100 via `computeExchangeMatchScore()`.

---

## Forbidden inputs

Must never appear in score payload:

- `viewCount`
- `hcpPoints`
- `followerCount` / `fansCount`
- `workspacePropsCount` / `itemPropsCount`
- `blendedRating` / `averageRating`
- `reputationScore`
- `feedRankBoost` / `sponsoredBoost`

Validated by `scorePayloadIsClean()` and `FORBIDDEN_EXCHANGE_SCORE_SIGNALS`.

---

## Future surfaces (4E+)

| Surface | Signals shown |
|---------|---------------|
| Profile module | Top 1–3 matches |
| Messages | Match context on propose |
| Admin | Graph integrity audit |

**Not** discovery feed inserts.

---

## i18n keys

`marketplace.exchange.signals.*` (NL + EN)

---

## Code

- `lib/marketplace/exchange/exchange-signals.ts`
- `lib/marketplace/exchange/exchange-match-score.ts`
