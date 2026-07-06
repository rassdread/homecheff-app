# Discovery Ranking Signal Matrix

**Version:** V1 (Discovery Phase 2A)  
**Last updated:** 2026-07-06

Contract: `lib/discovery/contracts/discovery-ranking-contract.ts`

**Legend:** YES = allowed | NO = forbidden | LIMITED = allowed with caps/rules | GATE = eligibility only, not sort key

---

## Trust signals

| Signal | Can rank? | Can gate? | Can personalize? | Can display? | Notes |
|--------|-----------|-----------|------------------|--------------|-------|
| Product reviews (count) | LIMITED | YES | NO | YES | Channel-specific; verified only |
| Product reviews (avg ★) | NO | LIMITED | NO | YES | Per-channel display; never blend |
| Deal reviews (count) | YES | YES | NO | YES | Service/task/workshop/request |
| Deal reviews (avg ★) | NO | LIMITED | NO | YES | Display on profile |
| Courier reviews (count) | YES | YES | NO | YES | Courier matching only |
| Courier reviews (avg ★) | NO | LIMITED | NO | YES | Courier profile |
| Completed deals | LIMITED | YES | NO | YES | Volume cap in anti-gaming |
| Completed deliveries | LIMITED | YES | NO | YES | Courier context only |
| Repeat customers | LIMITED | YES | NO | YES | Tier 4+ evidence |
| Trust badges (trust-tier) | NO | YES | NO | YES | Floor tier, not sort score |
| Trust tier (seller) | LIMITED | YES | NO | YES | Coarse ordinal gate |
| Trust tier (courier) | LIMITED | YES | NO | YES | Courier routes only |
| Trust tier (buyer) | NO | YES | YES | YES | Request/barter context |

---

## Engagement signals

| Signal | Can rank? | Can gate? | Can personalize? | Can display? | Notes |
|--------|-----------|-----------|------------------|--------------|-------|
| Favorites | LIMITED | NO | YES | YES | Capped tie-break; anti-gaming |
| Followers | NO | NO | YES | YES | **Never rank** |
| Views | NO | NO | LIMITED | YES | Dedupe required for any rank use |
| Workspace props | NO | NO | NO | YES | Studio only — **never trust** |

---

## Gamification signals

| Signal | Can rank? | Can gate? | Can personalize? | Can display? | Notes |
|--------|-----------|-----------|------------------|--------------|-------|
| HCP points | NO | NO | NO | YES | **Never rank** |
| Achievement badges | NO | NO | NO | YES | Non-trust badges |
| Community badges | NO | NO | NO | YES | Display on profile/cards |

---

## Identity & matching signals

| Signal | Can rank? | Can gate? | Can personalize? | Can display? | Notes |
|--------|-----------|-----------|------------------|--------------|-------|
| Account age | NO | LIMITED | NO | YES | Gate verified sellers only |
| KVK / business | NO | YES | NO | YES | Identity gate, not popularity |
| Specializations | NO | YES | YES | YES | Section: skill match |
| Accepted specializations | NO | YES | YES | YES | Section: accepts_your_values |
| Barter openness | NO | YES | YES | YES | Barter matching |
| Distance (km) | YES | YES | YES | YES | `nearby` section |
| Recency (createdAt) | LIMITED | NO | YES | YES | `new_creators`, tie-break |
| ListingKind | NO | YES | YES | YES | Filter, not quality score |
| Response time median | NO | YES | NO | YES | Gate "responsive" badge only |

---

## Forbidden composite signals

| Signal | All uses |
|--------|----------|
| Blended averageRating | **FORBIDDEN** |
| reputationScore | **FORBIDDEN** (do not create) |
| DishReview aggregate | **FORBIDDEN** |
| Item props / propsCount | **FORBIDDEN** |

---

## Phase 2B ranking input

Only `DiscoveryRankingInput` (`readModel` + `trust` + optional `viewer`) may feed ranking functions.

```typescript
// lib/discovery/contracts/discovery-ranking-contract.ts
type DiscoveryRankingInput = {
  readModel: DiscoveryReadModel;
  trust: DiscoveryTrustContract;
  viewer?: { distanceKm?, acceptedSpecializationOverlap? };
};
```

No parallel reads from `/api/feed` legacy shapes or `averageRating` fields.
