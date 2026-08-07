# Deployment Report — Notification Production

**Date:** 2026-08-06  
**Merge:** `5f1fe295` — Merge pull request #1 from `feature/notification-reliability`  
**Production deploy:** `dpl_94a5FDDHQ1pD9zyjJVnujVoKwaUm`  
**Alias:** https://homecheff.eu  
**ReadyState:** READY  

## Live probes

| Endpoint | Result |
|----------|--------|
| `GET /api/public/firebase-web-config` | **503** `firebase_web_not_configured` (expected until NEXT_PUBLIC_FIREBASE_* set) |
| `GET /api/cron/notification-outbox` (no auth) | **401** Unauthorized (CRON_SECRET enforced) |
| `GET /firebase-messaging-sw.js` | **200** |
| `NotificationPushOutbox` table | **exists**, 0 rows |

## Env on Vercel Production

| Variable | Status |
|----------|--------|
| FIREBASE_PROJECT_ID | Present |
| FIREBASE_CLIENT_EMAIL | Present |
| FIREBASE_PRIVATE_KEY | Present |
| CRON_SECRET | Added this session |
| NEXT_PUBLIC_FIREBASE_* / VAPID | **Missing** |

## Verdict implication

Android FCM + durable outbox are live in production. Closed-tab Web Push remains blocked on missing public Firebase/VAPID env → overall **PARTIAL**.
