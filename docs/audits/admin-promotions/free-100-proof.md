# 100% Free Promotion Proof

Paths: WELCOME1 (100%/1), WELCOME3 (100%/3)

| Check | Result |
|-------|--------|
| No Stripe micro-charge | PASS (`finalPriceCents <= 0` → entitlement) |
| Duration → validUntil | PASS (`discountDurationCycles × 30` days) |
| Atomic reserve + confirm | PASS |
| Global + per-user count once | PASS (single redemption row) |
| Second redeem same user (cap 1) | REJECT |
| Other user | PASS if global allows |
| Silent paid renewal | Not performed; consent policy unchanged |

Automated: `validate-admin-promotions.ts` + redemption-limits suite.
