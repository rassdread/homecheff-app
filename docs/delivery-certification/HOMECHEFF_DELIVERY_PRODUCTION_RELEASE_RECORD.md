# HomeCheff Delivery production release record

Date: 2026-10-26  
Repository: rassdread/homecheff-app  
Branch: `fix/delivery-financial-blockers`  
Production application: https://homecheff.eu

## Status

Delivery code is remediated locally. It is not deployed. Customer-facing Delivery stays disabled.

| Item | State |
| --- | --- |
| Production Delivery flag | VERIFIED false on `/api/delivery/alignment-flags` |
| Production deployment of this commit | NOT_STARTED |
| Production deployment id | NOT_AVAILABLE. The public `x-vercel-id` is a request id. |
| Production database | NOT_STARTED. Migration status was not read and no production credential was used. |
| Production Stripe | NOT_STARTED |
| Production Google Maps | NOT_STARTED |
| Production smoke test | NOT_STARTED |
| Regional pilot | NOT_STARTED |

## Code ready for a later deploy

The commit that contains the V6B remediation is the release candidate after it is committed. It includes the V6A obligation table and the V6B identity, webhook, and livemode fixes. `HOMECHEFF_DELIVERY_ENABLED` must stay false on production during the first deploy.

Required production environment, names only:

- `DATABASE_URL` and `DIRECT_URL` for the production Neon host
- `STRIPE_SECRET_KEY` live key, matching `event.livemode`
- `STRIPE_WEBHOOK_SECRET` for the production endpoint
- `GOOGLE_MAPS_API_KEY` server key
- `GOOGLE_MAPS_KEY_ROLE=production`
- no `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` copy of that server key
- `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` unset
- `HOMECHEFF_DELIVERY_ENABLED` false until Gate G

## Release order

1. Gate A accepted by the owner.
2. Gate B: backup, then apply the four migrations already on preview. Delivery stays disabled.
3. Deploy this commit to the production Vercel project. Delivery stays disabled.
4. Confirm marketplace home, authentication, and checkout still load.
5. Gate C: production Maps key and role. Distance pricing must fail closed until this is true.
6. Gate D: signed production webhook, one test event, receipt row with `livemode` true. Invalid signatures stay 400.
7. Gate E: operations view shows receipt health, Maps readiness, and courier obligations. Live recovery stays off.
8. Gate F: one authorized small live delivery. Exactly one obligation and one transfer. Stop on any mismatch.
9. Gate G: enable Delivery for a named regional pilot only.

If the application deploy breaks existing marketplace routes, roll back the Vercel deployment. Do not drop the new tables as that rollback. They are additive. Dropping them deletes receipt and obligation history.

## Stripe test evidence already collected

Test mode only. Destination tail `eL3ugc`. One transfer per successful obligation. A timed-out lookup created no transfer. A lost local transfer id reconciled to the original Stripe transfer.

## Activation

`PRODUCTION_DELIVERY_ENABLED = false`  
`DELIVERY_PRODUCTION_READY = false`
