# Trust Signal Audit

**Version:** V1 (Discovery Phase 2A)  
**Last updated:** 2026-07-06

## Purpose

Inventory every trust-adjacent signal in HomeCheff and classify it for ranking readiness. Phase 2B ranking must consume only signals approved in `DISCOVERY_RANKING_SIGNAL_MATRIX.md`.

---

## Signal inventory

| Signal | Source | Classification | Trust channel? | In DiscoveryReadModel? | Populated today? |
|--------|--------|----------------|----------------|------------------------|------------------|
| **ProductReview** | `ProductReview` | TRUST | Product | `trust.productReviewCount` | ✅ products API |
| **DealReview** | `DealReview` | TRUST | Deal | `trust.dealReviewCount` | ❌ contract only |
| **CourierReview** | `DeliveryReview` | TRUST | Courier | `trust.courierReviewCount` | ❌ contract only |
| **CompletedDeals** | `CommunityOrder` COMPLETED | TRUST | Deal lifecycle | `trust.completedDeals` | ❌ profile only |
| **CompletedDeliveries** | `CourierAssignment` COMPLETED | TRUST | Courier lifecycle | `trust.completedDeliveries` | ❌ profile only |
| **RepeatCustomers** | Derived groupBy on deals | TRUST | Deal loyalty | Not in read model | Profile only |
| **ResponseTime** | `lib/communication/response-time.ts` | QUALITY | — | — | Seller profile UI |
| **Followers** | `Follow` / `FanRequest` | ENGAGEMENT | — | `social.fansCount` | Partial |
| **Favorites** | `Favorite` | ENGAGEMENT | — | `social.favoriteCount` | ✅ |
| **WorkspaceProps** | `WorkspaceContentProp` | ENGAGEMENT | — | `social.workspacePropsCount` | Stats API |
| **Views** | `AnalyticsEvent` VIEW | ENGAGEMENT | — | — | Legacy `viewCount` |
| **HCP** | `HcpEvent`, `UserHcpStats` | GAMIFICATION | — | — | Profile HCP |
| **Badges** | `UserBadge` | GAMIFICATION / TRUST | Trust subset | `trust.trustBadges` | ✅ products |
| **AccountAge** | `User.createdAt` | IDENTITY | — | — | Profile trust |
| **KVK** | `SellerProfile.kvk`, `Business.kvkNumber` | IDENTITY | — | — | Seller payload |
| **Specializations** | `Product.specializations[]` | MATCHING | Taxonomy | `specializations` | ✅ |
| **AcceptedValues** | `Product.acceptedSpecializations[]` | MATCHING | Barter/values | `acceptedSpecializations` | ✅ |
| **DishReview** | `DishReview` | QUALITY | Community feedback | — | **Never trust** |
| **BarterOpenness** | `Product.barterOpenness` | MATCHING | — | `barterOpenness` | ✅ |

---

## Classification definitions

| Class | Meaning | Ranking default |
|-------|---------|-----------------|
| **TRUST** | Transaction-gated evidence of reliable exchange | May rank / gate per channel |
| **QUALITY** | Subjective feedback without transaction gate | Display only; dish = never trust |
| **ENGAGEMENT** | Attention / saves / follows | Personalize or display; capped for rank |
| **GAMIFICATION** | HCP, non-trust badges | Display only — never rank |
| **IDENTITY** | Verification, age, business registration | Gate only — never sort key |
| **MATCHING** | Taxonomy overlap for barter/values/location | Personalize + gate sections |

---

## Per-channel review models

| Model | Gate | Blends with |
|-------|------|-------------|
| ProductReview | Order / OrderItem | Nothing |
| DealReview | CommunityOrder COMPLETED | Nothing |
| DeliveryReview | DeliveryOrder or CourierAssignment COMPLETED | Nothing |
| DishReview | None required | **Excluded from all trust** |

See `docs/architecture/REVIEW_ARCHITECTURE.md`.

---

## Existing code paths

| Path | Role |
|------|------|
| `lib/trust/profile-trust-summary.ts` | Profile SSOT — per-channel averages + counts (display) |
| `lib/discovery/contracts/discovery-read-model.ts` | Listing trust block — counts only |
| `lib/discovery/contracts/discovery-trust-contract.ts` | Phase 2A — tiers + repeat customers |
| `lib/stats/compute-user-public-stats.ts` | Seller public stats — parallel to discovery |
| `lib/gamification/trust-hcp.ts` | HCP on trust events — not ranking |

---

## Gaps before Phase 2B enrichment

1. Listing APIs do not populate deal/courier/completed counts on `discovery.trust`
2. `DiscoveryTrustContract` (tiers) not yet attached to API payloads
3. `repeatCustomers` and `responseTime` not on discovery read model
4. Legacy `averageRating` still on ~50+ files (see `TRUST_CONSUMER_DEBT.md`)

---

## MUST NEVER use for ranking

- Blended `averageRating` across channels
- `reputationScore` (does not exist — do not introduce)
- HCP points
- Raw follower count as sort key
- View count without dedupe
- Workspace props
- DishReview / item props
- Account age as popularity sort
