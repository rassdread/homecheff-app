-- Snapshot Connect destination on Payout at transfer time
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "destinationConnectAccountId" TEXT;
