# Activity Card Eligibility Audit

**Phase:** 3B  
**Last updated:** 2026-07-06

---

## Engine

`resolveActivityCardContracts(input, cooldownState)` — pure function, no ranking.

Eligibility snapshot built server-side via `fetchActivityCardEligibilityInput(userId)`.

---

## Type → trigger mapping

| ActivityCardType | Shows when |
|------------------|------------|
| `PROFILE_COMPLETION` | `completenessPercent < 100` |
| `REQUEST_REVIEW` | Completed order (DELIVERED/SHIPPED) without buyer review |
| `SHARE_QR` | Logged in + profile photo present |
| `NEARBY_HELP_REQUEST` | Location set + nearby REQUEST listings in feed pool |
| `UPLOAD_FIRST_LISTING` | Seller role + `productCount === 0` |
| `UPLOAD_FIRST_INSPIRATION` | `dishCount === 0` |
| `COMPLETE_WORKSPACE` | Seller role + no workplace photos |
| `VERIFY_ACCOUNT` | Email not verified (not dismissible) |
| `ADD_WORKSHOP` | Has listings, no KNOWLEDGE/workshop product |
| `BECOME_COURIER` | No `DeliveryProfile` |
| `INVITE_FRIEND` | Logged in (community activation) |

---

## Guests

No cards — `loggedIn: false` returns empty set.

---

## Forbidden signals

Activity eligibility **must not** use:

- HCP points / tiers
- Follower counts as ranking
- View counts
- Blended ratings
- Recommendation scores

See `FORBIDDEN_ACTIVITY_CARD_SIGNALS`.

---

## Priority order (tie-break)

Higher `priority` number wins; stable sort by `type` string.

Critical paths: `VERIFY_ACCOUNT` (98), `REQUEST_REVIEW` (95), `PROFILE_COMPLETION` (100).

---

## Cooldown interaction

After show or dismiss, same `type` suppressed for **7 days** (client + server contract).

Per-type `cooldownDays` applies on dismiss for extended suppression.

---

## Test matrix

```bash
npx tsx scripts/validate-activity-cards.ts
```

Covers: no listings, no photo, review due, courier disabled, guest block, repeat cooldown.
