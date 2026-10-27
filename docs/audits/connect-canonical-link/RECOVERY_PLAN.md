# Stripe Connect canonical link recovery plan

Status: prepared, not executed.  
Production database writes: none.  
Stripe account changes: none.

The application defect that cleared `User.stripeConnectAccountId` during a status read is fixed in code and is not deployed. Do not restore the three pointers until that fix is in production. A status read on the current production commit can clear a restored pointer again.

## Confirmed desync

These three users have an empty canonical pointer and a populated affiliate mirror. No other user has that split. No Connect account is referenced by two users.

| User | Affiliate account | Live Stripe | Proposed canonical account |
|---|---|---|---|
| `7647bf21-e9ab-4e3a-af83-eeec23e24dcb` | `acct_1Sj52gRyMYBvOmov` | Express, charges, payouts, transfers active, balance 0, 7 transfers, 2 payouts | same affiliate account |
| `a26f0700-ade5-485d-862a-fdb303724385` | `acct_1UU2IoRsNH4cScb8` | Particular, identity verified, charges, payouts, transfers active, balance 0, no transfers | same affiliate account |
| `98e79e17-fe12-4320-ad49-19ba10d31271` | `acct_1Sj5DiRspsUkt4GS` | Express, charges, payouts, transfers active, balance 0, no transfers | same affiliate account |

Ownership evidence is the affiliate row's `userId`, not a name or email match. Wioletta's September account `acct_1UEwPNRsYX6hZRHH` is payout-ready and unlinked. It stays unlinked. Her earlier Express account `acct_1UAByR2MtOOZkjCa` is incomplete and stays unlinked.

The other Sergio registrations, `6c004e0d-1dad-40ae-a842-45020d9eafef` and `1c52c7cc-3403-4624-bde1-1731caa3b159`, are separate user records. Do not merge them and do not move a Connect account between them.

## Procedure for one user

Run this only after the code fix is deployed, and only for one approved user at a time.

1. Read the user and affiliate rows again. Stop if the canonical pointer is no longer empty or the affiliate account id changed.
2. Retrieve the affiliate account with the live platform key. Stop unless charges, payouts, and transfers are active and the account is not deleted.
3. In one transaction, update the user only while the pointer is still empty:

```sql
UPDATE "User"
SET "stripeConnectAccountId" = :affiliate_account_id,
    "stripeConnectOnboardingCompleted" = true
WHERE id = :user_id
  AND "stripeConnectAccountId" IS NULL;
```

4. If that update changes one row, set the affiliate onboarding flag to true only when its account id is still the same value. Insert an `AuditLog` row with action `STRIPE_CONNECT_LINK_CHANGE`, the user id, previous account id `null`, the new account id, reason `RECOVERY_FROM_AFFILIATE_MIRROR`, operation `EXPLICIT_RESTORE`, the approving actor, and verification `live_transfers_active`.
5. Do not create a Stripe account, transfer, payout, or charge.

For Wioletta the affiliate flag is currently false even though Stripe is ready. The restore must use the live Stripe result, not that stale flag.

## Rollback

If no payout has been sent to the restored pointer, set `User.stripeConnectAccountId` back to null and `stripeConnectOnboardingCompleted` back to false where the id is still the restored account. Leave the affiliate row in place. Record a second audit row with reason `RECOVERY_ROLLBACK`. Do not change Stripe balances or historical payout rows.

## Not in this recovery

The 26 accounts that are on neither `User` nor `Affiliate` stay unlinked. Twenty-three have no balance, transfer, or payout. Three are recorded historical replacements, including `acct_1UEwPNRsYX6hZRHH` and `acct_1UAByR2MtOOZkjCa`. None is selected automatically.
