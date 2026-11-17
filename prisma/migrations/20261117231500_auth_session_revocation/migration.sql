-- One browser session ended by Uitloggen must not be restored by a late response.
CREATE TABLE "AuthSessionRevocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSessionRevocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSessionRevocation_userId_sid_key" ON "AuthSessionRevocation"("userId", "sid");

CREATE INDEX "AuthSessionRevocation_createdAt_idx" ON "AuthSessionRevocation"("createdAt");
