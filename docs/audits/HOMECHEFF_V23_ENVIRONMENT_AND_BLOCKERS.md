# V23 environment and blockers

## Isolation

| Check | Result |
|---|---|
| Repository | rassdread/homecheff-app |
| Source branch | fix/v22-final-certification-subscriptions-business-profiles |
| Source HEAD | ba3ad6f0694ffad26c0ae248d8e687c8178c0416 |
| Work branch | fix/v23-final-execution-certification |
| Production baseline | 85b11d6d4708f68760122314a1ace654591f7643 is an ancestor |
| Production deployment | Not changed. Alignment flags on homecheff.eu still report homeCheffDeliveryEnabled false |
| Preview database | ep-green-wind-a2cspmqw / neondb. Used from the gitignored local preview env file |
| Stripe | Test key and Stripe CLI profile both resolve to acct_1S6D3DRpYdPVF6LP. livemode false on the V23 charge and transfer |
| Vercel API | Token request to /v2/user and the project env list returned HTTP 403 |
| Webhook exposure | No deployment protection exception was created. The local listener was a Stripe CLI forwarder to 127.0.0.1 only |

Production database and production Stripe were not written. Public Delivery was not enabled. Gate F was not executed.

## Blocker inventory

### Stripe webhook to the protected preview

- Root cause: Vercel Authentication answers unauthenticated preview requests before the app.
- Previous attempts: V19 used a temporary alias protection override, then revoked it. V22 left the preview behind SSO.
- Available solution: `stripe listen` forwards a signed event to a local app process that uses the preview database and the test key. That path was used for the V23 payment and refund.
- Required access: none for the local path. A deployment-wide protection exception would need a separate explicit approval and was not used.
- Safe method: keep the exception unused. Remove nothing, because nothing was opened.

### Vercel deploy of this commit

- Root cause: the stored Vercel CLI token is rejected with HTTP 403.
- Previous attempts: the same token created the V22 preview.
- Available solution: sign in again with `vercel login`, then deploy this branch with no production target.
- Required access: an interactive Vercel login for the project owner.
- Safe method: after login, deploy only an isolated preview. Do not set a production target.

### Admin Center and subscription browser flows

- Root cause: `/register` and `/sell` on the local Next dev server throw `TypeError: Cannot read properties of undefined (reading 'call')` in the webpack client runtime. The Vercel preview remains behind SSO.
- Previous attempts: V21 and V22 did not complete an authenticated browser pass. V23 opened both routes after they compiled and the error remained.
- Available solution: fix or bypass the local client crash, or sign into the preview after the CLI token works.
- Required access: a rendered authenticated browser. No forged session was used.
- Safe method: do not treat the source text of the links as a browser pass.

### Seller transfer recovery

- Root cause: the certified payment settled on the first attempt, so there was no failed transfer to recover.
- Previous attempts: V19 cached a failed transfer against a fake Connect id and then refunded that charge. V23 did not reuse that refunded charge.
- Available solution: one new test-mode checkout whose first transfer is conclusively absent, then `POST /api/admin/orders/{orderId}/recover-seller-transfer`.
- Required access: the same local listener and preview database already used.
- Safe method: do not call recovery on the refunded V23 charge or the historical V19 charge.
