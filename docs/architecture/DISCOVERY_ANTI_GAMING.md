# Discovery Anti-Gaming Rules

**Version:** V1 (Discovery Phase 2A)  
**Last updated:** 2026-07-06

Rules that Phase 2B ranking **must** enforce. Specification only — no implementation in Phase 2A.

---

## Global principles

1. **Trust signals require transaction gates** — reviews without completed orders/deals/deliveries do not count.
2. **Channels never blend** — gaming one channel must not inflate another.
3. **Engagement ≠ trust** — saves, views, follows are not trust.
4. **Gamification ≠ trust** — HCP and non-trust badges never rank.

---

## Signal-specific rules

### Followers never rank

- `Follow` / fan count may **personalize** ("makers you follow") or **display** on profile.
- **Must not** be a global sort key or trust tier input.
- FanRequest gated flow prevents bulk bot follows (existing product behavior).

### HCP never ranks

- `HcpEvent` points reflect engagement and milestones.
- **Display** on profile and HCP leaderboard only.
- **Forbidden** in `DiscoveryRankingInput` and all sort functions.

### Views require dedupe

- Raw `AnalyticsEvent` VIEW counts are inflated by refreshes and bots.
- Ranking may use **deduped unique viewers** (e.g. per user per listing per 24h) if ever allowed — default **display only**.
- Legacy `viewCount` on API payloads is not ranking-ready without dedupe pipeline.

### Favorites capped

- `Favorite` saves may contribute **limited** tie-break weight (see signal matrix: `favorite_count_limited`).
- Cap: max equivalent of 5 favorites worth of ranking influence per listing per time window.
- Self-favorites and duplicate accounts must be excluded (same userId).

### Workspace props never trust

- `WorkspaceContentProp` is studio engagement only.
- **Must not** appear in trust tier, trust contract, or ranking sort.
- Distinct from `Favorite` on products/dishes (Phase 0).

### Dish feedback never trust

- `DishReview` is community feedback on inspiration content.
- **Excluded** from ProductReview, DealReview, DeliveryReview aggregates.
- **Must not** gate commerce or appear in `DiscoveryTrustContract`.

### Review circles

- Users who only review each other (closed loop ≤3 accounts) are flagged for manual review.
- Phase 2B: exclude reciprocal review pairs within 14 days from ranking weight (implementation TBD).

### Reciprocal reviews

- DealReview where buyer and seller review each other on same order is **allowed** (both participated).
- ProductReview self-dealing (same household accounts) detected via shared payment fingerprint — exclude from rank weight.

### Cold-start abuse

- New accounts flooding listings without verification stay at **Tier 0–1**.
- `new_creators` section uses recency + tier cap ≤2 — prevents empty spam listings from dominating.

### Creator spam

- Rate limits on listing creation (existing sell flows).
- Discovery ranking ignores listings with no media + no description + tier 0 beyond local browse.

---

## Enforcement checklist (Phase 2B)

- [ ] Ranking module imports `DISCOVERY_TRUST_FORBIDDEN_SIGNALS` and fails CI if referenced
- [ ] No sort function reads `UserHcpStats.totalScore`
- [ ] Favorites influence capped in ranking config
- [ ] View dedupe job exists before any view-based section

---

## Related docs

- `docs/architecture/REVIEW_ARCHITECTURE.md`
- `docs/architecture/DISCOVERY_RANKING_SIGNAL_MATRIX.md`
- `docs/audits/MARKETPLACE_CONFLICTS.md` (C14 — HCP vs trust)
