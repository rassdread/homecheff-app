# Trust Badge Normalization (Phase 2B-F)

**Date:** 2026-07-06  
**Module:** `lib/discovery/trust/trust-badge-utils.ts`

---

## Exposed on discovery trust

Only **TRUST** display tier badges (`badgeDisplayTier(slug) === 'TRUST'`):

| Slug | Tier floor | Role |
|------|------------|------|
| `eerste-afspraak` | Seller → Active (2) | First deal milestone |
| `eerste-verkoop` | Seller → Active (2) | First sale milestone |
| `eerste-review` | Seller → Reviewed (3) | First review milestone |
| `betrouwbare-verkoper` | Seller → Established (4) | Trusted seller |
| `betrouwbare-bezorger` | Courier → Established (4) | Trusted courier |
| `vaste-klant` | Buyer → Expert (5) | Repeat buyer |

Primary discovery trust slugs (Phase 2B spec):

- `eerste-afspraak`
- `betrouwbare-verkoper`
- `betrouwbare-bezorger`
- `vaste-klant`

Tier-floor badges (`eerste-review`, `eerste-verkoop`) are included when TRUST class but used for tier derivation floors, not ranking scores.

---

## Excluded from discovery trust

| Category | Examples | Reason |
|----------|----------|--------|
| Achievement badges | streaks, milestones (non-trust) | Not trust evidence |
| Community badges | social participation | Not order-gated |
| HCP badges | profile boost, featured | Gamification — forbidden signal |

Filtering: `filterTrustBadges()` on wire badges; `filterTrustBadgeSlugs()` on DB slugs in batch fetch.

---

## Mapping flow

```
UserBadge (DB) → badge.slug
  → filterTrustBadgeSlugs()
  → derive-trust-tier badge floors
  → filterTrustBadges(author-badge-summaries chips)
  → discovery.trust.trustBadges
```

UI may still show achievement badges on `user.badges` / `seller.badges` — discovery trust exposes TRUST class only.
