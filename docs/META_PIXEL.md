# HomeCheff Meta Pixel

Browser pixel only. Conversions API is not enabled.

## Configuration

```bash
NEXT_PUBLIC_META_PIXEL_ID=1055469524190840
```

The id is public. It is not a secret. If the variable is missing or not numeric, the pixel does not load and the rest of HomeCheff keeps working.

Set it on Vercel for Production before a production build. `NEXT_PUBLIC_*` values are inlined at build time.

## Consent

Analytics consent stays in `localStorage` key `privacy-notice-accepted` (`true` / `all` / `necessary`).

Marketing consent is a separate key, `hc-marketing-consent` (`granted` / `denied`). Accepting analytics does not grant Meta. The existing cookie banner asks for the marketing choice. There is no second banner.

Meta loads only when marketing consent is `granted`. The pixel is initialized with the id only. `autoConfig` is off. No email, phone, name, or other user fields are sent. Automatic Advanced Matching is not enabled in code.

Do not queue `consent: revoke` before `init` and `consent: grant`. Current `fbevents.js` stops draining the command queue when it sees revoke, so a grant sitting behind that revoke never runs and no browser event is sent until a later live `fbq('consent','grant')`. Revoke stays on the explicit opt-out path.

## Events

| Event | When |
| --- | --- |
| PageView | First eligible load and later pathname changes. Query-string UI state does not fire another PageView. |
| CompleteRegistration | Email registration succeeded with a user id, or Google registration that created an account from the register flow. Login does not fire it. |
| ViewContent | A marketplace listing detail page has a listing id. Feed cards do not fire it. |
| InitiateCheckout | Stripe checkout URL or session was created. HomeCheff-credit-only checkout does not fire it. |
| Purchase | `/payment/success` loaded a Stripe session with `payment_status=paid` and `amount_total > 0`. |

Listing publication stays on the server analytics event `listing_published`. There is no matching Meta standard event, so no custom Meta event is sent.

Growth and Studio subscriptions are not sent. Seller subscription payment is confirmed in the Stripe webhook, and this task does not add a browser Purchase for that flow.

## Event ids for a future Conversions API

Browser calls use Meta's `eventID`. A later server Conversions API call must send the same value as `event_id`.

| Event | event id |
| --- | --- |
| CompleteRegistration | `reg:{userId}` |
| InitiateCheckout | `ic:{stripeCheckoutSessionId}` when the session id is known |
| Purchase | `purchase:{stripeCheckoutSessionId}` |

Do not generate a Meta access token in the client. Server CAPI still needs:

1. A server-only Meta access token in Vercel (never `NEXT_PUBLIC`).
2. The same pixel id (`1055469524190840`).
3. Purchase (and optionally CompleteRegistration) sent from the existing paid Stripe webhook / registration success path with the event ids above.
4. No customer email, phone, name, or address in the payload unless a later, explicit consent design allows hashed matching.

Until that exists, CAPI status is not enabled.
