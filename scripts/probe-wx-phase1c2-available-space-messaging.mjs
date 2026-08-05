/**
 * WX Phase 1C.2 — Available Space messaging browser proof.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Load resolver via tsx/cjs interop
const require = createRequire(import.meta.url);
let resolveOrientationExplanation;
try {
  // Prefer compiled-free: spawn expectations from duplicated pure logic via dynamic tsx
  const { execFileSync } = await import("node:child_process");
  const out = execFileSync(
    "npx",
    [
      "tsx",
      "-e",
      `import { resolveOrientationExplanation as r } from './lib/adaptive-workspace-react/resolve-orientation-explanation.ts';
       const vps=${JSON.stringify([
         { id: "320x568", w: 320, h: 568 },
         { id: "360x640", w: 360, h: 640 },
         { id: "375x667", w: 375, h: 667 },
         { id: "390x844", w: 390, h: 844 },
         { id: "412x915", w: 412, h: 915 },
         { id: "430x932", w: 430, h: 932 },
         { id: "phone-landscape", w: 844, h: 390 },
         { id: "768x1024", w: 768, h: 1024 },
         { id: "820x1180", w: 820, h: 1180 },
         { id: "1024x768", w: 1024, h: 768 },
         { id: "1280x720", w: 1280, h: 720 },
         { id: "1440x900", w: 1440, h: 900 },
         { id: "1920x1080", w: 1920, h: 1080 },
       ])};
       console.log(JSON.stringify(vps.map(v=>({...v,level:r({usableWidthPx:v.w,usableHeightPx:v.h}).level}))));`,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  const expected = JSON.parse(out.trim().split("\n").filter(Boolean).pop());
  var EXPECT = Object.fromEntries(expected.map((e) => [e.id, e.level]));
  var VIEWPORTS = expected;
} catch (e) {
  console.error(e);
  process.exit(2);
}

const BASE = process.env.BASE_URL || "https://homecheff.eu";
const OUT = process.env.OUT_DIR || "docs/audits/wx-phase1c2-available-space-messaging";
mkdirSync(`${OUT}/screenshots`, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    locale: "en-US",
  });
  const page = await context.newPage();
  await page.goto(BASE.replace(/\/$/, "") + "/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(5000);

  const snap = await page.evaluate(() => {
    const strip = document.querySelector("[data-wx-orientation-strip]");
    const r = strip?.getBoundingClientRect();
    const text = (strip?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      phase: strip?.getAttribute("data-wx-phase"),
      level: strip?.getAttribute("data-wx-orientation-explain"),
      complete: strip?.getAttribute("data-wx-orientation-complete"),
      hasIdentity: Boolean(document.querySelector("[data-wx-orientation-identity]")),
      hasTitle: Boolean(document.querySelector("[data-wx-orientation-title]")),
      hasBody: Boolean(document.querySelector("[data-wx-orientation-explain-body]")),
      hasActions: Boolean(document.querySelector("[data-wx-orientation-actions]")),
      marketingHero: Boolean(document.querySelector("[data-home-hero], .home-hero")),
      stripH: r ? Math.round(r.height) : 0,
      overflowHidden: strip ? getComputedStyle(strip).overflow === "hidden" : false,
      textPreview: text.slice(0, 240),
      errorBoundary: /Something went wrong/i.test(document.body.innerText || ""),
    };
  });

  await page.screenshot({ path: `${OUT}/screenshots/${vp.id}.png`, fullPage: false });

  const pass =
    !snap.errorBoundary &&
    !snap.marketingHero &&
    snap.phase === "1c.2" &&
    snap.complete === "1" &&
    snap.hasIdentity &&
    snap.hasTitle &&
    snap.hasBody &&
    snap.hasActions &&
    !snap.overflowHidden &&
    snap.level === vp.level;

  results.push({ id: vp.id, w: vp.w, h: vp.h, expectLevel: vp.level, pass, snap });
  await context.close();
}

await browser.close();

const summary = {
  verdict: results.every((r) => r.pass)
    ? "WX_PHASE_1C_2_AVAILABLE_SPACE_PASS"
    : "WX_PHASE_1C_2_AVAILABLE_SPACE_PARTIAL",
  base: BASE,
  passCount: results.filter((r) => r.pass).length,
  total: results.length,
  results,
};
writeFileSync(`${OUT}/browser-proof.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(results.every((r) => r.pass) ? 0 : 1);
