import { chromium, webkit } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "https://homecheff.eu";
const OUT = "docs/audits/phase55-location-radius-validation";
mkdirSync(`${OUT}/screenshots`, { recursive: true });

const VIEWPORTS = [
  { id: "desk-1440", w: 1440, h: 900 },
  { id: "phone-390", w: 390, h: 844 },
  { id: "phone-land", w: 844, h: 390 },
  { id: "tablet-768", w: 768, h: 1024 },
];

async function snapPage(page, label) {
  const data = await page.evaluate(async () => {
    const strip = document.querySelector("[data-wx-orientation-strip]");
    const err = /Something went wrong/i.test(document.body.innerText || "");
    const useLoc = Array.from(document.querySelectorAll("button,a,[role=button]")).filter(el =>
      /use my location|gebruik mijn locatie|mijn locatie/i.test(el.textContent || "") ||
      /use my location|gebruik mijn locatie/i.test(el.getAttribute("aria-label") || "")
    );
    const placeInputs = Array.from(document.querySelectorAll("input")).filter(el =>
      /plaats|postcode|place|city|locatie|location/i.test(
        (el.placeholder || "") + (el.getAttribute("aria-label") || "") + (el.name || "")
      )
    );
    const radius = Array.from(document.querySelectorAll("select,button,[role=combobox]")).filter(el =>
      /km|radius|straal/i.test((el.textContent || "") + (el.getAttribute("aria-label") || ""))
    );
    const banner = document.querySelector("[data-location-refine], .location-refine") ||
      Array.from(document.querySelectorAll("*")).find(el => /meer precisie|use precise|kies een plaats|choose a place|refine/i.test(el.textContent||"") && el.children.length < 12);
    // network-ish: localStorage
    let pref = null;
    try { pref = JSON.parse(localStorage.getItem("hc_location_pref_v1") || "null"); } catch {}
    // try capture last feed url from performance
    const feeds = performance.getEntriesByType("resource")
      .map(e => e.name)
      .filter(n => n.includes("/api/feed"))
      .slice(-3);
    const approx = performance.getEntriesByType("resource")
      .map(e => e.name)
      .filter(n => n.includes("/api/geo/approx"))
      .slice(-2);
    return {
      err,
      phase: strip?.getAttribute("data-wx-phase") || null,
      level: strip?.getAttribute("data-wx-orientation-explain") || null,
      useLocCount: useLoc.length,
      useLocNames: useLoc.slice(0,3).map(el => (el.textContent||"").trim().slice(0,40)),
      placeInputCount: placeInputs.length,
      placePlaceholders: placeInputs.slice(0,3).map(el => el.placeholder || el.name || ""),
      radiusControlCount: radius.length,
      hasBannerish: Boolean(banner),
      pref,
      lastFeeds: feeds,
      approxCalls: approx,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  });
  return data;
}

async function runBrowser(browserType, name) {
  const browser = await browserType.launch({ headless: true });
  const results = [];
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      locale: "nl-NL",
      geolocation: undefined,
      permissions: [],
    });
    const page = await context.newPage();
    const feedReqs = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/feed") || req.url().includes("/api/geo/approx")) {
        feedReqs.push(req.url());
      }
    });
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(4500);
    const baseSnap = await snapPage(page);
    await page.screenshot({ path: `${OUT}/screenshots/${name}-${vp.id}-fresh.png`, fullPage: false });

    // Try open filters / place on desktop
    let manualOk = null;
    try {
      // open mobile sheet if needed
      const filterBtn = page.locator('button,a').filter({ hasText: /filter|zoek|locatie|plaats/i }).first();
      if (vp.w < 900) {
        const candidates = page.locator('button').filter({ hasText: /filter/i });
        if (await candidates.count()) await candidates.first().click({ timeout: 3000 }).catch(()=>{});
        await page.waitForTimeout(800);
      }
      const input = page.locator('input[placeholder*="plaats" i], input[placeholder*="postcode" i], input[placeholder*="Place" i], input[placeholder*="city" i]').first();
      if (await input.count()) {
        await input.fill("Amsterdam");
        await page.waitForTimeout(400);
        // apply - look for Toepassen / Apply / Zoeken
        const apply = page.locator('button').filter({ hasText: /toepassen|apply|zoek|ok|klaar|gebruik/i }).first();
        if (await apply.count()) {
          await apply.click({ timeout: 3000 }).catch(()=>{});
        } else {
          await input.press("Enter");
        }
        await page.waitForTimeout(3500);
        const after = await snapPage(page);
        const placeFeeds = feedReqs.filter(u => u.includes("place=") || decodeURIComponent(u).includes("Amsterdam"));
        manualOk = {
          applied: true,
          pref: after.pref,
          placeFeeds: placeFeeds.slice(-2),
          err: after.err,
        };
        await page.screenshot({ path: `${OUT}/screenshots/${name}-${vp.id}-amsterdam.png`, fullPage: false });
      } else {
        manualOk = { applied: false, reason: "no_place_input_visible" };
      }
    } catch (e) {
      manualOk = { applied: false, error: String(e).slice(0, 180) };
    }

    // GPS button presence + click denied path
    let gps = null;
    try {
      await context.clearPermissions();
      const btn = page.locator('button').filter({ hasText: /mijn locatie|my location/i }).first();
      const visible = await btn.count();
      if (visible) {
        // grant then deny simulation: click without permission → should not crash
        await btn.click({ timeout: 4000 }).catch(()=>{});
        await page.waitForTimeout(2000);
        const afterGps = await snapPage(page);
        gps = { clicked: true, err: afterGps.err, pref: afterGps.pref };
      } else {
        gps = { clicked: false, reason: "button_not_found" };
      }
    } catch (e) {
      gps = { error: String(e).slice(0,180) };
    }

    // malformed localStorage recovery
    let malformed = null;
    try {
      await page.evaluate(() => localStorage.setItem("hc_location_pref_v1", "{not-json"));
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);
      const after = await snapPage(page);
      malformed = { err: after.err, pref: after.pref, phase: after.phase };
    } catch (e) {
      malformed = { error: String(e).slice(0,180) };
    }

    results.push({
      vp: vp.id,
      baseSnap,
      manualOk,
      gps,
      malformed,
      feedSample: feedReqs.slice(0, 5),
    });
    await context.close();
  }
  await browser.close();
  return results;
}

const chromiumResults = await runBrowser(chromium, "chromium");
let webkitResults = null;
try {
  webkitResults = await runBrowser(webkit, "webkit");
} catch (e) {
  webkitResults = { error: String(e).slice(0, 200) };
}

const out = {
  base: BASE,
  at: new Date().toISOString(),
  chromium: chromiumResults,
  webkit: webkitResults,
};
writeFileSync(`${OUT}/browser-probe.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  chromium: chromiumResults.map(r => ({
    vp: r.vp,
    err: r.baseSnap.err,
    phase: r.baseSnap.phase,
    useLoc: r.baseSnap.useLocCount,
    place: r.baseSnap.placeInputCount,
    prefSource: r.baseSnap.pref?.source,
    manual: r.manualOk,
    gps: r.gps,
    malformedErr: r.malformed?.err,
  })),
  webkitOk: !webkitResults?.error,
}, null, 2));
