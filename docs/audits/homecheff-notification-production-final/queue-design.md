# Queue Design — NotificationPushOutbox

## Model

Table `NotificationPushOutbox` (Prisma + migration `20260806_notification_push_outbox`).

Statuses: `QUEUED` → `PROCESSING` → `SENT` | back to `QUEUED` (retry) | `FAILED` (invalid token) | `EXPIRED` (max attempts).

## Guarantees

- **Write once per delivery intent:** unique `idempotencyKey = sha256(batchId:token)`
- **Claim:** `FOR UPDATE SKIP LOCKED` + reclaim stale `PROCESSING` > 5 minutes
- **Backoff:** 30s × 2^(n-1), capped at 1 hour, maxAttempts default 8
- **Survive restart/deploy:** rows in Postgres; cron every minute
- **Survive Firebase outage:** rows remain `QUEUED` with nextAttemptAt
- **Invalid tokens:** `FAILED` + PushToken.isActive=false (no infinite retry)
- **Replay:** `POST /api/admin/notifications/outbox/replay` or `npx tsx scripts/replay-notification-outbox.ts`

## Immediate + durable

`sendFcmNotificationsForMessage` enqueues then calls `processDuePushOutbox` immediately. Failures remain queued for cron.
