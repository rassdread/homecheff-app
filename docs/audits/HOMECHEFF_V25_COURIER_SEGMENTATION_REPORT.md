# HomeCheff V25 — courier segmentation and targeted email

The existing Growth > Notificaties composer now filters couriers by readiness and previews the exact audience before any send. Community > Berichten is still chat review. Seller and buyer broadcasts still use their existing role queries. No production email was sent, no production row was written, and public Delivery stayed off.

## Identity

| Field | Value |
| --- | --- |
| TASK_NAME | HOMECHEFF_V25_ADMIN_COURIER_SEGMENTATION_AND_TARGETED_EMAIL |
| BASE_HEAD | `3f375da31606f25e5637943eeeb933a170115bfa` |
| FINAL_HEAD | `3f375da31606f25e5637943eeeb933a170115bfa` plus uncommitted local changes |
| REMOTE_HEAD | `3f375da31606f25e5637943eeeb933a170115bfa` on `fix/v23-3-original-admin-cockpit-restoration` |
| WORKTREE_CLEAN | no |
| PRODUCTION_SHA | `63c95ae4846fd58a9c6bb67e3f4f0af859b40d32` |
| PRODUCTION_DEPLOYMENTS | none in this task. Production remains `dpl_HKRNHTJFZgYiPpPoVU2opb5xh4p3` |
| PUBLIC_DELIVERY_ENABLED | false |
| PRODUCTION_EMAILS_SENT | 0 |
| PRODUCTION_DATABASE_WRITES | 0 |
| PRODUCTION_STRIPE_WRITES | 0 |
| PRODUCTION_RELEASE_READY | no |

The V24 label correction, the V24 audit, and the earlier payout-test fixture fix are still in the worktree. They were not reverted.

## Production courier counts

Recounted read-only on 2026-10-28 from production profiles and a live Stripe read. The identity cache was not written. Deleted accounts and the system placeholder are not contactable. A missing date of birth, a suspension, a block, or an invalid email also removes someone from every send filter. Counts overlap: one courier can miss both the agreement and Stripe Connect.

| Field | Value |
| --- | --- |
| TOTAL_HISTORICAL_COURIERS | 31 |
| TOTAL_EXISTING_COURIERS | 18 profiles that are not deleted and not the system placeholder |
| ACTIVE_COURIERS | 11 contactable profiles with an active courier profile |
| READY_COURIERS | 0 |
| AGREEMENT_MISSING | 12 contactable couriers |
| STRIPE_CONNECT_MISSING | 10 contactable couriers |
| STRIPE_ONBOARDING_INCOMPLETE | 0 in the send filter |
| PROFILE_INCOMPLETE | 3 contactable couriers |
| INACTIVE_COURIERS | 1 contactable courier |

`ALL_EXISTING_COURIERS` in the composer is the contactable set of 12, not the 31 historical rows. Steve Brown has incomplete Stripe onboarding, but he is excluded from that filter because his date of birth is missing. Natercia Silva (`TesSilva`) is the only courier with a live verified individual identity and active transfers. She is in the agreement-missing group, not in ready, because `delivery-agreement-2026-10-20-2` is not accepted. An empty identity cache or a failed Stripe read is `UNKNOWN`, not unverified and not ready. `payouts_enabled` is not treated as identity.

## What changed

Admin > Growth > Notificaties keeps the existing subject, message, notification, and email controls. Choosing Bezorgers opens the readiness filters:

- Alle bestaande bezorgers
- Actieve bezorgers
- Klaar voor bezorgingen
- Overeenkomst nog accepteren
- Stripe Connect ontbreekt
- Stripe-onboarding niet afgerond
- Stripe-verificatie niet afgerond
- Profiel onvolledig
- Inactieve bezorgers

Vehicle, operating area, and last activity narrow that choice. The preview shows the recipient count, exclusion reasons, names, email addresses, the Dutch readiness label, and the missing requirements. Pages are 20 rows. Filters do not send mail.

A signed recipient snapshot lasts 15 minutes. Send uses the intersection of that snapshot and a fresh evaluation, so the audience can shrink and cannot grow. Each address is mailed once, not by CC. Reactivation is promotional: it requires `marketingAccepted` and names `support@homecheff.eu` as the unsubscribe contact. Agreement, Stripe, profile, and pilot templates are operational and do not promise public Delivery, assignments, or earnings.

Stripe is read only while building a preview or a send, at most 24 accounts, and only when the existing 15-minute cache is missing or stale. A failed read stays unknown. Connect account ids are not replaced and no Connect account is created.

| Field | Value |
| --- | --- |
| COURIER_FILTERS_IMPLEMENTED | yes, in the existing Notificaties composer |
| ROLE_FILTERING_PRESERVED | yes. Sellers and buyers still use `User.role`. Gebruikers capability filters are unchanged |
| RECIPIENT_PREVIEW_STATUS | count, exclusions, names, emails, readiness, and missing items before send |
| RECIPIENT_DEDUPLICATION_STATUS | one row per user and one email per address. Snapshot blocks a larger retry |
| EMAIL_TEMPLATES_STATUS | five Dutch templates. None are sent automatically |
| EMAIL_SEND_AUTHORIZATION_STATUS | existing admin session plus `ADMIN` or `SUPERADMIN`, and the mapped growth capability |
| EMAIL_BATCHING_STATUS | existing batches of 25, the 50-recipient confirmation, and the 500 cap |
| EMAIL_AUDIT_LOGGING_STATUS | the existing blast log now records the admin, segment, filters, attempt count, provider acceptances, failures, and that inbox delivery was not confirmed |

## Tests and build

| Field | Value |
| --- | --- |
| TEST_RESULTS | 7 segmentation tests, 2 composer-contract tests, and 4 existing role-capability tests passed. The existing email blast-guard file passed. No mailbox was used |
| TYPESCRIPT_STATUS | pass. 699 current, 767 baseline, 0 new, 68 already resolved. The baseline was not shrunk |
| PRODUCTION_BUILD_STATUS | local `next build` did not finish. The first run compiled and then stopped because this shell had no `DATABASE_URL` while collecting `/api/admin/affiliates/commission-adjustment`. The second run, with a placeholder URL that is not production, ran out of memory at the 4096 MB heap. Neither failure is a courier-filter type error |

The logged-in Admin Cockpit was not clicked through in a browser. The filter rules were verified with isolated fixtures.

## Remaining blockers

- No courier is ready for an assignment.
- Tes Silva still has to accept the current agreement herself. Her matcher cache is still empty, and her saved radius is still 10 km.
- The composer is local only. Production still serves `63c95ae4` until an approved deploy.
- Seller and buyer broadcasts in Notificaties still follow `User.role`.
- Local production build did not complete on this machine.

## Required owner actions

- Open Growth > Notificaties after deploy, choose the agreement-missing couriers, preview the names, and only then approve a send.
- Do not treat a provider acceptance as proof that a message reached the inbox.
- Ask Tes Silva to accept the current agreement in her dashboard if she is the Gate F courier.
- Approve any later identity-cache refresh separately. It writes production courier fields.
- Do not enable public Delivery from this change.

## V24 and V25 courier counts

The 16 and the 18 are two classifications of the same production rows. Nothing was added or deleted between the audits.

V24 counted 16 living courier profiles with `isActive` true. V24 also counted 18 `isActive` rows, and 2 of those rows belonged to deleted accounts, so they were not living profiles.

V25 `TOTAL_EXISTING_COURIERS` is 18: every profile that is not deleted and is not the system placeholder. That set is the 16 living active profiles plus 2 living inactive profiles, Sergio Arrias and Steve Brown. The arithmetic is 31 historical rows, minus 12 deleted accounts, minus the system placeholder, which is 18.

V25 `ACTIVE_COURIERS` is a further cut to 11. A living active profile is included only when the account is contactable: not deleted, not the placeholder, not suspended or blocked, age confirmed at 18 or older, and a valid email. The 16 living active profiles are not all contactable.

## Release readiness

Certification of this implementation does not deploy production. Public Delivery stays off. No production email is sent from this change. The local `next build` stays blocked at the existing 4096 MB heap in `scripts/vercel-build.js`. The TypeScript ratchet keeps its existing 6144 MB setting. The baseline file is unchanged. Preview deployment details are recorded after the protected Vercel preview of this commit.
