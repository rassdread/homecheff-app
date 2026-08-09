/**
 * Browser cert: original feed UX (CTA inserts + infinite scroll + routing).
 *
 * Usage:
 *   FEED_UX_BASE_URL=https://homecheff.eu node scripts/certify-original-feed-ux.mjs
 *   FEED_UX_BASE_URL=http://127.0.0.1:3000 node scripts/certify-original-feed-ux.mjs
 */
import { accessSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BASE = (process.env.FEED_UX_BASE_URL || "https://homecheff.eu").replace(
  /\/$/,
  "",
);
const OUT = join(
  process.cwd(),
  "docs/audits/feed-original-ux-restore",
  `run-${Date.now()}`,
);
mkdirSync(OUT, { recursive: true });

function chromiumPath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const home = process.env.HOME || "";
  const candidates = [
    `${home}/Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium`,
    `${home}/.cache/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium`,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const p of candidates) {
    try {
      accessSync(p);
      return p;
    } catch {
      /* next */
    }
  }
  throw new Error("Chromium not found; set PUPPETEER_EXECUTABLE_PATH");
}

async function collectFeed(page) {
  return page.evaluate(() => {
    const anchors = [
      ...document.querySelectorAll(
        'a[href*="/product/"], a[href*="/recipe/"], a[href*="/garden/"], a[href*="/design/"]',
      ),
    ];
    const hrefs = [];
    const seen = new Set();
    for (const a of anchors) {
      const href = a.getAttribute("href") || "";
      if (!href || seen.has(href)) continue;
      seen.add(href);
      hrefs.push(href);
    }
    const insertNodes = [
      ...document.querySelectorAll("[data-hc-feed-insert]"),
    ];
    const insertIds = insertNodes.map((el) =>
      el.getAttribute("data-hc-feed-insert"),
    );
    const contentsInserts = [...document.querySelectorAll("div.contents")].filter(
      (el) => {
        const t = (el.textContent || "").trim();
        return (
          /HomeGarden|HomeDesigner|HomeCheff/.test(t) ||
          /Google Play|Affiliate 12-12|Work at HomeCheff|Share something/.test(
            t,
          ) ||
          /new accounts this week|nieuwe accounts/.test(t)
        );
      },
    );
    const verticals = Boolean(
      document.querySelector(
        '[data-testid="home-vertical-chip-strip"], [data-hc-feed-insert="verticals"]',
      ) ||
        contentsInserts.some((el) =>
          /HomeGarden|HomeDesigner/.test(el.textContent || ""),
        ),
    );
    const promoLike =
      insertIds.some((id) => id && id.startsWith("promo:")) ||
      insertIds.includes("pulse") ||
      insertIds.includes("share") ||
      contentsInserts.some((el) =>
        /Google Play|Affiliate 12-12|Work at HomeCheff|Share something/.test(
          el.textContent || "",
        ),
      );
    return {
      uniqueHrefs: hrefs.length,
      hrefs: hrefs.slice(0, 40),
      products: hrefs.filter((h) => h.includes("/product/")).length,
      recipes: hrefs.filter((h) => h.includes("/recipe/")).length,
      gardens: hrefs.filter((h) => h.includes("/garden/")).length,
      designs: hrefs.filter((h) => h.includes("/design/")).length,
      verticalsHint: verticals,
      promoLike,
      insertIds,
      contentsInsertCount: contentsInserts.length,
      path: location.pathname,
    };
  });
}

async function runViewport(label, viewport) {
  const browser = await puppeteer.launch({
    executablePath: chromiumPath(),
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const snaps = [];
  try {
    await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await sleep(5000);
    const initial = await collectFeed(page);
    await page.screenshot({
      path: join(OUT, `${label}-initial.png`),
      fullPage: false,
    });
    snaps.push({ tag: "initial", ...initial });

    for (let i = 1; i <= 3; i += 1) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2.2));
      await sleep(2800);
      const snap = await collectFeed(page);
      await page.screenshot({
        path: join(OUT, `${label}-scroll-${i}.png`),
        fullPage: false,
      });
      snaps.push({ tag: `scroll-${i}`, ...snap });
    }

    // Click first product/recipe if present (logged-out listing).
    let listingNav = { ok: false, href: null, statusHint: null };
    const first =
      snaps.find((s) => s.hrefs?.length)?.hrefs?.[0] ||
      snaps[0]?.hrefs?.[0];
    if (first) {
      await page.goto(new URL(first, BASE).toString(), {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await sleep(2500);
      const listingState = await page.evaluate(() => ({
        body: document.body?.innerText || "",
        path: location.pathname,
      }));
      listingNav = {
        ok:
          !/Application error|Seller Not Found|404|Something went wrong/i.test(
            listingState.body,
          ) && !/\/login/i.test(listingState.path),
        href: first,
        statusHint: listingState.body.slice(0, 120),
        path: listingState.path,
      };
      await page.screenshot({
        path: join(OUT, `${label}-listing.png`),
        fullPage: false,
      });
    }

    const maxUnique = Math.max(...snaps.map((s) => s.uniqueHrefs));
    const grew =
      snaps[snaps.length - 1].uniqueHrefs > snaps[0].uniqueHrefs ||
      maxUnique > snaps[0].uniqueHrefs;
    const ctaHint = snaps.some((s) => s.verticalsHint || s.promoLike);

    return {
      label,
      viewport,
      snaps,
      listingNav,
      infiniteScrollGrew: grew,
      ctaHint,
      maxUnique,
    };
  } finally {
    await browser.close();
  }
}

const report = {
  at: new Date().toISOString(),
  base: BASE,
  out: OUT,
  results: {},
};

report.results.chromiumDesktop = await runViewport("chromium-desktop", {
  width: 1280,
  height: 900,
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
});

report.results.chromiumMobile = await runViewport("chromium-mobile", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const mobile = report.results.chromiumMobile;
const desktop = report.results.chromiumDesktop;

const gates = {
  mobileCtaHint: mobile.ctaHint,
  mobileInfiniteScroll: mobile.infiniteScrollGrew,
  desktopInfiniteScroll: desktop.infiniteScrollGrew,
  mobileListingNav: mobile.listingNav.ok,
  desktopListingNav: desktop.listingNav.ok,
  mobileMaxUniqueAtLeast12: mobile.maxUnique >= 12,
};

report.gates = gates;
report.verdict =
  gates.mobileCtaHint &&
  gates.mobileInfiniteScroll &&
  gates.mobileListingNav &&
  gates.desktopListingNav &&
  gates.mobileMaxUniqueAtLeast12
    ? "HOMECHEFF_ORIGINAL_FEED_UX_RESTORED"
    : "HOMECHEFF_ORIGINAL_FEED_UX_NO_GO";

writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
writeFileSync(
  join(
    process.cwd(),
    "docs/audits/feed-original-ux-restore/latest-browser-report.json",
  ),
  JSON.stringify(report, null, 2),
);

console.log(JSON.stringify({ out: OUT, gates, verdict: report.verdict }, null, 2));
process.exit(report.verdict === "HOMECHEFF_ORIGINAL_FEED_UX_RESTORED" ? 0 : 2);
