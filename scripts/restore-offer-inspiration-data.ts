/**
 * One-shot production correction for empty offer→inspiration mirrors.
 * Does not delete Products. Does not invent guide text. No schema migration.
 *
 * Run: npx tsx scripts/restore-offer-inspiration-data.ts
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { categoryHasMeaningfulGuide } from '../lib/inspiratie/guide-requirements';
import { usernameContainsTempPlaceholder } from '../lib/username-placeholder';

const POM = '8fd14127-ee0a-440f-983b-7982c8ebab60';
const BROWNIE = 'f7f39442-095b-4de5-aea7-f3709a41d61b';
const HEALTHY = '6758bb31-6c1f-43b9-b2e2-dbac9358e132';
const CERT = 'ac00ba62-18f1-43c5-9922-7b7ad3c5934b';
const CERT_OWNER = '8d818ef6-2035-47a1-ba9c-3be7111823e2';

function loadEnvLocal() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvLocal();

function definitiveUsername(username: string | null | undefined): string | null {
  const value = (username || '').trim();
  if (!value || usernameContainsTempPlaceholder(value)) return null;
  return value;
}

async function main() {
  const prisma = new PrismaClient();
  const report: Record<string, unknown> = {};
  try {
    const dishes = await prisma.dish.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        userId: true,
        category: true,
        title: true,
        ingredients: true,
        instructions: true,
        materials: true,
        notes: true,
        plantType: true,
        soilType: true,
        plantDate: true,
        harvestDate: true,
        plantDistance: true,
        growthDuration: true,
        photos: { select: { id: true, url: true } },
        stepPhotos: { select: { id: true } },
        growthPhotos: { select: { id: true } },
        _count: { select: { reviews: true, favorites: true } },
      },
    });

    const ids = dishes.map((d) => d.id);
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        listingIntent: true,
        isActive: true,
        Image: { select: { fileUrl: true } },
        _count: { select: { orderItems: true, reviews: true, favorites: true } },
      },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const erroneous: string[] = [];
    const genuineIncomplete: string[] = [];
    const uncertain: string[] = [];

    for (const dish of dishes) {
      const guide = categoryHasMeaningfulGuide(dish.category, dish);
      const product = productById.get(dish.id);
      if (guide) continue;
      const hasMedia = dish.stepPhotos.length > 0 || dish.growthPhotos.length > 0;
      if (product && product.listingIntent === 'OFFER' && !hasMedia) {
        erroneous.push(dish.id);
      } else if (!product && !hasMedia) {
        genuineIncomplete.push(dish.id);
      } else {
        uncertain.push(dish.id);
      }
    }

    if (erroneous.includes(HEALTHY)) {
      throw new Error('Refusing to unpublish the known complete recipe');
    }

    report.FLAT_DISHES_AUDITED = erroneous.length + genuineIncomplete.length + uncertain.length;
    report.ERRONEOUS_OFFER_MIRRORS_FOUND = erroneous.length;
    report.GENUINE_INCOMPLETE_INSPIRATION_FOUND = genuineIncomplete.length;
    report.UNCERTAIN_RECORDS = uncertain.length;
    report.erroneousIds = erroneous;
    report.genuineIncompleteIds = genuineIncomplete;
    report.uncertainIds = uncertain;

    const healthy = dishes.find((d) => d.id === HEALTHY);
    report.HEALTHY_STILL_PUBLISHED = Boolean(healthy);
    report.HEALTHY_HAS_GUIDE = healthy
      ? categoryHasMeaningfulGuide(healthy.category, healthy)
      : false;

    const pom = dishes.find((d) => d.id === POM);
    const brownie = dishes.find((d) => d.id === BROWNIE);
    const pomProduct = productById.get(POM);
    const brownieProduct = productById.get(BROWNIE);
    report.POM_PAIRED_OFFER = Boolean(pomProduct && pomProduct.listingIntent === 'OFFER');
    report.POM_GUIDE = pom ? categoryHasMeaningfulGuide(pom.category, pom) : null;
    report.BROWNIE_PAIRED_OFFER = Boolean(brownieProduct && brownieProduct.listingIntent === 'OFFER');
    report.BROWNIE_GUIDE = brownie ? categoryHasMeaningfulGuide(brownie.category, brownie) : null;
    report.BROWNIE_PROVENANCE = !brownie
      ? 'missing'
      : brownieProduct && brownieProduct.listingIntent === 'OFFER' && report.BROWNIE_GUIDE === false
        ? 'offer-mirror'
        : brownieProduct
          ? 'paired-product-not-empty-offer-mirror'
          : 'no-paired-product';

    const noneUsers = await prisma.user.findMany({
      where: { displayNameOption: { equals: 'none', mode: 'insensitive' } },
      select: { id: true, username: true, displayNameOption: true },
    });
    const noneWithUsername = noneUsers.filter((u) => definitiveUsername(u.username));
    const noneWithout = noneUsers.filter((u) => !definitiveUsername(u.username));
    const noneIds = noneUsers.map((u) => u.id);
    const publicDishes = noneIds.length
      ? await prisma.dish.count({ where: { userId: { in: noneIds }, status: 'PUBLISHED' } })
      : 0;
    const publicProducts = noneIds.length
      ? await prisma.product.count({
          where: { seller: { userId: { in: noneIds } }, isActive: true },
        })
      : 0;

    report.USERS_WITH_DISPLAY_NONE_BEFORE = noneUsers.length;
    report.NONE_WITH_USERNAME = noneWithUsername.length;
    report.NONE_WITHOUT_USERNAME = noneWithout.length;
    report.PUBLIC_CONTENT_OWNED_BY_NONE_USERS = { dishes: publicDishes, products: publicProducts };

    if (!report.HEALTHY_HAS_GUIDE) {
      throw new Error('Healthy recipe guide missing; aborting data changes');
    }

    if (erroneous.length) {
      const updated = await prisma.dish.updateMany({
        where: { id: { in: erroneous }, status: 'PUBLISHED' },
        data: { status: 'PRIVATE' },
      });
      report.MIRRORS_UNPUBLISHED = updated.count;
    } else {
      report.MIRRORS_UNPUBLISHED = 0;
    }

    const pomAfter = await prisma.dish.findUnique({
      where: { id: POM },
      select: { status: true },
    });
    const pomProductAfter = await prisma.product.findUnique({
      where: { id: POM },
      select: { isActive: true, listingIntent: true },
    });
    report.POM_DISH_STATUS_AFTER = pomAfter?.status ?? 'removed';
    report.POM_PRODUCT_ACTIVE = pomProductAfter?.isActive ?? false;
    report.POM_PRODUCT_INTENT = pomProductAfter?.listingIntent ?? null;

    const brownieAfter = await prisma.dish.findUnique({
      where: { id: BROWNIE },
      select: { status: true },
    });
    const brownieProductAfter = await prisma.product.findUnique({
      where: { id: BROWNIE },
      select: { isActive: true, listingIntent: true },
    });
    report.BROWNIE_DISH_STATUS_AFTER = brownieAfter?.status ?? 'removed';
    report.BROWNIE_PRODUCT_ACTIVE = brownieProductAfter?.isActive ?? false;

    const cert = await prisma.dish.findUnique({
      where: { id: CERT },
      include: {
        photos: true,
        _count: { select: { reviews: true, favorites: true } },
      },
    });
    const certProduct = await prisma.product.findUnique({
      where: { id: CERT },
      select: {
        isActive: true,
        seller: { select: { userId: true } },
        Image: { select: { fileUrl: true } },
        _count: { select: { orderItems: true, reviews: true, favorites: true } },
      },
    });
    report.CERT_FOUND = Boolean(cert);
    report.CERT_OWNER_MATCH = cert?.userId === CERT_OWNER;
    report.CERT_PRODUCT_INACTIVE = certProduct ? certProduct.isActive === false : null;
    report.CERT_DISH_REVIEWS = cert?._count.reviews ?? null;
    report.CERT_DISH_FAVORITES = cert?._count.favorites ?? null;
    report.CERT_PRODUCT_ORDERS = certProduct?._count.orderItems ?? null;

    let testDishCleaned = false;
    let testBlobCleaned = false;
    if (
      cert &&
      cert.userId === CERT_OWNER &&
      certProduct &&
      certProduct.isActive === false &&
      certProduct.seller?.userId === CERT_OWNER &&
      (cert._count.reviews ?? 0) === 0 &&
      (cert._count.favorites ?? 0) === 0 &&
      (certProduct._count.orderItems ?? 0) === 0 &&
      (certProduct._count.reviews ?? 0) === 0 &&
      (certProduct._count.favorites ?? 0) === 0
    ) {
      const productUrls = new Set(certProduct.Image.map((img) => img.fileUrl));
      const exclusive = cert.photos.filter((photo) => !productUrls.has(photo.url));
      await prisma.dish.delete({ where: { id: CERT } });
      testDishCleaned = true;
      testBlobCleaned = false;
      report.CERT_EXCLUSIVE_PHOTO_ROWS = exclusive.length;
      report.CERT_SHARED_PHOTO_ROWS = cert.photos.length - exclusive.length;
      report.CERT_BLOB_NOTE =
        'Dish photo rows removed with the dish. Shared product image blobs were left in place.';
    }
    report.TEST_DISH_CLEANED = testDishCleaned;
    report.TEST_BLOB_CLEANED = testBlobCleaned;
    const certProductStill = await prisma.product.findUnique({
      where: { id: CERT },
      select: { id: true, isActive: true },
    });
    report.CERT_PRODUCT_KEPT = Boolean(certProductStill);

    const migrated = noneWithUsername.length
      ? await prisma.user.updateMany({
          where: { id: { in: noneWithUsername.map((u) => u.id) } },
          data: { displayNameOption: 'username' },
        })
      : { count: 0 };
    report.NONE_USERS_MIGRATED = migrated.count;

    const pomOwner = await prisma.user.findUnique({
      where: { id: pom?.userId || 'missing' },
      select: { username: true, displayNameOption: true, name: true },
    });
    const brownieOwner = brownie
      ? await prisma.user.findUnique({
          where: { id: brownie.userId },
          select: { username: true, displayNameOption: true, name: true },
        })
      : null;
    const pomPublic = definitiveUsername(pomOwner?.username);
    const browniePublic = definitiveUsername(brownieOwner?.username);
    report.POM_DISPLAY_OPTION = pomOwner?.displayNameOption ?? null;
    report.POM_AUTHOR_AFTER = pomPublic;
    report.POM_REAL_NAME_EXPOSED = Boolean(
      pomOwner?.name && pomPublic && pomOwner.name.trim() === pomPublic,
    );
    report.BROWNIE_DISPLAY_OPTION = brownieOwner?.displayNameOption ?? null;
    report.BROWNIE_AUTHOR_AFTER = browniePublic;
    report.REAL_NAME_EQUALS_PUBLIC =
      Boolean(pomOwner?.name && pomPublic && pomOwner.name.trim() === pomPublic);

    const healthyAfter = await prisma.dish.findUnique({
      where: { id: HEALTHY },
      select: { status: true, ingredients: true, instructions: true },
    });
    report.HEALTHY_STATUS_AFTER = healthyAfter?.status ?? null;
    report.HEALTHY_INGREDIENTS = healthyAfter?.ingredients.length ?? 0;
    report.HEALTHY_STEPS = healthyAfter?.instructions.length ?? 0;

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('DATA_CORRECTION_FAIL', error instanceof Error ? error.message : 'failed');
  process.exit(1);
});
