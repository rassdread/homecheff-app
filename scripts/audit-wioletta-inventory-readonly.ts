/**
 * Read-only production inventory audit: identify Wioletta listings +
 * global existing-product classification. Never mutates.
 *
 *   npx tsx --env-file=.env.local scripts/audit-wioletta-inventory-readonly.ts
 */
import { writeFileSync } from 'node:fs';
import { prisma } from '../lib/prisma';
import { listingUsesPhysicalInventory } from '../lib/products/listing-inventory';
import { formFieldsForCategory } from '../lib/marketplace/form-config';
import { parseFulfillmentOptions, legacyUrlCategoryToMarketplace, fulfillmentIsDigitalOnly } from '../lib/marketplace/listing-taxonomy';
import type { MarketplaceCategory } from '@prisma/client';

function classify(p: {
  marketplaceCategory: string | null;
  category: string;
  priceModel: string | null;
  listingIntent: string | null;
  specializations: string[] | null;
  subcategory: string | null;
  fulfillmentOptions: unknown;
}) {
  const fo = p.fulfillmentOptions ? parseFulfillmentOptions(p.fulfillmentOptions) : null;
  const mappedCat = (p.marketplaceCategory ||
    legacyUrlCategoryToMarketplace(p.category)) as MarketplaceCategory;
  const uses = listingUsesPhysicalInventory({
    marketplaceCategory: p.marketplaceCategory || mappedCat,
    priceModel: p.priceModel,
    listingIntent: p.listingIntent,
    specializations: p.specializations,
    fulfillmentOptions: fo,
  });
  const fields = formFieldsForCategory(
    mappedCat,
    p.specializations,
    p.subcategory,
    {
      priceModel: p.priceModel,
      listingIntent: p.listingIntent,
      digital: fo ? fulfillmentIsDigitalOnly(fo) : false,
    },
  );
  return {
    mappedCat,
    usesInventory: uses,
    showStock: fields.showStock,
    digitalOnly: fo ? fulfillmentIsDigitalOnly(fo) : false,
    digitalFlag: Boolean(fo?.digital),
    mismatchHidden: uses && !fields.showStock,
  };
}

function segment(p: {
  marketplaceCategory: string | null;
  category: string;
  priceModel: string | null;
  listingIntent: string | null;
  specializations: string[] | null;
  fulfillmentOptions: unknown;
}) {
  const fo = p.fulfillmentOptions ? parseFulfillmentOptions(p.fulfillmentOptions) : null;
  const model = String(p.priceModel ?? '').toUpperCase();
  const cat = String(p.marketplaceCategory || p.category || '').toUpperCase();
  if (p.listingIntent === 'REQUEST') return 'REQUEST';
  if (fo && fulfillmentIsDigitalOnly(fo)) return 'DIGITAL';
  if (['ON_REQUEST', 'VOLUNTARY', 'HOURLY', 'DAILY'].includes(model)) return 'ON_REQUEST';
  if (cat === 'ARTISTIC_SERVICE' || cat === 'PRACTICAL_SERVICE') return 'SERVICE';
  if (cat === 'KNOWLEDGE') {
    const specs = p.specializations ?? [];
    if (specs.some((id) => ['knowledge.workshop', 'knowledge.cookingclass', 'knowledge.musicclass'].includes(id))) {
      return 'WORKSHOP';
    }
    return 'SERVICE';
  }
  if (cat === 'CREATE' || cat === 'CHEFF' || cat === 'CHEF') return 'CREATE';
  if (cat === 'GROW' || cat === 'GROWN' || cat === 'GARDEN') return 'GROW';
  if (cat === 'DESIGN' || cat === 'DESIGNER') return 'DESIGN';
  return 'UNKNOWN/LEGACY';
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Wioletta', mode: 'insensitive' } },
        { username: { contains: 'wioletta', mode: 'insensitive' } },
        { email: { contains: 'wioletta', mode: 'insensitive' } },
        { name: { contains: 'Wioleta', mode: 'insensitive' } },
        { username: { contains: 'wioleta', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      SellerProfile: { select: { id: true } },
    },
  });

  const internalUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    sellerProfileId: u.SellerProfile?.id ?? null,
  }));

  const sellerIds = users
    .map((u) => u.SellerProfile?.id)
    .filter((id): id is string => Boolean(id));

  const wiolettaProducts =
    sellerIds.length > 0
      ? await prisma.product.findMany({
          where: { sellerId: { in: sellerIds } },
          select: {
            id: true,
            title: true,
            createdAt: true,
            category: true,
            marketplaceCategory: true,
            subcategory: true,
            specializations: true,
            listingIntent: true,
            priceModel: true,
            fulfillmentOptions: true,
            stock: true,
            maxStock: true,
            isActive: true,
            orderMethod: true,
            placeName: true,
          },
          orderBy: { createdAt: 'asc' },
        })
      : [];

  const wiolettaListings = wiolettaProducts.map((p, i) => {
    const c = classify(p);
    return {
      alias: `WIOLETTA_LISTING_${String.fromCharCode(65 + i)}`,
      id: p.id,
      title: p.title,
      createdAt: p.createdAt.toISOString(),
      category: p.category,
      marketplaceCategory: p.marketplaceCategory,
      subcategory: p.subcategory,
      specializations: p.specializations,
      listingIntent: p.listingIntent,
      priceModel: p.priceModel,
      fulfillmentOptions: p.fulfillmentOptions,
      stock: p.stock,
      maxStock: p.maxStock,
      isActive: p.isActive,
      orderMethod: p.orderMethod,
      segment: segment(p),
      ...c,
    };
  });

  const products = await prisma.product.findMany({
    select: {
      id: true,
      category: true,
      marketplaceCategory: true,
      subcategory: true,
      specializations: true,
      listingIntent: true,
      priceModel: true,
      fulfillmentOptions: true,
      stock: true,
      maxStock: true,
      createdAt: true,
    },
  });

  const buckets: Record<string, number> = {};
  let stockSupported = 0;
  let stockGtZero = 0;
  let stockZero = 0;
  let stockNull = 0;
  let formHiddenButSupported = 0;
  let potentiallyMisclassified = 0;
  let missingMarketplaceCategory = 0;
  let missingSpecs = 0;
  let digitalFlagButNotOnly = 0;
  const mismatchSamples: Array<Record<string, unknown>> = [];

  for (const p of products) {
    const seg = segment(p);
    buckets[seg] = (buckets[seg] || 0) + 1;
    const c = classify(p);
    if (!p.marketplaceCategory) missingMarketplaceCategory += 1;
    if (!p.specializations || p.specializations.length === 0) missingSpecs += 1;
    if (c.digitalFlag && !c.digitalOnly) digitalFlagButNotOnly += 1;
    if (c.usesInventory) {
      stockSupported += 1;
      if (typeof p.stock !== 'number') stockNull += 1;
      else if (p.stock > 0) stockGtZero += 1;
      else stockZero += 1;
    }
    if (c.mismatchHidden) {
      formHiddenButSupported += 1;
      if (mismatchSamples.length < 12) {
        mismatchSamples.push({
          id: p.id,
          category: p.category,
          marketplaceCategory: p.marketplaceCategory,
          priceModel: p.priceModel,
          listingIntent: p.listingIntent,
          specializations: p.specializations,
          subcategory: p.subcategory,
          stock: p.stock,
        });
      }
    }
    const looksPhysical =
      p.category === 'CHEFF' ||
      p.category === 'GROWN' ||
      p.category === 'DESIGNER';
    if (looksPhysical && !c.usesInventory && p.listingIntent !== 'REQUEST') {
      potentiallyMisclassified += 1;
    }
  }

  const publicReport = {
    WIOLETTA_USER_FOUND: users.length > 0 ? 'YES' : 'NO',
    WIOLETTA_USER_COUNT: users.length,
    WIOLETTA_PRODUCT_COUNT: wiolettaProducts.length,
    WIOLETTA_STOCK_SUPPORTED_PRODUCT_COUNT: wiolettaListings.filter((l) => l.usesInventory)
      .length,
    WIOLETTA_LISTINGS: wiolettaListings.map((l) => ({
      alias: l.alias,
      TYPE: l.segment,
      CREATED_AT: l.createdAt,
      LEGACY_CATEGORY: l.category,
      MARKETPLACE_CATEGORY: l.marketplaceCategory,
      TAXONOMY_SPECS: l.specializations,
      SUBCATEGORY: l.subcategory,
      PRICE_MODEL: l.priceModel,
      LISTING_INTENT: l.listingIntent,
      STOCK: l.stock,
      MAX_STOCK: l.maxStock,
      PUBLISHED: l.isActive,
      STOCK_SHOULD_APPLY: l.usesInventory,
      STOCK_FIELD_VISIBLE: l.showStock,
      DIGITAL_ONLY: l.digitalOnly,
      DIGITAL_FLAG: l.digitalFlag,
      FORM_VS_POLICY_MISMATCH: l.mismatchHidden,
    })),
    TOTAL_EXISTING_PRODUCTS: products.length,
    SEGMENTS: buckets,
    EXISTING_STOCK_SUPPORTED: stockSupported,
    EXISTING_STOCK_GT_ZERO: stockGtZero,
    EXISTING_STOCK_ZERO: stockZero,
    EXISTING_STOCK_NULL: stockNull,
    LEGACY_STOCK_SUPPORTED_BUT_FORM_HIDDEN: formHiddenButSupported,
    POTENTIALLY_MISCLASSIFIED_PRODUCTS: potentiallyMisclassified,
    MISSING_MARKETPLACE_CATEGORY: missingMarketplaceCategory,
    MISSING_SPECS: missingSpecs,
    DIGITAL_FLAG_BUT_NOT_ONLY: digitalFlagButNotOnly,
    MISMATCH_SAMPLES: mismatchSamples,
  };

  writeFileSync(
    'docs/audits/inventory-end-to-end/wioletta-internal.json',
    JSON.stringify({ internalUsers, wiolettaListings, publicReport }, null, 2),
  );
  writeFileSync(
    'docs/audits/inventory-end-to-end/wioletta-public.json',
    JSON.stringify(publicReport, null, 2),
  );
  console.log(JSON.stringify(publicReport, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
