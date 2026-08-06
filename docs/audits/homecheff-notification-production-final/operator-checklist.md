# Operator Checklist — Final Proof Matrix

Prerequisites: deploy branch + apply migration + set Firebase Admin + `NEXT_PUBLIC_FIREBASE_*` + VAPID.

## A. Durable outbox

1. Temporarily break Firebase (or use invalid token) → row stays `QUEUED`/`FAILED`/`EXPIRED`, never silent-missing.
2. Restore Firebase → cron or `POST /api/admin/notifications/outbox/replay` → `SENT`.
3. Confirm `GET /api/admin/notifications/outbox/replay` stats.

## B. Android (physical)

For each: NEW_ORDER, CHAT, PROPOSAL, PAYMENT, DELIVERY, REFUND — app open / background / killed / locked → tray → tap → correct screen.

## C. Web closed-tab

1. Settings → Browser push inschakelen (Chrome/Edge/Android Chrome).
2. Close all HomeCheff tabs.
3. Trigger chat/order → system notification.
4. Click → correct deep link (focus existing if any).

## D. Tokens

Multi-device, logout DELETE, login re-register, web refresh on visibility, stale token deactivate on FCM error.

## E. Battery

No new polling loops; outbox is cron + event-driven drain only.
