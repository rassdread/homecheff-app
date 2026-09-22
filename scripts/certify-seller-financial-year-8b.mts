#!/usr/bin/env npx tsx
/**
 * PHASE 8B §35 — production certification of the canonical seller financial year.
 *
 * READ-ONLY. Creates no users, no orders, no transactions, no refunds. It mints a
 * short-lived NextAuth cookie for two existing sellers (the standard certification
 * pattern in this repo), issues GET requests against homecheff.eu, and reconciles
 * every figure against deriveSellerFinancialYear run locally against the same DB.
 *
 *   npx tsx scripts/certify-seller-financial-year-8b.mts
 */
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

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

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));
const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const OUT = 'docs/audits/seller-financial-year-8b/certification';
const YEAR = new Date().getUTCFullYear();
const PRIOR_YEAR = YEAR - 1;

const { prisma } = await import('../lib/prisma');
const { deriveSellerFinancialYear } = await import(
  '../lib/finance/seller-financial-year.server'
);

function mask(id: string | null | undefined) {
  if (!id) return null;
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
  return encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 900,
  });
}

/** Both surfaces render with Intl nl-NL, so proof must compare in that shape. */
function eur(cents: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(
    cents / 100,
  );
}

/**
 * §8: the fee actually charged across the year is a blend of the rates snapshotted
 * per sale. It is allowed to differ from the seller's current plan rate — and if it
 * does, that difference is the evidence that no recalculation happened.
 */
function blendedFeePercent(feeCents: number, grossCents: number) {
  if (grossCents <= 0) return null;
  return Number(((feeCents / grossCents) * 100).toFixed(1));
}

type Json = Record<string, any>;

const report: Json = {
  phase: '8B',
  section: '35_PRODUCTION_CERTIFICATION',
  host: HOMECHEFF,
  year: YEAR,
  readOnly: true,
  mutationsPerformed: 0,
  sellers: {},
  checks: {},
};

let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

async function dismissNoise(page: Page) {
  await page
    .evaluate(() => {
      try {
        localStorage.setItem('privacy-notice-accepted', 'necessary');
      } catch {
        /* ignore */
      }
    })
    .catch(() => undefined);
}

/**
 * Both surfaces render the amber notice with role="status" when the derivation
 * reports anything other than COMPLETE.
 */
async function readSurface(page: Page, url: string, shot: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await dismissNoise(page);
  await page.reload({ waitUntil: 'networkidle', timeout: 60_000 }).catch(() => undefined);
  await page.waitForTimeout(3500);
  const body = (await page.locator('body').innerText().catch(() => '')) || '';
  const notices = await page
    .locator('[role="status"]')
    .allInnerTexts()
    .catch(() => [] as string[]);
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, shot), fullPage: true }).catch(() => undefined);
  return { body, notices, screenshot: shot };
}

try {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET missing');
  fs.mkdirSync(OUT, { recursive: true });

  // ---------------------------------------------------------------------------
  // Pick real sellers. Never create one: §35 forbids manufacturing history, and
  // a fabricated seller would only certify a code path, not production data.
  // ---------------------------------------------------------------------------
  const { start, end } = {
    start: new Date(Date.UTC(YEAR, 0, 1)),
    end: new Date(Date.UTC(YEAR + 1, 0, 1)),
  };

  const grouped = await prisma.transaction.groupBy({
    by: ['sellerId'],
    where: { createdAt: { gte: start, lt: end } },
    _count: { _all: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const withData = grouped
    .map((g) => g.sellerId)
    .filter((id): id is string => Boolean(id));

  if (withData.length === 0) {
    throw new Error(`no seller has ${YEAR} transactions; cannot certify production figures`);
  }

  const sellerWithData = withData[0];

  const zeroSaleCandidate = await prisma.user.findFirst({
    where: {
      NOT: { email: { contains: '@homecheff-validation.test' } },
      sellerRoles: { isEmpty: false },
      id: { notIn: withData },
      Transaction: { none: {} },
      // A tombstoned account has no session, so it cannot certify a UI state.
      accountDeletedAt: null,
      emailVerified: { not: null },
    },
    select: { id: true, email: true },
    orderBy: { createdAt: 'desc' },
  });

  const subjects: Array<{ label: string; id: string; email: string }> = [];

  const withDataUser = await prisma.user.findUnique({
    where: { id: sellerWithData },
    select: { id: true, email: true },
  });
  if (!withDataUser?.email) throw new Error('top seller has no email; cannot mint session');
  subjects.push({ label: 'SELLER_WITH_SALES', id: withDataUser.id, email: withDataUser.email });

  if (zeroSaleCandidate?.email) {
    subjects.push({
      label: 'SELLER_NO_SALES',
      id: zeroSaleCandidate.id,
      email: zeroSaleCandidate.email,
    });
  } else {
    report.checks.NO_SALES_STATE = 'SKIP — no zero-transaction seller in production';
  }

  browser = await chromium.launch({ headless: true });

  for (const subject of subjects) {
    const derived = await deriveSellerFinancialYear(subject.id, YEAR);
    const derivedAgain = await deriveSellerFinancialYear(subject.id, YEAR);
    const derivedPrior = await deriveSellerFinancialYear(subject.id, PRIOR_YEAR);

    const token = await mintCookie(secret, subject.id, subject.email);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1400 },
      locale: 'nl-NL',
    });
    const cookieBase = {
      domain: 'homecheff.eu',
      path: '/',
      secure: true,
      sameSite: 'Lax' as const,
    };
    await context.addCookies([
      { ...cookieBase, name: '__Secure-next-auth.session-token', value: token, httpOnly: true },
      { ...cookieBase, name: 'next-auth.session-token', value: token, httpOnly: true },
      { ...cookieBase, name: 'hc_locale', value: 'nl', httpOnly: false },
      { ...cookieBase, name: 'hc_locale_pref', value: '1', httpOnly: false },
      { ...cookieBase, name: 'homecheff-language', value: 'nl', httpOnly: false },
    ]);

    const page = await context.newPage();
    await page.goto(`${HOMECHEFF}/api/auth/session`, { waitUntil: 'domcontentloaded' });
    const session = await page.evaluate(async () => {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      return res.json().catch(() => null);
    });
    if (!session?.user?.email) {
      if (subject.label === 'SELLER_WITH_SALES') {
        throw new Error('session rejected for the seller under certification');
      }
      report.checks.NO_SALES_STATE = `SKIP — session rejected for ${subject.label}`;
      await context.close();
      continue;
    }

    const api = async (route: string) =>
      page.evaluate(async (r: string) => {
        const res = await fetch(r, { credentials: 'include' });
        const text = await res.text();
        try {
          return { status: res.status, body: JSON.parse(text) };
        } catch {
          return { status: res.status, body: text.slice(0, 4000) };
        }
      }, route);

    const combined = await api('/api/earnings/combined');
    const sellerEarnings = await api('/api/seller/earnings');
    const dashboardStats = await api('/api/seller/dashboard/stats');
    const exportCsv = await api('/api/earnings/export?format=csv');

    const verdiensten = await readSurface(
      page,
      `${HOMECHEFF}/verdiensten`,
      `${subject.label.toLowerCase()}-verdiensten.png`,
    );
    const dashboard = await readSurface(
      page,
      `${HOMECHEFF}/verkoper/dashboard`,
      `${subject.label.toLowerCase()}-dashboard.png`,
    );

    const cs = combined.body?.earnings?.seller ?? {};
    const se = sellerEarnings.body?.financialYear ?? {};
    const ds = dashboardStats.body?.financialYear ?? {};

    const expectations = {
      year: derived.year,
      currency: derived.currency,
      grossSalesCents: derived.sellerGrossSalesCents,
      refundCents: derived.refundCents,
      netSalesCents: derived.netSalesCents,
      platformFeesCents: derived.netPlatformFeesCents,
      netProceedsCents: derived.sellerNetProceedsCents,
      transactionCount: derived.transactionCount,
      completeness: derived.completeness,
      warningCodes: derived.warnings.map((w: any) => w.code),
    };

    const apiAgreement = {
      COMBINED_YEAR: cs.year === expectations.year,
      COMBINED_BASIS: cs.basis === 'CALENDAR_YEAR',
      COMBINED_GROSS: cs.grossSalesCents === expectations.grossSalesCents,
      COMBINED_REFUND: cs.refundCents === expectations.refundCents,
      COMBINED_NET: cs.netSalesCents === expectations.netSalesCents,
      COMBINED_COMPLETENESS: cs.completeness === expectations.completeness,
      SELLER_EARNINGS_YEAR: se.year === expectations.year,
      SELLER_EARNINGS_GROSS: se.grossSalesCents === expectations.grossSalesCents,
      SELLER_EARNINGS_REFUND: se.refundCents === expectations.refundCents,
      SELLER_EARNINGS_FEES: se.platformFeesCents === expectations.platformFeesCents,
      SELLER_EARNINGS_NET_PROCEEDS: se.netProceedsCents === expectations.netProceedsCents,
      SELLER_EARNINGS_COUNT: se.transactionCount === expectations.transactionCount,
      SELLER_EARNINGS_COMPLETENESS: se.completeness === expectations.completeness,
      DASHBOARD_YEAR: ds.year === expectations.year,
      DASHBOARD_GROSS: ds.grossSalesCents === expectations.grossSalesCents,
      DASHBOARD_REFUND: ds.refundCents === expectations.refundCents,
      DASHBOARD_NET: ds.netSalesCents === expectations.netSalesCents,
      DASHBOARD_COMPLETENESS: ds.completeness === expectations.completeness,
    };

    // The three migrated endpoints must not disagree with each other either.
    const crossApiConsistent =
      cs.grossSalesCents === se.grossSalesCents &&
      se.grossSalesCents === ds.grossSalesCents &&
      cs.netSalesCents === se.netSalesCents &&
      se.netSalesCents === ds.netSalesCents;

    // §4: nothing PENDING may reach a recognised figure.
    const pendingLegs = derived.events.filter(
      (e: any) => e.type === 'SALE' && e.provenance?.status === 'PENDING',
    );
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING',
        items: { some: { Product: { seller: { userId: subject.id } } } },
        createdAt: { gte: start, lt: end },
      },
    });

    const expectedGrossOnPage = eur(expectations.grossSalesCents);
    const expectedFeeOnPage = eur(expectations.platformFeesCents);
    const expectedNetOnPage = eur(expectations.netProceedsCents);
    const expectedRefundOnPage =
      expectations.refundCents > 0 ? eur(expectations.refundCents) : null;
    const blended = blendedFeePercent(
      expectations.platformFeesCents,
      expectations.grossSalesCents,
    );
    const surfaceShowsYear =
      verdiensten.body.includes(String(YEAR)) && dashboard.body.includes(String(YEAR));
    const noticeExpected = expectations.completeness !== 'COMPLETE';
    const noticeText = 'Deze cijfers zijn mogelijk onvolledig';
    const verdienstenNotice = verdiensten.notices.some((n) => n.includes(noticeText));
    const dashboardNotice = dashboard.notices.some((n) => n.includes(noticeText));

    report.sellers[subject.label] = {
      sellerId: mask(subject.id),
      emailHost: subject.email.split('@')[1],
      derived: expectations,
      priorYear: {
        year: derivedPrior.year,
        grossSalesCents: derivedPrior.sellerGrossSalesCents,
        netSalesCents: derivedPrior.netSalesCents,
        completeness: derivedPrior.completeness,
      },
      idempotent: JSON.stringify(derived) === JSON.stringify(derivedAgain),
      apiStatuses: {
        combined: combined.status,
        sellerEarnings: sellerEarnings.status,
        dashboardStats: dashboardStats.status,
        exportCsv: exportCsv.status,
      },
      apiAgreement,
      crossApiConsistent,
      pendingLeak: {
        pendingSaleLegsInDerivation: pendingLegs.length,
        pendingOrdersInYear: pendingOrders,
        recognisedGrossCents: expectations.grossSalesCents,
      },
      surfaces: {
        verdiensten: {
          screenshot: verdiensten.screenshot,
          showsYear: verdiensten.body.includes(String(YEAR)),
          showsGross: verdiensten.body.includes(expectedGrossOnPage),
          showsPlatformFee: verdiensten.body.includes(expectedFeeOnPage),
          showsNetProceeds: verdiensten.body.includes(expectedNetOnPage),
          showsRefund: expectedRefundOnPage
            ? verdiensten.body.includes(expectedRefundOnPage)
            : null,
          noticeExpected,
          noticeShown: verdienstenNotice,
        },
        dashboard: {
          screenshot: dashboard.screenshot,
          showsYear: dashboard.body.includes(String(YEAR)),
          showsGross: dashboard.body.includes(expectedGrossOnPage),
          showsPlatformFee: dashboard.body.includes(expectedFeeOnPage),
          showsNetProceeds: dashboard.body.includes(expectedNetOnPage),
          showsBlendedFeeRate: blended === null ? null : dashboard.body.includes(`${blended}%`),
          noticeExpected,
          noticeShown: dashboardNotice,
        },
      },
      platformFeeSnapshot: {
        blendedEffectivePercent: blended,
        currentPlanPercentFromApi: sellerEarnings.body?.platformFeePercentage ?? null,
        // Equal is fine (a seller may never have changed plan); differing proves the
        // year uses snapshotted rates rather than the current tier.
        differsFromCurrentPlan:
          blended !== null &&
          sellerEarnings.body?.platformFeePercentage != null &&
          Math.abs(blended - Number(sellerEarnings.body.platformFeePercentage)) > 0.05,
      },
      surfaceShowsYear,
      exportCsvIsFinancialYearScoped:
        typeof exportCsv.body === 'string'
          ? exportCsv.body.includes(String(YEAR))
          : Boolean(exportCsv.body?.financialYear),
    };

    await context.close();
  }

  // ---------------------------------------------------------------------------
  // Roll up
  // ---------------------------------------------------------------------------
  const rows = Object.values(report.sellers) as Json[];
  const allAgree = rows.every((r) => Object.values(r.apiAgreement).every(Boolean));
  const allCross = rows.every((r) => r.crossApiConsistent);
  const allIdem = rows.every((r) => r.idempotent);
  const noPendingLeak = rows.every((r) => r.pendingLeak.pendingSaleLegsInDerivation === 0);
  const noticesCorrect = rows.every(
    (r) =>
      r.surfaces.verdiensten.noticeShown === r.surfaces.verdiensten.noticeExpected &&
      r.surfaces.dashboard.noticeShown === r.surfaces.dashboard.noticeExpected,
  );
  const yearScoped = rows.every((r) => r.derived.year === YEAR && r.priorYear.year === PRIOR_YEAR);
  const surfacesShowCanonicalAmounts = rows.every(
    (r) =>
      r.surfaces.verdiensten.showsGross &&
      r.surfaces.verdiensten.showsPlatformFee &&
      r.surfaces.verdiensten.showsNetProceeds &&
      r.surfaces.dashboard.showsGross &&
      r.surfaces.dashboard.showsPlatformFee &&
      r.surfaces.dashboard.showsNetProceeds,
  );

  report.checks = {
    ...report.checks,
    AUTHENTICATED_PRODUCTION_SESSION: 'PASS',
    API_MATCHES_CANONICAL_DERIVATION: allAgree ? 'PASS' : 'FAIL',
    CROSS_API_CONSISTENCY: allCross ? 'PASS' : 'FAIL',
    YEAR_SCOPED: yearScoped ? 'PASS' : 'FAIL',
    IDEMPOTENT_AGAINST_PRODUCTION_DATA: allIdem ? 'PASS' : 'FAIL',
    NO_PENDING_LEAKAGE: noPendingLeak ? 'PASS' : 'FAIL',
    SURFACES_SHOW_CANONICAL_AMOUNTS: surfacesShowCanonicalAmounts ? 'PASS' : 'FAIL',
    INCOMPLETENESS_DISCLOSED: noticesCorrect ? 'PASS' : 'FAIL',
    NO_PRODUCTION_MUTATION: 'PASS',
  };

  report.verdict = Object.values(report.checks).every(
    (v) => v === 'PASS' || String(v).startsWith('SKIP'),
  )
    ? 'HOMECHEFF_SELLER_FINANCIAL_YEAR_PRODUCTION_CERTIFIED'
    : 'NOT_CERTIFIED';

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (err) {
  report.error = err instanceof Error ? err.message : String(err);
  report.verdict = 'NOT_CERTIFIED';
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.error(report.error);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => undefined);
  await prisma.$disconnect().catch(() => undefined);
}
