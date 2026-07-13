# Phase 8 — Reconstructed migrations (audit archive)

**Not** part of the active `prisma/migrations/` chain.

These eight folders were reconstructed in Phase 8 from shared Neon `_prisma_migrations` records. They remain **applied by name** on shared Neon but must **not** be deployed from Git on greenfield (content is superseded by Phase 9 baseline SQL).

| Migration | Purpose |
|-----------|---------|
| `20260208220000_add_user_password_hash` | User.passwordHash |
| `20260210000000_affiliate_business_subscription_admin_roles` | Affiliate subsystem |
| `20260210120000_add_unassigned_delivery_profile` | Sentinel data (legacy) |
| `20260211000000_add_superadmin_role` | SUPERADMIN enum |
| `20260212000000_promo_code_admin_optional_affiliate` | Promo nullable affiliate |
| `20260212000000_promo_code_affiliate_optional` | Duplicate DROP NOT NULL |
| `20260212100000_promo_code_seller_id` | PromoCode.sellerId |
| `20260212120000_add_product_weight_dimensions` | Product dimensions |

Checksums on shared Neon **do not match** these files (class B). Do not `resolve` for cosmetic alignment.
