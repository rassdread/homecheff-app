-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "availabilityDate" TIMESTAMP(3),
ADD COLUMN     "isFutureProduct" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Listing_availabilityDate_isFutureProduct_idx" ON "public"."Listing"("availabilityDate", "isFutureProduct");
