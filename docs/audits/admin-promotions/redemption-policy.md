# Redemption Policy

## Limits

| Field | Meaning |
|-------|---------|
| `maxRedemptions` | Total active redemptions across all users |
| `maxRedemptionsPerUser` | Active redemptions allowed for one account |
| null | Unlimited for that dimension |

Active = `RESERVED` + `CONFIRMED` (not `RELEASED`).

## Stages

1. **Quote** (`resolveSubscriptionPromo` + optional `userId`) — soft check
2. **Subscribe** — `reservePromoRedemption` authoritative lock + insert + increment

A code may become unavailable between quote and subscribe; subscribe rejects safely.

## Combinations

- A null/null → unlimited (other rules apply)
- B 100 / 1 → max 100 total, 1 each
- C 1 / 1 → first eligible user only
- D 10 / 3 → user up to 3, global 10
- E disabled/expired → always reject
