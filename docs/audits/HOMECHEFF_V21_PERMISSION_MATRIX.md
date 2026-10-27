# HomeCheff V21 permission matrix

## Model

`SUPERADMIN` is allowed every capability in `lib/admin/admin-capabilities.ts`.

An `ADMIN` with no `cap:SCOPED` marker keeps the legacy boolean map. Financial transfer recovery and promotion edits still require `canViewPaymentInfo`. Studio capabilities are not granted by the legacy map.

An `ADMIN` with `cap:SCOPED` is allowed only the listed `cap:` capabilities. A missing capability is denied even when an old boolean would have allowed it.

A non-admin is denied.

## Templates

| Template | Includes | Does not include |
| --- | --- | --- |
| MARKETPLACE_ADMIN | Marketplace view and order management | Refund execution, transfer recovery, Growth billing, Studio |
| GROWTH_ADMIN | Campaigns and affiliates | Marketplace payments, Studio |
| STUDIO_ADMIN | Studio projects and jobs | Marketplace, Growth campaigns, Studio costs |
| SUPPORT_ADMIN | Users and order view | Financial execution |
| FINANCE_ADMIN | Payment view, refund execution, transfer recovery | Administrator management, promotion edits |
| READ_ONLY_ADMIN | View capabilities across platforms | Refunds, transfer recovery, promotion edits |
| CUSTOM_ADMIN | Global dashboard only | Everything else until edited |

Templates are starting sets. The assignment request can send an explicit capability list instead.

## Assignment rules

`POST /api/admin/capabilities` requires a superadmin. It rejects:

- a subadmin caller
- a caller changing their own account
- any change to a superadmin account
- removal of the last active superadmin when that flag is set
- an unknown capability name

Assigning grants sets `User.role` to `ADMIN` on the same user row. It does not create a second user and it does not grant `SUPERADMIN`. Revoke leaves `cap:SCOPED` with no capabilities. Suspend and restore use the existing `suspendedAt` field. `getPlatformAdmin` already denies a suspended account.

## Server enforcement added in V21

| Route | Capability |
| --- | --- |
| `POST /api/admin/refunds/execute` | `MARKETPLACE.REFUNDS.EXECUTE` |
| `POST /api/admin/orders/{orderId}/recover-seller-transfer` | `MARKETPLACE.TRANSFERS.RECOVER` |
| `PATCH /api/admin/promo-codes/{id}` | `MARKETPLACE.PROMOTIONS.EDIT` |
| `GET /api/admin/center/summary` | Per section |
| `GET /api/admin/users/{id}/overview` | User view, then per section |
| `GET` and `POST /api/admin/capabilities` | Superadmin |

Other existing admin routes still use their previous `ADMIN` or `SUPERADMIN` checks. That is a remaining gap: a scoped subadmin can still be rejected or allowed by those older checks independently of the new catalog. Routes that only check `role === ADMIN` can still be called by a scoped subadmin who has the `ADMIN` role.

## Migration

No existing admin was rewritten. Accounts without `cap:SCOPED` keep their current access. Studio access is not implied for them. The current superadmin is unchanged because this branch did not write the preview or production database.
