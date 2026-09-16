import { prisma } from '../lib/prisma';
import { listingUsesPhysicalInventory } from '../lib/products/listing-inventory';
import {
  parseFulfillmentOptions,
  fulfillmentIsDigitalOnly,
  legacyUrlCategoryToMarketplace,
} from '../lib/marketplace/listing-taxonomy';

async function main() {
  const products = await prisma.product.findMany({
    select: {
      category: true,
      marketplaceCategory: true,
      subcategory: true,
      specializations: true,
      listingIntent: true,
      priceModel: true,
      fulfillmentOptions: true,
      stock: true,
      orderMethod: true,
    },
  });

  const mis: unknown[] = [];
  const missingMc: unknown[] = [];
  const digitalNotOnly: unknown[] = [];
  for (const p of products) {
    const fo = p.fulfillmentOptions
      ? parseFulfillmentOptions(p.fulfillmentOptions)
      : null;
    const uses = listingUsesPhysicalInventory({
      marketplaceCategory:
        p.marketplaceCategory || legacyUrlCategoryToMarketplace(p.category),
      priceModel: p.priceModel,
      listingIntent: p.listingIntent,
      specializations: p.specializations,
      fulfillmentOptions: fo,
    });
    const looksPhysical = ['CHEFF', 'GROWN', 'DESIGNER'].includes(p.category);
    if (looksPhysical && !uses && p.listingIntent !== 'REQUEST') {
      mis.push({
        category: p.category,
        marketplaceCategory: p.marketplaceCategory,
        priceModel: p.priceModel,
        specs: p.specializations,
        subcategory: p.subcategory,
        stock: p.stock,
        orderMethod: p.orderMethod,
        digitalOnly: fo ? fulfillmentIsDigitalOnly(fo) : false,
        fulfillment: fo,
      });
    }
    if (!p.marketplaceCategory) {
      missingMc.push({
        category: p.category,
        priceModel: p.priceModel,
        stock: p.stock,
        specs: p.specializations,
        subcategory: p.subcategory,
      });
    }
    if (fo?.digital && fo && !fulfillmentIsDigitalOnly(fo)) {
      digitalNotOnly.push({
        category: p.category,
        marketplaceCategory: p.marketplaceCategory,
        stock: p.stock,
        uses,
        fulfillment: fo,
      });
    }
  }
  console.log(
    JSON.stringify(
      { misclassified: mis, missingMarketplaceCategory: missingMc, digitalNotOnly },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
