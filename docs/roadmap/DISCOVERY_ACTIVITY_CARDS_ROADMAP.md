# Discovery Activity Cards Roadmap

---

## Phase 3A — Architecture (current)

**Delivered:**
- Taxonomy (7 categories, 24 cards)
- Trigger matrix + pure eligibility evaluator
- Visibility matrix (all private)
- Feed slot strategy (`futureSlots.activity_cards`)
- Sidebar + mobile placement design
- Anti-spam rules (client dismiss/cooldown spec)
- Data requirements audit (no HCP)
- Validation script

**Not in scope:** UI, API enablement, schema, ranking changes.

---

## Phase 3B — Implementation

| Workstream | Tasks |
|------------|-------|
| **Data layer** | `fetchActivityCardTriggerState(userId)` — batch signals from existing sources |
| **API** | Extend `/api/feed` or `/api/me/activity-cards` — return eligible cards |
| **Enable slot** | `activity_cards.enabled: true` + `cards[]` in discovery payload |
| **UI — feed** | `ActivityCardBand` component in GeoFeed insert pipeline |
| **UI — sidebar** | `ActivityCardSidebarStack` below filters |
| **Dismiss** | localStorage persistence per `ACTIVITY_CARD_DISMISS_STORAGE` |
| **i18n** | Full `activityCards.*` keys (nl/en) |
| **Analytics** | `activity_card_impression`, `activity_card_cta`, `activity_card_dismiss` events |

**Acceptance:** Logged-in users see ≤2 feed cards; guests see none; no HCP triggers.

---

## Phase 3C — Personalization hooks

| Hook | Description |
|------|-------------|
| **Viewer context** | Specialization overlap → prioritize `configure_accepted_values`, `respond_to_request` |
| **Role-aware** | Seller vs buyer vs courier card pools |
| **Geo-aware** | Boost `local_activation` when `scope=nearby` |
| **Completion sync** | Server dismiss when trigger condition clears (e.g. profile complete) |
| **Optional schema** | `UserActivityCardState` for cross-device dismiss (if product approves) |

**Explicitly not in 3C:** Collaborative filtering, ML ranking, recommendation engine merge.

---

## Dependencies

- Phase 2E feed contract (`discovery.futureSlots`)
- ProfileV2 completeness (`computeCompletenessItems`)
- DiscoveryTrustContract (Phase 2B)
- Existing user-action-center patterns (reference only — separate module)

---

## Validation

```bash
npx tsx scripts/validate-activity-cards.ts
npx tsx scripts/validate-discovery-feed.ts
```
