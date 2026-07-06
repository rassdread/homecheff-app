# Trust Tier Specification

**Version:** V1 (Discovery Phase 2A)  
**Last updated:** 2026-07-06  
**Status:** Specification only — no scoring implementation

## Purpose

Define capability-specific trust tiers that ranking, gating, and discovery sections may reference. **No composite score. No `reputationScore` field.**

Contract: `lib/discovery/contracts/discovery-trust-contract.ts`

---

## Tier scale (all capabilities)

| Tier | Name | Meaning |
|------|------|---------|
| **0** | Unknown | No evidence or account too new to assess |
| **1** | Present | Profile/listing exists; no completed trust transactions |
| **2** | Active | At least one completed transaction in capability |
| **3** | Reviewed | At least one verified review in capability channel |
| **4** | Established | Multiple reviews + repeat evidence |
| **5** | Expert | Sustained high-volume trust evidence + trust badges |

Tiers are **ordinal labels**, not numeric scores. Phase 2B may sort by tier only as a coarse gate, not as a fine-grained popularity metric.

---

## Seller tier

Evidence from **product** and **deal** channels (never blended into one average).

| Tier | Requirements (all must be met where applicable) |
|------|-----------------------------------------------------|
| 0 | No seller profile or no active listings |
| 1 | Active seller profile or ≥1 active listing |
| 2 | ≥1 completed deal **or** ≥1 verified product sale (Order COMPLETED) |
| 3 | ≥1 ProductReview **or** ≥1 DealReview (verified, submitted) |
| 4 | ≥3 reviews across product+deal **or** ≥2 repeat customers **or** badge `betrouwbare-verkoper` |
| 5 | ≥10 product+deal reviews **and** ≥3 repeat customers **or** ≥5 completed deals as seller with ≥4★ median in deal channel (display only — tier assignment uses counts + badges, not blended stars) |

**ListingKinds:** PRODUCT, SERVICE, TASK, WORKSHOP, COACHING, REQUEST (seller side)

---

## Buyer tier

Evidence from completed purchases and deal participation.

| Tier | Requirements |
|------|--------------|
| 0 | Unknown buyer |
| 1 | Registered account |
| 2 | ≥1 completed order or community deal as buyer |
| 3 | ≥1 review left (any trust channel) |
| 4 | ≥2 completed deals as buyer |
| 5 | ≥3 completed deals + badge `vaste-klant` or repeat seller relationships |

Buyers are not ranked in marketplace listing feeds; buyer tier gates **request matching** and **barter trust** in Phase 2B+.

---

## Courier tier

Evidence from **DeliveryReview** and **CourierAssignment** only.

| Tier | Requirements |
|------|--------------|
| 0 | No delivery profile |
| 1 | Delivery profile created |
| 2 | ≥1 completed courier assignment |
| 3 | ≥1 DeliveryReview received |
| 4 | ≥3 delivery reviews **or** badge `betrouwbare-bezorger` |
| 5 | ≥10 completed deliveries + ≥5 delivery reviews |

**Never** mix courier tier with seller product tier on the same badge or sort key.

---

## Trust badges mapping

Trust-tier badges (from `lib/gamification/badge-priority.ts`) inform tier floor, not ranking score:

| Badge slug | Minimum tier implication |
|------------|-------------------------|
| `eerste-review` | Seller ≥3 (product channel) |
| `eerste-verkoop` | Seller ≥2 |
| `eerste-afspraak` | Seller ≥2 (deal) |
| `betrouwbare-verkoper` | Seller ≥4 |
| `betrouwbare-bezorger` | Courier ≥4 |
| `vaste-klant` | Buyer ≥5 |

Achievement/community badges **do not** affect tiers.

---

## Explicit prohibitions

- No `reputationScore` or headline blended average
- No Wilson score in tier assignment (Phase 2B may use for display sections only if separately specified)
- No HCP contribution to tier
- No follower or view contribution to tier
- DishReview never affects any tier

---

## Consumer mapping (future)

| Surface | Tiers used |
|---------|------------|
| `trusted_makers` section | `sellerTier ≥ 4` |
| Courier assignment | `courierTier ≥ 3` |
| Barter matching | `sellerTier ≥ 3` + specialization overlap |
| Cold-start `new_creators` | `sellerTier ≤ 2` + recency |

Implementation deferred to Phase 2B.
