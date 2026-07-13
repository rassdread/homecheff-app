-- Baseline pack (Phase 8): affiliate + business subscription + admin permissions foundation.
-- Idempotent reconstruction from live schema introspection (Feb 2026 DB-only migration).
-- PromoCode created here WITHOUT sellerId; nullable affiliate + sellerId come in later baseline steps.
-- AdminPermissions base table: tab columns are added by earlier 20250115000001 when that table exists.

-- Enums
DO $$ BEGIN CREATE TYPE "AffiliateStatus" AS ENUM ('ACTIVE', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AttributionType" AS ENUM ('USER_SIGNUP', 'BUSINESS_SIGNUP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AttributionSource" AS ENUM ('REF_LINK', 'PROMO_CODE', 'MANUAL', 'ANDROID_BETA_DOWNLOAD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PromoCodeStatus" AS ENUM ('ACTIVE', 'DISABLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CommissionLedgerEventType" AS ENUM ('INVOICE_PAID', 'ORDER_PAID', 'REFUND', 'CHARGEBACK', 'ADMIN_ADJUSTMENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CommissionLedgerStatus" AS ENUM ('PENDING', 'AVAILABLE', 'PAID', 'REVERSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AffiliatePayoutStatus" AS ENUM ('CREATED', 'SENT', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AdminPermissions (base; tab permission columns may already exist from 20250115000001)
CREATE TABLE IF NOT EXISTS "AdminPermissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canViewRevenue" BOOLEAN NOT NULL DEFAULT true,
    "canViewUserDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewUserEmails" BOOLEAN NOT NULL DEFAULT true,
    "canViewProductDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewOrderDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewDeliveryDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "canViewSystemMetrics" BOOLEAN NOT NULL DEFAULT true,
    "canViewAuditLogs" BOOLEAN NOT NULL DEFAULT true,
    "canViewPaymentInfo" BOOLEAN NOT NULL DEFAULT true,
    "canViewPrivateMessages" BOOLEAN NOT NULL DEFAULT true,
    "canDeleteUsers" BOOLEAN NOT NULL DEFAULT true,
    "canEditUsers" BOOLEAN NOT NULL DEFAULT true,
    "canDeleteProducts" BOOLEAN NOT NULL DEFAULT true,
    "canEditProducts" BOOLEAN NOT NULL DEFAULT true,
    "canModerateContent" BOOLEAN NOT NULL DEFAULT true,
    "canSendNotifications" BOOLEAN NOT NULL DEFAULT true,
    "canManageAdminPermissions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminPermissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminPermissions_userId_key" ON "AdminPermissions"("userId");
CREATE INDEX IF NOT EXISTS "AdminPermissions_userId_idx" ON "AdminPermissions"("userId");

DO $$ BEGIN
  ALTER TABLE "AdminPermissions" ADD CONSTRAINT "AdminPermissions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Affiliate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentAffiliateId" TEXT,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeConnectAccountId" TEXT,
    "stripeConnectOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "customUserCommissionPct" DOUBLE PRECISION,
    "customBusinessCommissionPct" DOUBLE PRECISION,
    "customParentUserCommissionPct" DOUBLE PRECISION,
    "customParentBusinessCommissionPct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Affiliate_userId_key" ON "Affiliate"("userId");
CREATE INDEX IF NOT EXISTS "Affiliate_userId_idx" ON "Affiliate"("userId");
CREATE INDEX IF NOT EXISTS "Affiliate_parentAffiliateId_idx" ON "Affiliate"("parentAffiliateId");
CREATE INDEX IF NOT EXISTS "Affiliate_status_idx" ON "Affiliate"("status");

DO $$ BEGIN
  ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_parentAffiliateId_fkey"
    FOREIGN KEY ("parentAffiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ReferralLink" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReferralLink_code_key" ON "ReferralLink"("code");
CREATE INDEX IF NOT EXISTS "ReferralLink_affiliateId_idx" ON "ReferralLink"("affiliateId");
CREATE INDEX IF NOT EXISTS "ReferralLink_code_idx" ON "ReferralLink"("code");

DO $$ BEGIN
  ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_affiliateId_fkey"
    FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Attribution" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AttributionType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "source" "AttributionSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Attribution_affiliateId_idx" ON "Attribution"("affiliateId");
CREATE INDEX IF NOT EXISTS "Attribution_userId_idx" ON "Attribution"("userId");
CREATE INDEX IF NOT EXISTS "Attribution_startsAt_endsAt_idx" ON "Attribution"("startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "Attribution_type_idx" ON "Attribution"("type");

DO $$ BEGIN
  ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_affiliateId_fkey"
    FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PromoCode" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL DEFAULT 'SUBSCRIPTION_ONLY',
    "discountSharePct" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "status" "PromoCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX IF NOT EXISTS "PromoCode_affiliateId_idx" ON "PromoCode"("affiliateId");
CREATE INDEX IF NOT EXISTS "PromoCode_code_idx" ON "PromoCode"("code");
CREATE INDEX IF NOT EXISTS "PromoCode_status_idx" ON "PromoCode"("status");
CREATE INDEX IF NOT EXISTS "PromoCode_startsAt_endsAt_idx" ON "PromoCode"("startsAt", "endsAt");

DO $$ BEGIN
  ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_affiliateId_fkey"
    FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "BusinessSubscription" (
    "id" TEXT NOT NULL,
    "businessUserId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "planId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" TEXT NOT NULL,
    "promoCodeId" TEXT,
    "attributionId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BusinessSubscription_businessUserId_key" ON "BusinessSubscription"("businessUserId");
CREATE INDEX IF NOT EXISTS "BusinessSubscription_businessUserId_idx" ON "BusinessSubscription"("businessUserId");
CREATE INDEX IF NOT EXISTS "BusinessSubscription_stripeSubscriptionId_idx" ON "BusinessSubscription"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "BusinessSubscription_startsAt_endsAt_idx" ON "BusinessSubscription"("startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "BusinessSubscription_attributionId_idx" ON "BusinessSubscription"("attributionId");
CREATE INDEX IF NOT EXISTS "BusinessSubscription_promoCodeId_idx" ON "BusinessSubscription"("promoCodeId");

DO $$ BEGIN
  ALTER TABLE "BusinessSubscription" ADD CONSTRAINT "BusinessSubscription_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BusinessSubscription" ADD CONSTRAINT "BusinessSubscription_attributionId_fkey"
    FOREIGN KEY ("attributionId") REFERENCES "Attribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CommissionLedger" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" "CommissionLedgerEventType" NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" "CommissionLedgerStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3),
    "meta" JSONB,
    "businessSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommissionLedger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommissionLedger_eventId_key" ON "CommissionLedger"("eventId");
CREATE INDEX IF NOT EXISTS "CommissionLedger_affiliateId_idx" ON "CommissionLedger"("affiliateId");
CREATE INDEX IF NOT EXISTS "CommissionLedger_eventId_idx" ON "CommissionLedger"("eventId");
CREATE INDEX IF NOT EXISTS "CommissionLedger_status_idx" ON "CommissionLedger"("status");
CREATE INDEX IF NOT EXISTS "CommissionLedger_availableAt_idx" ON "CommissionLedger"("availableAt");
CREATE INDEX IF NOT EXISTS "CommissionLedger_eventType_idx" ON "CommissionLedger"("eventType");

DO $$ BEGIN
  ALTER TABLE "CommissionLedger" ADD CONSTRAINT "CommissionLedger_affiliateId_fkey"
    FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommissionLedger" ADD CONSTRAINT "CommissionLedger_businessSubscriptionId_fkey"
    FOREIGN KEY ("businessSubscriptionId") REFERENCES "BusinessSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "AffiliatePayout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" "AffiliatePayoutStatus" NOT NULL DEFAULT 'CREATED',
    "stripeTransferId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AffiliatePayout_affiliateId_idx" ON "AffiliatePayout"("affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliatePayout_status_idx" ON "AffiliatePayout"("status");
CREATE INDEX IF NOT EXISTS "AffiliatePayout_periodStart_periodEnd_idx" ON "AffiliatePayout"("periodStart", "periodEnd");

DO $$ BEGIN
  ALTER TABLE "AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey"
    FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SubAffiliateInvite" (
    "id" TEXT NOT NULL,
    "parentAffiliateId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "inviteToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubAffiliateInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubAffiliateInvite_inviteToken_key" ON "SubAffiliateInvite"("inviteToken");
CREATE INDEX IF NOT EXISTS "SubAffiliateInvite_parentAffiliateId_idx" ON "SubAffiliateInvite"("parentAffiliateId");
CREATE INDEX IF NOT EXISTS "SubAffiliateInvite_inviteToken_idx" ON "SubAffiliateInvite"("inviteToken");
CREATE INDEX IF NOT EXISTS "SubAffiliateInvite_email_idx" ON "SubAffiliateInvite"("email");
CREATE INDEX IF NOT EXISTS "SubAffiliateInvite_status_idx" ON "SubAffiliateInvite"("status");

DO $$ BEGIN
  ALTER TABLE "SubAffiliateInvite" ADD CONSTRAINT "SubAffiliateInvite_parentAffiliateId_fkey"
    FOREIGN KEY ("parentAffiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
