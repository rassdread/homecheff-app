# V23 admin authorization

Status: IMPLEMENTED and UNIT_TESTED for the deny default. DATABASE_TESTED and HTTP-tested for the synthetic preview users below. Not a full browser pass.

## Unknown route default

`resolveAdminRouteCapabilities` now returns `DENY` for an unmapped admin path. It no longer returns `GLOBAL.SYSTEM.MANAGE` or `GLOBAL.SYSTEM.VIEW`.

`unknownAdminRouteDecision` allows only `SUPERADMIN`. Every other role is denied. The guard applies that decision before the capability check, so a legacy administrator cannot inherit system access from a missing mapping.

`/api/admin/all-users` was the one existing route that fell through. It is now mapped with the users route.

The inventory test walks every `app/api/admin/**/route.ts`, resolves each exported method, and fails if any path returns `DENY`. That test passed. No `"use server"` actions were found.

## HTTP results on the local app

| Caller | Request | Response |
|---|---|---|
| Anonymous | GET /api/admin/orders | 401 |
| Normal user 8f161418-7381-4199-9ab8-9220ddfedf0d | GET /api/admin/orders | 403 |
| Marketplace admin 7b02a6d7-18a6-41b8-aaab-cc4bd414cc88 | GET /api/admin/orders | 200 |
| Marketplace admin | GET /api/admin/affiliates | 403 Missing capability |
| Marketplace admin | POST /api/admin/refunds/execute | 403 Missing capability |
| Growth admin b4b41dec-bed8-46e0-9809-758f20bff894 | GET /api/admin/orders | 403 |
| Growth admin | GET /api/admin/affiliates | 200 |
| Read-only admin b4ba38c2-b6b7-440b-8351-60603ef7bd14 | GET /api/admin/orders | 200 |
| Read-only admin | POST /api/admin/refunds/execute | 403 |
| Suspended admin f9dd1f71-33ab-46d7-85fa-3e240a733c7b | GET /api/admin/orders | 403 Suspended admin account |
| Legacy admin 5b970103-0932-4b33-ac20-86813ad6a4da | GET /api/admin/orders | 200 |
| Superadmin | GET /api/admin/not-a-real-route | 404, because no handler exists |

A path with no route file cannot reach the guard. The deny decision for a future handler is covered by the unit test, not by that 404.

Studio admin 17acdba6-08ba-45b9-9094-99851b47e94c and multi-platform admin 091f61b4-5913-487e-9a70-94ed5f29b471 were created in the preview database. Their HTTP matrix was not executed. Sessions were real credential logins. No session cookie was forged.
