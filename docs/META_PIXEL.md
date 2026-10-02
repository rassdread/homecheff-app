# HomeCheff Meta Pixel

Browser pixel only. Conversions API is not enabled. Do not turn it on for campaign launch.

Production: https://homecheff.eu  
Dataset: HomeCheff Website  
Pixel ID: `1055469524190840`

This integration measures HomeCheff's own ads. It is not a general behavioral profile of visitors. Code can only control what HomeCheff sends. It cannot control how Meta uses a request after Meta has received it.

## What is sent

After explicit marketing consent, and only then, HomeCheff may send:

| Event | When | Wire payload |
| --- | --- | --- |
| CompleteRegistration | A new account was created from the register flow. Login does not send it. | Event name plus a random event id. No user id. No custom data. |
| Purchase | `/payment/success` loaded a Stripe session with `payment_status=paid` and `amount_total > 0`. | Event name plus a random event id. No amount, no listing id, no Stripe id, no order id. |

Duplicate protection stays on the device. The local key is a hash. The id sent to Meta is not derived from a HomeCheff or Stripe identifier.

These two events are enough to answer:

- Did a HomeCheff campaign generate registrations?
- Did a HomeCheff campaign generate a genuine paid marketplace conversion?
- What did the campaign approximately cost per conversion? Meta reports ad spend divided by attributed conversions. That does not require the order amount. Return on ad spend is not a goal of this integration.

## What is not sent

| Event or field | Decision |
| --- | --- |
| PageView | Not sent. A page view on every route is browsing behavior, and it is not required to count registrations or purchases. |
| ViewContent | Not sent. Listing views are not required for the three questions above. |
| InitiateCheckout | Not sent. Starting checkout is not a paid conversion. |
| Order value and currency | Not sent. |
| Listing ids, seller ids, order ids | Not sent. |
| User id, email, phone, name, address, date of birth | Not sent. |
| Stripe session id, Stripe customer, payment intent | Not sent as event data. The success-page query is removed from the address bar before the pixel runs. |
| Affiliate id, `hc_ref`, `/welkom/{code}` | Not sent. Events are refused on `/welkom` and on any URL that still has `hc_ref` or `ref`. The affiliate cookie and `/welkom` flow are unchanged. |
| Search text | Stripped from the current URL before the pixel runs. |
| Automatic Advanced Matching | Off in code (`autoConfig` false, `init` with the pixel id only). |
| Conversions API, access tokens, custom audiences, customer-list uploads | Not part of this integration. |

## Consent

Analytics consent stays in `privacy-notice-accepted` (`true` / `all` / `necessary`).

Marketing consent is `hc-marketing-consent` (`granted` / `denied`). Accepting analytics does not grant Meta. "Necessary only" does not grant Meta.

| State | Result |
| --- | --- |
| Unset | No Meta script, no `fbq`, no Meta event, no `_fbp` or `_fbc` created by HomeCheff. |
| Denied | Same. Withdrawal also revokes pixel consent and expires `_fbp` and `_fbc` on this host. |
| Granted | HomeCheff may send CompleteRegistration and Purchase only. |

The pixel script is not loaded when consent is granted. It is loaded only when one of those two events is actually sent.

If the visitor landed with `fbclid` and then grants marketing consent, HomeCheff stores that click id in `sessionStorage` (`hc_meta_click`). That storage is not a Meta cookie and is not sent by itself. When a conversion is sent, HomeCheff writes the `_fbc` cookie from that click id so Meta can attribute the conversion to the ad click. The click id is discarded on denial.

Withdrawing consent stops later events and deletes the cookies this site can delete. It does not delete data Meta already received.

### Do not reintroduce the queue stall

`fbevents.js` stops draining its command queue when it processes `consent: revoke`. If revoke is queued before `init` and `consent: grant`, the grant and every event behind it stay stuck.

`initMetaPixel` queues only:

1. `set autoConfig false`
2. `init` with the pixel id and no user data
3. `consent grant`

Revoke stays on the explicit opt-out path.

## Configuration

```bash
NEXT_PUBLIC_META_PIXEL_ID=1055469524190840
```

The id is public. If it is missing or not numeric, the pixel does not load and the rest of HomeCheff keeps working. `NEXT_PUBLIC_*` values are inlined at build time.

## Unavoidable data after an opted-in conversion

When a conversion request leaves the browser, Meta can also see data HomeCheff does not put in custom parameters:

- IP address of the connection
- User agent
- The current page URL after the sensitive query parameters above are removed (`fbclid` is left in place because it is the ad click id)
- The previous page URL, if the browser exposes it as the pixel referrer
- `_fbp`, which `fbevents.js` sets when the script loads
- `_fbc`, when a stored ad click id exists
- The pixel id, the event name, the random event id, and the time of the request

HomeCheff cannot promise a limit on Meta's later use of that request.

## Manual checklist before any campaign

Do this in Meta Business / Events Manager. Code cannot read or set these. Do not add people, and do not add Selen, as part of this work.

Dataset: HomeCheff Website. Pixel: `1055469524190840`.

1. Events Manager → Data sources → this pixel → Settings. Under Event setup, set **Track events automatically without code** to **Off**. New pixels have had this on by default since 3 August 2026. Automatic events would let Meta invent extra events from the site.
2. Same Settings tab. Set **Automatic advanced matching** to **Off**. Do not turn on email, phone, or name matching.
3. Do not open the Event setup tool, and do not save event-setup rules for this pixel.
4. Confirm there is no Conversions API connection, no access token, and no partner integration (shop platform, gateway, or offline set) attached to this dataset.
5. Settings → data restrictions / core setup, if shown: turn **core setup on** so the dataset shares less. This is not a substitute for the consent gate in the app.
6. Do not create a Custom Audience from a customer list, a website audience, or a lookalike. Do not upload a customer file.
7. When a campaign is created later, leave audience expansion and Advantage detailed targeting off unless a separate decision accepts that extra use. This checklist does not create a campaign.
8. If a data-retention control is shown for the dataset, choose the shortest period Meta offers. If it is not shown, record that it was not exposed.
9. Confirm the only web data source for this dataset is this pixel.
10. Do not grant new Business Manager users from this checklist.

## What this pixel does not change

Affiliate attribution, `hc_ref`, `/welkom/{code}`, commissions, Stripe payment verification, seller payouts, authentication, marketplace ordering, Growth, Studio, GA4, and Vercel Analytics are unchanged.
