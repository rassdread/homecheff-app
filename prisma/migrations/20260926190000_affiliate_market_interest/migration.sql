-- New-country affiliate interest. The row is the source of truth; email is a notice.

CREATE TABLE "AffiliateMarketInterest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "region" TEXT,
    "phone" TEXT,
    "languages" TEXT,
    "profileUrl" TEXT,
    "salesExperience" TEXT,
    "networkReach" TEXT,
    "wantsOwnCustomers" BOOLEAN,
    "wantsNetwork" BOOLEAN,
    "motivation" TEXT,
    "locale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateMarketInterest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AffiliateMarketInterest_email_countryCode_status_idx" ON "AffiliateMarketInterest"("email", "countryCode", "status");
