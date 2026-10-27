# HomeCheff V22 admin authorization audit

## What was already true

`SUPERADMIN` bypasses capability checks. Accounts without `cap:SCOPED` keep the legacy boolean map. Studio access is not included in that legacy map.

## Gap closed in this change

All 82 `app/api/admin/**/route.ts` handlers now call `requireMappedAdminCapability` before their older role check. The map lives in `lib/admin/admin-route-capabilities.ts`.

A scoped administrator is allowed only when one of the route capabilities is in their `cap:` grants. `requireAdminPermission` no longer accepts a permissions-row boolean as a bypass once `cap:SCOPED` is present.

`POST /api/admin/upgrade-to-superadmin` no longer writes a role. It returns `SUPERADMIN_SELF_ASSIGN_DISABLED`.

`POST /api/admin/assign-role` refuses self-changes and refuses granting or editing a superadmin. `DELETE` refuses demoting a superadmin.

## Compatibility

Legacy administrators without `cap:SCOPED` still pass the capabilities their old flags allow, including order viewing when no permissions row exists. They do not gain Studio access. Existing rows were not rewritten. The preview database currently has 0 users with role `ADMIN` or `SUPERADMIN`, so no live administrator was migrated.

## Tests

Route-policy tests cover marketplace, growth, read-only, promotion editor, and legacy behavior. They call the policy function. They are not signed-in HTTP calls.

## Remaining risk

The admin pages are still client components. Hiding a tab is not the security boundary. The API checks are. A route that is added later and forgotten by the map falls through to `GLOBAL.SYSTEM.VIEW` for reads and `GLOBAL.SYSTEM.MANAGE` for writes. Those capabilities are not in the scoped templates, so a scoped subadmin is denied. A legacy administrator with no permissions row can still call an unmapped write. New admin routes need an explicit entry.
