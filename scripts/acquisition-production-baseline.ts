/**
 * Anonymized Production commercial baseline for Marketplace (acquisition measurement).
 * No PII in output. Writes JSON under homecheff-leads/docs/gtm/evidence-acquisition-baseline/.
 *
 * Usage (from homecheff-app): npx tsx scripts/acquisition-production-baseline.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/prisma";
import {
  LISTING_QUALITY_THRESHOLD,
  scoreListingQuality,
} from "../lib/acquisition/listing-quality";
import { productToListingQualityInput } from "../lib/acquisition/product-quality-input";

const MEANINGFUL_ORDER_STATUSES = [
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

const SERVICE_MARKETPLACE_CATEGORIES = [
  "ARTISTIC_SERVICE",
  "PRACTICAL_SERVICE",
  "KNOWLEDGE",
] as const;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const now = new Date();
  const d30 = daysAgo(30);
  const stamp = now.toISOString().slice(0, 10);
  const leadsEvidenceDir = join(
    "/Users/sergioarrias/HomeCheffProjects/homecheff-leads",
    "docs/gtm/evidence-acquisition-baseline",
  );

  const vlaardingenSellerWhere = {
    isActive: true,
    seller: {
      User: {
        city: { contains: "Vlaardingen", mode: "insensitive" as const },
      },
    },
  };

  const [
    activeListings,
    foodListings,
    gardenListings,
    creationsListings,
    serviceListings,
    activeSellerIds,
    vlaardingenListings,
    vlaardingenSellerRows,
    orders30,
    affiliateCount,
    commissionByStatus,
    activeProductsForQuality,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, category: "CHEFF" } }),
    prisma.product.count({ where: { isActive: true, category: "GROWN" } }),
    prisma.product.count({ where: { isActive: true, category: "DESIGNER" } }),
    prisma.product
      .count({
        where: {
          isActive: true,
          marketplaceCategory: { in: [...SERVICE_MARKETPLACE_CATEGORIES] },
        },
      })
      .catch(() => -1),
    prisma.product.findMany({
      where: { isActive: true },
      select: { sellerId: true },
      distinct: ["sellerId"],
    }),
    prisma.product.count({ where: vlaardingenSellerWhere }),
    prisma.product.findMany({
      where: vlaardingenSellerWhere,
      select: { sellerId: true },
      distinct: ["sellerId"],
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: d30 },
        status: { in: [...MEANINGFUL_ORDER_STATUSES] },
        items: { some: {} },
      },
      select: {
        id: true,
        userId: true,
        totalAmount: true,
      },
    }),
    prisma.affiliate.count().catch(() => -1),
    prisma.commissionLedger
      .groupBy({
        by: ["status"],
        _sum: { amountCents: true },
        _count: { _all: true },
      })
      .catch(() => []),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sellerId: true,
        title: true,
        description: true,
        priceCents: true,
        priceModel: true,
        category: true,
        marketplaceCategory: true,
        placeName: true,
        pickupAddress: true,
        pickupLat: true,
        pickupLng: true,
        useProfileLocation: true,
        delivery: true,
        sellerCanDeliver: true,
        stock: true,
        maxStock: true,
        availabilityDate: true,
        isFutureProduct: true,
        isActive: true,
        Image: { select: { id: true } },
        Video: { select: { id: true } },
        seller: {
          select: {
            displayName: true,
            bio: true,
            lat: true,
            lng: true,
            User: { select: { city: true } },
          },
        },
      },
    }),
  ]);

  let qualityListings = 0;
  const qualitySellerIds = new Set<string>();
  for (const p of activeProductsForQuality) {
    const scored = scoreListingQuality(productToListingQualityInput(p));
    if (scored.score >= LISTING_QUALITY_THRESHOLD) {
      qualityListings += 1;
      qualitySellerIds.add(p.sellerId);
    }
  }

  const buyerIds = new Set(orders30.map((o) => o.userId));
  const gmvCents = orders30.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const aov =
    orders30.length > 0 ? Math.round(gmvCents / orders30.length) : 0;

  const commissionMap: Record<string, { count: number; cents: number }> = {};
  for (const row of commissionByStatus as Array<{
    status: string;
    _sum: { amountCents: number | null };
    _count: { _all: number };
  }>) {
    commissionMap[row.status] = {
      count: row._count._all,
      cents: row._sum.amountCents ?? 0,
    };
  }

  const metrics: Record<string, number | string | null> = {
    BASELINE_DATE: stamp,
    PRODUCT: "marketplace",
    MARKETPLACE_ACTIVE_SELLERS: activeSellerIds.length,
    MARKETPLACE_ACTIVE_LISTINGS: activeListings,
    LISTINGS_FOOD: foodListings,
    LISTINGS_GARDEN: gardenListings,
    LISTINGS_CREATIONS: creationsListings,
    LISTINGS_SERVICES:
      serviceListings < 0 ? "UNKNOWN" : serviceListings,
    ...(serviceListings < 0
      ? {
          LISTINGS_SERVICES_WHY:
            "marketplaceCategory service enum filter query failed",
        }
      : {}),
    VLAARDINGEN_ACTIVE_SELLERS: vlaardingenSellerRows.length,
    VLAARDINGEN_ACTIVE_LISTINGS: vlaardingenListings,
    MARKETPLACE_BUYERS_30D: buyerIds.size,
    MARKETPLACE_ORDERS_30D: orders30.length,
    MARKETPLACE_GMV_30D: gmvCents,
    MARKETPLACE_PLATFORM_REVENUE_30D: "UNKNOWN",
    MARKETPLACE_PLATFORM_REVENUE_30D_WHY:
      "Order stores platformFeeCollected boolean only; no per-order feeCents. Avoid inventing revenue from DEFAULT_PLATFORM_FEE_PERCENT.",
    MARKETPLACE_AOV: aov,
    QUALITY_LISTINGS_COUNT: qualityListings,
    ACTIVE_SELLERS_WITH_QUALITY: qualitySellerIds.size,
    LISTING_QUALITY_THRESHOLD,
    AFFILIATES: affiliateCount < 0 ? "UNKNOWN" : affiliateCount,
    PENDING_COMMISSION_CENTS: commissionMap.PENDING?.cents ?? 0,
    AVAILABLE_COMMISSION_CENTS: commissionMap.AVAILABLE?.cents ?? 0,
    PAID_COMMISSION_CENTS: commissionMap.PAID?.cents ?? 0,
  };

  const rows = Object.entries(metrics)
    .filter(([k]) => k !== "PRODUCT" && !k.endsWith("_WHY"))
    .map(([METRIC, VALUE]) => ({
      BASELINE_DATE: stamp,
      PRODUCT: "marketplace",
      METRIC,
      VALUE,
      SOURCE: "marketplace_production_db_aggregate",
    }));

  mkdirSync(leadsEvidenceDir, { recursive: true });
  const outPath = join(leadsEvidenceDir, `marketplace-baseline-${stamp}.json`);
  writeFileSync(
    outPath,
    JSON.stringify({ capturedAt: now.toISOString(), metrics, rows }, null, 2),
  );
  console.log(JSON.stringify({ ok: true, outPath, metrics }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
