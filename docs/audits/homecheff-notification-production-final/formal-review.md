# Formal Review — Notification Production Completion

## Scope

Production completion only: deploy readiness, outbox migration, env/cron hardening. No redesign of notification architecture.

## Verified

| Item | Status |
|------|--------|
| Server FCM (`FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`) on Vercel Production | Present |
| Durable outbox code + cron `/api/cron/notification-outbox` | Present |
| `NotificationPushOutbox` migration applied to production DB | **Applied live** |
| Rollback SQL documented | Present (DROP TABLE) |
| `CRON_SECRET` on Vercel Production + Preview | **Added** |
| Outbox cron rejects unauthenticated calls when `NODE_ENV=production` and secret missing | Hardened |
| Android channels / POST_NOTIFICATIONS / deep links (prior commits) | Present |
| Static validators | PASS |

## Blocking gaps (prevent SUCCESS)

| Item | Status |
|------|--------|
| `NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_FIREBASE_VAPID_KEY` on Vercel | **Missing** — closed-tab Web Push inert until set + redeploy |
| VAPID private key | Held in Firebase Console (not an app env var) — operator must create Web Push cert in console |
| Physical Android / closed-tab E2E proof | Operator checklist required |

## Formal review decision

**READY TO MERGE & DEPLOY for Android FCM + durable outbox.**  
**NOT READY for HOMECHEFF_NOTIFICATION_SYSTEM_PRODUCTION_SUCCESS** until Web Firebase public config is set and operator E2E proof completes.
