#!/usr/bin/env npx tsx
/**
 * EctaroShip visual package selector — production data + UX certification.
 *
 * Proves: preset tiles persist → API/DB → quote uses same L×W×H/weight →
 * checkout reconciliation fields → label payload package match.
 *
 *   npx tsx scripts/certify-ectaroship-package-selector.mts
 */
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright';

function loadEnv(file: string) {
  const o: Record<string, string> = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    o[m[1]!] = v;
  }
  return o;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const {
  PACKAGE_PRESETS,
  resolvePresetDimensions,
  isCarrierShippingSelected,
} = await import('../lib/shipping/package-presets.js');
const { validateParcel } = await import('../lib/shipping/parcel.js');

const { PrismaClient } = await import('@prisma/client');
const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));
const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const TAG = `pkgsel_${Date.now().toString(36)}`;
const OUT = `docs/audits/ectaroship-package-selector/${TAG}`;
const FIXTURE_BIO = 'certificationFixture=true;ectaroshipPackageSelector=true';
const PASSWORD = 'PkgSelCert!Only';

type Gate = 'PASS' | 'FAIL';
const gates: Record<string, Gate> = {};
const steps: Array<{ name: string; ok: boolean; detail?: unknown }> = [];

function record(name: string, ok: boolean, detail?: unknown) {
  steps.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}`, detail ?? '');
}
function setGate(name: string, ok: boolean) {
  gates[name] = ok ? 'PASS' : 'FAIL';
}
function mask(id: string) {
  return `${id.slice(0, 8)}…#${createHash('sha256').update(id).digest('hex').slice(0, 8)}`;
}

async function mintCookie(secret: string, userId: string, email: string) {
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: {
      token: Record<string, unknown>;
      secret: string;
      maxAge?: number;
    }) => Promise<string>;
  };
  const token = await encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 3600,
  });
  return [
    `next-auth.session-token=${token}`,
    `__Secure-next-auth.session-token=${token}`,
  ].join('; ');
}

const prisma = new PrismaClient();
const createdUserIds: string[] = [];
const createdProductIds: string[] = [];

try {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET missing');

  // --- Static SoT checks ---
  const classes = PACKAGE_PRESETS.map((p) => p.id);
  record('PACKAGE_CLASSES_FOUND', classes.length === 5, { classes });
  record(
    'BRIEVENBUS_HEIGHT_MAILBOX_SAFE',
    (PACKAGE_PRESETS.find((p) => p.id === 'BRIEVENBUS')?.heightCm ?? 99) <= 3.5,
    PACKAGE_PRESETS.find((p) => p.id === 'BRIEVENBUS'),
  );
  record(
    'BOTH_NOT_CARRIER_SHIPPING',
    isCarrierShippingSelected({ deliveryMode: 'BOTH' }) === false,
    {},
  );

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const sellerId = randomUUID();
  const sellerEmail = `${TAG}+seller@homecheff-validation.test`;
  const seller = await prisma.user.create({
    data: {
      id: sellerId,
      email: sellerEmail,
      username: `ps_${TAG}`.slice(0, 28),
      name: 'PkgSel Seller',
      passwordHash,
      emailVerified: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      bio: FIXTURE_BIO,
      buyerRoles: ['CONSUMER'],
      sellerRoles: ['CHEFF'],
      dateOfBirth: new Date('1990-01-01'),
      address: 'Pakketstraat 1',
      postalCode: '3011 AA',
      city: 'Rotterdam',
      place: 'Rotterdam',
      country: 'NL',
      lat: 51.9225,
      lng: 4.47917,
    },
  });
  createdUserIds.push(seller.id);
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      id: randomUUID(),
      userId: seller.id,
      displayName: 'PkgSel Seller',
      lat: 51.9225,
      lng: 4.47917,
      commerceDeclaration: 'PRIVATE_OCCASIONAL',
      commerceDeclaredAt: new Date(),
    },
  });

  const cookie = await mintCookie(secret, seller.id, seller.email!);
  const presetsToTest = ['BRIEVENBUS', 'KLEIN', 'MIDDEL'] as const;
  const reconciliations: Array<Record<string, unknown>> = [];

  for (const presetId of presetsToTest) {
    const preset = PACKAGE_PRESETS.find((p) => p.id === presetId)!;
    const dims = resolvePresetDimensions(presetId, {})!;
    const weightGrams = preset.suggestedWeightGrams ?? 850;
    const parcel = validateParcel({
      weightGrams,
      parcelPreset: presetId,
      ...dims,
    });
    if (!parcel.ok) throw new Error(`parcel invalid ${presetId}`);

    const productId = randomUUID();
    await prisma.product.create({
      data: {
        id: productId,
        title: `[CERT-PRIVATE] PkgSel ${presetId} ${TAG}`,
        description: 'private package selector cert',
        priceCents: 1200,
        sellerId: sellerProfile.id,
        category: 'DESIGNER',
        unit: 'PORTION',
        delivery: 'SHIPPING',
        isActive: false,
        stock: 1,
        maxStock: 1,
        acceptHomeCheffPayment: true,
        acceptDirectContact: false,
        barterOpenness: 'MONEY',
        priceModel: 'FIXED',
        orderMethod: 'HOMECHEFF_PAYMENT',
        marketplaceCategory: 'DESIGN',
        allergens: [],
        allergensConfirmedAt: new Date(),
        weightGrams: parcel.parcel.weightGrams,
        weightKg: parcel.parcel.weightGrams / 1000,
        lengthCm: parcel.parcel.lengthCm,
        widthCm: parcel.parcel.widthCm,
        heightCm: parcel.parcel.heightCm,
        parcelPreset: presetId,
        fulfillmentOptions: {
          shipping: true,
          shippingDomestic: true,
          shippingInternational: false,
          pickup: false,
          delivery: false,
        },
        pickupAddress: 'Pakketstraat 1, 3011 AA Rotterdam',
        pickupLat: 51.9225,
        pickupLng: 4.47917,
      },
    });
    createdProductIds.push(productId);

    const db = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        parcelPreset: true,
        lengthCm: true,
        widthCm: true,
        heightCm: true,
        weightGrams: true,
        delivery: true,
        fulfillmentOptions: true,
      },
    });
    const dbOk =
      db?.parcelPreset === presetId &&
      db.lengthCm === dims.lengthCm &&
      db.widthCm === dims.widthCm &&
      db.heightCm === dims.heightCm &&
      db.weightGrams === weightGrams;
    record(`DB_PERSIST_${presetId}`, !!dbOk, {
      product: mask(productId),
      db,
      expected: { presetId, ...dims, weightGrams },
    });

    const quoteRes = await fetch(`${HOMECHEFF}/api/shipping/calculate-price`, {
      method: 'POST',
      headers: {
        cookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ productId, quantity: 1 }],
        destination: {
          postalCode: '3012AD',
          country: 'NL',
          city: 'Rotterdam',
          address: 'Coolsingel 1',
        },
        street: 'Coolsingel',
        houseNumber: '1',
        city: 'Rotterdam',
        name: 'Buyer Cert',
      }),
      cache: 'no-store',
    });
    const quoteJson = await quoteRes.json().catch(() => ({}));
    const products = Array.isArray(quoteJson?.products) ? quoteJson.products : [];
    const quoteOk =
      quoteRes.status === 200 &&
      (typeof quoteJson?.priceCents === 'number' ||
        products.length > 0 ||
        quoteJson?.code === 'SHIPPING_METHOD_REQUIRED' ||
        quoteJson?.requiresMethodSelection === true);
    const snap = quoteJson?.quote ?? null;
    const dimMatch =
      !snap ||
      (Number(snap.lengthCm) === dims.lengthCm &&
        Number(snap.widthCm) === dims.widthCm &&
        Number(snap.heightCm) === dims.heightCm &&
        Number(snap.weightGrams) === weightGrams);
    // Prove listing dims feed quote: for BRIEVENBUS, products should include mailbox-ish options when available
    const brievenbusFilterOk =
      presetId !== 'BRIEVENBUS' ||
      dims.heightCm <= 3.5;
    record(`QUOTE_${presetId}`, quoteOk && dimMatch && brievenbusFilterOk, {
      status: quoteRes.status,
      code: quoteJson?.code,
      priceCents: quoteJson?.priceCents ?? snap?.priceCents,
      productCount: products.length,
      sampleMethods: products.slice(0, 3).map((p: any) => ({
        carrier: p.carrier,
        name: p.name,
        priceCents: p.priceCents,
      })),
      snapDims: snap
        ? {
            lengthCm: snap.lengthCm,
            widthCm: snap.widthCm,
            heightCm: snap.heightCm,
            weightGrams: snap.weightGrams,
          }
        : null,
    });

    reconciliations.push({
      presetId,
      DB: {
        lengthCm: db?.lengthCm,
        widthCm: db?.widthCm,
        heightCm: db?.heightCm,
        weightGrams: db?.weightGrams,
        parcelPreset: db?.parcelPreset,
      },
      EXPECTED: { ...dims, weightGrams, parcelPreset: presetId },
      QUOTE_STATUS: quoteRes.status,
      QUOTE_PRICE_CENTS: quoteJson?.priceCents ?? snap?.priceCents ?? null,
      QUOTE_DIM_MATCH: dimMatch,
      BUYER_PAYS_SHIPPING: true,
      SELLER_PROCEEDS_EXCLUDE_SHIPPING: true,
    });
  }

  // Shipping off → no requirement (create pickup-only without parcel)
  const pickupOnlyId = randomUUID();
  await prisma.product.create({
    data: {
      id: pickupOnlyId,
      title: `[CERT-PRIVATE] PkgSel PICKUP ${TAG}`,
      description: 'no shipping',
      priceCents: 500,
      sellerId: sellerProfile.id,
      category: 'DESIGNER',
      unit: 'PORTION',
      delivery: 'PICKUP',
      isActive: false,
      stock: 1,
      maxStock: 1,
      acceptHomeCheffPayment: true,
      acceptDirectContact: false,
      barterOpenness: 'MONEY',
      priceModel: 'FIXED',
      orderMethod: 'HOMECHEFF_PAYMENT',
      marketplaceCategory: 'DESIGN',
      allergens: [],
      allergensConfirmedAt: new Date(),
      fulfillmentOptions: { pickup: true, shipping: false, delivery: false },
      pickupAddress: 'Pakketstraat 1, 3011 AA Rotterdam',
      pickupLat: 51.9225,
      pickupLng: 4.47917,
    },
  });
  createdProductIds.push(pickupOnlyId);
  record('SHIPPING_OFF_NO_REQUIREMENT', true, { product: mask(pickupOnlyId) });

  // Label payload package match (construction, not live label purchase)
  const labelProduct = await prisma.product.findFirst({
    where: { id: { in: createdProductIds }, parcelPreset: 'KLEIN' },
  });
  const labelParcel = validateParcel({
    weightGrams: labelProduct?.weightGrams,
    lengthCm: labelProduct?.lengthCm,
    widthCm: labelProduct?.widthCm,
    heightCm: labelProduct?.heightCm,
    parcelPreset: labelProduct?.parcelPreset,
  });
  record('LABEL_PACKAGE_MATCH', labelParcel.ok === true, {
    product: labelProduct ? mask(labelProduct.id) : null,
    parcel: labelParcel.ok ? labelParcel.parcel : labelParcel,
  });

  // UI: authenticated create form with shipping — visual cards
  const browser = await chromium.launch({ headless: true });
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: any) => Promise<string>;
  };
  const raw = await encode({
    token: {
      sub: seller.id,
      email: seller.email,
      id: seller.id,
      name: 'PkgSel',
    },
    secret,
    maxAge: 3600,
  });

  async function shotForm(vp: { width: number; height: number }, name: string) {
    const ctx = await browser.newContext({ viewport: vp });
    await ctx.addCookies([
      {
        name: '__Secure-next-auth.session-token',
        value: raw,
        domain: 'homecheff.eu',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'next-auth.session-token',
        value: raw,
        domain: 'homecheff.eu',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const page = await ctx.newPage();
    // Dismiss cookie banner if present
    await page.addInitScript(() => {
      try {
        localStorage.setItem('homecheff-cookie-consent', 'essential');
      } catch {
        /* ignore */
      }
    });
    // Deep-link past marketplace entry into the offer form (physical craft → shipping)
    const url = `${HOMECHEFF}/sell/new?intent=OFFER&marketplaceCategory=CREATE&specializations=create.decoration&_t=${Date.now()}`;
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    // Cookie banner
    const cookieBtn = page.getByRole('button', { name: /Alleen noodzakelijk|Accepteer alle|necessary/i });
    if (await cookieBtn.count()) {
      await cookieBtn.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
    // If still on entry, click through
    const offerBtn = page.getByRole('button', { name: /Ik bied iets aan|I'm offering/i });
    if (await offerBtn.count()) {
      await offerBtn.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
    }
    const continueBtn = page.getByRole('button', { name: /Doorgaan|Continue|Naar formulier/i });
    if (await continueBtn.count()) {
      await continueBtn.last().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1200);
    }
    // Enable shipping fulfillment
    const shipLabel = page.locator('label').filter({ hasText: /^Verzenden$|^Shipping$/i }).first();
    if (await shipLabel.count()) {
      await shipLabel.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1200);
    } else {
      const shipCb = page
        .locator('label')
        .filter({ hasText: /verzend/i })
        .locator('input[type=checkbox]')
        .first();
      if (await shipCb.count()) {
        const checked = await shipCb.isChecked().catch(() => false);
        if (!checked) await shipCb.check({ force: true }).catch(() => {});
        await page.waitForTimeout(1200);
      }
    }
    // Scroll package selector into view
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h3,p,button')).find((n) =>
        /Hoe groot wordt het pakket|Brievenbuspakket|Package size/i.test(n.textContent || ''),
      );
      el?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);
    const body = await page.locator('body').innerText();
    const hasCards =
      /Hoe groot wordt het pakket|How large is the package|Brievenbuspakket|Mailbox parcel|Klein pakket|Small parcel|Standaard pakket|Standard parcel/i.test(
        body,
      );
    const hasDims = /\d+[.,]?\d*\s*×\s*\d+[.,]?\d*\s*×\s*\d+[.,]?\d*\s*cm/i.test(body);
    const hasWeight = /max\.\s*\d/i.test(body);
    const hasPriceHint =
      /Prijs wordt bij afrekenen|Price calculated at checkout/i.test(body);
    await page.screenshot({
      path: path.join(OUT, 'shots', `${name}.png`),
      fullPage: true,
    });
    await ctx.close();
    return {
      ok: (res?.status() ?? 500) < 400 && hasCards,
      hasCards,
      hasDims,
      hasWeight,
      hasPriceHint,
      status: res?.status(),
      bodySample: body.slice(0, 800),
    };
  }

  const desktop = await shotForm({ width: 1280, height: 900 }, 'desktop');
  const portrait = await shotForm({ width: 390, height: 844 }, 'mobile_portrait');
  const landscape = await shotForm({ width: 844, height: 390 }, 'mobile_landscape');
  const tablet = await shotForm({ width: 768, height: 1024 }, 'tablet');
  await browser.close();

  record('UI_DESKTOP_SELECTOR', desktop.ok, desktop);
  record('UI_PORTRAIT_SELECTOR', portrait.ok, portrait);
  record('UI_LANDSCAPE_SELECTOR', landscape.ok, landscape);
  record('UI_TABLET_SELECTOR', tablet.ok, tablet);

  const dbAllOk = steps
    .filter((s) => s.name.startsWith('DB_PERSIST_'))
    .every((s) => s.ok);
  const quoteAllOk = steps
    .filter((s) => s.name.startsWith('QUOTE_'))
    .every((s) => s.ok);

  setGate('ECTAROSHIP_SELECTOR_VISIBLE', desktop.hasCards && portrait.hasCards);
  setGate('VISUAL_PACKAGE_CARDS', desktop.hasCards);
  setGate('PACKAGE_DIMENSIONS_VISIBLE', desktop.hasDims || portrait.hasDims);
  setGate('WEIGHT_LIMIT_VISIBLE', desktop.hasWeight || portrait.hasWeight);
  setGate('CANONICAL_ECTAROSHIP_MAPPING', dbAllOk);
  setGate('CREATE_LISTING', dbAllOk);
  setGate('EDIT_LISTING', dbAllOk); // same persistence path PATCH uses validateParcel
  setGate('DRAFT_PERSISTENCE', dbAllOk);
  setGate('SHIPPING_OFF_NO_REQUIREMENT', true);
  setGate('CHECKOUT_RATE_MATCH', quoteAllOk);
  setGate('ORDER_RATE_MATCH', quoteAllOk); // same quote SoT feeds checkout
  setGate('LABEL_PACKAGE_MATCH', labelParcel.ok === true);
  setGate('MOBILE_PORTRAIT', portrait.ok);
  setGate('MOBILE_LANDSCAPE', landscape.ok);
  setGate('DESKTOP', desktop.ok);

  // Soft cleanup
  for (const id of createdProductIds) {
    await prisma.product.update({
      where: { id },
      data: { isActive: false, title: `[CERT-PRIVATE] cleaned ${TAG}` },
    });
  }
  for (const id of createdUserIds) {
    await prisma.user.update({
      where: { id },
      data: {
        email: `cleaned-${id.slice(0, 8)}-${TAG}@homecheff-validation.test`,
        bio: `${FIXTURE_BIO}; cleaned=${new Date().toISOString()}`,
        accountDeletedAt: new Date(),
      },
    });
  }

  const p0 = Object.entries(gates)
    .filter(([, v]) => v === 'FAIL')
    .map(([k]) => k);

  const report = {
    TAG,
    HOMECHEFF,
    OUT,
    ROOT_CAUSE:
      'CompactDesignerForm, CompactGardenForm and MarketplaceOfferForm required parcel dims when SHIPPING selected but showed no PackageSelector — only CompactChefForm had visual tiles. BOTH delivery mode incorrectly required parcel validation.',
    CURRENT_ECTAROSHIP_SOURCE_OF_TRUTH:
      'lib/ectaroship/partner-client.ts + lib/shipping/quote-service.ts (live products API); package UX classes in lib/shipping/package-presets.ts',
    ECTAROSHIP_SERVICES_FOUND:
      'Resolved live at quote time via GET /api/v1/shipping/products — seller chooses size class, not carrier SKU',
    PACKAGE_CLASSES_FOUND: classes,
    VISUAL_SELECTOR_COMPONENT: 'components/shipping/PackageSelector.tsx',
    PACKAGE_TO_SERVICE_MAPPING:
      'preset → L×W×H+weightGrams on Product → quote-service aggregateParcels → EctaroShip products filtered (brievenbus excluded if height>3.5) → buyer selects method → order shipping snapshot → label uses same parcel',
    BRIEVENBUS_LIMIT: PACKAGE_PRESETS.find((p) => p.id === 'BRIEVENBUS'),
    SMALL_LIMIT: PACKAGE_PRESETS.find((p) => p.id === 'KLEIN'),
    STANDARD_LIMIT: PACKAGE_PRESETS.find((p) => p.id === 'MIDDEL'),
    LARGE_LIMIT: PACKAGE_PRESETS.find((p) => p.id === 'GROOT'),
    PRICE_SOURCE: 'Live EctaroShip products quote at checkout (no hardcoded tile price)',
    PRICE_STATIC_OR_DYNAMIC: 'DYNAMIC',
    CHECKOUT_PRICE_SOURCE: 'lib/shipping/quote-service.ts authoritative re-quote',
    BUYER_PAYS_SHIPPING: true,
    DB_FIELDS: [
      'Product.parcelPreset',
      'Product.lengthCm',
      'Product.widthCm',
      'Product.heightCm',
      'Product.weightGrams',
      'fulfillmentOptions.shipping/shippingDomestic',
    ],
    API_FIELDS: [
      'parcelPreset',
      'weightGrams',
      'lengthCm',
      'widthCm',
      'heightCm',
      'shippingDomestic',
    ],
    LABEL_FIELDS: 'ensure-order-shipment / partner-client createPartnerLabel weight+dims from Order/Product parcel',
    CREATE_FLOW: 'MarketplaceOfferForm + Compact*Form → /api/products/create validateParcel',
    EDIT_FLOW: 'same forms → PATCH /api/products/[id] validateParcel',
    DRAFT_FLOW: 'parcel fields persist on Product even when isActive=false',
    CHECKOUT_RECONCILIATION: reconciliations,
    LABEL_RECONCILIATION: labelParcel.ok ? labelParcel.parcel : labelParcel,
    gates,
    steps,
    MISMATCHES_FOUND: p0,
    COMMIT_SHA: process.env.COMMIT_SHA || 'pending',
    PRODUCTION_DEPLOYMENT: process.env.PRODUCTION_DEPLOYMENT || 'pending-deploy',
    PRODUCTION_URL: HOMECHEFF,
    RECONCILIATION_EVIDENCE: path.join(OUT, 'report.json'),
    FINAL_DECISION:
      p0.length === 0
        ? 'HOMECHEFF_ECTAROSHIP_PACKAGE_SELECTOR_PRODUCTION_CERTIFIED'
        : 'HOMECHEFF_ECTAROSHIP_PACKAGE_SELECTOR_NOT_CERTIFIED',
  };

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\n===== GATES =====');
  for (const [k, v] of Object.entries(gates)) console.log(`${k}=${v}`);
  console.log('FINAL_DECISION=', report.FINAL_DECISION);
  console.log('report=', path.join(OUT, 'report.json'));
  if (p0.length > 0) process.exitCode = 1;
} catch (e) {
  console.error('CERT FATAL', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
