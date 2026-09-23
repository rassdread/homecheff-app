# Acquisition KPI dictionary

Source of truth in code: `lib/analytics/acquisition-kpi-dictionary.ts`.

Economic events are written once to `AnalyticsEvent` with `entityType = ACQUISITION` and a stable `entityId` dedupe key. A second call with the same key does not insert another row.

They are not sent to Google Ads, Meta or LinkedIn. Client landing views (`seller_landing_view`, `affiliate_landing_view`, `growth_landing_view`) go to GA4 only after cookie consent, and only if the GA4 script is allowed by CSP.

`purchase` uses the amount stored on a confirmed order, and only when Stripe `payment_status` is `paid`. HomeCheff Credits are not converted into euros. `revenue` is the sum of those purchase rows, not a second event.

Events whose product state lives on growth.homecheff.eu, or that would duplicate Attribution, stay defined and unwired.
