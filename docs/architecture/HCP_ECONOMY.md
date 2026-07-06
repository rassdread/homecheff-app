# HCP Economy

**Phase:** 3K — Foundation  
**Status:** Implemented (contracts + rules; no ledger payout wiring)  
**Last updated:** 2026-07-06  
**Builds on:** Activations 3G, Opportunity Economy 3I–3J

---

## North star

**HCP may reward real participation** in activations and opportunities — badges, milestones, optional points — without ever influencing discovery ranking, trust tiers, reviews, seller reputation, or visibility.

```
Verified completion  →  HCP reward contract  →  Recognition (+ optional HCP)  →  Sidebar plan
```

**Hard rule:** HCP is never an eligibility gate for discovery surfaces.

---

## Reward categories (7)

`ACTIVATION` · `COMMUNITY` · `PARTNER` · `WORKSHOP` · `COURIER` · `HELPER` · `EVENT`

---

## Reward actions (12)

| Action | Typical source |
|--------|----------------|
| `COMPLETE_ACTIVATION` | Real-world activation completion |
| `HELP_NEIGHBOR` | Practical neighborhood activations |
| `COMMUNITY_HELPER_COMPLETION` | Community support / helper opportunities |
| `HOST_WORKSHOP` | Workshop host opportunity |
| `BECOME_PARTNER` | Partner opportunity |
| `BECOME_AMBASSADOR` | Ambassador opportunity |
| `BECOME_COURIER` | Courier opportunity |
| `INVITE_BUSINESS` | Local business inviter |
| `INVITE_SPORTS_CLUB` | Sports club inviter |
| `INVITE_SCHOOL` | School inviter |
| `INVITE_MUNICIPALITY` | Municipality inviter |
| `ORGANIZE_EVENT` | Event organizer |

---

## Limits

Per category defaults in `CATEGORY_LIMIT_DEFAULTS`:

| Category | Daily | Weekly | Cooldown |
|----------|-------|--------|----------|
| ACTIVATION | 3 | 10 | 4h |
| HELPER | 2 | 5 | 8h |
| PARTNER | 1 | 3 | 24h |
| WORKSHOP | 1 | 2 | 48h |
| COURIER | 2 | 6 | 12h |
| COMMUNITY | 2 | 8 | 6h |
| EVENT | 1 | 2 | 72h |

Duplicate suppression: one award per action per evaluation; per-category daily caps in session resolver.

---

## Anti-gaming

Blocked patterns: self-referral, fake workshop loops, review farming, invitation spam, trust manipulation, velocity farming.

---

## Recognition (allowed)

Badges, milestones, streaks, community status, achievement history, optional HCP.

**Forbidden:** trust boosts, ranking boosts, visibility boosts.

---

## Forbidden HCP effects

`feed_rank_boost` · `trust_tier_boost` · `review_boost` · `seller_reputation_boost` · `visibility_boost` · `recommendation_boost` · `trust_manipulation` · `discovery_section_boost`

---

## Sidebar integration model

`HcpSidebarIntegrationPlan`:

- `progressPercent`
- `nextMilestone`
- `currentStreak`
- `recommendedAction`
- `communityAchievements`
- `dailyHcpEarned` / `weeklyHcpEarned` / `dailyCapRemaining`

Built via `buildHcpSidebarIntegrationPlan()` — UI wiring on `/mijn-hcp` is a follow-up.

---

## Code layout

```
lib/hcp/economy/
  hcp-reward-contract.ts
  hcp-reward-rules.ts
  hcp-activation-rewards.ts
  hcp-opportunity-rewards.ts
  hcp-recognition.ts
  hcp-sidebar-integration.ts
  resolve-hcp-economy.ts
  index.ts
```

---

## Boundaries

| In scope (3K) | Out of scope |
|---------------|--------------|
| Contracts, limits, anti-gaming | Prisma ledger / `award-hcp` wiring |
| Activation + opportunity reward maps | Ranking / trust engine changes |
| Sidebar integration **model** | Sponsored / recommendations |
| Validation script | Discovery section changes |

---

## References

- [HCP_REWARD_MATRIX.md](../audits/HCP_REWARD_MATRIX.md)
- [HCP_ANTI_GAMING.md](../audits/HCP_ANTI_GAMING.md)
- [DISCOVERY_HCP_PHASE3K.md](../progress/DISCOVERY_HCP_PHASE3K.md)
