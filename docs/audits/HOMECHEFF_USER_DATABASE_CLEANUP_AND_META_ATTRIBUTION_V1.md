# HOMECHEFF_USER_DATABASE_CLEANUP_AND_META_ATTRIBUTION_V1

Read-only database audit on 13 October 2026. No production user was deleted. Counts come from the live database and the shared classifier in `lib/admin/user-population.ts`. The SQL filters match that classifier (`real` 60, `test` 35, `deleted` 217, sum 312).

## Population

| Metric | Count |
| --- | ---: |
| Database accounts | 312 |
| Real users | 60 |
| Demonstrable test accounts | 35 |
| Anonymized accounts | 217 |
| Verified real users | 34 |
| Unverified real users (still real) | 26 |
| Active real users, `updatedAt` in 7 days | 14 |
| New real users today / 7 days / 30 days | 0 / 2 / 13 |
| Objectively empty hard-delete candidates | 44 |
| Accounts that must be retained | 268 |

Anonymized accounts all have `accountDeletedAt`. 216 were created in 2026. One anonymized row has the placeholder timestamp `2020-01-01` and stays in the deleted bucket.

Unverified or inactive accounts are not treated as test accounts. One real account matches a loose test-like name pattern and stays real.

Test accounts are: disposable certification emails already recognized by `isDisposableCertEmail`, the dedicated internal keep-fixtures, `certificationFixture=true` in the bio, reserved `.invalid` mailboxes (including `homecheff-cert.invalid`, which the older suffix list missed), and other `@homecheff.internal` addresses. Tombstones on `deleted+…@accounts.homecheff.internal` are anonymized, not test, so they are not counted twice.

## Why deleted names still appeared

Account deletion in `lib/account-deletion.ts` anonymizes the row and keeps the id for orders, payouts and audit links. It does not remove the user. `GET /api/admin/users` returned every row, so `deleted_<id>` stayed in the normal list and `prisma.user.count()` counted those rows as users.

The admin list now hides anonymized accounts by default. Admins can open them with the Verwijderd filter. Real-user statistics exclude anonymized and demonstrable test accounts.

## Hard-delete plan (not executed)

A hard delete of `User` cascades orders, transactions, payouts, escrows, affiliates and attributions. It is not safe when any of those, or Stripe Connect, seller Stripe ids, messages, proposals, reviews, listings, products, reports, HC settlement rows, delivery profiles, dishes, conversation participants or audit logs, still point at the account.

| Group | Count | Decision |
| --- | ---: | --- |
| Empty anonymized rows | 13 | Candidate only after explicit approval and a backup |
| Empty demonstrable test rows | 31 | Candidate only after explicit approval and a backup |
| Anonymized rows with retained links | 204 | Keep |
| Test rows with retained links, including keep-fixtures | 4 | Keep |
| Real users | 60 | Keep |

There is no Wallet table. HC settlement rows were checked; none are attached to the non-real set. Affiliate rows, commission ledger lines and signup attributions block deletion. 201 non-real accounts still have audit logs; deleting the tombstone would detach that record.

No backup was taken because nothing was deleted. A dump of the affected user ids is required before any later approved delete, inside a transaction, and only for the 44 empty candidates.

## Meta and affiliate attribution

Stored on the user: `acquisitionFirstTouch` (UTM cookie `hc_marketplace_utm_v1`, written at registration, never overwritten). Stored separately: `Attribution` for a resolved affiliate `hc_ref`.

| Signal | Stored result |
| --- | --- |
| Meta visitors | Not stored. Pixel and GA do not write a visitor count back. Consent still gates analytics and the pixel. |
| Meta registrations | 0. No user has a stored `utm_source` of meta, facebook or instagram. |
| Meta verified / activated / first listing | 0, because there are no stored Meta registrations. |
| Affiliate registrations among real users | 6 |
| Organic registrations | 0. Organic is only counted when a non-paid UTM was stored. |
| Other stored non-Meta source | 0 |
| Unknown origin among real users | 54 |
| Signup attribution rows in total | 9 (3 sit on non-real accounts) |

`/onboarding/seller?ref=…` is handled by middleware as an affiliate code. The `ref` parameter is removed. If the code is not a real affiliate code, nothing is saved. UTM parameters on the same URL survive and are stored at registration. Historical campaign clicks that only used `ref` cannot be reconstructed as Meta. No personal data is sent to Meta by this audit.

Future Meta registrations are measurable with the existing capture when the ad URL includes `utm_source=meta` (and a campaign name). That source then wins over an affiliate attribution so the same signup is not counted twice.

## Certification

| Check | Result |
| --- | --- |
| DATABASE_INTEGRITY | Pass. Read-only. Partition sum equals 312 and matches the SQL filters. |
| REAL_USERS_PRESERVED | Pass. No deletes. |
| FINANCIAL_RECORDS_PRESERVED | Pass. No deletes. Financial and Stripe links block the candidate list. |
| AFFILIATE_RECORDS_PRESERVED | Pass. Affiliate, ledger and attribution links block deletion. |
| STRIPE_INTEGRITY | Pass. No Stripe calls or mutations. |
| WALLET_INTEGRITY | Pass. No wallet model. HC settlement links were included in the retain check. |
| SOFT_DELETED_FILTER | Implemented. Default admin list hides tombstones. |
| USER_STATISTICS | Implemented on the existing admin overview, profile, analytics and command center. |
| META_ATTRIBUTION | Measured from stored fields only. Visitors and historical Meta signups are explicitly unknown. |
| ADMIN_DASHBOARD | Existing overview and command center extended. No second dashboard. |
| BUILD | Not run in this audit. |
| TESTS | `lib/admin/user-population.test.ts`: 10/10 passed. |
