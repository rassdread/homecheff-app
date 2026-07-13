-- CreateTable: DishReview
-- Safe migration: Only creates if table doesn't exist
CREATE TABLE IF NOT EXISTS "public"."DishReview" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DishReview_pkey" PRIMARY KEY ("id")
);

-- Ensure updatedAt has a default value for initial inserts
-- This is handled by Prisma's @updatedAt, but we need a default for the initial insert
ALTER TABLE IF EXISTS "public"."DishReview" 
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: DishReviewImage
-- Safe migration: Only creates if table doesn't exist
CREATE TABLE IF NOT EXISTS "public"."DishReviewImage" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DishReviewImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Only create if index doesn't exist
CREATE INDEX IF NOT EXISTS "DishReview_dishId_idx" ON "public"."DishReview"("dishId");
CREATE INDEX IF NOT EXISTS "DishReview_reviewerId_idx" ON "public"."DishReview"("reviewerId");
CREATE INDEX IF NOT EXISTS "DishReview_rating_idx" ON "public"."DishReview"("rating");
CREATE INDEX IF NOT EXISTS "DishReview_orderId_idx" ON "public"."DishReview"("orderId");
CREATE INDEX IF NOT EXISTS "DishReviewImage_reviewId_idx" ON "public"."DishReviewImage"("reviewId");

-- CreateUniqueConstraint: Only create if constraint doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DishReview_dishId_reviewerId_key'
    ) THEN
        ALTER TABLE "public"."DishReview" ADD CONSTRAINT "DishReview_dishId_reviewerId_key" UNIQUE ("dishId", "reviewerId");
    END IF;
END $$;

-- AddForeignKey: Only add if foreign key doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DishReview_dishId_fkey'
    ) THEN
        ALTER TABLE "public"."DishReview" ADD CONSTRAINT "DishReview_dishId_fkey" 
        FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DishReview_reviewerId_fkey'
    ) THEN
        ALTER TABLE "public"."DishReview" ADD CONSTRAINT "DishReview_reviewerId_fkey" 
        FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DishReview_orderId_fkey'
    ) THEN
        ALTER TABLE "public"."DishReview" ADD CONSTRAINT "DishReview_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DishReviewImage_reviewId_fkey'
    ) THEN
        ALTER TABLE "public"."DishReviewImage" ADD CONSTRAINT "DishReviewImage_reviewId_fkey" 
        FOREIGN KEY ("reviewId") REFERENCES "public"."DishReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

