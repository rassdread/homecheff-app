# Admin UI — Promotions

## Navigation

- Tab id: `promotions`
- Domain: `growth`
- Label: Promotions
- Allowed for SUPERADMIN and ADMIN dashboards; `system_admin` role mapping includes promotions
- Not under Affiliates tab

## Panel: `AdminPromotionsPanel`

- Fetches `GET /api/admin/promo-codes?platformOnly=1`
- Create: name, code, purpose, discount type (%/fixed), duration (1/3/6/12 or forever), max redemptions, end date
- List: status, duration, redemption count, copy code
- Activate / deactivate via `PATCH /api/admin/promo-codes/[id]` (reason required to disable)
- Delete: not exposed when unsafe; disable + audit is the safe path

## Affinity with Affiliates UI

Existing `AdminPromoCodesPanel` under Affiliates remains for affiliate-linked codes. Platform create goes through the Promotions panel.
