# Opportunity Eligibility Audit

**Phase:** 3I  
**Last updated:** 2026-07-06

---

## Allowed signals

| Signal | Description | Used by |
|--------|-------------|---------|
| `seller_tier` | Viewer seller tier 0–5 | MUNICIPALITY_INVITER |
| `courier_capability` | No delivery profile yet | COURIER |
| `location` | Geo set for viewer | COURIER, COMMUNITY_HELPER, SPORTS_CLUB_INVITER, MUNICIPALITY_INVITER, EVENT_ORGANIZER |
| `completed_deals` | Buyer/seller completed transactions | MUNICIPALITY_INVITER |
| `community_activity` | Neighbours, makers, requests | SPORTS_CLUB_INVITER, SCHOOL_INVITER |
| `workshop_history` | Workshops hosted or nearby | WORKSHOP_HOST, EVENT_ORGANIZER |
| `account_age` | Days since signup | AMBASSADOR, SCHOOL_INVITER |
| `profile_complete` | Profile completeness % | PARTNER, AMBASSADOR |
| `seller_role` | Has seller role | WORKSHOP_HOST, LOCAL_BUSINESS_INVITER |
| `product_count` | Active listings | WORKSHOP_HOST, LOCAL_BUSINESS_INVITER |
| `nearby_requests` | Open help requests in radius | COMMUNITY_HELPER |

---

## Forbidden signals

`hcp_balance` · `hcp_gate` · `follower_count` · `fan_count` · `view_count` · `engagement_score` · `feed_rank_boost` · `affiliate_tier` · `commission_balance`

---

## Per-type eligibility summary

| Type | Key rules |
|------|-----------|
| PARTNER | Not yet selling (no products) |
| AMBASSADOR | Account ≥7d; profile ≥50% or has listing |
| COURIER | Location set; no delivery profile |
| WORKSHOP_HOST | Seller with ≥1 product; no workshop listing |
| COMMUNITY_HELPER | Location + nearby requests > 0 |
| LOCAL_BUSINESS_INVITER | Seller with ≥3 products |
| SPORTS_CLUB_INVITER | Location + (sports interest or dishes) |
| SCHOOL_INVITER | Account ≥14d + community activity |
| MUNICIPALITY_INVITER | Seller tier ≥2 + ≥5 completed deals |
| EVENT_ORGANIZER | Workshop history or nearby workshops |

---

## Guest policy

Guests receive **zero** opportunities — all resolvers return `[]` when `loggedIn === false`.

---

## Cooldown interaction

Dismissal uses `dismissCooldownDays`; re-show uses `showCooldownDays`. Lifecycle `archived` suppresses surface display regardless of eligibility.

---

## Input bridge

`buildOpportunityEligibilityFromSurface()` extends `ActivityCardEligibilityInput` with economy-specific fields from feed pool signals (3F pattern).
