/**
 * Phase 4.2 authenticated browser proof (Preview SSO bypass).
 * Uses NextAuth credentials via emailOrUsername + password.
 */
import fs from 'node:fs';
import path from 'node:path';

const bypass = fs.existsSync('/tmp/hc4-bypass.secret')
  ? fs.readFileSync('/tmp/hc4-bypass.secret', 'utf8').trim()
  : process.env.VERCEL_PROTECTION_BYPASS || '';
const base =
  process.env.PREVIEW_DEPLOY_URL ||
  'https://homecheff-app-git-wx-phase-1c-c349dd-sergio-s-projects-f7b64ee1.vercel.app';
const outDir = 'docs/audits/wx-phase42-final-readiness/screenshots';
fs.mkdirSync(outDir, { recursive: true });

const password = process.env.PHASE42_PASSWORD || 'Phase4Preview!Only';
const users = {
  buyer: process.env.PHASE42_BUYER_EMAIL || 'dm-phase4+buyer.msf6bfo2@example.test',
  seller: process.env.PHASE42_SELLER_EMAIL || 'dm-phase42+seller.msf801w0@example.test',
  affiliate: process.env.PHASE42_AFF_EMAIL || 'dm-phase42+aff.msf801w0@example.test',
  courier: process.env.PHASE42_COURIER_EMAIL || 'dm-phase41+courier.msf6zgys@example.test',
  biz: process.env.PHASE42_BIZ_EMAIL || 'dm-phase41+biz.msf6zgys@example.test',
};

function withBypass(pagePath) {
  const joiner = pagePath.includes('?') ? '&' : '?';
  return `${base}${pagePath}${joiner}x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
}

async function loginWithCredentials(page, email) {
  await page.goto(withBypass('/login'), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  // Dismiss feed baseline overlay if present
  const closeBtn = page.locator('button:has-text("×"), [aria-label="Close"], button:has-text("Close")').first();
  if (await closeBtn.isVisible({ timeout: 800 }).catch(() => false)) {
    await closeBtn.click().catch(() => {});
  }
  const emailSel = '#emailOrUsername, input[name="emailOrUsername"]';
  const passSel = 'input[name="password"], input[type="password"]';
  await page.locator(emailSel).first().waitFor({ timeout: 10000 });
  await page.locator(emailSel).first().fill(email);
  await page.locator(passSel).first().fill(password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForTimeout(2500);
  // Prefer network session check after navigation settles
  const sessionResp = await page.request.get(`${base}/api/auth/session`, {
    headers: { 'x-vercel-protection-bypass': bypass },
  });
  const session = await sessionResp.json().catch(() => null);
  return Boolean(session?.user?.email);
}

async function shot(page, name, pagePath, extra = {}) {
  const t0 = Date.now();
  const consoleErrors = [];
  const onConsole = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  };
  page.on('console', onConsole);
  const resp = await page.goto(withBypass(pagePath), {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(extra.waitMs || 2000);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const title = await page.title();
  const body = (await page.locator('body').innerText().catch(() => ''))
    .replace(/\s+/g, ' ')
    .slice(0, 220);
  const gpsLeak = /52\.\d{4,}|4\.89\d{2,}/.test(body);
  page.off('console', onConsole);
  return {
    name,
    status: resp?.status() ?? 0,
    title,
    elapsedMs: Date.now() - t0,
    gpsLeak,
    consoleErrors: consoleErrors
      .filter((e) => !e.includes('vercel.live'))
      .slice(0, 5),
    bodyPreview: body,
    screenshot: file,
    url: page.url().split('?')[0],
    ...extra.meta,
  };
}

async function main() {
  const playwright = await import('playwright');
  const results = [];
  const viewports = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    phone: { width: 390, height: 844 },
    landscape: { width: 844, height: 390 },
  };

  // Public / responsive surfaces
  for (const [name, pagePath, vp] of [
    ['desktop-home', '/', 'desktop'],
    ['tablet-home', '/', 'tablet'],
    ['phone-home', '/', 'phone'],
    ['landscape-home', '/', 'landscape'],
    ['desktop-login', '/login', 'desktop'],
    ['phone-login', '/login', 'phone'],
    ['desktop-register', '/register', 'desktop'],
    ['desktop-feed', '/?mode=discover', 'desktop'],
    ['phone-feed', '/?mode=discover', 'phone'],
    ['desktop-affiliate-marketing', '/affiliate', 'desktop'],
    ['desktop-delivery-marketing', '/delivery', 'desktop'],
  ]) {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: viewports[vp],
      extraHTTPHeaders: {
        'x-vercel-protection-bypass': bypass,
        'x-vercel-set-bypass-cookie': 'true',
      },
    });
    const page = await context.newPage();
    try {
      results.push(await shot(page, name, pagePath));
    } catch (e) {
      results.push({ name, error: String(e).slice(0, 300) });
    }
    await browser.close();
  }

  // Authenticated journeys per role
  const roles = [
    {
      key: 'buyer',
      email: users.buyer,
      pages: [
        ['auth-buyer-login', '/login'],
        ['auth-buyer-feed', '/?mode=discover'],
        ['auth-buyer-orders', '/orders'],
        ['auth-buyer-profile', '/profile'],
        ['auth-buyer-notifications', '/notifications'],
        ['auth-buyer-messages', '/messages'],
      ],
    },
    {
      key: 'seller',
      email: users.seller,
      pages: [
        ['auth-seller-sell', '/sell'],
        ['auth-seller-profile', '/profile'],
        ['auth-seller-subscription', '/subscription'],
      ],
    },
    {
      key: 'courier',
      email: users.courier,
      pages: [
        ['auth-courier-delivery', '/delivery'],
        ['auth-courier-calendar', '/delivery/calendar'],
      ],
    },
    {
      key: 'biz',
      email: users.biz,
      pages: [
        ['auth-biz-delivery', '/delivery'],
        ['auth-biz-dashboard', '/delivery/business'],
      ],
    },
    {
      key: 'affiliate',
      email: users.affiliate,
      pages: [
        ['auth-affiliate-dashboard', '/affiliate/dashboard'],
        ['auth-affiliate-earnings', '/affiliate/earnings'],
      ],
    },
  ];

  for (const role of roles) {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: viewports.desktop,
      extraHTTPHeaders: {
        'x-vercel-protection-bypass': bypass,
        'x-vercel-set-bypass-cookie': 'true',
      },
    });
    const page = await context.newPage();
    let loggedIn = false;
    try {
      loggedIn = await loginWithCredentials(page, role.email);
      results.push({
        name: `login-${role.key}`,
        loggedIn,
        email: role.email,
        url: page.url().split('?')[0],
      });
    } catch (e) {
      results.push({
        name: `login-${role.key}`,
        loggedIn: false,
        error: String(e).slice(0, 300),
      });
    }
    if (loggedIn) {
      for (const [name, pagePath] of role.pages) {
        try {
          results.push(
            await shot(page, name, pagePath, { meta: { loggedIn: true, role: role.key } })
          );
        } catch (e) {
          results.push({ name, error: String(e).slice(0, 200), loggedIn, role: role.key });
        }
      }
    }
    // Phone + landscape spot checks for buyer only
    if (role.key === 'buyer' && loggedIn) {
      for (const [vp, label] of [
        ['phone', 'phone'],
        ['landscape', 'landscape'],
      ]) {
        await page.setViewportSize(viewports[vp]);
        try {
          results.push(
            await shot(page, `auth-buyer-feed-${label}`, '/?mode=discover', {
              meta: { loggedIn: true, role: 'buyer', viewport: label },
            })
          );
        } catch (e) {
          results.push({ name: `auth-buyer-feed-${label}`, error: String(e).slice(0, 200) });
        }
      }
    }
    await browser.close();
  }

  const loginResults = results.filter((r) => r.name?.startsWith('login-'));
  const authOk = loginResults.filter((r) => r.loggedIn).length;
  const payload = {
    ok: results.every((r) => !r.error && (r.status === undefined || r.status < 400)),
    bypassUsed: Boolean(bypass),
    authenticatedLogins: authOk,
    loginAttempts: loginResults.length,
    results,
  };
  fs.writeFileSync(
    'docs/audits/wx-phase42-final-readiness/browser-proof.json',
    JSON.stringify(payload, null, 2)
  );
  console.log(
    JSON.stringify(
      {
        ok: payload.ok,
        authenticatedLogins: authOk,
        loginAttempts: loginResults.length,
        sample: results.slice(0, 3),
        logins: loginResults,
        authSurfaces: results.filter((r) => r.loggedIn).map((r) => r.name),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
