# Subscription Integration

## Plans

BASIC / PRO / PREMIUM — base prices from `Subscription` table (fallback constants in resolver).

## Quote contract

Each plan quote includes:

- `basePriceCents`, `discountCents`, `finalPriceCents`
- `discountDurationCycles`, `resumesAtListPrice`
- `mode`, `isPlatform`

## Subscribe behavior

| Case | Behavior |
|------|----------|
| `finalPriceCents <= 0` | `activateFreeSubscriptionEntitlement` — entitlement window from `discountDurationCycles` (×30 days) or plan default |
| Timed platform % (`discountDurationCycles` set) | Catalog Stripe price + **repeating** coupon for N cycles → list price resumes |
| Untimed / affiliate | Existing custom discounted recurring price path |

## /sell UX

- Copy: “Heb je een promocode?”
- Plan cards show first N months promotional price and “Daarna: list / maand”
- Client never invents discount math; subscribe revalidates code server-side
