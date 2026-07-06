# Exchange Notification Readiness — Audit

**Phase:** 4E (architecture only)  
**Date:** 2026-07-06  
**Status:** Prepared — no push implementation

---

## Purpose

Define how exchange suggestions graduate to **notifications** in a future phase (4H) without coupling to discovery push, sponsored campaigns, or engagement spam.

**Principle:** Notifications are **high-intent, low-frequency, opt-in** — not a growth hack.

---

## Notification kinds

| Kind ID | Trigger | Example copy (EN) | Min score | Required signal |
|---------|---------|-------------------|-----------|-----------------|
| `NEARBY_ACCEPTS_YOUR_OFFER` | New match: counterparty accepts your offer category within 10 km | “Someone nearby accepts what you offer” | 70 | Category overlap + local |
| `NEW_LOCAL_EXCHANGE` | New eligible match &lt; 5 km, not seen before | “New local exchange opportunity” | 65 | `LOCAL_EXCHANGE` |
| `MUTUAL_EXCHANGE_FOUND` | `mutualBarterReady` becomes true | “Mutual exchange found with [title]” | 75 | `MUTUAL_EXCHANGE_READINESS` |
| `DESIRED_MATCH_FOUND` | Exact desired subcategory match | “A listing matches what you wanted” | 75 | `EXACT_DESIRED_MATCH` |
| `MULTI_STEP_PATH_FOUND` | Chain path length ≥ 2 *(4H)* | “A community exchange path is possible” | 70 | Graph path |

### Deprecated / forbidden notification kinds

| Kind | Reason |
|------|--------|
| `COME_BACK_FOR_BARTER` | Engagement spam |
| `TRENDING_EXCHANGE` | Implies ranking |
| `SPONSORED_EXCHANGE` | Commercial confusion |
| `HCP_EXCHANGE_BONUS` | Economy gamification |
| `NEW_FOLLOWER_EXCHANGE` | Social metric |

---

## Channel architecture

```
resolveExchangeSuggestions()
        ↓
evaluateNotificationEligibility()
        ↓
ExchangeNotificationQueue (future)
        ↓
┌───────────────┬────────────────┬──────────────┐
│ In-app inbox  │ Push (opt-in)  │ Email digest │
│ Always        │ High-intent    │ Weekly opt-in│
└───────────────┴────────────────┴──────────────┘
```

### Channel rules

| Channel | Default | Exchange content |
|---------|---------|------------------|
| In-app inbox | On | All eligible kinds |
| Push | **Off** | `MUTUAL_EXCHANGE_FOUND`, `DESIRED_MATCH_FOUND` only |
| Email | Off | Weekly digest max 5 matches |
| SMS | Off | Never for exchange |

Aligns with [MOBILE_SURFACE_ARCHITECTURE.md](../architecture/MOBILE_SURFACE_ARCHITECTURE.md) S8 — never push generic “come back”.

---

## Eligibility pipeline (future)

```typescript
type ExchangeNotificationCandidate = {
  kind: ExchangeNotificationKind;
  suggestionId: string;
  score: number;
  signals: ExchangeSignalKind[];
  sourceListingId: string;
  targetListingId: string;
  distanceKm: number | null;
  createdAt: string;
};

// Pseudocode — not implemented in 4E
function evaluateNotificationEligibility(
  candidate: ExchangeNotificationCandidate,
  prefs: UserNotificationPrefs,
): 'send' | 'suppress' {
  // 1. User opt-in for exchange push
  // 2. Score >= kind threshold
  // 3. Required signal present
  // 4. Global + per-kind caps
  // 5. Pair not dismissed
  // 6. Both listings still eligible
  // 7. Not same user
}
```

---

## Frequency caps

### Per user

| Cap | Limit |
|-----|-------|
| Push / day | 1 |
| Push / week | 3 |
| In-app / day | 5 |
| Email digest / week | 1 (max 5 items) |
| Same kind / day | 1 |
| Same listing pair / 14 days | 1 notification |

### Per match

| Rule | Value |
|------|-------|
| Min hours between re-notify same pair | 72 |
| Notify only on **new** match or score crossing threshold | +10 points |
| Expired listing | Cancel pending |

### Quiet hours

- Default: 22:00–08:00 local — queue for morning
- User override in settings

---

## User preferences (future settings)

| Preference | Default | Controls |
|------------|---------|----------|
| `exchange.pushEnabled` | `false` | All push |
| `exchange.pushMutualOnly` | `true` | Restrict to mutual + exact desired |
| `exchange.inAppEnabled` | `true` | Inbox items |
| `exchange.emailDigest` | `false` | Weekly email |
| `exchange.maxRadiusKm` | 25 | Local notifications |
| `exchange.snoozeUntil` | null | Global snooze |

**Location:** Settings → Notifications → Exchange opportunities (new section in 4H).

---

## Payload contract (future)

```typescript
type ExchangeNotificationPayload = {
  kind: ExchangeNotificationKind;
  titleKey: string;           // marketplace.exchange.notifications.*
  bodyKey: string;
  bodyParams: {
    listingTitle?: string;
    distanceKm?: number;
    categoryEmoji?: string;
  };
  deepLink: string;           // /product/[id]?exchangeSuggestion=[id]
  suggestionId: string;
  listingIds: [string, string];
  score: number;
  signals: ExchangeSignalKind[];
};
```

### Deep link behaviour

| Tap action | Destination |
|------------|-------------|
| Notification body | Target listing detail + suggestions expanded |
| “View path” (multi-step) | Profile exchange module → chain sheet |

---

## Deduplication with surfaces

| Rule | Behaviour |
|------|-----------|
| User saw suggestion on detail &lt; 1h ago | Suppress push |
| User dismissed pair | Suppress all channels 14 days |
| Shown in sidebar this session | In-app only, no push |
| 3 session dismissals | 24h global snooze all exchange notifications |

Same dedup keys as [EXCHANGE_SURFACE_MATRIX.md](./EXCHANGE_SURFACE_MATRIX.md) caps.

---

## Examples

### Example 1 — Mutual local exchange

| Field | Value |
|-------|-------|
| Viewer | User A — offers `grow.basil` |
| Match | User B — wants `grow.basil`, offers `create.bread` |
| Type | `MUTUAL_EXCHANGE` + `LOCAL_EXCHANGE` |
| Score | 82 |
| Signals | `EXACT_DESIRED_MATCH`, `MUTUAL_EXCHANGE_READINESS` |
| Notification | `MUTUAL_EXCHANGE_FOUND` push (if opt-in) |

### Example 2 — Nearby accepts your category

| Field | Value |
|-------|-------|
| Viewer | User A — accepts 🍳 HomeCheff |
| Match | User C — offers `create.meal` 4 km away |
| Type | `DIRECT_EXCHANGE` + `LOCAL_EXCHANGE` |
| Score | 71 |
| Notification | `NEARBY_ACCEPTS_YOUR_OFFER` in-app only |

### Example 3 — Suppressed

| Field | Value |
|-------|-------|
| Reason | User dismissed pair yesterday |
| Action | No notification until day 14 |

---

## Infrastructure checklist (4H implementation)

| Item | 4E status | 4H action |
|------|-----------|-----------|
| Notification kind enum | Defined here | Add to `lib/notifications/types` |
| i18n `marketplace.exchange.notifications.*` | Planned | Add en/nl |
| User prefs schema | Planned | Prisma / settings API |
| Queue / cron for match diff | — | New job: `exchange-notification-scan` |
| Push provider integration | Existing comms | Wire eligible payloads |
| Admin audit log | — | Log sent/suppressed reasons |
| Validator script | — | `validate-exchange-notifications.ts` |

---

## Security & privacy

| Concern | Mitigation |
|---------|------------|
| Stalker vector | No exact address in copy — distance band only |
| Spam | Caps + opt-in push |
| Wrong user | Auth + own-listing context only |
| Leaked wants | Visitor cannot trigger notifications about private wants |
| Commercial blur | Never use sponsored template IDs |

---

## Out of scope (4E)

- Push delivery code
- Prisma schema changes
- Cron jobs
- Settings UI
- A/B testing notification copy

---

## References

- [MARKETPLACE_EXCHANGE_SUGGESTIONS.md](../architecture/MARKETPLACE_EXCHANGE_SUGGESTIONS.md)
- [EXCHANGE_SURFACE_MATRIX.md](./EXCHANGE_SURFACE_MATRIX.md)
- [EXCHANGE_SIGNAL_MATRIX.md](./EXCHANGE_SIGNAL_MATRIX.md)
- [MOBILE_SURFACE_ARCHITECTURE.md](../architecture/MOBILE_SURFACE_ARCHITECTURE.md)
