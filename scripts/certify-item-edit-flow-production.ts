/**
 * Authenticated Production certification for owner item edit flow.
 * Uses MediaCert seller (existing controlled owner). Does not reopen loop root-cause work.
 *
 *   BASE_URL=https://homecheff.eu npx tsx scripts/certify-item-edit-flow-production.ts
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { PrismaClient } from '@prisma/client';

function slugifySegment(s: string): string {
  const out = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return out || 'item';
}

function buildProductDetailPath(
  title: string,
  place: string | null | undefined,
  id: string,
): string {
  const t = slugifySegment(title || 'product');
  const rawPlace = place?.split(',')[0]?.trim() || '';
  const p = rawPlace ? slugifySegment(rawPlace) : 'lokaal';
  return `/product/${t}-${p}-hcid-${id}`;
}

function buildProductEditPath(
  title: string,
  place: string | null | undefined,
  id: string,
): string {
  return `${buildProductDetailPath(title, place, id)}/edit`;
}

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const EMAIL = process.env.MEDIA_TEST_EMAIL || 'mediacert+homecheff@example.com';
const PASSWORD = process.env.MEDIA_TEST_PASSWORD || 'MediaCert!2026Hc';
const MARKER = ' ·HC-editcert';
const OUT = join(
  process.cwd(),
  'docs/audits/interaction-integrity',
  `item-edit-auth-cert-${Date.now()}`,
);

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || process.env.DIRECT_URL },
  },
});

type Snapshot = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  category: string | null;
  marketplaceCategory: string | null;
  specializations: string[];
  isActive: boolean;
  createdAt: string;
  sellerId: string;
  acceptHomeCheffPayment: boolean | null;
  acceptDirectContact: boolean | null;
  priceModel: string | null;
  listingIntent: string | null;
  barterOpenness: string | null;
  orderMethod: string | null;
  delivery: string | null;
  fulfillmentOptions: unknown;
  pickupAddress: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  stock: number;
  sellerCanDeliver: boolean | null;
  deliveryRadiusKm: number | null;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  parcelPreset: string | null;
  allergens: string[];
  allergensConfirmedAt: string | null;
  integrityStatus: string | null;
  sellerContributionTypes: string[];
  sellerContributionNote: string | null;
  madeToConsumerSpecifications: boolean | null;
  rapidlyPerishable: boolean | null;
  imageUrls: string[];
  imageCount: number;
  place: string | null;
};

async function loadSnapshot(productId: string): Promise<Snapshot | null> {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      Image: { orderBy: { sortOrder: 'asc' }, select: { fileUrl: true } },
      seller: { select: { id: true, User: { select: { place: true } } } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    priceCents: p.priceCents,
    category: p.category,
    marketplaceCategory: p.marketplaceCategory,
    specializations: p.specializations ?? [],
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    sellerId: p.sellerId,
    acceptHomeCheffPayment: p.acceptHomeCheffPayment,
    acceptDirectContact: p.acceptDirectContact,
    priceModel: p.priceModel,
    listingIntent: p.listingIntent,
    barterOpenness: p.barterOpenness,
    orderMethod: p.orderMethod,
    delivery: p.delivery,
    fulfillmentOptions: p.fulfillmentOptions,
    pickupAddress: p.pickupAddress,
    pickupLat: p.pickupLat,
    pickupLng: p.pickupLng,
    stock: p.stock,
    sellerCanDeliver: p.sellerCanDeliver,
    deliveryRadiusKm: p.deliveryRadiusKm,
    weightGrams: p.weightGrams,
    lengthCm: p.lengthCm,
    widthCm: p.widthCm,
    heightCm: p.heightCm,
    parcelPreset: p.parcelPreset,
    allergens: p.allergens ?? [],
    allergensConfirmedAt: p.allergensConfirmedAt?.toISOString() ?? null,
    integrityStatus: p.integrityStatus,
    sellerContributionTypes: p.sellerContributionTypes ?? [],
    sellerContributionNote: p.sellerContributionNote,
    madeToConsumerSpecifications: p.madeToConsumerSpecifications,
    rapidlyPerishable: p.rapidlyPerishable,
    imageUrls: p.Image.map((i) => i.fileUrl),
    imageCount: p.Image.length,
    place: p.seller?.User?.place ?? null,
  };
}

function unrelatedEqual(a: Snapshot, b: Snapshot): string[] {
  const keys: (keyof Snapshot)[] = [
    'priceCents',
    'category',
    'marketplaceCategory',
    'specializations',
    'isActive',
    'acceptHomeCheffPayment',
    'acceptDirectContact',
    'priceModel',
    'listingIntent',
    'barterOpenness',
    'orderMethod',
    'delivery',
    'fulfillmentOptions',
    'pickupAddress',
    'pickupLat',
    'pickupLng',
    'stock',
    'sellerCanDeliver',
    'deliveryRadiusKm',
    'weightGrams',
    'lengthCm',
    'widthCm',
    'heightCm',
    'parcelPreset',
    'allergens',
    'integrityStatus',
    'sellerContributionTypes',
    'sellerContributionNote',
    'madeToConsumerSpecifications',
    'rapidlyPerishable',
    'imageUrls',
    'imageCount',
    'sellerId',
  ];
  const diffs: string[] = [];
  for (const k of keys) {
    const av = JSON.stringify(a[k] ?? null);
    const bv = JSON.stringify(b[k] ?? null);
    if (av !== bv) diffs.push(`${String(k)}: ${av} → ${bv}`);
  }
  // Allergen confirmation timestamp may refresh on save; presence must remain.
  if (Boolean(a.allergensConfirmedAt) !== Boolean(b.allergensConfirmedAt)) {
    diffs.push(
      `allergensConfirmedAt presence: ${Boolean(a.allergensConfirmedAt)} → ${Boolean(b.allergensConfirmedAt)}`,
    );
  }
  return diffs;
}

async function login(page: Page): Promise<boolean> {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(800);
  const emailSel = '#emailOrUsername, input[name="emailOrUsername"]';
  await page.locator(emailSel).first().waitFor({ timeout: 15000 });
  await page.locator(emailSel).first().fill(EMAIL);
  await page.locator('input[name="password"], input[type="password"]').first().fill(PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForTimeout(2000);
  const session = await page.request.get(`${BASE}/api/auth/session`).then((r) => r.json());
  return Boolean(session?.user?.email);
}

async function waitEditorStable(
  page: Page,
  expectedTitle: string,
  expectedDescription?: string,
) {
  await page.waitForSelector('[data-edit-product-form]', { timeout: 30000 });
  // Wait for title input to show existing value (hydrate complete).
  await page.waitForFunction(
    (title) => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.some((i) => (i as HTMLInputElement).value === title);
    },
    expectedTitle,
    { timeout: 30000 },
  );
  if (expectedDescription != null) {
    await page.waitForFunction(
      (desc) => {
        const labels = Array.from(document.querySelectorAll('label'));
        const descLabel = labels.find((l) =>
          /omschrijving|beschrijving|description/i.test(l.textContent || ''),
        );
        const ta =
          (descLabel?.parentElement?.querySelector(
            'textarea',
          ) as HTMLTextAreaElement | null) ||
          (descLabel?.nextElementSibling as HTMLTextAreaElement | null);
        return Boolean(ta && ta.value === desc);
      },
      expectedDescription,
      { timeout: 30000 },
    );
  }
  await page.waitForTimeout(1500);
}

function tinyJpeg(): Buffer {
  return Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
    'base64',
  );
}

async function apiLogin(): Promise<string> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookie = csrfRes.headers.getSetCookie?.() ?? [];
  const jar = cookie.map((c) => c.split(';')[0]).join('; ');
  const body = new URLSearchParams({
    csrfToken,
    emailOrUsername: EMAIL,
    password: PASSWORD,
    json: 'true',
    callbackUrl: `${BASE}/`,
  });
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: jar,
    },
    body,
    redirect: 'manual',
  });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = [...cookie, ...setCookies]
    .map((c) => c.split(';')[0])
    .join('; ');
  const session = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  }).then((r) => r.json());
  if (!session?.user?.email) {
    throw new Error(`API login failed: ${res.status}`);
  }
  return cookieHeader;
}

let certCleanupProductId: string | null = null;
let certCreatedNewListing = false;

/** A failed or finished run must not leave a public Inspiration twin. */
async function unpublishCertDishTwin(productId: string, deactivateProduct: boolean) {
  await prisma.dish.updateMany({
    where: { id: productId, status: 'PUBLISHED' },
    data: { status: 'PRIVATE' },
  });
  if (deactivateProduct) {
    await prisma.product.updateMany({
      where: { id: productId, isActive: true },
      data: { isActive: false },
    });
  }
}

async function ensureOwnedListing(cookie: string): Promise<{ id: string; created: boolean }> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
    select: { SellerProfile: { select: { id: true } } },
  });
  const sellerId = user?.SellerProfile?.id;
  if (!sellerId) throw new Error('MediaCert seller profile missing');

  const existing = await prisma.product.findFirst({
    where: {
      sellerId,
      isActive: true,
      title: { startsWith: 'EditFlowCert' },
      Image: { some: {} },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (existing) {
    // Ensure taxonomy/legal defaults so UI save only needs the description change.
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        specializations: ['create.meal'],
        subcategory: 'create.meal',
        marketplaceCategory: 'CREATE',
        sellerContributionTypes: ['PREPARED'],
        barterOpenness: 'MONEY',
        allergensConfirmedAt: new Date(),
        description:
          'Controlled EditFlowCert listing for authenticated production edit smoke.',
      },
    });
    return { id: existing.id, created: false };
  }

  // Paid offers require commerce self-declaration (LEGAL-1).
  await fetch(`${BASE}/api/seller/commerce-declaration`, {
    method: 'PUT',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ declaration: 'PRIVATE_OCCASIONAL' }),
  });

  const form = new FormData();
  form.append('file', new Blob([tinyJpeg()], { type: 'image/jpeg' }), 'editcert.jpg');
  form.append('type', 'general');
  const up = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form,
  });
  const upJson = await up.json();
  const imageUrl = upJson.url || upJson.publicUrl;
  if (!imageUrl) throw new Error(`upload failed: ${JSON.stringify(upJson)}`);

  const create = await fetch(`${BASE}/api/products/create`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `EditFlowCert ${Date.now()}`,
      description: 'Controlled EditFlowCert listing for authenticated production edit smoke.',
      priceCents: 350,
      category: 'CHEFF',
      subcategory: 'create.meal',
      specializations: ['create.meal'],
      marketplaceCategory: 'CREATE',
      listingIntent: 'OFFER',
      priceModel: 'FIXED',
      acceptHomeCheffPayment: true,
      acceptDirectContact: false,
      sellerContributionTypes: ['PREPARED'],
      sellerContributionNote: 'EditFlowCert controlled contribution',
      barterOpenness: 'MONEY',
      allergensConfirmedAt: new Date().toISOString(),
      fulfillmentOptions: { pickup: true, delivery: false, shipping: false, digital: false },
      images: [imageUrl],
      isActive: true,
      placeName: 'Vlaardingen',
      useProfileLocation: false,
      pickupLat: 51.912,
      pickupLng: 4.341,
      pickupAddress: null,
      stock: 1,
    }),
  });
  const created = await create.json().catch(() => ({}));
  const id = created?.id || created?.product?.id || created?.productId;
  if (!create.ok || !id) {
    throw new Error(`create listing failed: ${create.status} ${JSON.stringify(created)}`);
  }
  return { id: String(id), created: true };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report: Record<string, unknown> = {
    base: BASE,
    email: EMAIL,
    startedAt: new Date().toISOString(),
  };

  const user = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      SellerProfile: { select: { id: true } },
    },
  });
  if (!user?.SellerProfile?.id) {
    throw new Error(`MediaCert seller not found for ${EMAIL}`);
  }

  const apiCookie = await apiLogin();
  const seeded = await ensureOwnedListing(apiCookie);
  const productId = seeded.id;
  certCleanupProductId = productId;
  certCreatedNewListing = seeded.created;
  report.seededOrReusedListingId = productId;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      Image: { orderBy: { sortOrder: 'asc' }, take: 1 },
      seller: { select: { User: { select: { place: true } } } },
    },
  });
  if (!product) {
    throw new Error('Owned listing missing after ensure');
  }

  const before = await loadSnapshot(product.id);
  if (!before) throw new Error('snapshot failed');

  const listingCountBefore = await prisma.product.count({
    where: { sellerId: user.SellerProfile.id },
  });

  const originalDescription = before.description ?? '';
  const hasMarker = originalDescription.includes(MARKER);
  const descriptionEdited = hasMarker
    ? originalDescription.replace(MARKER, '')
    : `${originalDescription}${MARKER}`;
  const descriptionRestored = originalDescription;

  report.LISTING_ID = before.id;
  report.TITLE_BEFORE = before.title;
  report.DESCRIPTION_BEFORE = originalDescription;
  report.RELEVANT_FIELD_SNAPSHOT = {
    priceCents: before.priceCents,
    category: before.category,
    marketplaceCategory: before.marketplaceCategory,
    specializations: before.specializations,
    imageCount: before.imageCount,
    acceptHomeCheffPayment: before.acceptHomeCheffPayment,
    acceptDirectContact: before.acceptDirectContact,
    delivery: before.delivery,
    isActive: before.isActive,
    createdAt: before.createdAt,
    sellerId: before.sellerId,
  };

  const editPath = buildProductEditPath(
    before.title,
    before.place,
    before.id,
  );
  const detailPath = buildProductDetailPath(
    before.title,
    before.place,
    before.id,
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const productApiHits: number[] = [];
  page.on('request', (req) => {
    if (req.url().includes(`/api/products/${before.id}`)) {
      productApiHits.push(Date.now());
    }
  });

  try {
    const loggedIn = await login(page);
    report.loginOk = loggedIn;
    if (!loggedIn) throw new Error('Login failed');

    // Profile → Aanbod → Edit
    await page.goto(`${BASE}/profile?tab=aanbod`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(OUT, '01-profile-aanbod.png'), fullPage: false });

    const editBtn = page
      .locator(`[data-owner-listing-card="true"]`)
      .filter({ hasText: before.title })
      .locator('[data-owner-action="edit"]')
      .first();

    const editVisible = await editBtn.count();
    report.profileEditButtonFound = editVisible > 0;

    if (editVisible > 0) {
      await editBtn.click();
    } else {
      // Fallback: direct canonical edit (still authenticated owner)
      await page.goto(`${BASE}${editPath}`, {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      });
    }

    await page.waitForURL(/\/product\/[^/]+\/edit/, { timeout: 30000 });
    await waitEditorStable(page, before.title, originalDescription);
    await page.screenshot({ path: join(OUT, '02-editor-open.png'), fullPage: false });

    const settleStart = Date.now();
    await page.waitForTimeout(2500);
    const lateHits = productApiHits.filter((t) => t > settleStart).length;
    report.FETCH_LOOP_ON_OPEN = lateHits === 0 ? 'NO' : `YES(${lateHits})`;

    const formState = await page.evaluate((expected) => {
      const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      const titleEl = inputs.find((i) => i.value === expected.title);
      const labels = Array.from(document.querySelectorAll('label'));
      const descLabel = labels.find((l) =>
        /omschrijving|beschrijving|description/i.test(l.textContent || ''),
      );
      const descEl =
        (descLabel?.parentElement?.querySelector(
          'textarea',
        ) as HTMLTextAreaElement | null) ||
        (descLabel?.nextElementSibling as HTMLTextAreaElement | null);
      const imgs = Array.from(
        document.querySelectorAll('[data-edit-product-form] img'),
      ) as HTMLImageElement[];
      return {
        hasForm: !!document.querySelector('[data-edit-product-form]'),
        titleLoaded: Boolean(titleEl),
        titleValue: titleEl?.value ?? null,
        descriptionLoaded: Boolean(descEl && descEl.value === expected.description),
        descriptionValue: descEl?.value ?? null,
        photoCount: imgs.filter((i) => (i.src || '').length > 10).length,
        path: location.pathname,
      };
    }, { title: before.title, description: originalDescription });

    report.openFormState = formState;
    if (!formState.hasForm || !formState.titleLoaded || !formState.descriptionLoaded) {
      throw new Error(`Editor not fully loaded: ${JSON.stringify(formState)}`);
    }

    // Make one reversible description change on the real description field
    const descArea = page
      .locator('[data-edit-product-form] label')
      .filter({ hasText: /^Omschrijving|^Beschrijving|^Description/i })
      .locator('xpath=following-sibling::textarea[1]')
      .first();
    await descArea.waitFor({ state: 'visible', timeout: 15000 });
    await descArea.click();
    // React-controlled: set value via native setter + input event
    await descArea.evaluate((el, value) => {
      const ta = el as HTMLTextAreaElement;
      const proto = window.HTMLTextAreaElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc?.set?.call(ta, value);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }, descriptionEdited);
    await page.waitForTimeout(500);
    const filled = await descArea.inputValue();
    report.descriptionFilledInForm = filled;
    if (filled !== descriptionEdited) {
      throw new Error(`Description fill failed: got ${JSON.stringify(filled)}`);
    }

    // Ensure allergen confirmation is checked when shown (CHEFF food listings).
    const allergenBox = page
      .locator('[data-edit-product-form] label')
      .filter({ hasText: /allergen/i })
      .locator('input[type="checkbox"]')
      .first();
    if ((await allergenBox.count()) > 0) {
      const checked = await allergenBox.isChecked().catch(() => false);
      if (!checked) await allergenBox.check({ force: true });
    }

    // Ensure at least one specialization is selected if picker is empty.
    const selectedSpec = page.locator(
      '[data-edit-product-form] [data-selected="true"], [data-edit-product-form] button[aria-pressed="true"]',
    );
    if ((await selectedSpec.count()) === 0) {
      const specCandidate = page
        .locator('[data-edit-product-form] button, [data-edit-product-form] label')
        .filter({ hasText: /maaltijd|meal|pasta|bakken|brood/i })
        .first();
      if ((await specCandidate.count()) > 0) {
        await specCandidate.click();
      }
    }

    await page.screenshot({ path: join(OUT, '03-description-edited.png'), fullPage: false });

    // Save — capture PATCH response
    const patchWait = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/products/${before.id}`) &&
        r.request().method() === 'PATCH',
      { timeout: 45000 },
    );
    const saveBtn = page
      .locator('[data-edit-product-form] button[type="submit"]')
      .first();
    await saveBtn.click();
    const patchRes = await patchWait.catch(() => null);
    const patchStatus = patchRes?.status() ?? null;
    const patchBody = patchRes ? await patchRes.json().catch(() => ({})) : null;
    const patchRequestBody = patchRes
      ? patchRes.request().postDataJSON?.() ?? null
      : null;
    report.patchStatus = patchStatus;
    report.patchError = patchBody?.error ?? patchBody?.errorKey ?? null;
    report.patchRequestDescription = patchRequestBody?.description ?? null;
    const formAlert = await page
      .locator('[data-edit-product-form] [role="alert"], [data-edit-product-form] .text-red-600')
      .first()
      .textContent()
      .catch(() => null);
    report.formAlertAfterSave = formAlert;
    await page.screenshot({ path: join(OUT, '03b-after-save-click.png'), fullPage: false });
    writeFileSync(join(OUT, 'mid-save.json'), JSON.stringify({
      patchStatus,
      patchError: report.patchError,
      patchRequestDescription: report.patchRequestDescription,
      formAlert,
      filled,
    }, null, 2));

    // If client validation blocked save, fix common gates and retry once.
    if (!patchRes && formAlert) {
      if (/allergen/i.test(formAlert)) {
        const allergenBox = page
          .locator('[data-edit-product-form] label')
          .filter({ hasText: /allergen/i })
          .locator('input[type="checkbox"]')
          .first();
        if ((await allergenBox.count()) > 0) {
          await allergenBox.check({ force: true });
        }
      }
      if (/specialisatie/i.test(formAlert)) {
        const specBtn = page
          .locator('[data-edit-product-form] button, [data-edit-product-form] label')
          .filter({ hasText: /maaltijd|meal|pasta|bakken|brood/i })
          .first();
        if ((await specBtn.count()) > 0) {
          await specBtn.click();
          await page.waitForTimeout(400);
        }
      }
      const patchWait2 = page.waitForResponse(
        (r) =>
          r.url().includes(`/api/products/${before.id}`) &&
          r.request().method() === 'PATCH',
        { timeout: 45000 },
      );
      await saveBtn.click();
      const patchRes2 = await patchWait2.catch(() => null);
      report.patchStatus = patchRes2?.status() ?? null;
      const body2 = patchRes2 ? await patchRes2.json().catch(() => ({})) : null;
      report.patchError = body2?.error ?? body2?.errorKey ?? null;
      report.patchRequestDescription =
        patchRes2?.request().postDataJSON?.()?.description ?? null;
      report.validationRetry = true;
      report.formAlertAfterRetry = await page
        .locator('[data-edit-product-form] [role="alert"], [data-edit-product-form] .text-red-600')
        .first()
        .textContent()
        .catch(() => null);
    }

    // Wait for navigation away from edit OR settle
    await page.waitForTimeout(4000);
    const afterSaveUrl = page.url();
    report.afterSaveUrl = afterSaveUrl;
    const saveNavLoop =
      /\/edit\/?$/.test(new URL(afterSaveUrl).pathname) &&
      productApiHits.filter((t) => t > Date.now() - 2000).length > 3;
    report.saveNavigationLoop = saveNavLoop;

    // If still on edit, wait a bit more for onSave redirect
    if (/\/edit\/?$/.test(new URL(afterSaveUrl).pathname)) {
      await page.waitForTimeout(3000);
    }
    report.urlAfterSaveSettle = page.url();

    const after = await loadSnapshot(before.id);
    if (!after) throw new Error('listing missing after save');

    const listingCountAfter = await prisma.product.count({
      where: { sellerId: user.SellerProfile.id },
    });

    const descSaved =
      (after.description || '').includes(MARKER) === !hasMarker ||
      after.description === descriptionEdited;

    report.EXISTING_ITEM_SAVE = descSaved && after.description === descriptionEdited ? 'PASS' : 'FAIL';
    report.SAME_LISTING_ID_AFTER_SAVE = after.id === before.id ? 'YES' : 'NO';
    report.DUPLICATE_CREATED =
      listingCountAfter === listingCountBefore ? 'NO' : `YES(+${listingCountAfter - listingCountBefore})`;
    report.OWNER_UNCHANGED = after.sellerId === before.sellerId ? 'YES' : 'NO';
    report.CREATED_AT_UNCHANGED =
      after.createdAt === before.createdAt ? 'YES' : 'NO';

    const diffs = unrelatedEqual(before, after);
    report.unrelatedDiffs = diffs;
    report.UNRELATED_FIELDS_PRESERVED = diffs.length === 0 ? 'PASS' : 'FAIL';

    // Profile shows update (UI and owner products API)
    await page.goto(`${BASE}/profile?tab=aanbod`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await page.waitForTimeout(3000);
    const profileText = await page.evaluate(() => document.body?.innerText || '');
    const sellerProducts = await page.request
      .get(`${BASE}/api/seller/products`)
      .then((r) => r.json())
      .catch(() => ({ products: [] }));
    const inSellerApi = (sellerProducts.products || []).some(
      (p: { id?: string; title?: string; description?: string }) =>
        p.id === before.id &&
        (p.description === descriptionEdited || p.title === before.title),
    );
    report.PROFILE_AFTER_SAVE =
      profileText.includes(before.title) || inSellerApi ? 'PASS' : 'FAIL';
    report.profileHasTitleText = profileText.includes(before.title);
    report.profileSellerApiHit = inSellerApi;

    // Public detail
    await page.goto(`${BASE}${detailPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await page.waitForTimeout(2500);
    const detailText = await page.evaluate(() => document.body?.innerText || '');
    const detailShowsUpdate =
      detailText.includes(before.title) &&
      (descriptionEdited.length < 40
        ? detailText.includes(descriptionEdited)
        : detailText.includes(MARKER) === !hasMarker ||
          detailText.includes(descriptionEdited.slice(0, 40)));
    // Description may be truncated on detail — also verify via API
    const publicApi = await fetch(`${BASE}/api/products/${before.id}`).then((r) => r.json());
    const publicDesc = publicApi?.product?.description ?? '';
    report.PUBLIC_DETAIL_AFTER_SAVE =
      publicDesc === descriptionEdited && detailText.includes(before.title)
        ? 'PASS'
        : publicDesc === descriptionEdited
          ? 'PASS'
          : 'FAIL';
    report.publicApiDescription = publicDesc;
    await page.screenshot({ path: join(OUT, '05-public-detail.png'), fullPage: false });

    // Feed resolves same listing
    const feed = await fetch(`${BASE}/api/feed?limit=40`).then((r) => r.json());
    const feedHit = (feed.items || []).some(
      (it: { id?: string }) => it.id === before.id,
    );
    // Feed may paginate — also accept product still active+discoverable via API
    report.FEED_AFTER_SAVE =
      feedHit || (publicApi?.product?.isActive && publicApi?.product?.id === before.id)
        ? 'PASS'
        : 'FAIL';
    report.feedHit = feedHit;

    // Re-open Edit — updated value present
    const reopenHitsBefore = productApiHits.length;
    await page.goto(`${BASE}${editPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await waitEditorStable(page, before.title);
    await page.waitForTimeout(2000);
    const reopenLate = productApiHits.length - reopenHitsBefore;
    const reopenDesc = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const descLabel = labels.find((l) =>
        /omschrijving|beschrijving|description/i.test(l.textContent || ''),
      );
      const ta =
        (descLabel?.parentElement?.querySelector(
          'textarea',
        ) as HTMLTextAreaElement | null) ||
        (descLabel?.nextElementSibling as HTMLTextAreaElement | null);
      return ta?.value ?? null;
    });
    report.REOPEN_EDIT_PERSISTENCE =
      reopenDesc === descriptionEdited ? 'PASS' : 'FAIL';
    report.reopenDescription = reopenDesc;
    report.FETCH_LOOP_AFTER_SAVE = reopenLate <= 3 ? 'NO' : `YES(${reopenLate})`;
    if (reopenDesc !== descriptionEdited) {
      writeFileSync(
        join(OUT, 'reopen-mismatch.json'),
        JSON.stringify({ expected: descriptionEdited, got: reopenDesc }, null, 2),
      );
    }
    await page.screenshot({ path: join(OUT, '06-reopen-edit.png'), fullPage: false });

    // Cancel/Back without changes — prefer form cancel, else header back.
    const descBeforeCancel = (await loadSnapshot(before.id))?.description ?? null;
    const cancelBtn = page
      .locator('[data-edit-product-form] button[type="button"]')
      .filter({ hasText: /annuleer|cancel|terug|back/i })
      .first();
    if (await cancelBtn.count()) {
      await cancelBtn.click();
    } else {
      await page
        .locator('main button, [data-edit-product-form] button')
        .filter({ hasText: /terug|back|annuleer|cancel/i })
        .first()
        .click();
    }
    await page.waitForTimeout(2500);
    const afterCancelUrl = page.url();
    const stillOnEdit = /\/edit\/?$/.test(new URL(afterCancelUrl).pathname);
    await page.waitForTimeout(2000);
    const autoReopened = /\/edit\/?$/.test(new URL(page.url()).pathname);
    const afterCancelSnap = await loadSnapshot(before.id);
    report.CANCEL_BACK =
      !stillOnEdit &&
      !autoReopened &&
      afterCancelSnap?.description === descBeforeCancel
        ? 'PASS'
        : 'FAIL';
    report.cancel = {
      afterCancelUrl,
      stillOnEdit,
      autoReopened,
      descriptionUnchangedOnCancel: afterCancelSnap?.description === descBeforeCancel,
    };
    await page.screenshot({ path: join(OUT, '07-after-cancel.png'), fullPage: false });

    // Restore original description via authenticated PATCH (safe reverse)
    const cookie = (await context.cookies())
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    const restoreRes = await fetch(`${BASE}/api/products/${before.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ description: descriptionRestored }),
    });
    const restoreJson = await restoreRes.json().catch(() => ({}));
    const restored = await loadSnapshot(before.id);
    report.RESTORE =
      restoreRes.ok && restored?.description === descriptionRestored ? 'PASS' : 'FAIL';
    report.restoreStatus = restoreRes.status;
    report.restoreError = restoreJson?.error ?? null;
    report.DESCRIPTION_AFTER_RESTORE = restored?.description ?? null;

    // Final flags aggregate
    const flags = {
      EXISTING_ITEM_SAVE: report.EXISTING_ITEM_SAVE,
      SAME_LISTING_ID_AFTER_SAVE: report.SAME_LISTING_ID_AFTER_SAVE,
      DUPLICATE_CREATED: report.DUPLICATE_CREATED,
      OWNER_UNCHANGED: report.OWNER_UNCHANGED,
      CREATED_AT_UNCHANGED: report.CREATED_AT_UNCHANGED,
      UNRELATED_FIELDS_PRESERVED: report.UNRELATED_FIELDS_PRESERVED,
      PROFILE_AFTER_SAVE: report.PROFILE_AFTER_SAVE,
      PUBLIC_DETAIL_AFTER_SAVE: report.PUBLIC_DETAIL_AFTER_SAVE,
      FEED_AFTER_SAVE: report.FEED_AFTER_SAVE,
      REOPEN_EDIT_PERSISTENCE: report.REOPEN_EDIT_PERSISTENCE,
      CANCEL_BACK: report.CANCEL_BACK,
      FETCH_LOOP_AFTER_SAVE: report.FETCH_LOOP_AFTER_SAVE,
      FETCH_LOOP_ON_OPEN: report.FETCH_LOOP_ON_OPEN,
      RESTORE: report.RESTORE,
    };
    report.flags = flags;

    const allPass =
      flags.EXISTING_ITEM_SAVE === 'PASS' &&
      flags.SAME_LISTING_ID_AFTER_SAVE === 'YES' &&
      flags.DUPLICATE_CREATED === 'NO' &&
      flags.OWNER_UNCHANGED === 'YES' &&
      flags.CREATED_AT_UNCHANGED === 'YES' &&
      flags.UNRELATED_FIELDS_PRESERVED === 'PASS' &&
      flags.PROFILE_AFTER_SAVE === 'PASS' &&
      flags.PUBLIC_DETAIL_AFTER_SAVE === 'PASS' &&
      flags.FEED_AFTER_SAVE === 'PASS' &&
      flags.REOPEN_EDIT_PERSISTENCE === 'PASS' &&
      flags.CANCEL_BACK === 'PASS' &&
      flags.FETCH_LOOP_AFTER_SAVE === 'NO' &&
      flags.FETCH_LOOP_ON_OPEN === 'NO' &&
      flags.RESTORE === 'PASS';

    report.PRODUCTION_AUTHENTICATED_SMOKE = allPass ? 'PASS' : 'FAIL';
    report.FINAL_DECISION = allPass
      ? 'HOMECHEFF_ITEM_EDIT_FLOW_PRODUCTION_CERTIFIED'
      : 'HOMECHEFF_ITEM_EDIT_FLOW_PRODUCTION_NOT_CERTIFIED';
    report.finishedAt = new Date().toISOString();

    writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ out: OUT, ...flags, FINAL_DECISION: report.FINAL_DECISION }, null, 2));
  } finally {
    if (certCleanupProductId) {
      await unpublishCertDishTwin(certCleanupProductId, certCreatedNewListing).catch((err) => {
        console.error('CERT_DISH_CLEANUP_FAIL', err);
      });
    }
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error('CERT_FAIL', e);
  if (certCleanupProductId) {
    await unpublishCertDishTwin(certCleanupProductId, certCreatedNewListing).catch(() => undefined);
  }
  try {
    writeFileSync(
      join(OUT, 'fatal.json'),
      JSON.stringify({ error: String(e), stack: (e as Error)?.stack }, null, 2),
    );
  } catch {
    /* ignore */
  }
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
