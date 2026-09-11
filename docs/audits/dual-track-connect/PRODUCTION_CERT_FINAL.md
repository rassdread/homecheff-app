# Dual-track Connect — production certification (card_payments PARTICULAR)

Date: 2026-09-11
Commit: 64ef7eb5

## PARTICULAR config (live-validated)

- business_type=individual
- dashboard=none
- transfers + card_payments requested
- full SA
- SCT unchanged (platform charge → transfer)

## HC application flow re-cert

- User: disposable dual-track-cert-*@homecheff.invalid
- Account: acct_1UESeZRvbewhJiVV
- stripeConnectTrack=PARTICULAR
- KvK/company docs: NO
- Personal KYC + bank: YES
- paymentReady=false until KYC (correct)

## Feature flag

DUAL_TRACK_CONNECT_ENABLED=true on production after flag-OFF deploy regression.

## Migration

Dry-run: 0 auto-eligible; user-confirmation required for stuck/wrong-type Express.
No accounts auto-migrated. Old accounts not deleted.
