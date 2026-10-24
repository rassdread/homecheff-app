-- Admin recovery attempts. The Stripe event payload is not stored.
CREATE TABLE "StripeWebhookRecoveryAttempt" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookRecoveryAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StripeWebhookRecoveryAttempt_eventId_createdAt_idx" ON "StripeWebhookRecoveryAttempt"("eventId", "createdAt");
