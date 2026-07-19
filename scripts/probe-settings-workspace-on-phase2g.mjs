#!/usr/bin/env node
/**
 * Phase 2G — Settings Workspace ON browser verification (Puppeteer).
 *
 * Requires a running Next production server with:
 *   HOMECHEFF_AW_SETTINGS_HARNESS=1
 *   HOMECHEFF_SETTINGS_WORKSPACE_MODE=<off|shadow|on>
 *
 * Usage:
 *   node scripts/probe-settings-workspace-on-phase2g.mjs --base-url=http://127.0.0.1:3017 --mode=on
 *
 * Writes JSON report to docs/audits/artifacts/ (gitignored preferred) or /tmp.
 * Does not activate public production. Does not use query/localStorage mode flags.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer";

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3017";
  let mode = "on";
  let outDir = join(process.cwd(), "docs/audits/artifacts");
  let reportName = null;
  for (const a of argv) {
    if (a.startsWith("--base-url=")) baseUrl = a.slice("--base-url=".length);
    if (a.startsWith("--mode=")) mode = a.slice("--mode=".length);
    if (a.startsWith("--out-dir=")) outDir = a.slice("--out-dir=".length);
    if (a.startsWith("--report-name=")) reportName = a.slice("--report-name=".length);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), mode, outDir, reportName };
}

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "desktop-1280x720", width: 1280, height: 720 },
  { name: "desktop-1024x768", width: 1024, height: 768 },
  { name: "tablet-820x1180", width: 820, height: 1180 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-430x932", width: 430, height: 932 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "short-1280x600", width: 1280, height: 600 },
  { name: "short-1024x576", width: 1024, height: 576 },
  { name: "short-430x650", width: 430, height: 650 },
];

const PROFILE_BOUNDARIES = [
  { name: "compact-1", width: 719, height: 800 },
  { name: "compact", width: 720, height: 800 },
  { name: "compact+1", width: 721, height: 800 },
  { name: "comfort-1", width: 1023, height: 800 },
  { name: "comfort", width: 1024, height: 800 },
  { name: "comfort+1", width: 1025, height: 800 },
  { name: "expanded-1", width: 1439, height: 800 },
  { name: "expanded", width: 1440, height: 800 },
  { name: "expanded+1", width: 1441, height: 800 },
  { name: "short-h", width: 1280, height: 479 },
];

function collectConsole(page) {
  const issues = [];
  page.on("console", (m) => {
    const t = m.text();
    if (
      /hydration|did not match|validateDOMNesting|maximum update depth|ResizeObserver loop|unmounted component/i.test(
        t,
      ) ||
      m.type() === "error"
    ) {
      issues.push({ type: m.type(), text: t.slice(0, 400) });
    }
  });
  page.on("pageerror", (e) =>
    issues.push({ type: "pageerror", text: String(e).slice(0, 400) }),
  );
  return issues;
}

async function snapshotTree(page) {
  return page.evaluate(() => {
    const probe = window.__AW_PHASE2G_PROBE__ ?? {
      mounts: 0,
      unmounts: 0,
      renders: 0,
    };
    const root = document.querySelector("[data-aw-settings-harness-page]");
    const onRoot = document.querySelector("[data-aw-settings-on-root]");
    const shadowRoot = document.querySelector("[data-aw-settings-shadow-root]");
    const regions = document.querySelectorAll("[data-aw-region]").length;
    const slots = document.querySelectorAll("[data-aw-slot]").length;
    const panels = document.querySelectorAll("[data-aw-panel]").length;
    const hosts = document.querySelectorAll("[data-aw-widget-host]").length;
    const children = document.querySelectorAll("[data-aw-harness-child]").length;
    const mains = document.querySelectorAll("main").length;
    const mode =
      onRoot?.getAttribute("data-aw-mode") ||
      shadowRoot?.getAttribute("data-aw-mode") ||
      null;
    const activation =
      onRoot?.getAttribute("data-aw-render-activation") ||
      shadowRoot?.getAttribute("data-aw-render-activation") ||
      null;
    const profile =
      onRoot?.getAttribute("data-aw-profile") ||
      shadowRoot?.getAttribute("data-aw-profile") ||
      "";
    const resolveCount = Number(
      onRoot?.getAttribute("data-aw-resolve-count") ||
        shadowRoot?.getAttribute("data-aw-resolve-count") ||
        "0",
    );
    const attrBlob = [
      ...(onRoot?.attributes ? [...onRoot.attributes] : []),
      ...(shadowRoot?.attributes ? [...shadowRoot.attributes] : []),
    ]
      .map((a) => `${a.name}=${a.value}`)
      .join("\n");
    // Deny domain values — not attribute names that legitimately contain "token"
    // (e.g. data-aw-stability-token, data-aw-chrome-token).
    const denylistValue =
      /(?:^|[=\s])(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|Bearer\s+[A-Za-z0-9._-]+|sk_live_|password=|session=)/i.test(
        attrBlob,
      ) ||
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
        document.body?.innerText?.slice(0, 500) ?? "",
      );

    return {
      harnessPresent: Boolean(root),
      onRoot: Boolean(onRoot),
      shadowRoot: Boolean(shadowRoot),
      regions,
      slots,
      panels,
      hosts,
      children,
      mains,
      mode,
      activation,
      profile,
      resolveCount,
      probe: { ...probe },
      maxWidthClass: Boolean(
        document.querySelector(".max-w-5xl"),
      ),
      paddingClass: Boolean(document.querySelector(".px-4")),
      sensitiveLeak: denylistValue,
      activeElementTag: document.activeElement?.tagName ?? null,
      activeElementId: document.activeElement?.id ?? null,
      scrollY: window.scrollY,
    };
  });
}

async function runModeChecks(page, expectedMode) {
  const snap = await snapshotTree(page);
  const checks = [];
  const push = (id, ok, detail) => checks.push({ id, ok, detail });

  push("harness-present", snap.harnessPresent, "harness page mounted");
  push("single-child", snap.children === 1, `children=${snap.children}`);
  push("mounts-1", snap.probe.mounts === 1, `mounts=${snap.probe.mounts}`);
  push(
    "unmounts-0",
    snap.probe.unmounts === 0,
    `unmounts=${snap.probe.unmounts}`,
  );
  push("no-sensitive", !snap.sensitiveLeak, "diagnostics/DOM leak check");
  push("max-w-5xl", snap.maxWidthClass, "visual parity class");
  push("px-4", snap.paddingClass, "visual parity padding");

  if (expectedMode === "on") {
    push("on-root", snap.onRoot && !snap.shadowRoot, "workspace writer only");
    push("regions-1", snap.regions === 1, `regions=${snap.regions}`);
    push("slots-1", snap.slots === 1, `slots=${snap.slots}`);
    push("panels-1", snap.panels === 1, `panels=${snap.panels}`);
    push("hosts-1", snap.hosts === 1, `hosts=${snap.hosts}`);
    push("mode-on", snap.mode === "on", `mode=${snap.mode}`);
    push(
      "activation-true",
      snap.activation === "true",
      `activation=${snap.activation}`,
    );
  } else if (expectedMode === "shadow") {
    push("shadow-root", snap.shadowRoot && !snap.onRoot, "legacy writer");
    push("regions-0", snap.regions === 0, `regions=${snap.regions}`);
    push("mode-shadow", snap.mode === "shadow", `mode=${snap.mode}`);
    push(
      "activation-false",
      snap.activation === "false",
      `activation=${snap.activation}`,
    );
  } else {
    push("off-shadow-root", snap.shadowRoot && !snap.onRoot, "legacy off path");
    push("mode-off", snap.mode === "off", `mode=${snap.mode}`);
    push("regions-0", snap.regions === 0, `regions=${snap.regions}`);
  }

  return { snap, checks };
}

async function continuitySequence(page) {
  const results = [];

  await page.focus("[data-aw-harness-input]");
  await page.type("[data-aw-harness-input]", "phase2g-continuity");
  await page.click("[data-aw-harness-disclosure]");

  const before = await snapshotTree(page);
  results.push({ step: "after-local-state", before });

  // Width resize across profiles
  for (const vp of [
    { width: 390, height: 844 },
    { width: 800, height: 900 },
    { width: 1200, height: 800 },
    { width: 1500, height: 900 },
    { width: 1280, height: 479 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewport(vp);
    await new Promise((r) => setTimeout(r, 350));
  }

  const afterResize = await snapshotTree(page);
  void afterResize;
  const inputValue = await page.$eval(
    "[data-aw-harness-input]",
    (el) => el.value,
  );
  const disclosureOpen = await page.$(
    "[data-aw-harness-disclosure-body]",
  );

  // Scroll then resize — Workspace must not reset scrollY
  await page.focus("[data-aw-harness-input]");
  await page.evaluate(() => window.scrollTo(0, 200));
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.setViewport({ width: 1100, height: 800 });
  await new Promise((r) => setTimeout(r, 350));
  const scrollAfter = await page.evaluate(() => window.scrollY);
  const focusAfterScrollResize = await page.evaluate(
    () => document.activeElement?.id ?? null,
  );

  // Identical geometry: re-apply same viewport; resolve count should stabilize
  const mid = await snapshotTree(page);
  const resolveBefore = mid.resolveCount;
  await page.setViewport({ width: 1100, height: 800 });
  await new Promise((r) => setTimeout(r, 500));
  const afterIdentical = await snapshotTree(page);

  results.push({
    step: "continuity",
    mounts: afterIdentical.probe.mounts,
    unmounts: afterIdentical.probe.unmounts,
    inputValue,
    disclosureOpen: Boolean(disclosureOpen),
    focusId: focusAfterScrollResize,
    scrollBefore,
    scrollAfter,
    resolveBefore,
    resolveAfterIdentical: afterIdentical.resolveCount,
    resolveDelta: afterIdentical.resolveCount - resolveBefore,
    profile: afterIdentical.profile,
  });

  return results;
}

async function isolationCheck(page, baseUrl) {
  const routes = ["/", "/notifications", "/messages", "/profile"];
  const out = [];
  for (const route of routes) {
    const res = await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 500));
    const found = await page.evaluate(() => ({
      onRoot: Boolean(document.querySelector("[data-aw-settings-on-root]")),
      harness: Boolean(
        document.querySelector("[data-aw-settings-harness-page]"),
      ),
      region: document.querySelectorAll("[data-aw-region]").length,
      settingsHubHost: document.querySelectorAll(
        '[data-aw-widget-id="settings.hub"]',
      ).length,
    }));
    out.push({
      route,
      status: res?.status() ?? null,
      ...found,
      isolated:
        !found.onRoot &&
        !found.harness &&
        found.region === 0 &&
        found.settingsHubHost === 0,
    });
  }
  return out;
}

async function main() {
  const { baseUrl, mode, outDir, reportName } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const consoleIssues = collectConsole(page);

  const report = {
    measuredAt: new Date().toISOString(),
    baseUrl,
    expectedMode: mode,
    browser: "chromium-puppeteer",
    viewports: [],
    profileBoundaries: [],
    continuity: null,
    isolation: null,
    consoleIssues: [],
    modeChecks: null,
    screenshots: [],
    pass: false,
  };

  try {
    await page.setViewport({ width: 1280, height: 800 });
    const res = await page.goto(`${baseUrl}/aw-settings-harness`, {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    report.initialStatus = res?.status() ?? null;
    await new Promise((r) => setTimeout(r, 800));

    report.modeChecks = await runModeChecks(page, mode);

    // Viewport matrix + screenshots for key sizes
    const shotNames = new Set([
      "desktop-1440x900",
      "desktop-1024x768",
      "mobile-390x844",
      "short-1280x600",
      "short-430x650",
    ]);
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise((r) => setTimeout(r, 300));
      const snap = await snapshotTree(page);
      const entry = {
        ...vp,
        mounts: snap.probe.mounts,
        unmounts: snap.probe.unmounts,
        children: snap.children,
        onRoot: snap.onRoot,
        shadowRoot: snap.shadowRoot,
        profile: snap.profile,
        visible: snap.harnessPresent && snap.children === 1,
      };
      report.viewports.push(entry);
      if (shotNames.has(vp.name)) {
        const file = join(outDir, `phase2g-${mode}-${vp.name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        report.screenshots.push(file);
      }
    }

    // Reset and continuity
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}/aw-settings-harness`, {
      waitUntil: "networkidle0",
      timeout: 90000,
    });
    await new Promise((r) => setTimeout(r, 500));
    report.continuity = await continuitySequence(page);

    for (const b of PROFILE_BOUNDARIES) {
      await page.setViewport({ width: b.width, height: b.height });
      await new Promise((r) => setTimeout(r, 300));
      const snap = await snapshotTree(page);
      report.profileBoundaries.push({
        ...b,
        profile: snap.profile,
        mounts: snap.probe.mounts,
        unmounts: snap.probe.unmounts,
        regionIdsOk: snap.regions === (mode === "on" ? 1 : 0),
      });
    }

    report.isolation = await isolationCheck(page, baseUrl);

    // settings route smoke (auth redirect expected when unauthenticated)
    try {
      const settingsRes = await page.goto(`${baseUrl}/settings`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      report.settingsSmoke = {
        status: settingsRes?.status() ?? null,
        url: page.url(),
        redirectedToLogin: /login/i.test(page.url()),
        aborted: false,
      };
    } catch (err) {
      report.settingsSmoke = {
        status: null,
        url: page.url(),
        redirectedToLogin: /login/i.test(page.url()),
        aborted: true,
        error: String(err?.message || err).slice(0, 200),
      };
    }

    report.consoleIssues = consoleIssues;
    const modeOk = (report.modeChecks?.checks ?? []).every((c) => c.ok);
    const continuity = report.continuity?.find((c) => c.step === "continuity");
    const contOk =
      continuity &&
      continuity.mounts === 1 &&
      continuity.unmounts === 0 &&
      continuity.inputValue === "phase2g-continuity" &&
      continuity.disclosureOpen === true &&
      continuity.scrollAfter === continuity.scrollBefore &&
      (continuity.resolveDelta ?? 0) <= 1;
    const viewportOk = report.viewports.every(
      (v) => v.visible && v.unmounts === 0 && v.mounts === 1,
    );
    const boundaryOk = report.profileBoundaries.every(
      (b) => b.unmounts === 0 && b.mounts === 1,
    );
    const isolationOk = (report.isolation ?? []).every((r) => r.isolated);
    const hydrationOk = !consoleIssues.some((i) =>
      /hydration|did not match/i.test(i.text),
    );

    report.pass =
      modeOk &&
      contOk &&
      viewportOk &&
      boundaryOk &&
      isolationOk &&
      hydrationOk &&
      report.initialStatus === 200;

    report.summary = {
      modeOk,
      contOk,
      viewportOk,
      boundaryOk,
      isolationOk,
      hydrationOk,
    };
  } finally {
    await browser.close();
  }

  const outFile = join(
    outDir,
    reportName || `phase2g-browser-${mode}.json`,
  );
  writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ outFile, pass: report.pass, summary: report.summary }, null, 2));
  if (!report.pass) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
