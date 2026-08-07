-- Durable FCM push delivery outbox
CREATE TABLE IF NOT EXISTS "NotificationPushOutbox" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushTokenId" TEXT,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 8,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "payload" JSONB NOT NULL,
    "notificationId" TEXT,
    "kind" TEXT,
    "sentAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationPushOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPushOutbox_idempotencyKey_key" ON "NotificationPushOutbox"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "NotificationPushOutbox_status_nextAttemptAt_idx" ON "NotificationPushOutbox"("status", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "NotificationPushOutbox_userId_createdAt_idx" ON "NotificationPushOutbox"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationPushOutbox_notificationId_idx" ON "NotificationPushOutbox"("notificationId");

DO $$ BEGIN
  ALTER TABLE "NotificationPushOutbox"
    ADD CONSTRAINT "NotificationPushOutbox_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
