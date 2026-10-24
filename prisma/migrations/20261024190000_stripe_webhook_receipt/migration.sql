-- Persistent Stripe webhook processing status. The event payload is not stored.
CREATE TABLE "StripeWebhookReceipt" (
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeWebhookReceipt_pkey" PRIMARY KEY ("eventId")
);

CREATE INDEX "StripeWebhookReceipt_status_updatedAt_idx" ON "StripeWebhookReceipt"("status", "updatedAt");
