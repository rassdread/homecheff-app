# Delivery affiliate certification

Eligible base = **HomeCheff delivery platform fee only** (12% of customer delivery charge).

```
affiliatePool = floor(H × 50%)
DIRECT → up to 50% of H
PARTNER/SUB → 40% of H + MAIN 10% of H   (MAIN10_SUB40)
```

Rules:

- `COURIER_PRINCIPAL_COMMISSIONED = NO`
- `COMPANY_PROVIDER_PRINCIPAL_COMMISSIONED = NO`
- One delivery fee → **one** affiliate event (`orderId_delivery_{deliveryOrderId}`)
- Company referral attaches to company/provider identity — **not** per driver
- Driver referral must not double-claim the same fee

Partner 30% subscription discount does **not** apply to delivery.
