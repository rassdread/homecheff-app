-- Atomic per-user / global promo redemption ledger
CREATE TABLE IF NOT EXISTS "PromoCodeRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessSubscriptionId" TEXT,
    "planKey" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "discountSharePct" INTEGER NOT NULL DEFAULT 0,
    "discountDurationCycles" INTEGER,
    "basePriceCents" INTEGER NOT NULL,
    "finalPriceCents" INTEGER NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "PromoCodeRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromoCodeRedemption_stripeCheckoutSessionId_key"
  ON "PromoCodeRedemption"("stripeCheckoutSessionId");

CREATE INDEX IF NOT EXISTS "PromoCodeRedemption_promoCodeId_userId_idx"
  ON "PromoCodeRedemption"("promoCodeId", "userId");

CREATE INDEX IF NOT EXISTS "PromoCodeRedemption_promoCodeId_status_idx"
  ON "PromoCodeRedemption"("promoCodeId", "status");

CREATE INDEX IF NOT EXISTS "PromoCodeRedemption_userId_idx"
  ON "PromoCodeRedemption"("userId");

CREATE INDEX IF NOT EXISTS "PromoCodeRedemption_createdAt_idx"
  ON "PromoCodeRedemption"("createdAt");

DO $$ BEGIN
  ALTER TABLE "PromoCodeRedemption"
    ADD CONSTRAINT "PromoCodeRedemption_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PromoCodeRedemption"
    ADD CONSTRAINT "PromoCodeRedemption_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
