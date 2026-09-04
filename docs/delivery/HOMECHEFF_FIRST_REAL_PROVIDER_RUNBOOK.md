# First real provider runbook

Do **not** create fake Public providers to certify.

When first legitimate individual or company signs up:

1. Onboarding complete (`/delivery/start` path)
2. Pricing configured + area + availability
3. Payout/Connect onboarding (`/verdiensten`)
4. `isVerified` / `isActive` / online as per eligibility gates
5. Controlled real Marketplace order with delivery
6. Individual: accept → pickup → deliver → payout
7. Company: assign driver → driver completes → company settlement
8. Confirm affiliate event once (if attributable)
9. Confirm zero double settlement / double assign

Checklist artifacts: order id, deliveryOrder id, payout id, affiliate event id.
