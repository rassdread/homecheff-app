# Duration Model

## Field

`PromoCode.discountDurationCycles` (nullable Int, 1–36 when set)

## Semantics

- **Set (e.g. 3):** Discount applies for 3 billing periods, then list price resumes (`resumesAtListPrice: true`).
- **Null:** Legacy / forever discount behaviour (custom recurring price for paid; free path uses plan `durationDays`).

## Examples

| Code | % | Cycles | Effect |
|------|---|--------|--------|
| WELCOME3 | 100 | 3 | Free entitlement ~90 days, then paid path per policy |
| HALF6 | 50 | 6 | Stripe repeating 50% coupon × 6 months on catalog price |
| FOREVER50 | 50 | null | Forever discounted price (legacy) |

## Helpers

- `parseDiscountDurationCycles` — admin input validation
- `billingCyclesToDurationDays` — free entitlement window (cycles × 30)
- `buildPromoDurationQuote` — server quote fields for UI
