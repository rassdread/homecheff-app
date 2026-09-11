-- Dual-track Stripe Connect: persist PARTICULAR vs BUSINESS server-side.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectTrack" TEXT;
