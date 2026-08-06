-- Rollback for 20260806_notification_push_outbox (additive only; safe drop)
-- Run ONLY if rolling back the outbox feature after confirming no audit need.
DROP TABLE IF EXISTS "NotificationPushOutbox";
