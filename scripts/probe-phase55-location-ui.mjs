import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
const BASE = process.env.BASE_URL || "https://homecheff.eu";
const OUT = "docs/audits/phase55-location-radius-validation";
mkdirSync(`${OUT}/screenshots`, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

async function openLocationControls(page) {
  // Prefer test id
  let input = page.locator('[data-testid="feed-place-input"]');
  if (await input.count()) return input.first();
  // Try filter / refine buttons
  for (const re of [/filter/i, /locatie/i, /verfijn|refine/i, /zoek/i]) {
    const btn = page.locator("button").filter({ hasText: re });
    const n = await btn.count();
    for (let i = 0; i < Math.min(n, 4); i++) {
      await btn.nth(i).click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(600);
      input = page.locator('[data-testid="feed-place-input"]');
      if (await input.count()) return input.first();
    }
  }
  return null;
}

for (const vp of [
  { id: "desk-1440", w: 1440, h: 900 },
  { id: "phone-390", w: 390, h: 844 },
]) {
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, locale: "nl-NL" });
  const page = await context.newPage();
  const reqs = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/feed") || r.url().includes("/api/geo/approx")) reqs.push(r.url());
  });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);
  const err = await page.evaluate(() => /Something went wrong/i.test(document.body.innerText || ""));
  const phase = await page.locator("[data-wx-orientation-strip]").getAttribute("data-wx-phase").catch(() => null);
  const input = await openLocationControls(page);
  let manual = { found: false };
  if (input) {
    await input.fill("Amsterdam");
    const apply = page.locator("button").filter({ hasText: /toepassen|apply/i }).first();
    if (await apply.count()) await apply.click().catch(() => {});
    else await input.press("Enter");
    await page.waitForTimeout(4000);
    const pref = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem("hc_location_pref_v1") || "null"); } catch { return null; }
    });
    const placeFeeds = reqs.filter((u) => /place=|Amsterdam/i.test(decodeURIComponent(u)));
    manual = { found: true, prefSource: pref?.source, prefPlace: pref?.place, placeFeeds: placeFeeds.slice(-2), err: await page.evaluate(() => /Something went wrong/i.test(document.body.innerText || "")) };
  }
  // GPS deny path
  let gps = { found: false };
  const gpsBtn = page.locator("button").filter({ hasText: /mijn locatie|my location/i }).first();
  if (await gpsBtn.count()) {
    await gpsBtn.click().catch(() => {});
    await page.waitForTimeout(2500);
    gps = {
      found: true,
      err: await page.evaluate(() => /Something went wrong/i.test(document.body.innerText || "")),
      pref: await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("hc_location_pref_v1")||"null"); } catch { return null; } }),
    };
  }
  await page.screenshot({ path: `${OUT}/screenshots/ui-${vp.id}.png`, fullPage: false });
  results.push({ vp: vp.id, err, phase, manual, gps, sampleReqs: reqs.slice(0, 6) });
  await context.close();
}
await browser.close();
writeFileSync(`${OUT}/browser-ui-probe.json`, JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));
