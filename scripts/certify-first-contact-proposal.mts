/**
 * Authenticated first-contact proposal certification.
 * Disposable @homecheff-validation.test fixtures only (not publicly discoverable).
 * Cleanup via disposeTempCertificationUsers.
 *
 * CERT_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/certify-first-contact-proposal.mts
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type BrowserContext, type Page } from 'playwright';

function loadEnv(file: string) {
  const o: Record<string, string> = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    o[m[1]!] = v;
  }
  return o;
}

const appEnv = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(appEnv)) {
  if (!process.env[k]) process.env[k] = v;
}

const { PrismaClient } = await import('@prisma/client');
const bcrypt = (await import('bcryptjs')).default;
const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));

const BASE = process.env.CERT_BASE_URL || 'http://127.0.0.1:3000';
const TAG = `fccert${Date.now().toString(36)}`;
const OUT = path.join('docs/audits/first-contact-proposal', TAG);
const PASSWORD = 'FcCertValidate!Only';

type Gate = 'PASS' | 'FAIL';
const gates: Record<string, Gate> = {};
const notes: string[] = [];

function setGate(name: string, ok: boolean, detail?: string) {
  gates[name] = ok ? 'PASS' : 'FAIL';
  console.log(`[${gates[name]}] ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok && detail) notes.push(`${name}: ${detail}`);
}

async function mintToken(secret: string, userId: string, email: string) {
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: { token: Record<string, unknown>; secret: string; maxAge?: number }) => Promise<string>;
  };
  return encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 60 * 60,
  });
}

async function contextFor(browser: Awaited<ReturnType<typeof chromium.launch>>, token: string, width: number, height: number) {
  const host = new URL(BASE).hostname;
  const secure = BASE.startsWith('https://');
  const context = await browser.newContext({
    viewport: { width, height },
    locale: 'nl-NL',
    extraHTTPHeaders: {
      cookie: `next-auth.session-token=${token}`,
    },
  });
  await context.addCookies([
    {
      name: 'next-auth.session-token',
      value: token,
      domain: host,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure,
    },
  ]);
  await context.addInitScript(() => {
    localStorage.setItem('homecheff-language', 'nl');
  });
  context.on('page', (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('[BROWSER]', msg.text().slice(0, 300));
    });
    page.on('requestfailed', (req) => {
      console.log('[REQFAIL]', req.method(), req.url().slice(0, 160), req.failure()?.errorText || '');
    });
    page.on('request', (req) => {
      if (req.url().includes('/api/conversations')) {
        console.log('[REQ]', req.method(), req.url().slice(0, 160));
      }
    });
    page.on('response', (res) => {
      if (res.url().includes('/api/conversations') || res.url().includes('/proposals')) {
        console.log('[RES]', res.status(), res.url().slice(0, 160));
      }
    });
  });
  return context;
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false }).catch(() => undefined);
}

async function openChooser(page: Page) {
  await page.goto(`${BASE}/product/${productId}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const browserSession = await page.evaluate(async () => {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    const text = await res.text();
    return `${res.status} ${text.slice(0, 180)}`;
  });
  if (!browserSession.includes('"id"')) {
    throw new Error(`browser session missing: ${browserSession}`);
  }
  const start = page.getByRole('button', { name: 'Start chat' });
  await start.first().waitFor({ state: 'attached', timeout: 60000 });
  const count = await start.count();
  let clicked = false;
  for (let i = 0; i < count; i++) {
    if (await start.nth(i).isVisible()) {
      await start.nth(i).click();
      clicked = true;
      break;
    }
  }
  if (!clicked) throw new Error('no visible Start chat button');
  await page.locator('[data-hc-first-contact-proposal]').waitFor({ state: 'visible', timeout: 20000 });
}

async function assertChoices(page: Page, label: string) {
  const proposal = page.locator('[data-hc-first-contact-proposal]');
  const quick = page.locator('[data-hc-first-contact-quick]');
  const write = page.locator('[data-hc-first-contact-write]');
  const box = await proposal.boundingBox();
  const vp = page.viewportSize()!;
  const inView = !!box && box.y >= 0 && box.y + box.height <= vp.height + 2 && box.x >= 0 && box.x + box.width <= vp.width + 2;
  const text = ((await proposal.innerText()) || '').replace(/\s+/g, ' ').trim();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
  setGate(`${label}_VISIBLE`, (await quick.isVisible()) && (await write.isVisible()) && (await proposal.isVisible()) && text === 'Voorstel doen' && inView && overflow, `text=${text} inView=${inView} overflowOk=${overflow}`);
  await shot(page, `${label}-choices`);
}

let productId = '';
let buyerId = '';
let sellerId = '';

function waitForConversationStart(page: Page) {
  return page.waitForResponse(
    (res) => res.url().includes('/api/conversations/start') && res.request().method() === 'POST',
    { timeout: 45000 },
  );
}

async function sendQuick(page: Page) {
  await page.locator('[data-hc-first-contact-quick]').click();
  const button = page.locator('[data-hc-first-contact-quick-panel] button').first();
  const hit = await button.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 20));
    return {
      text: (el.textContent || '').trim().slice(0, 80),
      same: !!top && (top === el || el.contains(top)),
      top: top ? `${top.tagName}.${String((top as HTMLElement).className || '').slice(0, 60)}` : 'none',
      y: Math.round(r.y),
    };
  });
  console.log('[HIT quick]', JSON.stringify(hit));
  const pending = waitForConversationStart(page);
  await button.click();
  const res = await pending;
  if (!res.ok()) throw new Error(`quick start failed ${res.status()} ${await res.text().catch(() => '')}`);
}

async function sendFree(page: Page, text: string) {
  await openChooser(page);
  await page.locator('[data-hc-first-contact-write]').click();
  const area = page.locator('[data-hc-first-contact-write-panel] textarea');
  await area.fill(text);
  const pending = waitForConversationStart(page);
  await page.locator('[data-hc-first-contact-write-panel] button').click();
  const res = await pending;
  if (!res.ok()) throw new Error(`free start failed ${res.status()}`);
}

async function openProposalSheet(page: Page) {
  await openChooser(page);
  await page.locator('[data-hc-first-contact-proposal]').click();
  await page.waitForURL(/openProposal=1/, { timeout: 30000 });
  await page.locator('[data-hc-proposal-sheet-portal]').waitFor({ state: 'visible', timeout: 30000 });
}

async function submitSheet(page: Page, label: string) {
  const amount = page.locator('#proposal-amount');
  if (await amount.count()) {
    const current = await amount.inputValue().catch(() => '');
    if (!current.trim()) await amount.fill('12.50');
    await amount.focus();
  }
  const blocked = page.locator('[data-hc-proposal-submit-blocked-reason]');
  if (await blocked.isVisible().catch(() => false)) {
    const reason = await blocked.innerText();
    if (/betaling|payment|HomeCheff/i.test(reason)) {
      const direct = page.getByRole('button', { name: /onderling|direct|afspreken/i }).first();
      if (await direct.count()) await direct.click();
    }
  }
  const submit = page.locator('[data-hc-proposal-submit]');
  await submit.waitFor({ state: 'visible' });
  const vp = page.viewportSize()!;
  const box = await submit.boundingBox();
  const hit = await page.evaluate(() => {
    const el = document.querySelector('[data-hc-proposal-submit]');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 10));
    return !!top && (el === top || el.contains(top));
  });
  const closeHit = await page.evaluate(() => {
    const el = document.querySelector('[data-hc-proposal-sheet-close]');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!top && (el === top || el.contains(top));
  });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
  setGate(
    `${label}_SHEET`,
    !!box && box.y + box.height <= vp.height + 2 && hit && closeHit && overflow,
    `hit=${hit} close=${closeHit} overflow=${overflow} y=${box ? Math.round(box.y) : 'na'}`,
  );
  await shot(page, `${label}-sheet`);
  if (!(await submit.isEnabled())) {
    const reason = await page.locator('[data-hc-proposal-submit-blocked-reason]').innerText().catch(() => 'disabled');
    throw new Error(`submit disabled: ${reason}`);
  }
  const pendingSubmit = page.waitForResponse(
    (res) => res.url().includes('/proposals') && res.request().method() === 'POST',
    { timeout: 60000 },
  );
  await submit.click();
  const submitRes = await pendingSubmit;
  if (!submitRes.ok()) {
    throw new Error(`proposal submit ${submitRes.status()} ${(await submitRes.text().catch(() => '')).slice(0, 240)}`);
  }
  await page.locator('[data-hc-proposal-sheet-portal]').waitFor({ state: 'detached', timeout: 20000 });
}

const prisma = new PrismaClient();
const { disposeTempCertificationUsers } = await import('../lib/certification/dispose-temp-fixtures.ts');

const browser = await chromium.launch({
  headless: true,
  args: ['--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:3000'],
});
let buyerToken = '';
let sellerToken = '';

try {
  const secret = (appEnv.NEXTAUTH_SECRET || appEnv.AUTH_SECRET || '').trim();
  if (!secret) throw new Error('NEXTAUTH_SECRET missing');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const buyer = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${TAG}+buyer@homecheff-validation.test`,
      passwordHash,
      name: 'FcCert Buyer',
      username: `fccbuy${TAG}`.slice(0, 28),
      emailVerified: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      bio: 'certificationFixture=true',
      lat: 51.912,
      lng: 4.343,
      place: 'Vlaardingen',
      buyerRoles: ['CONSUMER'],
      interests: ['CHEFF'],
    },
  });
  buyerId = buyer.id;
  const seller = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${TAG}+seller@homecheff-validation.test`,
      passwordHash,
      name: 'FcCert Seller',
      username: `fccsel${TAG}`.slice(0, 28),
      emailVerified: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      bio: 'certificationFixture=true',
      lat: 51.912,
      lng: 4.343,
      place: 'Vlaardingen',
      sellerRoles: ['CHEFF'],
      interests: ['CHEFF'],
    },
  });
  sellerId = seller.id;
  const profile = await prisma.sellerProfile.create({
    data: {
      id: randomUUID(),
      userId: seller.id,
      displayName: 'FcCert Seller',
      lat: 51.912,
      lng: 4.343,
      bio: 'certificationFixture=true',
      commerceDeclaration: 'PRIVATE_OCCASIONAL',
      commerceDeclaredAt: new Date(),
    },
  });
  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      sellerId: profile.id,
      category: 'CHEFF',
      title: `FcCert ${TAG}`,
      description: 'Private certification fixture. certificationFixture=true. Safe to delete.',
      priceCents: 1250,
      unit: 'PORTION',
      delivery: 'PICKUP',
      isActive: false,
      stock: 5,
      maxStock: 5,
      acceptHomeCheffPayment: false,
      acceptDirectContact: true,
      barterOpenness: 'MONEY',
      priceModel: 'FIXED',
      orderMethod: 'CONTACT',
      marketplaceCategory: 'CREATE',
      allergens: [],
      allergensConfirmedAt: new Date(),
      fulfillmentOptions: { pickup: true, delivery: false, digital: false },
      tags: [TAG, 'FCCERT'],
      placeName: 'Vlaardingen',
    },
  });
  productId = product.id;

  buyerToken = await mintToken(secret, buyer.id, buyer.email!);
  sellerToken = await mintToken(secret, seller.id, seller.email!);

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { cookie: `next-auth.session-token=${buyerToken}` },
  });
  const sessionJson = await sessionRes.json().catch(() => ({}));
  if (sessionRes.status !== 200 || sessionJson?.user?.id !== buyer.id) {
    throw new Error(`buyer session failed ${sessionRes.status} ${JSON.stringify(sessionJson).slice(0, 200)}`);
  }

  if (process.env.CERT_API_ONLY === '1') {
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/conversations/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `next-auth.session-token=${buyerToken}`,
      },
      body: JSON.stringify({
        productId,
        initialMessage: 'Hoi! Is dit product nog beschikbaar?',
      }),
    });
    const text = await res.text();
    console.log('API_START', res.status, `${Date.now() - t0}ms`, text.slice(0, 240));
    throw new Error('api probe done');
  }

  if (process.env.CERT_PROBE === '1') {
    const sellerUser = await prisma.user.findUnique({
      where: { id: seller.id },
      select: { id: true, email: true, bio: true },
    });
    const profileRow = await prisma.sellerProfile.findUnique({
      where: { id: profile.id },
      select: { id: true, userId: true },
    });
    const pageRes = await fetch(`${BASE}/product/${productId}`, {
      headers: { cookie: `next-auth.session-token=${buyerToken}` },
      redirect: 'manual',
    });
    const html = await pageRes.text();
    console.log(
      'PROBE',
      JSON.stringify({
        status: pageRes.status,
        location: pageRes.headers.get('location'),
        hasTitle: html.includes(`FcCert ${TAG}`),
        notFound: html.includes('Page not found'),
        sellerUser,
        profile: profileRow,
      }),
    );
    throw new Error('probe done');
  }

  async function runViewport(width: number, height: number, key: string, withMessages: boolean) {
    const context = await contextFor(browser, buyerToken, width, height);
    const page = await context.newPage();
    try {
      await openChooser(page);
      await assertChoices(page, key);
      if (withMessages) {
        await sendQuick(page);
        await sendFree(page, `Vrij bericht ${key} ${TAG}`);
      }
      await openProposalSheet(page);
      await submitSheet(page, key);
    } catch (error) {
      const url = page.url();
      const body = await page.locator('body').innerText().catch(() => '');
      notes.push(`${key} page ${url} body=${body.replace(/\s+/g, ' ').slice(0, 400)}`);
      console.log(`[DEBUG] ${key} ${url} ${body.replace(/\s+/g, ' ').slice(0, 400)}`);
      await shot(page, `${key}-error`);
      throw error;
    } finally {
      await context.close();
    }
  }

  await runViewport(375, 812, 'MOBILE_375', true);
  await runViewport(430, 932, 'MOBILE', true);
  await runViewport(1280, 800, 'DESKTOP', true);

  const conversations = await prisma.conversation.findMany({
    where: { productId },
    select: { id: true },
  });
  setGate('DUPLICATE_CONVERSATION_PREVENTED', conversations.length === 1, `count=${conversations.length}`);
  setGate('CONVERSATION_CREATED_CORRECTLY', conversations.length === 1, conversations[0]?.id);
  const conversationId = conversations[0]?.id;
  if (!conversationId) throw new Error('no conversation');

  const messages = await prisma.message.findMany({
    where: { conversationId },
    select: { text: true },
  });
  const texts = messages.map((m) => m.text || '');
  setGate('FIRST_CONTACT_QUICK_MESSAGE', texts.some((t) => /beschikbaar/i.test(t)), texts.join(' | ').slice(0, 180));
  setGate('FIRST_CONTACT_FREE_MESSAGE', texts.some((t) => t.includes('Vrij bericht')), texts.filter((t) => t.includes('Vrij')).join(' | '));

  const proposals = await prisma.proposal.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
  setGate('FIRST_CONTACT_PROPOSAL_SUBMIT', proposals.length >= 1, `n=${proposals.length}`);
  setGate('LISTING_RELATION_PRESERVED', proposals.every((p) => p.productId === productId && p.conversationId === conversationId), proposals.map((p) => p.productId).join(','));
  setGate('FIRST_CONTACT_PROPOSAL_VISIBLE', gates.MOBILE_375_VISIBLE === 'PASS' && gates.MOBILE_VISIBLE === 'PASS' && gates.DESKTOP_VISIBLE === 'PASS');

  const existingCtx = await contextFor(browser, buyerToken, 1280, 800);
  const existingPage = await existingCtx.newPage();
  await existingPage.goto(`${BASE}/messages?conversation=${conversationId}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const existingProposalBtn = existingPage.locator('[data-hc-chat-composer] button').first();
  await existingProposalBtn.waitFor({ state: 'visible', timeout: 60000 });
  await existingProposalBtn.click();
  const existingSheet = await existingPage.locator('[data-hc-proposal-sheet-portal]').waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
  setGate('EXISTING_CONVERSATION_PROPOSAL', existingSheet);
  await existingPage.locator('[data-hc-proposal-sheet-close]').click().catch(() => undefined);
  await existingCtx.close();

  const sellerCtx = await contextFor(browser, sellerToken, 1280, 900);
  const sellerPage = await sellerCtx.newPage();
  await sellerPage.goto(`${BASE}/messages?conversation=${conversationId}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await sellerPage.waitForResponse(
    (res) => res.url().includes('/proposals') && res.request().method() === 'GET',
    { timeout: 60000 },
  ).catch(() => undefined);
  const counterBtn = sellerPage.getByRole('button', { name: 'Tegenvoorstel' });
  try {
    await counterBtn.first().waitFor({ state: 'visible', timeout: 60000 });
  } catch (error) {
    const body = await sellerPage.locator('body').innerText().catch(() => '');
    throw new Error(`seller counter missing at ${sellerPage.url()} body=${body.replace(/\s+/g, ' ').slice(0, 500)}`);
  }
  setGate('SELLER_SEES_PROPOSAL', true);
  await sellerPage.getByRole('button', { name: 'Tegenvoorstel' }).first().click();
  const counterAmount = sellerPage.locator('#counter-proposal-amount');
  await counterAmount.waitFor({ timeout: 15000 });
  await counterAmount.fill('9.00');
  const sendCounter = sellerPage.getByRole('button', { name: 'Tegenvoorstel versturen' });
  await sendCounter.waitFor({ state: 'visible', timeout: 60000 });
  try {
    await sellerPage.waitForFunction(() => {
      const button = [...document.querySelectorAll('button')].find((el) =>
        (el.textContent || '').includes('Tegenvoorstel versturen'),
      );
      return !!button && !(button as HTMLButtonElement).disabled;
    }, null, { timeout: 30000 });
  } catch {
    const reason = await sellerPage.locator('[role="alert"], [role="status"]').allInnerTexts().catch(() => []);
    throw new Error(`counter send stayed disabled: ${reason.join(' | ').slice(0, 300)}`);
  }
  const pendingCounter = sellerPage.waitForResponse(
    (res) => res.url().includes('/counter') && res.request().method() === 'POST',
    { timeout: 45000 },
  );
  await sendCounter.click();
  const counterRes = await pendingCounter;
  if (!counterRes.ok()) {
    throw new Error(`counter ${counterRes.status()} ${(await counterRes.text().catch(() => '')).slice(0, 240)}`);
  }
  const countered = await prisma.proposal.findFirst({
    where: { conversationId, parentProposalId: { not: null } },
  });
  setGate('COUNTERPROPOSAL', !!countered, countered?.id);

  const buyerCtx = await contextFor(browser, buyerToken, 1280, 900);
  const buyerPage = await buyerCtx.newPage();
  await buyerPage.goto(`${BASE}/messages?conversation=${conversationId}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await buyerPage.waitForResponse(
    (res) => res.url().includes('/proposals') && res.request().method() === 'GET' && res.ok(),
    { timeout: 90000 },
  );
  const acceptCard = countered
    ? buyerPage.locator(`#proposal-${countered.id}`)
    : buyerPage.locator('[id^="proposal-"]').first();
  await acceptCard.waitFor({ state: 'attached', timeout: 60000 });
  await acceptCard.scrollIntoViewIfNeeded();
  await acceptCard.waitFor({ state: 'visible', timeout: 20000 });
  await acceptCard.getByText('Ik begrijp dat ik deze afspraak moet nakomen.').click();
  const acceptCta = acceptCard.locator('[data-hc-accept-cta]');
  await acceptCta.click();
  await acceptCard.getByRole('button', { name: 'Ja, afspraak bevestigen' }).waitFor({ state: 'visible', timeout: 15000 });
  const pendingAccept = buyerPage.waitForResponse(
    (res) => res.url().includes('/accept') && res.request().method() === 'POST',
    { timeout: 45000 },
  );
  await acceptCta.click();
  const acceptRes = await pendingAccept;
  if (!acceptRes.ok()) {
    throw new Error(`accept ${acceptRes.status()} ${(await acceptRes.text().catch(() => '')).slice(0, 240)}`);
  }
  await acceptCard.getByText('Afspraak bevestigd').waitFor({ timeout: 20000 });
  const accepted = countered
    ? await prisma.proposal.findUnique({ where: { id: countered.id } })
    : null;
  const order = accepted
    ? await prisma.communityOrder.findFirst({ where: { proposalId: accepted.id } })
    : null;
  setGate('ACCEPT_PROPOSAL', accepted?.status === 'ACCEPTED', accepted?.status);
  setGate('POST_ACCEPT_FLOW', !!order, order?.id);

  await buyerCtx.close();
  await sellerCtx.close();
  const rejectCtx = await contextFor(browser, sellerToken, 1280, 900);
  const rejectPage = await rejectCtx.newPage();
  await rejectPage.goto(`${BASE}/messages?conversation=${conversationId}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await rejectPage.waitForResponse(
    (res) => res.url().includes('/proposals') && res.request().method() === 'GET' && res.ok(),
    { timeout: 90000 },
  );
  const pendingRows = await prisma.proposal.findMany({
    where: { conversationId, status: 'PENDING', createdById: buyerId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  console.log('[pending-to-reject]', pendingRows.map((p) => p.id).join(',') || 'none');
  if (!pendingRows.length) throw new Error('no buyer pending proposal left to reject');
  const pendingId = pendingRows[0]!.id;
  const domIds = await rejectPage.locator('[id^="proposal-"]').evaluateAll((els) => els.map((el) => el.id));
  console.log('[dom-proposals]', domIds.join(',') || 'none');
  const card = rejectPage.locator(`#proposal-${pendingId}`);
  await card.waitFor({ state: 'attached', timeout: 30000 });
  const rejectButton = card.locator('button', { hasText: 'afwijzen' });
  await rejectButton.waitFor({ state: 'visible', timeout: 30000 });
  await rejectButton.scrollIntoViewIfNeeded();
  const [rejectRes] = await Promise.all([
    rejectPage.waitForResponse(
      (res) => res.url().includes(`/api/proposals/${pendingId}/reject`) && res.request().method() === 'POST',
      { timeout: 60000 },
    ),
    rejectButton.click({ timeout: 15000 }),
  ]);
  if (!rejectRes.ok()) {
    throw new Error(`reject ${rejectRes.status()} ${(await rejectRes.text().catch(() => '')).slice(0, 240)}`);
  }
  await rejectCtx.close();
  const rejected = await prisma.proposal.findFirst({
    where: { conversationId, status: 'REJECTED' },
  });
  setGate('REJECT_PROPOSAL', !!rejected, rejected?.id ?? 'none');

  const noteTypes = await prisma.notification.findMany({
    where: { userId: { in: [buyerId, sellerId] }, type: { in: ['PROPOSAL_RECEIVED', 'PROPOSAL_COUNTERED', 'PROPOSAL_ACCEPTED', 'PROPOSAL_REJECTED'] } },
    select: { type: true, userId: true },
  });
  const types = new Set(noteTypes.map((n) => n.type));
  setGate(
    'NOTIFICATIONS',
    types.has('PROPOSAL_RECEIVED') && types.has('PROPOSAL_COUNTERED') && types.has('PROPOSAL_ACCEPTED'),
    [...types].join(','),
  );
} catch (error) {
  console.error('CERT_ERROR', error);
  notes.push(error instanceof Error ? error.stack || error.message : String(error));
  for (const key of [
    'MOBILE_375_VISIBLE',
    'MOBILE_VISIBLE',
    'DESKTOP_VISIBLE',
    'FIRST_CONTACT_QUICK_MESSAGE',
    'FIRST_CONTACT_FREE_MESSAGE',
    'FIRST_CONTACT_PROPOSAL_SUBMIT',
    'FIRST_CONTACT_PROPOSAL_VISIBLE',
    'EXISTING_CONVERSATION_PROPOSAL',
    'COUNTERPROPOSAL',
    'ACCEPT_PROPOSAL',
    'REJECT_PROPOSAL',
    'POST_ACCEPT_FLOW',
    'CONVERSATION_CREATED_CORRECTLY',
    'DUPLICATE_CONVERSATION_PREVENTED',
    'LISTING_RELATION_PRESERVED',
    'NOTIFICATIONS',
  ]) {
    if (!gates[key]) gates[key] = 'FAIL';
  }
} finally {
  await browser.close();
  let cleanup: unknown = null;
  try {
    cleanup = await disposeTempCertificationUsers([buyerId, sellerId].filter(Boolean));
  } catch (error) {
    cleanup = { error: error instanceof Error ? error.message : String(error) };
  }
  const report = { TAG, BASE, gates, notes, cleanup, at: new Date().toISOString() };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
  const failed = Object.values(gates).some((g) => g === 'FAIL') || Object.keys(gates).length === 0;
  process.exit(failed ? 1 : 0);
}
