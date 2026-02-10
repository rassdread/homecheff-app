-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'NL',
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
