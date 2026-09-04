# Delivery pricing & settlement

## Customer charge

Provider-owned (when pricing enabled):

```
if km ≤ freeRadius → 0
else max(minimum, base + chargeableKm × perKm)
```

Legacy platform table still exists when provider pricing is off.

## Split (SSOT `lib/fees.ts`)

```
H = round(D × 0.12)   # HomeCheff
C = D − H             # provider principal (88%)
```

Company and individual use the **same** split. Driver assignment does not create a second customer charge.

## Payout

`ensureDeliveryPayout` → ledger payout to **provider profile user** (company owner for DELIVERY_BUSINESS).

Drivers are compensated by the company outside HomeCheff unless a future product changes this.

## Formula (provider-v1)

`max(minimum, base + max(0, km - freeRadius) * perKm)` customer gross.

HomeCheff fee = 12% of gross; provider net = 88%.

Company settlement → profile owner. Drivers: 0 HomeCheff settlement unless policy changes.
