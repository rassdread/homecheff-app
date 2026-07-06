# Discovery Activity Cards Phase 3A — Complete

**Status:** Architecture + audit — implementation in Phase 3B

---

## Delivered

- [x] Part 1 — Activity card taxonomy (7 categories, 24 cards)
- [x] Part 2 — Trigger matrix + evaluator
- [x] Part 3 — Visibility matrix (all private, no SEO)
- [x] Part 4 — Feed integration plan (`futureSlots.activity_cards`)
- [x] Part 5 — Sidebar + mobile placement design
- [x] Part 6 — Anti-spam rules (caps, cooldowns, dismiss keys)
- [x] Part 7 — Data requirements (no HCP)
- [x] Part 8 — Roadmap 3A / 3B / 3C

---

## Key files

| File | Role |
|------|------|
| `lib/discovery/activity-cards/` | Canonical module |
| `lib/feed/discovery-feed-contract.ts` | Extended activity_cards slot spec |
| `docs/architecture/DISCOVERY_ACTIVITY_CARDS.md` | Architecture reference |
| `scripts/validate-activity-cards.ts` | CI validation |

---

## Not changed

- No ranking engine changes
- No sidebar UI redesign
- No schema migrations
- `activity_cards.enabled` remains `false`
