# Concurrency Review

## Mechanism

`prisma.$transaction` + `SELECT … FROM "PromoCode" WHERE id = $1 FOR UPDATE`

Then:

1. Count active redemptions (global + user)
2. `evaluatePromoRedemptionLimits`
3. Insert `PromoCodeRedemption`
4. `redemptionCount` increment

## Double-click

Two parallel Subscribe requests for the same user with per-user = 1:

- First acquires lock → succeeds
- Second waits → sees userActiveCount ≥ 1 → fails

## Paid path

Reservation at checkout create (`RESERVED`); webhook confirms (`CONFIRMED`). Session create failure → `releasePromoRedemption`.

## Warning

Abandoned checkouts leave `RESERVED` until release/TTL (not yet automated expiry job).
