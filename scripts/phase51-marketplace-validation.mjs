/**
 * Phase 5.1 — Production marketplace functional regression probe.
 * Creates a disposable buyer account, validates auth + discovery + gated surfaces.
 * Does not complete live Stripe payment.
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.PROD_URL || 'https://homecheff.eu';
const outDir = 'docs/audits/wx-phase51-marketplace-validation';
const shotDir = path.join(outDir, 'screenshots');
fs.mkdirSync(shotDir, { recursive: true });

const suffix = Date.now().toString(36);
const email = `phase51+buyer.${suffix}@homecheff-validation.test`;
const password = 'Phase51Validate!Only';
const username = `p51buy_${suffix}`.slice(0, 28);

const evidence = {
  at: new Date().toISOString(),
  base,
  commitHint: process.env.GIT_SHA || null,
  account: { email, username },
  http: [],
  auth: {},
  discovery: {},
  gated: {},
  browser: [],
  regressions: [],
};

async function http(pathname, opts = {}) {
  const t0 = Date.now();
  const url = pathname.startsWith('http') ? pathname : `${base}${pathname}`;
  const res = await fetch(url, {
    redirect: 'follow',
    ...opts,
    headers: {
      'user-agent': 'HomeCheff-Phase51-Validation',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  const row = {
    path: pathname,
    status: res.status,
    ms: Date.now() - t0,
    bytes: text.length,
    final: res.url,
  };
  evidence.http.push(row);
  return { res, text, row };
}

async function main() {
  // Public surfaces
  for (const p of [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/sell',
    '/messages',
    '/delivery',
    '/affiliate',
    '/profile',
    '/notifications',
    '/orders',
    '/favorites',
  ]) {
    await http(p);
  }

  const products = await http('/api/products?limit=8');
  let productJson = null;
  try {
    productJson = JSON.parse(products.text);
  } catch {
    evidence.regressions.push({
      severity: 'P1',
      area: 'discovery',
      note: 'products API non-JSON',
    });
  }
  evidence.discovery.productsStatus = products.row.status;
  evidence.discovery.itemCount = Array.isArray(productJson?.items)
    ? productJson.items.length
    : productJson?.products?.length ?? null;
  evidence.discovery.sampleTitles = (productJson?.items || productJson?.products || [])
    .slice(0, 3)
    .map((i) => i.title);

  const flags = await http('/api/delivery/alignment-flags');
  evidence.discovery.flags = (() => {
    try {
      return JSON.parse(flags.text);
    } catch {
      return null;
    }
  })();

  const providers = await http('/api/auth/providers');
  evidence.auth.providers = (() => {
    try {
      return Object.keys(JSON.parse(providers.text));
    } catch {
      return [];
    }
  })();

  // Register disposable buyer
  const regBody = {
    email,
    password,
    firstName: 'Phase51',
    lastName: 'Buyer',
    username,
    selectedBuyerType: 'CONSUMER',
    interests: ['CHEFF'],
    location: { lat: 52.37, lng: 4.89, place: 'Amsterdam' },
  };
  const reg = await http('/api/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(regBody),
  });
  evidence.auth.registerStatus = reg.row.status;
  evidence.auth.registerBody = reg.text.slice(0, 300);

  // CSRF + credentials login
  const csrfRes = await http('/api/auth/csrf');
  let csrfToken = null;
  try {
    csrfToken = JSON.parse(csrfRes.text).csrfToken;
  } catch {
    /* ignore */
  }
  const cookieJar = [];
  const collectCookies = (res) => {
    const raw = res.headers.getSetCookie?.() || [];
    for (const c of raw) cookieJar.push(c.split(';')[0]);
  };
  // Node fetch may not expose getSetCookie on all versions — use cookie from login response via playwright later
  evidence.auth.csrfPresent = Boolean(csrfToken);

  const loginForm = new URLSearchParams({
    csrfToken: csrfToken || '',
    emailOrUsername: email,
    password,
    json: 'true',
    redirect: 'false',
    callbackUrl: `${base}/`,
  });
  const login = await fetch(`${base}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'HomeCheff-Phase51-Validation',
    },
    body: loginForm.toString(),
    redirect: 'manual',
  });
  const setCookie = typeof login.headers.getSetCookie === 'function'
    ? login.headers.getSetCookie()
    : [];
  const sessionCookie = setCookie
    .map((c) => c.split(';')[0])
    .filter((c) => c.includes('session-token') || c.includes('next-auth'))
    .join('; ');
  evidence.auth.loginStatus = login.status;
  evidence.auth.loginHasSessionCookie = Boolean(sessionCookie);
  evidence.auth.loginBody = (await login.text()).slice(0, 200);

  const authed = async (pathname) => {
    const t0 = Date.now();
    const res = await fetch(`${base}${pathname}`, {
      headers: {
        cookie: sessionCookie,
        'user-agent': 'HomeCheff-Phase51-Validation',
      },
      redirect: 'follow',
    });
    const text = await res.text();
    const row = {
      path: pathname,
      status: res.status,
      ms: Date.now() - t0,
      bytes: text.length,
      authed: true,
    };
    evidence.gated[pathname] = row;
    return { res, text, row };
  };

  if (sessionCookie) {
    await authed('/api/auth/session');
    await authed('/api/profile/me');
    await authed('/api/notifications');
    await authed('/orders');
    await authed('/messages');
    await authed('/sell');
    await authed('/notifications');
    await authed('/profile');
  } else {
    evidence.regressions.push({
      severity: 'P1',
      area: 'account',
      note: 'Credentials login did not return session cookie via fetch (may need browser cookie jar)',
    });
  }

  // Forgot-password endpoint (should not leak; expect 200/ok even for unknown)
  const forgot = await http('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  evidence.auth.forgotPasswordStatus = forgot.row.status;
  evidence.auth.forgotPasswordBody = forgot.text.slice(0, 200);

  // Browser matrix
  const playwright = await import('playwright');
  const viewports = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    phone: { width: 390, height: 844 },
    landscape: { width: 844, height: 390 },
  };

  async function shot(name, pagePath, vp, doLogin = false) {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: viewports[vp] });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 180));
    });
    const t0 = Date.now();
    let status = 0;
    try {
      const resp = await page.goto(`${base}${pagePath}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      status = resp?.status() ?? 0;
      if (doLogin) {
        await page.waitForTimeout(1000);
        const emailSel = '#emailOrUsername, input[name="emailOrUsername"]';
        if (await page.locator(emailSel).first().isVisible({ timeout: 5000 }).catch(() => false)) {
          await page.locator(emailSel).first().fill(email);
          await page.locator('input[name="password"], input[type="password"]').first().fill(password);
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null),
            page.locator('button[type="submit"]').first().click(),
          ]);
          await page.waitForTimeout(2500);
        }
      }
      await page.waitForTimeout(1500);
      const file = path.join(shotDir, `${name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      const body = (await page.locator('body').innerText().catch(() => ''))
        .replace(/\s+/g, ' ')
        .slice(0, 200);
      const clipped = await page.evaluate(() => {
        const bad = [];
        for (const el of document.querySelectorAll('button, a, input, [role="button"]')) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > window.innerWidth + 2 || r.bottom > window.innerHeight + 80)) {
            bad.push((el.innerText || el.getAttribute('aria-label') || el.tagName).slice(0, 40));
          }
        }
        return bad.slice(0, 5);
      });
      evidence.browser.push({
        name,
        status,
        ms: Date.now() - t0,
        url: page.url().split('?')[0],
        bodyPreview: body,
        consoleErrors: consoleErrors.filter((e) => !e.includes('vercel.live')).slice(0, 5),
        clippedControls: clipped,
        screenshot: file,
        loggedInHint: !page.url().includes('/login'),
      });
    } catch (e) {
      evidence.browser.push({ name, error: String(e).slice(0, 250) });
    }
    await browser.close();
  }

  // Public responsive
  await shot('desktop-home', '/', 'desktop');
  await shot('tablet-home', '/', 'tablet');
  await shot('phone-home', '/', 'phone');
  await shot('landscape-home', '/', 'landscape');
  await shot('desktop-login', '/login', 'desktop');
  await shot('desktop-register', '/register', 'desktop');
  await shot('phone-feed', '/?mode=discover', 'phone');
  await shot('desktop-forgot', '/forgot-password', 'desktop');

  // Authenticated browser journey
  await shot('auth-login-desktop', '/login', 'desktop', true);
  // After login, capture key surfaces in one session
  {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: viewports.desktop });
    const page = await context.newPage();
    await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    const emailSel = '#emailOrUsername, input[name="emailOrUsername"]';
    let loggedIn = false;
    if (await page.locator(emailSel).first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.locator(emailSel).first().fill(email);
      await page.locator('input[name="password"], input[type="password"]').first().fill(password);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null),
        page.locator('button[type="submit"]').first().click(),
      ]);
      await page.waitForTimeout(3000);
      const session = await page.request.get(`${base}/api/auth/session`).then((r) => r.json()).catch(() => null);
      loggedIn = Boolean(session?.user?.email);
      evidence.auth.browserSessionEmail = session?.user?.email || null;
    }
    evidence.auth.browserLoggedIn = loggedIn;
    for (const [name, p] of [
      ['auth-profile', '/profile'],
      ['auth-messages', '/messages'],
      ['auth-orders', '/orders'],
      ['auth-notifications', '/notifications'],
      ['auth-sell', '/sell'],
      ['auth-favorites', '/favorites'],
      ['auth-delivery', '/delivery'],
    ]) {
      try {
        const t0 = Date.now();
        const resp = await page.goto(`${base}${p}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(1800);
        const file = path.join(shotDir, `${name}.png`);
        await page.screenshot({ path: file, fullPage: false });
        evidence.browser.push({
          name,
          status: resp?.status() ?? 0,
          ms: Date.now() - t0,
          url: page.url().split('?')[0],
          loggedIn,
          screenshot: file,
          bodyPreview: (await page.locator('body').innerText().catch(() => ''))
            .replace(/\s+/g, ' ')
            .slice(0, 180),
        });
      } catch (e) {
        evidence.browser.push({ name, error: String(e).slice(0, 200), loggedIn });
      }
    }
    // Phone auth spot
    await page.setViewportSize(viewports.phone);
    try {
      const resp = await page.goto(`${base}/messages`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);
      const file = path.join(shotDir, 'auth-messages-phone.png');
      await page.screenshot({ path: file, fullPage: false });
      evidence.browser.push({
        name: 'auth-messages-phone',
        status: resp?.status() ?? 0,
        loggedIn,
        screenshot: file,
      });
    } catch (e) {
      evidence.browser.push({ name: 'auth-messages-phone', error: String(e).slice(0, 200) });
    }
    await browser.close();
  }

  // Summaries / heuristics
  const httpFail = evidence.http.filter((h) => h.status >= 500);
  if (httpFail.length) {
    evidence.regressions.push({
      severity: 'P0',
      area: 'http',
      note: `5xx on ${httpFail.map((h) => h.path).join(', ')}`,
    });
  }
  if (!evidence.auth.providers.includes('credentials')) {
    evidence.regressions.push({
      severity: 'P0',
      area: 'account',
      note: 'credentials provider missing',
    });
  }
  if (!evidence.auth.providers.includes('google')) {
    evidence.regressions.push({
      severity: 'P2',
      area: 'account',
      note: 'google provider missing',
    });
  }
  if (evidence.discovery.itemCount === 0) {
    evidence.regressions.push({
      severity: 'P1',
      area: 'discovery',
      note: 'feed returned zero items',
    });
  }
  if (evidence.auth.registerStatus >= 400) {
    evidence.regressions.push({
      severity: 'P0',
      area: 'account',
      note: `register failed ${evidence.auth.registerStatus}: ${evidence.auth.registerBody}`,
    });
  }
  if (evidence.auth.browserLoggedIn === false) {
    evidence.regressions.push({
      severity: 'P0',
      area: 'account',
      note: 'browser credentials login failed for disposable user',
    });
  }

  const consoleHeavy = evidence.browser.filter((b) => (b.consoleErrors || []).length > 0);
  if (consoleHeavy.length) {
    evidence.regressions.push({
      severity: 'P2',
      area: 'responsive',
      note: `console errors on ${consoleHeavy.map((b) => b.name).join(', ')}`,
    });
  }

  evidence.ok =
    evidence.auth.registerStatus < 400 &&
    evidence.auth.browserLoggedIn === true &&
    httpFail.length === 0 &&
    (evidence.discovery.productsStatus || 0) < 400;

  fs.writeFileSync(path.join(outDir, 'evidence.json'), JSON.stringify(evidence, null, 2));
  console.log(
    JSON.stringify(
      {
        ok: evidence.ok,
        registerStatus: evidence.auth.registerStatus,
        browserLoggedIn: evidence.auth.browserLoggedIn,
        products: evidence.discovery.itemCount,
        providers: evidence.auth.providers,
        regressions: evidence.regressions,
        browserCount: evidence.browser.length,
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
