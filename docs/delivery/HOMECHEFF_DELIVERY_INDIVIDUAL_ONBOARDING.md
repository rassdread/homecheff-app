# Individual courier onboarding

1. `/delivery/start` → **Ik bezorg zelf**
2. `/delivery/signup` → profile (age 18+, area, transport)
3. `/delivery/settings` → pricing (`pricingEnabled`) + service area + availability
4. `POST /api/delivery/activate` `{ active: true }` when gate passes
5. Dashboard: `/delivery` → `/delivery/dashboard`

No developer SQL required. Settlement via profile owner + Stripe Connect onboarding in Verdiensten.
