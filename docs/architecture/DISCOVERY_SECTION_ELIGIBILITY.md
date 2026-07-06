# Discovery Section Eligibility

**Version:** V1 (Discovery Phase 2A)  
**Last updated:** 2026-07-06

**Status:** Definitions only — no sections implemented.

Each section specifies **required evidence** from `DiscoveryReadModel` + `DiscoveryTrustContract`. Phase 2B implements section builders against these rules.

---

## trusted_makers

**Purpose:** Surface sellers with proven deal/product trust.

| Requirement | Threshold |
|-------------|-----------|
| `trust.sellerTier` | ≥ 4 (Established) |
| `trust.product.reviewCount` + `trust.deal.reviewCount` | ≥ 3 combined |
| `readModel.isActive` | true |
| `readModel.listingKind` | not INSPIRATION |
| Anti-gaming | Exclude tier inflated by reciprocal-only reviews |

**Sort (Phase 2B):** deal review count → product review count → repeat customers (limited)

---

## top_rated

**Purpose:** Highlight strong per-channel performance (not blended stars).

| Requirement | Threshold |
|-------------|-----------|
| Channel | At least one of product/deal with `reviewCount ≥ 5` |
| Display | Per-channel ★ from profile trust API |
| Rank | By channel review count, not average |
| Exclude | INSPIRATION listings |

**Note:** Section title is marketing copy — internally uses **review volume + tier**, not a single "top rated" composite.

---

## nearby

**Purpose:** Geographic relevance.

| Requirement | Threshold |
|-------------|-----------|
| `readModel.distanceKm` | ≤ viewer radius (default 25 km) |
| `readModel.city` or coords | present |
| Gate | `sellerTier ≥ 1` |

**Sort:** distance ascending → recency tie-break

---

## new_creators

**Purpose:** Cold-start visibility for legitimate new sellers.

| Requirement | Threshold |
|-------------|-----------|
| `trust.sellerTier` | ≤ 2 |
| `readModel.createdAt` | within 30 days |
| Media | `coverImage` or `imageCount ≥ 1` |
| Anti-spam | description length ≥ 20 chars |

**Sort:** recency only — no engagement signals

---

## accepts_your_values

**Purpose:** Barter / values alignment (personalized).

| Requirement | Threshold |
|-------------|-----------|
| Viewer | logged in with known specializations or values |
| `readModel.acceptedSpecializations` | overlaps viewer values |
| `readModel.barterOpenness` | BARTER_ONLY or MONEY_AND_BARTER |
| Gate | `sellerTier ≥ 2` |

**Sort:** overlap count → distance

---

## trending

**Purpose:** Momentum without raw view ranking.

| Requirement | Threshold |
|-------------|-----------|
| Recency | created or updated within 7 days |
| Engagement | `social.favoriteCount ≥ 2` (capped) |
| Trust floor | `sellerTier ≥ 2` |
| Exclude | tier 0 spam listings |

**Sort:** favorites (capped) + recency — **no viewCount**

---

## recommended_for_you

**Purpose:** Personalization slot (Phase 2C+).

| Requirement | Threshold |
|-------------|-----------|
| Viewer | session with specialization prefs or follow graph |
| Signals | specialization overlap, follows, past favorites |
| Forbidden | HCP, views, blended rating as sort keys |

**Sort:** personalize only — not global default feed order

---

## Section → contract fields

| Section | Primary fields |
|---------|----------------|
| trusted_makers | `trust.sellerTier`, review counts, `repeatCustomers` |
| top_rated | channel review counts |
| nearby | `distanceKm`, `city` |
| new_creators | `createdAt`, `sellerTier`, media |
| accepts_your_values | `acceptedSpecializations`, `barterOpenness` |
| trending | `favoriteCount`, `createdAt` |
| recommended_for_you | viewer overlap + `specializations` |

---

## Not in Phase 2A scope

- Gezocht tab / REQUEST browse section
- Wilson scoring
- ML recommendations
- Unified `/api/discovery` endpoint
