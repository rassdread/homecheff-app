# Paid Discount Proof

| Case | Behaviour |
|------|-----------|
| 50% / 3 months | Catalog price + Stripe repeating coupon `duration_in_months: 3` |
| 25% / 6 months | Same pattern, 6 cycles |
| List price after | Stripe coupon ends → catalog price |
| Redemption | RESERVED at subscribe; CONFIRMED on webhook |
| Duplicate | FOR UPDATE prevents double reserve |

UI matches server quote duration fields.
