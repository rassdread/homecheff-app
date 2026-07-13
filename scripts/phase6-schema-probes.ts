/**
 * Phase 6 read-only schema probes — no DDL.
 */
import { prisma } from "../lib/prisma";

async function main() {
  const productCols = await prisma.$queryRaw`
    SELECT column_name, data_type, udt_name, is_nullable, column_default,
           numeric_precision, numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Product'
      AND column_name IN ('lengthCm', 'widthCm', 'heightCm', 'weightKg')
    ORDER BY column_name
  `;

  const productStats = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS total_products,
      COUNT("lengthCm")::int AS length_cm_set,
      COUNT("widthCm")::int AS width_cm_set,
      COUNT("heightCm")::int AS height_cm_set,
      COUNT("weightKg")::int AS weight_kg_set,
      MIN("lengthCm") AS min_length, MAX("lengthCm") AS max_length,
      MIN("widthCm") AS min_width, MAX("widthCm") AS max_width,
      MIN("heightCm") AS min_height, MAX("heightCm") AS max_height,
      MIN("weightKg") AS min_weight, MAX("weightKg") AS max_weight
    FROM "Product"
  `;

  const promoCols = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'PromoCode'
    ORDER BY ordinal_position
  `;

  const promoStats = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS total,
      COUNT("affiliateId")::int AS with_affiliate,
      COUNT("sellerId")::int AS with_seller,
      COUNT(*) FILTER (WHERE "affiliateId" IS NOT NULL AND "sellerId" IS NOT NULL)::int AS both,
      COUNT(*) FILTER (WHERE "affiliateId" IS NULL AND "sellerId" IS NULL)::int AS neither,
      COUNT(*) FILTER (WHERE "affiliateId" IS NOT NULL AND "sellerId" IS NULL)::int AS affiliate_only,
      COUNT(*) FILTER (WHERE "affiliateId" IS NULL AND "sellerId" IS NOT NULL)::int AS seller_only
    FROM "PromoCode"
  `;

  const promoOrphans = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*)::int FROM "PromoCode" p
       LEFT JOIN "Affiliate" a ON a.id = p."affiliateId"
       WHERE p."affiliateId" IS NOT NULL AND a.id IS NULL) AS orphan_affiliate,
      (SELECT COUNT(*)::int FROM "PromoCode" p
       LEFT JOIN "User" u ON u.id = p."sellerId"
       WHERE p."sellerId" IS NOT NULL AND u.id IS NULL) AS orphan_seller
  `;

  const promoFks = await prisma.$queryRaw`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table,
           rc.delete_rule, rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
    WHERE tc.table_name = 'PromoCode' AND tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.constraint_name
  `;

  const promoIndexes = await prisma.$queryRaw`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename = 'PromoCode' ORDER BY indexname
  `;

  const hcpCol = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'HcpCarouselSlide'
      AND column_name IN ('createdAt', 'updatedAt')
    ORDER BY column_name
  `;

  const hcpSample = await prisma.$queryRaw`
    SELECT id, "createdAt", "updatedAt"
    FROM "HcpCarouselSlide"
    ORDER BY "createdAt" DESC
    LIMIT 3
  `;

  const deliveryUnassigned = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS null_user_profiles
    FROM "DeliveryProfile" WHERE "userId" IS NULL
  `;

  const userRoleEnum = await prisma.$queryRaw`
    SELECT e.enumlabel FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' ORDER BY e.enumsortorder
  `;

  console.log(
    JSON.stringify(
      {
        productCols,
        productStats,
        promoCols,
        promoStats,
        promoOrphans,
        promoFks,
        promoIndexes,
        hcpCol,
        hcpSample,
        deliveryUnassigned,
        userRoleEnum,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
