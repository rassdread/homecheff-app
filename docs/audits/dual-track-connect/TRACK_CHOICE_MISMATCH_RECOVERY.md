# Connect track choice + configuration mismatch recovery

Date: 2026-09-11  
Builds on loop-fix `bbdfdad5`.

## Architecture SOT

| Key | Value |
|---|---|
| TRACK_SELECTION_SOT | `ConnectTrackSelector` + confirm step |
| TRACK_PERSISTENCE_SOT | `User.stripeConnectTrack` written before Account Link |
| CURRENT_ACCOUNT_RESOLVER | `getCurrentStripeConnectAccount` |
| CONNECT_ENTRY_STATE_SOT | `resolveConnectEntryState` |
| PARTICULAR_CONFIG | `individual` + `dashboard=none` + transfers/card_payments |
| BUSINESS_CONFIG | Express + transfers/card_payments |
| PARTICULAR_CONFIG_VALIDATION | `validateConnectAccountShape` pre-link + post-create |

## Dry-run inventory (live)

```
TOTAL_CONNECT_USERS = 9
CORRECT_LEGACY = 2
ABANDONED_ONBOARDING = 4 → CHOICE_REQUIRED (user picks later)
CHOICE_REQUIRED = 2
CONFIGURATION_MISMATCH = 1 (acct_1UEZj3RumBjJzKy1 non_profit PARTICULAR)
```

No bulk auto-replacement. Correct legacy kept. Abandoned → choose track when user returns.

## Current mismatch user

```
CURRENT_BAD_ACCOUNT = acct_1UEZj3RumBjJzKy1
CURRENT_BAD_ACCOUNT_TYPE = non_profit
OLD_PRESERVED = acct_1UDs6rRq99GqoVs2
REPLACEMENT_SAFETY = PASS (CONFIGURATION_MISMATCH_REPLACE)
BALANCE_SAFE = YES
```

User must confirm PARTICULAR → creates one replacement individual account via
idempotency key `connect-replace-particular:{userId}:{oldId}`.

## Loop fix preserved

`canCreateOnboardingLink` + pending_verification → no Account Link.
