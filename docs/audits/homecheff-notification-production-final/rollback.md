# Rollback

1. Revert commits on `feature/notification-reliability` (do not merge if rolling back before merge).
2. If merged: revert merge commit; redeploy previous Vercel deployment.
3. Optional: stop draining by removing vercel cron `/api/cron/notification-outbox` (queued rows remain harmless).
4. Table `NotificationPushOutbox` can remain (no user-facing impact) or be dropped after confirming no need for audit.
5. Remove `NEXT_PUBLIC_FIREBASE_*` only if intentionally disabling web push.
6. No destructive user data migration beyond additive outbox table.
