#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const VIEWPORTS = [
  { id: "phone-portrait", w: 390, h: 844 },
  { id: "phone-landscape", w: 844, h: 390 },
  { id: "tablet-portrait", w: 768, h: 1024 },
  { id: "tablet-landscape", w: 1024, h: 768 },
  { id: "laptop", w: 1280, h: 800 },
  { id: "desktop", w: 1440, h: 900 },
  { id: "ultrawide", w: 2560, h: 1440 },
];

function chromePath() {
  const p = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!existsSync(p)) throw new Error("Chrome missing");
  return p;
}

async function dismiss(page) {
  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((x) => /accepteer alle|accept all|alleen noodzakelijk|only necessary/i.test(x.textContent || ""))
      ?.click();
  }).catch(() => {});
  await new Promise((r) => setTimeout(r, 400));
}

async function snap(page) {
  return page.evaluate(() => {
    const vis = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 8 && r.height > 8 && s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0;
    };
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const cookie = document.querySelector("[data-wx-cookie-banner]");
    const earnTab = [...document.querySelectorAll("nav button, nav a")].some((el) =>
      vis(el) && /verdienen|earn/i.test((el.textContent || "").trim()) && !/learn/i.test(el.textContent || ""),
    );
    const careersPrimary = [...document.querySelectorAll("[data-wx-desktop-nav] a")].some((el) =>
      vis(el) && /werken bij|careers/i.test(el.textContent || ""),
    );
    const wanted = [...document.querySelectorAll("button")].some((b) =>
      vis(b) && /vraag|ask\s*\/\s*wanted|gezocht/i.test((b.textContent || "").trim()),
    );
    return {
      phase: ws?.getAttribute("data-wx-phase") || null,
      visibleAdaptive: ws?.getAttribute("data-wx-visible-adaptive") || null,
      workspaceClass: ws?.getAttribute("data-wx-workspace-class") || null,
      remount: ws?.getAttribute("data-wx-continuity-remount") || "0",
      presentationDrives: ws?.getAttribute("data-wx-presentation-drives-chrome") || "0",
      create: [...document.querySelectorAll("[data-wx-primary-action],[data-wx-bottom-create],[data-wx-landscape-create]")].filter(vis).length,
      search: vis(document.querySelector("[data-wx-feed-search]")),
      trade: vis(document.querySelector("[data-wx-trade-action]")),
      requestChip: wanted,
      // Also accept truncated Ask / Vraag chip labels
      requestChipLoose: [...document.querySelectorAll("button")].some((b) => {
        if (!vis(b)) return false;
        const t = (b.textContent || "").trim();
        return /^(ask|vraag)\b/i.test(t) || /ask\s*\/\s*wanted|vraag\s*\/\s*gezocht|gezocht|wanted/i.test(t);
      }),
      nearbyEmpty: vis(document.querySelector("[data-wx-nearby-empty]")),
      nearbyWarm: !!document.querySelector("[data-wx-nearby-warm]"),
      cookieCompact: !!document.querySelector("[data-wx-cookie-compact]"),
      cookieVisible: vis(cookie),
      cookieHeightPct: cookie && window.innerHeight ? Number((cookie.getBoundingClientRect().height / window.innerHeight).toFixed(3)) : null,
      earnInBottomNav: earnTab,
      careersInDesktopPrimary: careersPrimary,
      identity: /digitale buurtmarkt|digital neighbourhood marketplace/i.test(document.body.innerText.slice(0, 6000)),
      warmEmptyCopy: /buurt is dichtbij|neighbourhood is nearby|cook · grow|koken · groeien/i.test(document.body.innerText),
      logoSubtitle: /neighbourhood cook|buurt: koken|cheff,/i.test(document.body.innerText.slice(0, 4000)),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      strip: document.querySelector("[data-wx-orientation-strip]")?.innerText?.slice(0, 160) || null,
    };
  });
}

async function main() {
  const baseUrl = (process.argv.find((a) => a.startsWith("--base-url="))?.slice(11) || "http://127.0.0.1:3125").replace(/\/$/, "");
  const outDir = process.argv.find((a) => a.startsWith("--out-dir="))?.slice(10) || join(process.cwd(), "docs/audits/wx-phase1c1-2-final-launch-polish");
  mkdirSync(join(outDir, "screenshots"), { recursive: true });
  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e.message || e).slice(0, 180)));

  // Cookie first impression (fresh profile)
  const ctx = await browser.createBrowserContext();
  const fresh = await ctx.newPage();
  await fresh.setViewport({ width: 390, height: 844 });
  await fresh.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1200));
  await fresh.screenshot({ path: join(outDir, "screenshots", "cookie-before-style-compare.png"), fullPage: false });
  const cookieFirst = await snap(fresh);
  await fresh.close();
  await ctx.close();

  const matrix = [];
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await dismiss(page);
    await new Promise((r) => setTimeout(r, 1600));
    const s = await snap(page);
    await page.screenshot({ path: join(outDir, "screenshots", `${vp.id}.png`), fullPage: false });
      const pass =
      (s.create > 0) &&
      s.search &&
      s.trade &&
      (s.requestChip || s.requestChipLoose) &&
      s.identity &&
      s.remount === "0" &&
      s.presentationDrives === "0" &&
      !s.overflow &&
      !s.earnInBottomNav &&
      (vp.w < 1024 || !s.careersInDesktopPrimary);
    matrix.push({ viewport: vp.id, snap: s, pass });
    console.log(
      `${vp.id} → ${pass ? "PASS" : "FAIL"} create=${s.create} search=${s.search} trade=${s.trade} ask=${s.requestChip} earn=${s.earnInBottomNav} careers=${s.careersInDesktopPrimary} warm=${s.warmEmptyCopy} remount=${s.remount}`,
    );
  }

  // Rotation
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await dismiss(page);
  await new Promise((r) => setTimeout(r, 700));
  const p0 = await snap(page);
  await page.setViewport({ width: 844, height: 390 });
  await new Promise((r) => setTimeout(r, 700));
  const p1 = await snap(page);
  await page.screenshot({ path: join(outDir, "screenshots", "rotation-landscape.png"), fullPage: false });
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 700));
  const p2 = await snap(page);

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    cookieFirst,
    matrix,
    matrixPass: matrix.filter((m) => m.pass).length,
    matrixTotal: matrix.length,
    rotation: {
      portraitCreate: p0.create > 0,
      landscapeCreate: p1.create > 0,
      backCreate: p2.create > 0,
      remountStable: p0.remount === "0" && p1.remount === "0" && p2.remount === "0",
    },
    pageErrors: pageErrors.slice(0, 15),
  };
  writeFileSync(join(outDir, "browser-proof.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(outDir, "responsive-matrix.json"), JSON.stringify({ matrix }, null, 2));
  console.log("COOKIE", { compact: cookieFirst.cookieCompact, hPct: cookieFirst.cookieHeightPct, visible: cookieFirst.cookieVisible });
  console.log(report.matrixPass === report.matrixTotal && report.rotation.landscapeCreate ? "PROOF_PASS" : "PROOF_FAIL", `${report.matrixPass}/${report.matrixTotal}`);
  await browser.close();
  process.exit(report.matrixPass === report.matrixTotal && report.rotation.landscapeCreate ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
