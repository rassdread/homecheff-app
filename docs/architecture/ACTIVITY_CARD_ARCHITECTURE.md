# Activity Card Architecture

**Phase:** 3B Foundation  
**Status:** Enabled via `discovery.futureSlots.activity_cards`

---

## Purpose

Activity Cards are **contextual actions** for community activation — explicitly **not**:

- Advertisements
- Recommendations
- Discovery ranking
- Sponsored placements
- Trust engine inputs

They complement discovery sections without entering section builders, ranking, or trust pipelines.

---

## Module layout

```
lib/discovery/activity-cards/
├── activity-card-contract.ts          # ActivityCardContract + 11 types
├── activity-card-type-registry.ts     # Type definitions + eligibility
├── resolve-activity-card-contracts.ts # Eligibility engine
├── fetch-activity-card-eligibility.ts # Server snapshot (Prisma)
├── build-activity-cards-feed-slot.ts  # futureSlots payload
├── activity-card-insertion-planner.ts # Mobile 4/12/24, desktop between sections
├── activity-card-client-storage.ts    # Dismiss + session caps
├── activity-card-analytics.ts         # shown / dismissed / clicked / completed
├── activity-card-anti-spam.ts         # Cooldown policy
└── (3A) activity-card-taxonomy.ts     # Extended taxonomy — legacy triggers

components/discovery/activity-cards/
├── ActivityCard.tsx
├── ActivityCardFeedBand.tsx
└── index.ts

lib/feed/activity-card-feed-rows.ts    # Row interleaving (not in sections)
```

---

## ActivityCardContract

| Field | Description |
|-------|-------------|
| `id` | Stable instance id (`TYPE:userId`) |
| `type` | One of 11 `ActivityCardType` values |
| `priority` | Numeric priority (higher first) |
| `titleKey` / `descriptionKey` | i18n keys |
| `icon` | Lucide icon name |
| `actionLabelKey` / `actionHref` | CTA |
| `dismissible` | Show dismiss control |
| `cooldownDays` | Per-card dismiss cooldown |
| `eligibility` | `{ eligible, reason }` metadata |

---

## Supported types (3B)

`PROFILE_COMPLETION`, `REQUEST_REVIEW`, `SHARE_QR`, `NEARBY_HELP_REQUEST`, `UPLOAD_FIRST_LISTING`, `UPLOAD_FIRST_INSPIRATION`, `COMPLETE_WORKSPACE`, `VERIFY_ACCOUNT`, `ADD_WORKSHOP`, `BECOME_COURIER`, `INVITE_FRIEND`

---

## Feed integration

```json
{
  "discovery": {
    "futureSlots": [{
      "kind": "activity_cards",
      "enabled": true,
      "specVersion": 2,
      "cards": [...],
      "maxVisible": 1,
      "insertion": { "maxPerSession": 2, ... },
      "mobileSlots": [4, 12, 24],
      "desktopBetweenSections": { "betweenSections": true, "maxBands": 2 }
    }]
  }
}
```

**Never** inside `discovery.sections`, ranking engine, or trust enrichment.

---

## Anti-spam

| Rule | Value |
|------|-------|
| Max per session | 2 |
| Visible at once | 1 |
| Repeat same card | 7 days |
| Per-card dismiss cooldown | From `cooldownDays` on contract |

---

## Analytics

Events (no ranking impact): `ACTIVITY_CARD_SHOWN`, `ACTIVITY_CARD_DISMISSED`, `ACTIVITY_CARD_CLICKED`, `ACTIVITY_CARD_COMPLETED` → `/api/onboarding/analytics`

---

## Validation

```bash
npx tsx scripts/validate-activity-cards.ts
npm run lint
npm run build
```
