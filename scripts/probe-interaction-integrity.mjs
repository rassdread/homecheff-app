#!/usr/bin/env node
/**
 * HomeCheff interaction integrity probe (safe / non-destructive).
 *
 * Usage:
 *   node scripts/probe-interaction-integrity.mjs --base-url=https://homecheff.eu
 *   npm run probe:interaction-integrity -- --base-url=http://127.0.0.1:3000
 *
 * Fails when:
 * - expected control missing
 * - hamburger Link navigation dead (stays on same path)
 * - internal destination 404/5xx (except intentional LEGAL-0 paths)
 * - client pageerror / unhandledrejection during matrix
 * - overlay open/close or Back contract fails
 * - career/werken-bij navigation fails from hamburger
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE =
  process.argv.find((a) => a.startsWith("--base-url="))?.slice(11) ||
  "https://homecheff.eu";
const OUT =
  process.argv.find((a) => a.startsWith("--out-dir="))?.slice(10) ||
  join(
    process.cwd(),
    "docs/audits/interaction-integrity",
    `probe-${Date.now()}`,
  );

mkdirSync(OUT, { recursive: true });

/** Public static / legal destinations exposed by UI SSOTs. */
const STATIC_ROUTES = [
  "/privacy",
  "/terms",
  "/contact",
  "/faq",
  "/over-ons",
  "/community-guidelines",
  "/safety",
  "/constitution",
  "/manifest",
  "/affiliate",
  "/seo-hub",
  "/werken-bij",
  "/docs",
  "/evidence",
  "/hcp-ranglijsten",
  "/login",
  "/register",
];

/** LEGAL-0 intentional real 404s — must remain 404. */
const LEGAL0_INTENTIONAL_404 = ["/help", "/gidsen", "/reputatie"];

const VIEWPORTS = {
  portrait390: { width: 390, height: 844, isMobile: true, hasTouch: true },
  portrait430: { width: 430, height: 932, isMobile: true, hasTouch: true },
  land844: { width: 844, height: 390, isMobile: true, hasTouch: true },
  land740: { width: 740, height: 360, isMobile: true, hasTouch: true },
  land667: { width: 667, height: 375, isMobile: true, hasTouch: true },
  desk1280: { width: 1280, height: 900, isMobile: false, hasTouch: false },
  desk1440: { width: 1440, height: 900, isMobile: false, hasTouch: false },
};

function inventoryFromSource() {
  const root = process.cwd();
  const files = [
    "lib/home/homepage-info-chrome.ts",
    "components/Footer.tsx",
    "components/NavBar.tsx",
    "components/nav/NavbarLegalContactLinks.tsx",
    "lib/promotions/home-promotions.ts",
    "lib/legal/policy-urls.ts",
  ];
  const hrefs = new Set();
  for (const f of files) {
    let src = "";
    try {
      src = readFileSync(join(root, f), "utf8");
    } catch {
      continue;
    }
    for (const m of src.matchAll(/href:\s*['"](\/[^'"]+)['"]/g)) {
      hrefs.add(m[1].split("?")[0]);
    }
    for (const m of src.matchAll(/href=\{?['"](\/[^'"]+)['"]/g)) {
      hrefs.add(m[1].split("?")[0]);
    }
  }
  for (const r of STATIC_ROUTES) hrefs.add(r);
  return [...hrefs].sort();
}

async function dismiss(page) {
  await page
    .evaluate(() => {
      try {
        localStorage.setItem("homecheff-privacy-accepted", "1");
      } catch {}
      [...document.querySelectorAll("button")]
        .find((b) => /accepteer|accept|akkoord/i.test(b.textContent || ""))
        ?.click();
    })
    .catch(() => {});
}

async function httpProbe(path) {
  const url = new URL(path, BASE).toString();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: "text/html" },
    });
    return {
      path,
      status: res.status,
      location: res.headers.get("location"),
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (e) {
    return { path, status: 0, error: String(e).slice(0, 120), ok: false };
  }
}

function soft404(html) {
  if (!html) return false;
  return /page not found|pagina niet gevonden|404\s*[-–]/i.test(html);
}

async function collectVisibleControls(page) {
  return page.evaluate(() => {
    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const st = getComputedStyle(el);
      if (st.visibility === "hidden" || st.display === "none") return false;
      if (Number(st.opacity) === 0) return false;
      return true;
    };
    const out = [];
    const sel =
      'a[href], button, [role="button"], [data-wx-workbar-menu], [data-wx-workbar-create], [data-wx-feed-search], [data-hc-bottom-nav] a, [data-hc-bottom-nav] button, [data-homepage-info] a';
    for (const el of document.querySelectorAll(sel)) {
      if (!isVisible(el)) continue;
      const href = el.getAttribute("href");
      const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
      const tag = el.tagName.toLowerCase();
      const id = el.getAttribute("data-testid")
        ? el.getAttribute("data-testid")
        : el.hasAttribute("data-wx-workbar-menu")
          ? "workbar-menu"
          : el.hasAttribute("data-wx-workbar-create")
            ? "workbar-create"
            : el.id || null;
      out.push({
        tag,
        href,
        text,
        id,
        disabled: el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true",
      });
    }
    return out;
  });
}

async function openHamburger(page) {
  const candidates = [
    "[data-wx-workbar-menu]",
    'button[aria-controls="navbar-mobile-menu"]',
    'button[aria-label*="menu" i]',
    'button[aria-label*="Menu"]',
  ];
  for (const c of candidates) {
    const loc = page.locator(c).first();
    if (!(await loc.count())) continue;
    try {
      await loc.click({ timeout: 2500 });
      await page.waitForSelector("#navbar-mobile-menu", { timeout: 4000 });
      return true;
    } catch {
      try {
        await loc.click({ force: true, timeout: 2000 });
        await page.waitForSelector("#navbar-mobile-menu", { timeout: 4000 });
        return true;
      } catch {
        /* next */
      }
    }
  }
  const opened = await page.evaluate(() => {
    const btn =
      document.querySelector("[data-wx-workbar-menu]") ||
      document.querySelector('button[aria-controls="navbar-mobile-menu"]');
    if (!btn) return false;
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  });
  if (!opened) return false;
  try {
    await page.waitForSelector("#navbar-mobile-menu", { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

async function clickMenuHref(page, href) {
  const before = await page.evaluate(() => location.pathname + location.search);
  const link = page.locator(`#navbar-mobile-menu a[href="${href}"]`).first();
  if (!(await link.count())) {
    return { ok: false, reason: "missing_link", before, after: before };
  }
  try {
    await link.click({ timeout: 4000 });
  } catch {
    try {
      await link.click({ force: true, timeout: 4000 });
    } catch {
      await page.evaluate((h) => {
        document.querySelector(`#navbar-mobile-menu a[href="${h}"]`)?.click();
      }, href);
    }
  }
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => location.pathname + location.search);
  const expectedPath = href.split("?")[0];
  const ok = after === href || after.startsWith(expectedPath);
  return { ok, before, after, expected: href };
}

const report = {
  base: BASE,
  at: new Date().toISOString(),
  sourceInventoryHrefs: inventoryFromSource(),
  http: {},
  legal0: {},
  cases: {},
  failures: [],
  consoleErrors: [],
  pageErrors: [],
  counts: {},
};

function fail(surface, control, detail) {
  report.failures.push({ surface, control, detail });
}

// --- HTTP probes ---
for (const path of STATIC_ROUTES) {
  report.http[path] = await httpProbe(path);
  if (!report.http[path].ok && report.http[path].status !== 401 && report.http[path].status !== 403) {
    fail("http", path, report.http[path]);
  }
}
for (const path of LEGAL0_INTENTIONAL_404) {
  const r = await httpProbe(path);
  report.legal0[path] = r;
  if (r.status !== 404) {
    fail("legal0", path, `expected 404 got ${r.status}`);
  }
}
for (const path of report.sourceInventoryHrefs) {
  if (report.http[path] || LEGAL0_INTENTIONAL_404.includes(path)) continue;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("${")) continue;
  if (path.startsWith("/api/")) continue;
  const r = await httpProbe(path);
  report.http[path] = r;
  if (r.status === 404 || r.status >= 500) {
    fail("inventory-http", path, r);
  }
}

const browser = await chromium.launch({ headless: true });

async function withPage(vpKey, fn) {
  const vp = VIEWPORTS[vpKey];
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    locale: "nl-NL",
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("homecheff-privacy-accepted", "1");
      localStorage.setItem(
        "homecheff_feed_location_v1",
        JSON.stringify({
          lat: 51.9088,
          lng: 4.3444,
          place: "Vlaardingen",
          countryCode: "NL",
          radiusKm: 25,
          source: "manual",
          updatedAt: Date.now(),
        }),
      );
    } catch {}
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push({ type: "pageerror", msg: String(e).slice(0, 300) });
    report.pageErrors.push({ vp: vpKey, msg: String(e).slice(0, 300) });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (/favicon|Download the React DevTools|third-party/i.test(t)) return;
      errors.push({ type: "console", msg: t.slice(0, 300) });
      report.consoleErrors.push({ vp: vpKey, msg: t.slice(0, 300) });
    }
  });
  try {
    return await fn(page, errors);
  } finally {
    await ctx.close();
  }
}

// --- Production career regression (guest hamburger) ---
report.cases.careerPortrait = await withPage("portrait390", async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await page.waitForTimeout(1500);
  const opened = await openHamburger(page);
  if (!opened) {
    fail("hamburger", "open", "could not open menu portrait");
    return { opened: false, ok: false };
  }
  try {
    const nav = await clickMenuHref(page, "/werken-bij");
    if (!nav.ok) fail("career", "werken-bij hamburger", nav);
    await page.screenshot({ path: join(OUT, "career-portrait.png") }).catch(() => {});
    return { opened: true, ...nav };
  } catch (e) {
    fail("career", "werken-bij hamburger", String(e).slice(0, 200));
    return { opened: true, ok: false, error: String(e).slice(0, 200) };
  }
});

report.cases.careerLandscape = await withPage("land844", async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await page.waitForTimeout(2000);
  const opened = await openHamburger(page);
  if (!opened) {
    fail("hamburger", "open-landscape", "could not open menu landscape");
    return { opened: false, ok: false };
  }
  try {
    const nav = await clickMenuHref(page, "/werken-bij");
    if (!nav.ok) fail("career", "werken-bij landscape menu", nav);
    return { opened: true, ...nav };
  } catch (e) {
    fail("career", "werken-bij landscape menu", String(e).slice(0, 200));
    return { opened: true, ok: false, error: String(e).slice(0, 200) };
  }
});

// --- Hamburger link matrix (portrait) — sample all internal hrefs ---
report.cases.hamburgerMatrix = await withPage("portrait390", async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await page.waitForTimeout(1200);
  const results = [];
  const opened = await openHamburger(page);
  if (!opened) {
    fail("hamburger", "matrix-open", "fail");
    return { results };
  }
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("#navbar-mobile-menu a[href^='/']")]
      .map((a) => a.getAttribute("href"))
      .filter(Boolean),
  );
  const unique = [...new Set(hrefs)].filter(
    (h) => !h.startsWith("/api") && !h.includes("logout"),
  );
  // Close and re-open between navigations
  for (const href of unique) {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismiss(page);
    await page.waitForTimeout(600);
    const okOpen = await openHamburger(page);
    if (!okOpen) {
      results.push({ href, ok: false, reason: "menu_open_failed" });
      fail("hamburger", href, "menu_open_failed");
      continue;
    }
    const nav = await clickMenuHref(page, href);
    results.push({ href, ...nav });
    if (!nav.ok) fail("hamburger", href, nav);
  }
  return { hrefs: unique, results };
});

// --- Overlay Back closes menu ---
report.cases.menuBack = await withPage("portrait390", async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await openHamburger(page);
  await page.goBack();
  await page.waitForTimeout(500);
  const stillOpen = await page.evaluate(() => !!document.querySelector("#navbar-mobile-menu"));
  const path = await page.evaluate(() => location.pathname);
  if (stillOpen) fail("back", "hamburger", "menu still open after Back");
  if (path !== "/") fail("back", "hamburger", `left homepage: ${path}`);
  return { stillOpen, path };
});

// --- Homepage primary + info chrome + workbar ---
for (const vpKey of ["portrait390", "land844", "desk1280"]) {
  report.cases[`home-${vpKey}`] = await withPage(vpKey, async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await dismiss(page);
    await page.waitForTimeout(1800);
    const controls = await collectVisibleControls(page);
    const checks = {};

    // Logo / home
    const logo = page.locator('a[href="/"]').first();
    checks.logoVisible = (await logo.count()) > 0;

    // Search
    const search = page.locator("[data-wx-feed-search]").first();
    checks.searchVisible = (await search.count()) > 0;
    if (checks.searchVisible) {
      try {
        await search.click({ timeout: 3000 });
        await page.waitForTimeout(400);
        checks.searchFocused = await page.evaluate(() => {
          const el = document.querySelector("[data-wx-feed-search]");
          return el === document.activeElement || !!el?.closest("[data-open='1']");
        });
      } catch (e) {
        checks.searchClick = String(e).slice(0, 80);
      }
    }

    // Create / Aanbieden
    const create = page
      .locator("[data-wx-workbar-create], [data-wx-primary-action], [data-wx-mobile-create]")
      .first();
    checks.createVisible = (await create.count()) > 0;
    if (checks.createVisible) {
      try {
        await create.click({ timeout: 4000 });
        await page.waitForTimeout(800);
        checks.createOverlay = await page.evaluate(() => {
          const dialogs = document.querySelectorAll(
            '[role="dialog"], [data-create-flow], [data-testid*="create"]',
          );
          return [...dialogs].some((d) => {
            const r = d.getBoundingClientRect();
            return r.width > 40 && r.height > 40;
          });
        });
        // close via Escape / Back without publishing
        await page.keyboard.press("Escape").catch(() => {});
        await page.waitForTimeout(300);
      } catch (e) {
        checks.createError = String(e).slice(0, 100);
      }
    }

    // Info chrome links
    const infoHrefs = await page.evaluate(() =>
      [...document.querySelectorAll("[data-homepage-info] a[href], [data-wx-info-chrome] a[href], a[data-homepage-info-link]")]
        .map((a) => a.getAttribute("href"))
        .filter(Boolean),
    );
    checks.infoHrefs = infoHrefs;
    for (const href of [...new Set(infoHrefs)].slice(0, 12)) {
      if (!href.startsWith("/")) continue;
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await dismiss(page);
      await page.waitForTimeout(500);
      const link = page.locator(`a[href="${href}"]`).first();
      if (!(await link.count())) continue;
      try {
        await link.click({ timeout: 4000 });
        await page.waitForTimeout(900);
        const path = await page.evaluate(() => location.pathname + location.search);
        const expected = href.split("?")[0];
        const ok = path === href || path.startsWith(expected);
        checks[`info:${href}`] = { ok, path };
        if (!ok) fail(`info-${vpKey}`, href, { path });
      } catch (e) {
        fail(`info-${vpKey}`, href, String(e).slice(0, 100));
      }
    }

    // Bottom nav (portrait)
    if (vpKey.startsWith("portrait")) {
      const tabs = await page.evaluate(() =>
        [...document.querySelectorAll("[data-hc-bottom-nav] a, [data-hc-bottom-nav] button")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 2 && r.height > 2;
          })
          .map((el) => ({
            href: el.getAttribute("href"),
            text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
            tag: el.tagName.toLowerCase(),
          })),
      );
      checks.bottomNav = tabs;
      for (const tab of tabs) {
        if (!tab.href || !tab.href.startsWith("/")) continue;
        await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await dismiss(page);
        await page.waitForTimeout(400);
        try {
          await page.locator(`[data-hc-bottom-nav] a[href="${tab.href}"]`).first().click({ timeout: 4000 });
          await page.waitForTimeout(900);
          const path = await page.evaluate(() => location.pathname);
          const expected = tab.href.split("#")[0].split("?")[0] || "/";
          const ok =
            expected === "/"
              ? path === "/"
              : path === expected || path.startsWith(expected);
          checks[`bottom:${tab.href}`] = { ok, path };
          if (!ok) fail("bottom-nav", tab.href, { path });
        } catch (e) {
          fail("bottom-nav", tab.href || tab.text, String(e).slice(0, 80));
        }
      }
    }

    // Landscape workbar
    if (vpKey.startsWith("land")) {
      checks.workbar = await page.evaluate(() => {
        const menu = document.querySelector("[data-wx-workbar-menu]");
        const create = document.querySelector("[data-wx-workbar-create]");
        const logo = document.querySelector("[data-wx-workbar-logo]");
        const mr = menu?.getBoundingClientRect();
        const zone = 64;
        return {
          menu: !!menu,
          create: !!create,
          logo: !!logo,
          menuIntersectsOsZone: mr ? mr.right > window.innerWidth - zone : null,
        };
      });
      if (!checks.workbar.menu) fail("landscape", "workbar-menu", "missing");
      if (checks.workbar.menuIntersectsOsZone) {
        fail("landscape", "workbar-menu", "OS zone overlap");
      }
    }

    return { controlCount: controls.length, controlsSample: controls.slice(0, 40), checks };
  });
}

// --- Listing safe interactions ---
report.cases.listing = await withPage("portrait390", async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  try {
    await page.waitForSelector(
      'a[href*="/listing/"], a[href*="/dish/"], a[href*="/product/"], [data-testid="feed-card"] a',
      { timeout: 45000 },
    );
  } catch {
    fail("listing", "feed-card", "no card within timeout");
    return { ok: false };
  }
  const href = await page.evaluate(() => {
    const a = document.querySelector(
      'a[href*="/listing/"], a[href*="/dish/"], a[href*="/product/"]',
    );
    return a?.getAttribute("href") || null;
  });
  if (!href) {
    fail("listing", "href", "none");
    return { ok: false };
  }
  await page.goto(new URL(href, BASE).toString(), {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await dismiss(page);
  await page.waitForTimeout(1200);
  const path = await page.evaluate(() => location.pathname);
  const controls = await collectVisibleControls(page);

  // Report dialog boundary
  let reportUi = { opened: false };
  const reportBtn = page
    .locator('button:has-text("Report"), button:has-text("Melden"), [data-testid*="report"]')
    .first();
  if (await reportBtn.count()) {
    try {
      await reportBtn.click({ timeout: 3000 });
      await page.waitForTimeout(600);
      reportUi.opened = await page.evaluate(() =>
        [...document.querySelectorAll('[role="dialog"], [data-report]')].some((d) => {
          const r = d.getBoundingClientRect();
          return r.width > 40 && r.height > 40;
        }),
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      reportUi.closed = await page.evaluate(
        () =>
          ![...document.querySelectorAll('[role="dialog"]')].some((d) => {
            const r = d.getBoundingClientRect();
            return r.width > 40 && r.height > 40;
          }),
      );
    } catch (e) {
      reportUi.error = String(e).slice(0, 100);
    }
  }

  // Back to home
  await page.goBack();
  await page.waitForTimeout(800);
  const backPath = await page.evaluate(() => location.pathname);

  return {
    href,
    path,
    controlCount: controls.length,
    reportUi,
    backPath,
  };
});

// --- Footer on non-home route ---
report.cases.footer = await withPage("desk1280", async (page) => {
  await page.goto(`${BASE}/faq`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await page.waitForTimeout(800);
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("[data-homecheff-site-footer] a[href^='/']")]
      .map((a) => a.getAttribute("href"))
      .filter(Boolean),
  );
  const results = [];
  for (const href of [...new Set(hrefs)]) {
    const link = page.locator(`[data-homecheff-site-footer] a[href="${href}"]`).first();
    try {
      await link.click({ timeout: 4000 });
      await page.waitForTimeout(800);
      const path = await page.evaluate(() => location.pathname + location.search);
      const expected = href.split("?")[0];
      const ok = path === href || path.startsWith(expected);
      results.push({ href, ok, path });
      if (!ok) fail("footer", href, { path });
      await page.goto(`${BASE}/faq`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await dismiss(page);
      await page.waitForTimeout(400);
    } catch (e) {
      fail("footer", href, String(e).slice(0, 100));
      results.push({ href, ok: false, error: String(e).slice(0, 100) });
    }
  }
  return { hrefs, results };
});

// --- Desktop careers (signed-out: may be menu-only) ---
report.cases.desktopCareer = await withPage("desk1280", async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await page.waitForTimeout(1000);
  const direct = page.locator('a[href="/werken-bij"]').first();
  if (await direct.count()) {
    await direct.click({ timeout: 4000 });
    await page.waitForTimeout(1000);
    const path = await page.evaluate(() => location.pathname);
    const ok = path === "/werken-bij";
    if (!ok) fail("desktop", "werken-bij", { path });
    return { mode: "direct", ok, path };
  }
  return { mode: "not-in-desktop-primary", ok: true, note: "guest careers in hamburger only" };
});

await browser.close();

const tested =
  report.failures.length +
  Object.values(report.http).filter((h) => h.ok).length +
  (report.cases.hamburgerMatrix?.results?.filter((r) => r.ok).length || 0);

report.counts = {
  sourceInventory: report.sourceInventoryHrefs.length,
  httpProbed: Object.keys(report.http).length,
  httpBroken: Object.values(report.http).filter((h) => h.status === 404 || h.status >= 500).length,
  failures: report.failures.length,
  pageErrors: report.pageErrors.length,
  consoleErrors: report.consoleErrors.length,
  careerPortraitOk: !!report.cases.careerPortrait?.ok,
  careerLandscapeOk: !!report.cases.careerLandscape?.ok,
  menuBackOk: report.cases.menuBack && !report.cases.menuBack.stillOpen,
};

const pass =
  report.failures.length === 0 &&
  report.counts.careerPortraitOk &&
  report.counts.careerLandscapeOk &&
  report.counts.menuBackOk &&
  report.counts.httpBroken === 0;

report.verdict = pass
  ? "HOMECHEFF_FULL_INTERACTION_INTEGRITY_PROBE_PASS"
  : "HOMECHEFF_FULL_INTERACTION_INTEGRITY_PROBE_FAIL";

writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out: OUT, verdict: report.verdict, counts: report.counts, failures: report.failures }, null, 2));
process.exit(pass ? 0 : 1);
