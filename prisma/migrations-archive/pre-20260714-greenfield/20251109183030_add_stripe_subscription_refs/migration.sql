-- Add Stripe customer/subscription references to seller profiles
ALTER TABLE "SellerProfile"
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;





