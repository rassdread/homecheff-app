/**
 * Production certification probe after delivery i18n + scheduled jobs fix.
 * Uses MediaCert seller + disposable delivery courier.
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'https://homecheff.eu';
const OUT = path.join('docs/audits/all-dashboards-cert', `run-${Date.now()}`);
const MEDIA_EMAIL = process.env.MEDIA_TEST_EMAIL || 'mediacert+homecheff@example.com';
const MEDIA_PASS = process.env.MEDIA_TEST_PASSWORD || 'MediaCert!2026Hc';

fs.mkdirSync(OUT, { recursive: true });

const report = {
  base: BASE,
  out: OUT,
  checks: {},
  blockers: [],
};

function set(key, value) {
  report.checks[key] = value;
  console.log(key, '=', typeof value === 'object' ? JSON.stringify(value) : value);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[name="email"], input[type="email"], input[name="emailOrUsername"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 60000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1500);
}

async function registerAndDeliverySignup(request) {
  const suffix = `${Date.now()}`;
  const email = `cert.dash.${suffix}@homecheff.test`;
  const password = 'CertDash!2026Hc';
  const username = `certdash${suffix}`.slice(0, 20);

  // Prefer register API; fall back to auth/register variants
  let reg = await request.post(`${BASE}/api/auth/register`, {
    data: {
      email,
      password,
      name: 'Cert Dashboard Courier',
      username,
      acceptTerms: true,
    },
  });
  if (!reg.ok()) {
    reg = await request.post(`${BASE}/api/register`, {
      data: {
        email,
        password,
        name: 'Cert Dashboard Courier',
        username,
      },
    });
  }
  set('COURIER_REGISTER', { status: reg.status(), ok: reg.ok() });
  if (!reg.ok()) return null;

  // Login via credentials to get cookies on context happens in page; here use API csrf
  const csrfRes = await request.get(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  await request.post(`${BASE}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email,
      password,
      emailOrUsername: email,
      callbackUrl: `${BASE}/delivery/dashboard`,
      json: 'true',
    },
  });

  const signup = await request.post(`${BASE}/api/delivery/signup`, {
    data: {
      providerType: 'INDEPENDENT',
      transportation: ['BIKE'],
      maxDistance: 10,
      bio: 'Cert probe courier',
    },
  });
  set('COURIER_SIGNUP', { status: signup.status(), ok: signup.ok(), body: (await signup.text()).slice(0, 200) });
  return { email, password, username };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedNet = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 500) failedNet.push(`${res.status()} ${res.url()}`);
  });

  // --- MediaCert seller path ---
  try {
    await login(page, MEDIA_EMAIL, MEDIA_PASS);
    for (const route of [
      '/mijn-homecheff',
      '/verkoper/dashboard',
      '/verkoper/orders',
      '/verkoper/analytics',
      '/verkoper/revenue',
      '/orders',
      '/verdiensten',
      '/operations/vandaag',
      '/profile/deals',
      '/messages',
    ]) {
      const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1200);
      const title = await page.title();
      const bodyText = await page.locator('body').innerText().catch(() => '');
      const orphanColon = (bodyText.match(/(^|\n)\s*:\s*(\n|$)/g) || []).length;
      const orphanCheck = (bodyText.match(/(^|\n)\s*[✓•]\s*(\n|$)/g) || []).length;
      const shot = path.join(OUT, `seller${route.replace(/\//g, '_') || '_home'}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      set(`PAGE_${route}`, {
        status: res?.status(),
        title,
        orphanColon,
        orphanCheck,
        blankish: bodyText.trim().length < 40,
        shot,
      });
    }

    // Chat open / send when conversation exists
    const convJson = await page.evaluate(async () => {
      const r = await fetch('/api/conversations', { cache: 'no-store' });
      return { status: r.status, data: await r.json() };
    });
    const conversations = convJson.data?.conversations || [];
    set('CONVERSATIONS_COUNT', conversations.length);
    if (conversations[0]?.id) {
      await page.goto(`${BASE}/messages?conversation=${conversations[0].id}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      const composer = page.locator('textarea, [contenteditable="true"], input[name="message"]').first();
      const composerVisible = await composer.isVisible().catch(() => false);
      set('CHAT_COMPOSER_VISIBLE', composerVisible);
      if (composerVisible) {
        await composer.fill(`cert-ping ${Date.now()}`);
        const send = page.locator('button[type="submit"], button:has-text("Verstuur"), button:has-text("Send")').first();
        if (await send.isVisible().catch(() => false)) {
          await send.click();
          await page.waitForTimeout(1500);
          set('CHAT_SEND', 'ATTEMPTED');
        } else {
          set('CHAT_SEND', 'NO_SEND_BUTTON');
        }
      }
      await page.screenshot({ path: path.join(OUT, 'chat-open.png'), fullPage: true });
      set('CHAT_CONVERSATION_OPEN', 'PASS');
    } else {
      set('CHAT_CONVERSATION_OPEN', 'NOT_TESTABLE_NO_CONVERSATIONS');
      set('CHAT_SEND', 'NOT_TESTABLE_NO_CONVERSATIONS');
    }
  } catch (e) {
    set('SELLER_PATH_ERROR', String(e));
    report.blockers.push(`seller path: ${e}`);
  }

  // --- Disposable courier for delivery settings visual ---
  try {
    const courier = await registerAndDeliverySignup(context.request);
    if (!courier) {
      set('DELIVERY_SETTINGS_CONTENT', 'NOT_TESTABLE_REGISTER_FAILED');
      report.blockers.push('Could not register disposable courier');
    } else {
      const cPage = await context.newPage();
      await login(cPage, courier.email, courier.password);
      await cPage.goto(`${BASE}/delivery/settings`, { waitUntil: 'networkidle', timeout: 90000 });
      await cPage.waitForTimeout(2500);
      const text = await cPage.locator('body').innerText();
      const hasActive = text.includes('Actief als bezorger') || text.includes('Active as deliverer');
      const hasHow = text.includes('Hoe het werkt') || text.includes('How it works');
      const hasRadius = text.includes('Bezorgstraal') || text.includes('Delivery radius') || text.includes('km');
      const orphanColon = (text.match(/(^|\n)\s*:\s*(\n|$)/g) || []).length;
      const orphanBullet = (text.match(/(^|\n)\s*[✓•]\s*(\n|$)/g) || []).length;
      await cPage.screenshot({ path: path.join(OUT, 'delivery-settings-desktop.png'), fullPage: true });
      await cPage.setViewportSize({ width: 390, height: 844 });
      await cPage.waitForTimeout(800);
      await cPage.screenshot({ path: path.join(OUT, 'delivery-settings-portrait.png'), fullPage: true });
      await cPage.setViewportSize({ width: 844, height: 390 });
      await cPage.waitForTimeout(800);
      await cPage.screenshot({ path: path.join(OUT, 'delivery-settings-landscape.png'), fullPage: true });

      set('DELIVERY_SETTINGS_CONTENT', hasActive && hasHow && orphanColon === 0 ? 'PASS' : 'FAIL');
      set('DELIVERY_SETTINGS_I18N', hasActive && hasHow ? 'PASS' : 'FAIL');
      set('DELIVERY_SETTINGS_ORPHANS', { orphanColon, orphanBullet });
      set('DELIVERY_SETTINGS_HAS_RADIUS', hasRadius);

      await cPage.setViewportSize({ width: 1440, height: 900 });
      await cPage.goto(`${BASE}/delivery/dashboard`, { waitUntil: 'networkidle', timeout: 90000 });
      await cPage.waitForTimeout(2000);
      const dashText = await cPage.locator('body').innerText();
      const hasScheduled = dashText.includes('Geplande bezorgingen') || dashText.includes('Scheduled deliveries');
      await cPage.screenshot({ path: path.join(OUT, 'delivery-dashboard-desktop.png'), fullPage: true });
      set('DELIVERY_BOOKING_JOBS_UI', hasScheduled ? 'PASS' : 'FAIL');

      const api = await cPage.evaluate(async () => {
        const r = await fetch('/api/delivery/dashboard', { cache: 'no-store' });
        const j = await r.json();
        return {
          status: r.status,
          upcoming: Array.isArray(j.upcomingJobs),
          pending: Array.isArray(j.pendingBookingRequests),
          scheduledStat: j.stats?.scheduledJobs,
          onlineMeasured: j.stats?.onlineTimeMeasured,
        };
      });
      set('DELIVERY_BOOKING_JOBS_API', api.upcoming && api.pending ? 'PASS' : 'FAIL');
      set('DELIVERY_API_SHAPE', api);
      await cPage.close();
    }
  } catch (e) {
    set('DELIVERY_PATH_ERROR', String(e));
    report.blockers.push(`delivery path: ${e}`);
  }

  report.consoleErrors = consoleErrors.slice(0, 30);
  report.failedNetwork = failedNet.slice(0, 30);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('REPORT', path.join(OUT, 'report.json'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
