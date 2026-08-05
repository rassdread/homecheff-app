/**
 * Production Cleanup Phase 1 — audit + optional soft cleanup.
 *
 * Default: DRY RUN (report only).
 * Apply:   npx tsx scripts/production-cleanup-phase1.ts --apply
 *
 * Soft-deactivates obvious development artifacts (isActive=false / REMOVED / PRIVATE).
 * Removes Image / ListingMedia / DishPhoto rows with empty or clearly invalid URLs.
 * Does NOT wipe commerce history, schema, or architecture.
 *
 * Never run wipe-all scripts (cleanup-test-data*, clear-all-*) against production.
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const APPLY = process.argv.includes('--apply');
const HEAD_CHECK = process.argv.includes('--head-check');
const HEAD_LIMIT = 80;

const prisma = new PrismaClient();

const TITLE_PATTERNS = [
  'test product',
  'test listing',
  'test meal',
  'test lasagne',
  'verwijder mij',
  'lorem ipsum',
  'placeholder',
  'dummy',
  'fake product',
  'fake meal',
  'sample product',
  'qa listing',
  'debug listing',
  'temp listing',
  'demo listing',
  'asdf',
  'xxx test',
  'phase51',
  'phase52',
  'phase53',
  'phase54',
  'phase55',
  'phase56',
  'phase57',
  'e2e meal',
  'smoke meal',
  'barter only meal',
  'service proposal item',
];

function titleLooksLikeTest(title: string | null | undefined): boolean {
  if (!title) return false;
  const t = title.toLowerCase().trim();
  if (TITLE_PATTERNS.some((p) => t.includes(p))) return true;
  if (/^test[\s\-_]/i.test(t)) return true;
  if (/\[(test|qa|demo|temp)\]/i.test(t)) return true;
  if (/^phase\d+/i.test(t)) return true;
  if (/\be2e\b/i.test(t)) return true;
  if (t.length <= 2) return true;
  return false;
}

function sellerLooksLikeTest(
  displayName: string | null | undefined,
  email: string | null | undefined,
): boolean {
  const d = (displayName || '').toLowerCase();
  const e = (email || '').toLowerCase();
  if (/phase\d+/.test(d) || /phase\d+/.test(e)) return true;
  if (e === 'demo@homecheff.app') return true;
  if (e.endsWith('@test.com') || e.endsWith('@example.com')) return true;
  if (d.includes('e2e') || e.includes('e2e')) return true;
  return false;
}

function imageLooksLikePlaceholder(fileUrl: string | null | undefined): boolean {
  if (!fileUrl) return false;
  const u = fileUrl.toLowerCase();
  return (
    u.includes('/placeholder.') ||
    u.includes('placeholder.webp') ||
    u.includes('placeholder.png') ||
    u.includes('placeholder-lasagne') ||
    u.includes('via.placeholder.com') ||
    u.includes('placehold.co')
  );
}

function descriptionLooksLikeTest(desc: string | null | undefined): boolean {
  if (!desc) return false;
  const d = desc.toLowerCase();
  return (
    d.includes('lorem ipsum') ||
    d.includes('placeholder text') ||
    d.includes('this is a test') ||
    d.includes('dit is een test') ||
    d.includes('dummy content')
  );
}

function urlInvalid(url: string | null | undefined): boolean {
  if (url == null) return true;
  const u = String(url).trim();
  if (!u || u === 'undefined' || u === 'null' || u === '""' || u === "''") return true;
  if (u === '/' || u === '#') return true;
  // empty data URI
  if (u.startsWith('data:') && u.length < 32) return true;
  return false;
}

async function headOk(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(t);
    if (res.ok) return true;
    // some CDNs reject HEAD — try GET range
    if (res.status === 403 || res.status === 405) {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 8000);
      const res2 = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: ctrl2.signal,
        redirect: 'follow',
      });
      clearTimeout(t2);
      return res2.ok || res2.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}

type AuditReport = {
  dryRun: boolean;
  applied: boolean;
  timestamp: string;
  productsFlagged: Array<{ id: string; title: string; reason: string; isActive: boolean }>;
  listingsFlagged: Array<{ id: string; title: string; reason: string; status: string }>;
  dishesFlagged: Array<{ id: string; title: string | null; reason: string; status: string }>;
  usersFlagged: Array<{ id: string; email: string | null; name: string | null; reason: string }>;
  imagesInvalid: Array<{ id: string; productId: string; fileUrl: string }>;
  listingMediaInvalid: Array<{ id: string; listingId: string; url: string }>;
  dishPhotosInvalid: Array<{ id: string; dishId: string; url: string }>;
  brokenHeadChecks: Array<{ kind: string; id: string; url: string }>;
  actions: {
    productsDeactivated: number;
    listingsRemoved: number;
    dishesPrivatized: number;
    imagesDeleted: number;
    listingMediaDeleted: number;
    dishPhotosDeleted: number;
    usersSkippedWithOrders: number;
    usersNotDeleted: number;
  };
};

async function main() {
  const report: AuditReport = {
    dryRun: !APPLY,
    applied: false,
    timestamp: new Date().toISOString(),
    productsFlagged: [],
    listingsFlagged: [],
    dishesFlagged: [],
    usersFlagged: [],
    imagesInvalid: [],
    listingMediaInvalid: [],
    dishPhotosInvalid: [],
    brokenHeadChecks: [],
    actions: {
      productsDeactivated: 0,
      listingsRemoved: 0,
      dishesPrivatized: 0,
      imagesDeleted: 0,
      listingMediaDeleted: 0,
      dishPhotosDeleted: 0,
      usersSkippedWithOrders: 0,
      usersNotDeleted: 0,
    },
  };

  console.log(`\n=== Production Cleanup Phase 1 (${APPLY ? 'APPLY' : 'DRY RUN'}) ===\n`);

  // --- Products ---
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      isActive: true,
      listingIntent: true,
      Image: { select: { id: true, fileUrl: true } },
      seller: {
        select: {
          displayName: true,
          User: { select: { email: true } },
        },
      },
    },
  });

  for (const p of products) {
    const reasons: string[] = [];
    if (titleLooksLikeTest(p.title)) reasons.push('test-like title');
    if (descriptionLooksLikeTest(p.description)) reasons.push('test-like description');
    if (sellerLooksLikeTest(p.seller?.displayName, p.seller?.User?.email)) {
      reasons.push('test-like seller');
    }
    const usable = p.Image.filter((i) => !urlInvalid(i.fileUrl));
    if (p.Image.length > 0 && usable.length === 0) reasons.push('only-invalid-images');
    if (p.Image.some((i) => imageLooksLikePlaceholder(i.fileUrl))) {
      reasons.push('placeholder-image');
    }
    // Offers without any image are incomplete for marketplace display; requests may be text-only.
    if (p.listingIntent !== 'REQUEST' && p.Image.length === 0) {
      reasons.push('offer-no-images');
    }
    if (reasons.length) {
      report.productsFlagged.push({
        id: p.id,
        title: p.title,
        reason: reasons.join('; '),
        isActive: p.isActive,
      });
    }
  }

  // --- Legacy listings ---
  const listings = await prisma.listing.findMany({
    where: { status: { in: ['ACTIVE', 'DRAFT', 'PAUSED'] } },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      ListingMedia: { select: { id: true, url: true } },
    },
  });
  for (const l of listings) {
    const reasons: string[] = [];
    if (titleLooksLikeTest(l.title)) reasons.push('test-like title');
    if (descriptionLooksLikeTest(l.description)) reasons.push('test-like description');
    const usable = l.ListingMedia.filter((m) => !urlInvalid(m.url));
    if (l.ListingMedia.length > 0 && usable.length === 0) reasons.push('only-invalid-images');
    if (reasons.length) {
      report.listingsFlagged.push({
        id: l.id,
        title: l.title,
        reason: reasons.join('; '),
        status: l.status,
      });
    }
  }

  // --- Dishes ---
  const dishes = await prisma.dish.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      photos: { select: { id: true, url: true } },
    },
  });
  for (const d of dishes) {
    const reasons: string[] = [];
    if (titleLooksLikeTest(d.title)) reasons.push('test-like title');
    if (descriptionLooksLikeTest(d.description)) reasons.push('test-like description');
    if (reasons.length) {
      report.dishesFlagged.push({
        id: d.id,
        title: d.title,
        reason: reasons.join('; '),
        status: d.status,
      });
    }
  }

  // Also soft-deactivate INACTIVE-already Phase/E2E leftovers for report completeness,
  // and catch active products owned by Phase5 sellers even if title looks normal.
  const phaseOwned = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: 'Phase5', mode: 'insensitive' } },
        { seller: { displayName: { contains: 'Phase5', mode: 'insensitive' } } },
        { seller: { User: { email: { contains: 'phase5', mode: 'insensitive' } } } },
        { Image: { some: { fileUrl: { contains: 'placeholder.' } } } },
      ],
    },
    select: { id: true, title: true, isActive: true },
  });
  for (const p of phaseOwned) {
    if (!report.productsFlagged.some((x) => x.id === p.id)) {
      report.productsFlagged.push({
        id: p.id,
        title: p.title,
        reason: 'phase-e2e-or-placeholder',
        isActive: p.isActive,
      });
    }
  }

  // --- Users (flag only — never auto-delete without order check) ---
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: '@test.com' } },
        { email: { endsWith: '@example.com' } },
        { email: { endsWith: '@example.org' } },
        { email: { startsWith: 'demo@' } },
        { email: { startsWith: 'test@' } },
        { email: { equals: 'demo@homecheff.app' } },
        { email: { contains: 'phase5', mode: 'insensitive' } },
        { name: { contains: 'Test User', mode: 'insensitive' } },
        { name: { contains: 'Phase5', mode: 'insensitive' } },
        { name: { equals: 'Demo User' } },
        { username: { contains: 'testuser', mode: 'insensitive' } },
      ],
      accountDeletedAt: null,
    },
    select: { id: true, email: true, name: true, username: true },
  });
  for (const u of testUsers) {
    report.usersFlagged.push({
      id: u.id,
      email: u.email,
      name: u.name,
      reason: 'test/demo email or name pattern',
    });
  }

  // --- Invalid image rows (all products, not only active) ---
  const allImages = await prisma.image.findMany({
    select: { id: true, productId: true, fileUrl: true },
  });
  for (const img of allImages) {
    if (urlInvalid(img.fileUrl)) {
      report.imagesInvalid.push({
        id: img.id,
        productId: img.productId,
        fileUrl: String(img.fileUrl ?? ''),
      });
    }
  }

  const allListingMedia = await prisma.listingMedia.findMany({
    select: { id: true, listingId: true, url: true },
  });
  for (const m of allListingMedia) {
    if (urlInvalid(m.url)) {
      report.listingMediaInvalid.push({
        id: m.id,
        listingId: m.listingId,
        url: String(m.url ?? ''),
      });
    }
  }

  const allDishPhotos = await prisma.dishPhoto.findMany({
    select: { id: true, dishId: true, url: true },
  });
  for (const ph of allDishPhotos) {
    if (urlInvalid(ph.url)) {
      report.dishPhotosInvalid.push({
        id: ph.id,
        dishId: ph.dishId,
        url: String(ph.url ?? ''),
      });
    }
  }

  // Optional HEAD checks on a sample of https images for active products
  if (HEAD_CHECK) {
    console.log(`Running HEAD checks (limit ${HEAD_LIMIT})...`);
    let checked = 0;
    for (const p of products) {
      for (const img of p.Image) {
        if (checked >= HEAD_LIMIT) break;
        const u = img.fileUrl?.trim() ?? '';
        if (!u.startsWith('http')) continue;
        checked += 1;
        const ok = await headOk(u);
        if (!ok) {
          report.brokenHeadChecks.push({ kind: 'Image', id: img.id, url: u });
        }
      }
      if (checked >= HEAD_LIMIT) break;
    }
    console.log(`HEAD checked ${checked} URLs; broken=${report.brokenHeadChecks.length}`);
  }

  // --- APPLY ---
  if (APPLY) {
    const productIds = report.productsFlagged.map((p) => p.id);
    if (productIds.length) {
      const r = await prisma.product.updateMany({
        where: { id: { in: productIds }, isActive: true },
        data: { isActive: false },
      });
      report.actions.productsDeactivated = r.count;
    }

    const listingIds = report.listingsFlagged.map((l) => l.id);
    if (listingIds.length) {
      const r = await prisma.listing.updateMany({
        where: { id: { in: listingIds } },
        data: { status: 'REMOVED', isPublic: false },
      });
      report.actions.listingsRemoved = r.count;
    }

    const dishIds = report.dishesFlagged.map((d) => d.id);
    if (dishIds.length) {
      const r = await prisma.dish.updateMany({
        where: { id: { in: dishIds } },
        data: { status: 'PRIVATE' },
      });
      report.actions.dishesPrivatized = r.count;
    }

    const imageIds = [
      ...report.imagesInvalid.map((i) => i.id),
      ...report.brokenHeadChecks.filter((b) => b.kind === 'Image').map((b) => b.id),
    ];

    // Delete placeholder image rows attached to flagged products
    const flaggedIds = report.productsFlagged.map((p) => p.id);
    if (flaggedIds.length) {
      const placeholderImgs = await prisma.image.findMany({
        where: {
          productId: { in: flaggedIds },
          OR: [
            { fileUrl: { contains: 'placeholder.' } },
            { fileUrl: { contains: 'placeholder.png' } },
            { fileUrl: { contains: 'placeholder.webp' } },
          ],
        },
        select: { id: true },
      });
      imageIds.push(...placeholderImgs.map((i) => i.id));
    }

    if (imageIds.length) {
      const r = await prisma.image.deleteMany({ where: { id: { in: [...new Set(imageIds)] } } });
      report.actions.imagesDeleted = r.count;
    }

    if (report.listingMediaInvalid.length) {
      const r = await prisma.listingMedia.deleteMany({
        where: { id: { in: report.listingMediaInvalid.map((i) => i.id) } },
      });
      report.actions.listingMediaDeleted = r.count;
    }

    if (report.dishPhotosInvalid.length) {
      const r = await prisma.dishPhoto.deleteMany({
        where: { id: { in: report.dishPhotosInvalid.map((i) => i.id) } },
      });
      report.actions.dishPhotosDeleted = r.count;
    }

    // After image deletion: deactivate active products that now have zero usable images
    const stillActive = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, Image: { select: { fileUrl: true } } },
    });
    const emptyMediaIds = stillActive
      .filter((p) => p.Image.length === 0 || p.Image.every((i) => urlInvalid(i.fileUrl)))
      .map((p) => p.id);
    if (emptyMediaIds.length) {
      const r = await prisma.product.updateMany({
        where: { id: { in: emptyMediaIds } },
        data: { isActive: false },
      });
      report.actions.productsDeactivated += r.count;
      for (const id of emptyMediaIds) {
        if (!report.productsFlagged.some((p) => p.id === id)) {
          report.productsFlagged.push({
            id,
            title: '(empty media after cleanup)',
            reason: 'no-usable-images-after-cleanup',
            isActive: false,
          });
        }
      }
    }

    // Soft-hide obvious demo/phase users without deleting commerce history.
    let softHiddenUsers = 0;
    for (const u of report.usersFlagged) {
      const orderCount = await prisma.order.count({ where: { userId: u.id } });
      if (orderCount > 0) {
        report.actions.usersSkippedWithOrders += 1;
        continue;
      }
      await prisma.user.update({
        where: { id: u.id },
        data: {
          suspendedAt: new Date(),
          name: u.name?.startsWith('[hidden]') ? u.name : `[hidden] ${u.name || 'demo'}`,
        },
      });
      softHiddenUsers += 1;
    }
    report.actions.usersNotDeleted = report.usersFlagged.length - softHiddenUsers;
    (report.actions as Record<string, number>).usersSoftHidden = softHiddenUsers;
    report.applied = true;
  }

  // Summary
  console.log('Products flagged:', report.productsFlagged.length);
  for (const p of report.productsFlagged.slice(0, 30)) {
    console.log(`  - [${p.id}] ${p.title} (${p.reason})`);
  }
  console.log('Listings flagged:', report.listingsFlagged.length);
  console.log('Dishes flagged:', report.dishesFlagged.length);
  console.log('Users flagged (not auto-deleted):', report.usersFlagged.length);
  for (const u of report.usersFlagged.slice(0, 20)) {
    console.log(`  - ${u.email} / ${u.name}`);
  }
  console.log('Invalid Image rows:', report.imagesInvalid.length);
  console.log('Invalid ListingMedia rows:', report.listingMediaInvalid.length);
  console.log('Invalid DishPhoto rows:', report.dishPhotosInvalid.length);
  console.log('Broken HEAD checks:', report.brokenHeadChecks.length);
  if (APPLY) {
    console.log('Actions:', report.actions);
  } else {
    console.log('\nDry run only. Re-run with --apply to soft-deactivate / delete invalid image rows.');
  }

  const outDir = join(process.cwd(), 'docs/audits/production-cleanup-phase1');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, APPLY ? 'apply-report.json' : 'audit-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
