-- Account soft-deletion marker (Google Play / GDPR account deletion flow)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountDeletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_accountDeletedAt_idx" ON "User"("accountDeletedAt");
