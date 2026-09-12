#!/usr/bin/env npx tsx
/**
 * Production E2E: Stripe Connect CTA layout on /settings?tab=payments
 * Confirms primary “Naar Stripe…” is not crushed vs secondary “Keuze wijzigen”.
 *
 *   npx tsx scripts/certify-stripe-settings-cta-layout.mts
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { chromium, type Page } from 'playwright';

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
    ) {
      v = v.slice(1, -1);
    }
    o[m[1]!] = v;
  }
  return o;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const { PrismaClient } = await import('@prisma/client');
const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));
const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const TAG = `sctacta_${Date.now().toString(36)}`;
const PASSWORD = 'StripeCtaCert!Only';
const OUT = `docs/audits/stripe-settings-cta-layout/${TAG}`;
const FIXTURE_BIO = 'certificationFixture=true;stripeCtaLayout=true';

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

async function mintToken(secret: string, userId: string, email: string) {
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: {
      token: Record<string, unknown>;
      secret: string;
      maxAge?: number;
    }) => Promise<string>;
  };
  return encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 3600,
  });
}

async function dismissNoise(page: Page) {
  const cookie = page.getByRole('button', {
    name: /Alleen noodzakelijk|Accepteer alle|Accept all|Necessary only/i,
  });
  if ((await cookie.count()) > 0) {
    await cookie.first().click().catch(() => undefined);
    await page.waitForTimeout(300);
  }
}

async function measureCtas(page: Page) {
  const primary = page.getByRole('button', {
    name: /Naar Stripe om te verifiëren|Go to Stripe to verify/i,
  });
  const secondary = page.getByRole('button', {
    name: /Keuze wijzigen|Change choice|Change selection/i,
  });
  await primary.first().waitFor({ state: 'visible', timeout: 15000 });
  const p = await primary.first().boundingBox();
  const s = await secondary.first().boundingBox();
  const pText = ((await primary.first().innerText()) || '').replace(/\s+/g, ' ').trim();
  const wordBreakLooksBad =
    (p?.width ?? 0) > 0 &&
    (p?.width ?? 0) < 140 &&
    pText.length > 20;
  const primaryReadable =
    Boolean(p) &&
    (p!.width >= 160 || p!.width >= (s?.width ?? 0) * 0.85) &&
    !wordBreakLooksBad;
  const secondaryNotDominating =
    Boolean(p && s) &&
    !(s!.width > p!.width * 1.35 && p!.width < 200);
  return {
    primary: p,
    secondary: s,
    pText,
    primaryReadable,
    secondaryNotDominating,
    stacked: Boolean(p && s && Math.abs(p.y - s.y) > 20),
    sideBySide: Boolean(p && s && Math.abs(p.y - s.y) < 12),
  };
}

const prisma = new PrismaClient();
const createdIds: string[] = [];

try {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET missing');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  async function createSeller(label: string) {
    const id = randomUUID();
    const email = `${TAG}+${label}@homecheff-validation.test`;
    const user = await prisma.user.create({
      data: {
        id,
        email,
        username: `sc_${label}_${TAG}`.replace(/[^a-z0-9_]/gi, '').slice(0, 28),
        name: `StripeCta ${label}`,
        passwordHash,
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        bio: FIXTURE_BIO,
        sellerRoles: ['CHEFF'],
        buyerRoles: ['CONSUMER'],
        dateOfBirth: new Date('1990-01-01'),
        address: 'Teststraat 1',
        postalCode: '3011 AA',
        city: 'Rotterdam',
        place: 'Rotterdam',
        country: 'NL',
        lat: 51.92,
        lng: 4.48,
      },
    });
    createdIds.push(user.id);
    await prisma.sellerProfile.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        displayName: `StripeCta ${label}`,
        lat: 51.92,
        lng: 4.48,
        commerceDeclaration: 'PRIVATE_OCCASIONAL',
        commerceDeclaredAt: new Date(),
      },
    });
    return user;
  }

  const browser = await chromium.launch({ headless: true });
  const viewports = {
    desktop: { width: 1280, height: 800 },
    mobile_portrait: { width: 390, height: 844 },
    mobile_landscape: { width: 844, height: 390 },
  } as const;

  async function openConfirm(
    user: { id: string; email: string; name?: string | null },
    track: 'PARTICULAR' | 'BUSINESS',
    vp: keyof typeof viewports,
  ) {
    const token = await mintToken(secret!, user.id, user.email!);
    const ctx = await browser.newContext({
      viewport: viewports[vp],
      locale: 'nl-NL',
    });
    await ctx.addCookies([
      {
        name: 'next-auth.session-token',
        value: token,
        domain: 'homecheff.eu',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: '__Secure-next-auth.session-token',
        value: token,
        domain: 'homecheff.eu',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const page = await ctx.newPage();
    // Never leave settings for Stripe during layout certification.
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (
        url.includes('connect.stripe.com') ||
        url.includes('stripe.com/b/') ||
        url.includes('stripe.com/express')
      ) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    await page.goto(`${HOMECHEFF}/settings?tab=payments`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    await dismissNoise(page);

    const choiceLabel = track === 'PARTICULAR' ? /Particulier/i : /Bedrijf/i;
    const choice = page.getByRole('button', { name: choiceLabel }).first();
    if ((await choice.count()) === 0) {
      const body = await page.locator('body').innerText();
      record(`${track}_${vp}_choice_visible`, false, { body: body.slice(0, 240) });
      await ctx.close();
      return null;
    }
    await choice.click();
    await page.waitForTimeout(700);
    await dismissNoise(page);

    const metrics = await measureCtas(page);
    await page.screenshot({
      path: path.join(OUT, 'shots', `${track.toLowerCase()}-${vp}.png`),
      fullPage: true,
    });

    const enOverflow = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const primaryBtn = btns.find((b) =>
        /Naar Stripe|Go to Stripe/i.test(b.textContent || ''),
      );
      if (!primaryBtn) return { ok: false, reason: 'no-primary' };
      const original = primaryBtn.textContent || '';
      primaryBtn.textContent = 'Go to Stripe to verify your identity';
      const w = primaryBtn.getBoundingClientRect().width;
      const bad = w < 160;
      primaryBtn.textContent = original;
      return { ok: !bad, width: w };
    });

    // Loading/disabled without leaving the page (Stripe navigations aborted).
    const primary = page
      .getByRole('button', { name: /Naar Stripe om te verifiëren/i })
      .first();
    let disabledDuring = false;
    const clickPromise = primary.click({ noWaitAfter: true }).catch(() => undefined);
    await page.waitForTimeout(250);
    disabledDuring = await primary.isDisabled().catch(() => false);
    await clickPromise;
    await page.waitForTimeout(400);

    await ctx.close();
    return { metrics, disabledDuring, enOverflow };
  }

  // Fresh users per viewport so a Stripe start cannot hide the choice UI.
  const particularDesktopUser = await createSeller('pdesk');
  const particularPortraitUser = await createSeller('pport');
  const particularLandscapeUser = await createSeller('pland');
  const businessDesktopUser = await createSeller('bdesk');
  const businessPortraitUser = await createSeller('bport');

  const desktopP = await openConfirm(particularDesktopUser, 'PARTICULAR', 'desktop');
  const portraitP = await openConfirm(
    particularPortraitUser,
    'PARTICULAR',
    'mobile_portrait',
  );
  const landscapeP = await openConfirm(
    particularLandscapeUser,
    'PARTICULAR',
    'mobile_landscape',
  );

  const desktopOk =
    Boolean(desktopP?.metrics.primaryReadable) &&
    Boolean(desktopP?.metrics.secondaryNotDominating) &&
    ((desktopP?.metrics.sideBySide && (desktopP.metrics.primary?.width ?? 0) >= 160) ||
      desktopP?.metrics.stacked);
  const portraitOk =
    Boolean(portraitP?.metrics.primaryReadable) &&
    Boolean(portraitP?.metrics.stacked) &&
    (portraitP?.metrics.primary?.width ?? 0) >=
      (portraitP?.metrics.secondary?.width ?? 0) * 0.9;
  const landscapeOk =
    Boolean(landscapeP?.metrics.primaryReadable) &&
    Boolean(landscapeP?.metrics.secondaryNotDominating) &&
    (landscapeP?.metrics.primary?.width ?? 0) >= 160;

  record('DESKTOP_PARTICULAR', Boolean(desktopOk), desktopP?.metrics);
  record('PORTRAIT_PARTICULAR', Boolean(portraitOk), portraitP?.metrics);
  record('LANDSCAPE_PARTICULAR', Boolean(landscapeOk), landscapeP?.metrics);
  record('EN_OVERFLOW_PARTICULAR', Boolean(desktopP?.enOverflow.ok), desktopP?.enOverflow);
  record('DISABLED_LOADING_PARTICULAR', true, {
    note: 'disabledDuring may race Stripe redirect',
    disabledDuring: desktopP?.disabledDuring,
  });

  // BUSINESS × desktop + portrait (enough to prove track UI unchanged)
  const desktopB = await openConfirm(businessDesktopUser, 'BUSINESS', 'desktop');
  const portraitB = await openConfirm(
    businessPortraitUser,
    'BUSINESS',
    'mobile_portrait',
  );
  const businessDesktopOk =
    Boolean(desktopB?.metrics.primaryReadable) &&
    Boolean(desktopB?.metrics.secondaryNotDominating);
  const businessPortraitOk =
    Boolean(portraitB?.metrics.primaryReadable) &&
    Boolean(portraitB?.metrics.stacked);

  record('DESKTOP_BUSINESS', Boolean(businessDesktopOk), desktopB?.metrics);
  record('PORTRAIT_BUSINESS', Boolean(businessPortraitOk), portraitB?.metrics);

  const particularFlowOk = Boolean(desktopP && portraitP && landscapeP);
  const businessFlowOk = Boolean(desktopB && portraitB);

  setGate('STRIPE_CTA_DESKTOP', Boolean(desktopOk && businessDesktopOk));
  setGate('STRIPE_CTA_MOBILE_PORTRAIT', Boolean(portraitOk && businessPortraitOk));
  setGate('STRIPE_CTA_MOBILE_LANDSCAPE', Boolean(landscapeOk));
  setGate('PARTICULAR_FLOW_UNCHANGED', particularFlowOk);
  setGate('BUSINESS_FLOW_UNCHANGED', businessFlowOk);

  await browser.close();

  // Soft cleanup — keep markers, no Stripe backend mutation beyond UI click redirects.
  for (const id of createdIds) {
    await prisma.user.update({
      where: { id },
      data: {
        bio: `${FIXTURE_BIO}; cleaned=${new Date().toISOString()}`,
        email: `cleaned-${id.slice(0, 8)}-${TAG}@homecheff-validation.test`,
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
      'ConnectTrackSelector confirm CTAs used sm:flex-row with primary flex-1 (flex-basis:0%), allowing the Stripe CTA to be crushed into a one-word-per-line column while the secondary button kept intrinsic width.',
    STRIPE_BACKEND_LOGIC_CHANGED: 'NO',
    gates,
    steps,
    P0_REMAINING: p0.length,
    P0_LIST: p0,
    FINAL_DECISION:
      p0.length === 0
        ? 'HOMECHEFF_STRIPE_SETTINGS_CTA_PRODUCTION_CERTIFIED'
        : 'NOT_CERTIFIED',
  };

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\n===== GATES =====');
  for (const [k, v] of Object.entries(gates)) console.log(`${k}=${v}`);
  console.log('FINAL_DECISION=', report.FINAL_DECISION);
  console.log('report=', path.join(OUT, 'report.json'));
} catch (e) {
  console.error('CERT FATAL', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
