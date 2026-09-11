# Stripe Connect onboarding loop — production cert

Date: 2026-09-11

## ROOT_CAUSE / LOOP_ROOT_CAUSE

After Stripe return, live account had:

- `details_submitted=true`
- `currently_due=[]` / `past_due=[]`
- `pending_verification=["company.verification.document"]`
- `disabled_reason=requirements.pending_verification`

Old derivation ordered `disabledReason → RESTRICTED` **before** pending handling.
`RESTRICTED` + success page / CTA always offered Account Link → user sent back to Stripe → return → same state → **loop**.

Secondary amplifiers:

1. GET `/api/stripe/connect/onboard` PARTICULAR override forced `showOnboardingCta=true` for every `!paymentReady` account (including pending).
2. POST Account Link created whenever DB `onboardingCompleted=false`, without live `canCreateOnboardingLink`.
3. `/seller/stripe/refresh` auto-POSTed a new Account Link on every mount.

## Fix

- `normalizeStripeConnectStatus` / `deriveConnectAccountStatusFromStripe`: pending + `disabled_reason=requirements.pending_verification` → `PENDING_VERIFICATION`, **no** Account Link.
- `canCreateOnboardingLink` SOT; POST refuses link when false.
- Return → fresh Stripe retrieve → status page; refresh → retrieve first, link only if actionable.
- `getCurrentStripeConnectAccount(userId)` canonical current pointer.
- Track-aware readiness unchanged: PARTICULAR = `payouts && transfers=active`; BUSINESS = `charges && payouts`.

## Production data audit (live, read-only)

```
TOTAL_CONNECT_USERS = 9
PARTICULAR = 1
BUSINESS = 0
LEGACY = 8
MULTIPLE_STRIPE_ACCOUNTS = 1
CURRENT_ACCOUNT_MISSING = 0
CURRENT_ACCOUNT_POINTS_TO_OLD = 0
READY_AT_STRIPE_BUT_HC_NOT_READY = 0
POSSIBLE_LOOP_USERS (pre-fix) = 1
```

### Particular loop candidate (post-fix)

```
ACTIVE_HC_CONNECT_TRACK = PARTICULAR
ACTIVE_DB_STRIPE_ACCOUNT_ID = acct_1UEZj3RumBjJzKy1
OLD_ACCOUNT_ID = acct_1UDs6rRq99GqoVs2
NEW_ACCOUNT_ID = acct_1UEZj3RumBjJzKy1
ACTIVE_EQUALS_NEW = true
STRIPE_BUSINESS_TYPE = non_profit   # MANUAL_REVIEW — expected individual
STRIPE_DASHBOARD_TYPE = none
STRIPE_DETAILS_SUBMITTED = true
STRIPE_CHARGES_ENABLED = false
STRIPE_PAYOUTS_ENABLED = false
STRIPE_TRANSFERS_CAPABILITY = pending
STRIPE_PENDING_VERIFICATION = [company.verification.document]
STRIPE_DISABLED_REASON = requirements.pending_verification
HC_UI_STATUS (post-fix) = PENDING_VERIFICATION
canCreateOnboardingLink = false
LOOP_FIXED = true
```

No destructive remapping. Old Express preserved in AuditLog.

## Decision gate

Loop structural fix + live reclassify PASS.
Remaining: account `business_type=non_profit` on PARTICULAR track needs user/support MANUAL_REVIEW (not an onboarding loop).
Full authenticated Playwright matrix still required after deploy.
