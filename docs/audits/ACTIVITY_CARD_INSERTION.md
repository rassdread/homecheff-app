# Activity Card Insertion Audit

**Phase:** 3B  
**Last updated:** 2026-07-06

---

## Slot contract

Insertion uses **`discovery.futureSlots.activity_cards`** only.

Cards are **never** inserted:

- Inside `discovery.sections`
- Via ranking engine reorder
- Via trust enrichment
- As sponsored or recommendation rows

---

## Mobile feed

Insert after **sale row indices** `4`, `12`, `24` (1-based item count).

Implementation: `interleaveMobileActivityCards` in `lib/feed/activity-card-feed-rows.ts`.

GeoFeed renders `activity_card` rows as full-width `ActivityCardFeedBand`.

---

## Desktop feed

Insert **between discovery section bands** (after section heading).

Max **2** activity bands per session (`desktopBetweenSections.maxBands`).

---

## Session limits

| Limit | Value |
|-------|-------|
| `insertion.maxPerSession` | 2 |
| `maxVisible` | 1 |
| Client session store | `hc_activity_card:session` |

`filterCardsForSession` enforces caps before interleaving.

---

## Dedup

- Same card `id` never twice in one payload
- Same `type` not repeated within 7 days (cooldown state)
- Dismissed types excluded for session
- **Not** deduped against discovery listing ids (different row kind)

---

## Out of scope (3B)

- Sidebar stack (`ACTIVITY_CARD_SIDEBAR_PLACEMENT` — future)
- Messages inbox cards
- Profile owner prompts (separate surface)

---

## Validation

```bash
npx tsx scripts/validate-activity-cards.ts
```

Verifies mobile slots `4,12,24`, desktop section insertion, dedupe ids.
