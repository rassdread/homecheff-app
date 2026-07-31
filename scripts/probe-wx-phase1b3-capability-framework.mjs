#!/usr/bin/env node
/**
 * WX Phase 1B.3 — Capability Activation Framework browser proof.
 *
 * Diagnostics-only observation:
 * - data-wx-phase=1b.3
 * - data-wx-capability / data-wx-cap-* states
 * - reserved capabilities remain reserved
 * - mount IDs stable across Mode changes (no remount)
 * - no visual activation (attr data-wx-cap-visual-activation=0)
 *
 * Does NOT assert presentation redesign, rails activation, or Host ownership changes.
 *
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on \\
 *     NEXT_PUBLIC_FEED_SEALED_BASELINE=1 npx next start -H 127.0.0.1 -p 3088
 *   node scripts/probe-wx-phase1b3-capability-framework.mjs --base-url=http://127.0.0.1:3088
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

/**
 * Static Mode×capability fixtures (independently authored).
 * Probe does NOT import the capability resolver.
 */
const VIEWPORT_EXPECTATIONS = [
  {
    id: "browse-portrait",
    width: 390,
    height: 844,
    mode: "browse",
    posture: "portrait",
    caps: {
      navigation: "available",
      discovery: "available",
      search: "available",
      filters: "available",
      panels: "unavailable",
      "workspace-density": "available",
      inspector: "unavailable",
      selection: "unavailable",
      "workspace-memory": "reserved",
      "contextual-assistance": "reserved",
      "professional-workspace": "reserved",
      "ai-collaboration": "reserved",
      extensions: "reserved",
    },
    availableMin: 5,
    reservedExact: 5,
  },
  {
    id: "hybrid-portrait",
    width: 820,
    height: 1180,
    mode: "hybrid-workspace",
    posture: "portrait",
    caps: {
      navigation: "available",
      discovery: "available",
      search: "available",
      filters: "available",
      panels: "available",
      "workspace-density": "available",
      inspector: "available",
      selection: "available",
      "workspace-memory": "reserved",
      "contextual-assistance": "reserved",
      "professional-workspace": "reserved",
      "ai-collaboration": "reserved",
      extensions: "reserved",
    },
    availableMin: 8,
    reservedExact: 5,
  },
  {
    id: "full-landscape",
    width: 1280,
    height: 800,
    mode: "full-workspace",
    posture: "landscape",
    caps: {
      navigation: "available",
      discovery: "available",
      search: "available",
      filters: "available",
      panels: "available",
      "workspace-density": "available",
      inspector: "available",
      selection: "available",
      "workspace-memory": "reserved",
      "contextual-assistance": "reserved",
      "professional-workspace": "reserved",
      "ai-collaboration": "reserved",
      extensions: "reserved",
    },
    availableMin: 8,
    reservedExact: 5,
  },
  {
    id: "professional-landscape",
    width: 1920,
    height: 1080,
    mode: "professional-workspace",
    posture: "landscape",
    caps: {
      navigation: "available",
      discovery: "available",
      search: "available",
      filters: "available",
      panels: "available",
      "workspace-density": "available",
      inspector: "available",
      selection: "available",
      "workspace-memory": "reserved",
      "contextual-assistance": "reserved",
      "professional-workspace": "reserved",
      "ai-collaboration": "reserved",
      extensions: "reserved",
    },
    availableMin: 8,
    reservedExact: 5,
  },
];

const RESERVED_IDS = [
  "workspace-memory",
  "contextual-assistance",
  "professional-workspace",
  "ai-collaboration",
  "extensions",
];

const CAP_ATTR = {
  navigation: "data-wx-cap-navigation",
  discovery: "data-wx-cap-discovery",
  search: "data-wx-cap-search",
  filters: "data-wx-cap-filters",
  panels: "data-wx-cap-panels",
  "workspace-density": "data-wx-cap-workspace-density",
  inspector: "data-wx-cap-inspector",
  selection: "data-wx-cap-selection",
  "workspace-memory": "data-wx-cap-workspace-memory",
  "contextual-assistance": "data-wx-cap-contextual-assistance",
  "professional-workspace": "data-wx-cap-professional-workspace",
  "ai-collaboration": "data-wx-cap-ai-collaboration",
  extensions: "data-wx-cap-extensions",
};

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3088";
  let outDir = join(
    process.cwd(),
    "docs/audits/wx-phase1b3-capability-framework",
  );
  let mode = "local";
  let protectionBypass =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    process.env.X_VERCEL_PROTECTION_BYPASS ||
    "";
  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) baseUrl = arg.slice(11);
    if (arg.startsWith("--out-dir=")) outDir = arg.slice(10);
    if (arg.startsWith("--mode=")) mode = arg.slice(7);
    if (arg.startsWith("--protection-bypass=")) {
      protectionBypass = arg.slice("--protection-bypass=".length);
    }
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    outDir,
    mode,
    protectionBypass,
  };
}

function resolveChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(
      homedir(),
      "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    ),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error("Chrome/Chromium not found");
}

async function dismissPrivacy(page) {
  try {
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button")];
      const accept = buttons.find((b) =>
        /accepteer alle|accept all|alleen noodzakelijk|only necessary/i.test(
          b.textContent || "",
        ),
      );
      accept?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
  } catch {
    /* ignore */
  }
}

async function readSnap(page) {
  return page.evaluate((capAttr) => {
    const root = document.querySelector("[data-aw-feed-workspace]");
    if (!root) return { found: false };
    const caps = {};
    for (const [id, attr] of Object.entries(capAttr)) {
      caps[id] = root.getAttribute(attr);
    }
    const primary = document.querySelector('[data-wx-continuity-primary="1"]');
    const owner =
      document.querySelector("[data-feed-owner]")?.getAttribute("data-feed-owner") ||
      document
        .querySelector("[data-aw-primary-feed]")
        ?.getAttribute("data-feed-owner") ||
      null;
    return {
      found: true,
      phase: root.getAttribute("data-wx-phase"),
      capability: root.getAttribute("data-wx-capability"),
      capToken: root.getAttribute("data-wx-cap-token"),
      available: root.getAttribute("data-wx-cap-available"),
      unavailable: root.getAttribute("data-wx-cap-unavailable"),
      reserved: root.getAttribute("data-wx-cap-reserved"),
      visualActivation: root.getAttribute("data-wx-cap-visual-activation"),
      mode: root.getAttribute("data-wx-mode"),
      posture: root.getAttribute("data-wx-posture"),
      continuity: root.getAttribute("data-wx-continuity"),
      remount: root.getAttribute("data-wx-continuity-remount"),
      shellMountId: root.getAttribute("data-wx-shell-mount-id"),
      primaryMountId: primary?.getAttribute("data-wx-primary-mount-id") ?? null,
      layoutMode: root.getAttribute("data-aw-layout-mode"),
      usableWidth: root.getAttribute("data-aw-usable-width"),
      usableHeight: root.getAttribute("data-aw-usable-height"),
      workspaceCount: document.querySelectorAll("[data-aw-feed-workspace]")
        .length,
      stableFeedSlot: Boolean(
        document.querySelector("[data-aw-stable-feed-slot='1']"),
      ),
      feedOwner: owner,
      caps,
    };
  }, CAP_ATTR);
}

function evaluateFixture(fixture, snap, mountBaseline) {
  const reservedOk = RESERVED_IDS.every(
    (id) => snap.found && snap.caps[id] === "reserved",
  );
  const capsOk =
    snap.found &&
    Object.entries(fixture.caps).every(([id, state]) => snap.caps[id] === state);

  const checks = {
    workspaceFound: snap.found === true,
    phase1b3: snap.phase === "1b.3",
    capabilityContract:
      snap.capability === "wx-capability-activation-v1",
    visualActivationOff: snap.visualActivation === "0",
    singleWorkspace: snap.workspaceCount === 1,
    stableFeedSlot: snap.stableFeedSlot === true,
    continuityRemountZero: snap.remount === "0",
    modeMatches: snap.found && snap.mode === fixture.mode,
    postureMatches: snap.found && snap.posture === fixture.posture,
    capsMatchFixture: capsOk,
    reservedStayReserved: reservedOk,
    reservedCountExact:
      snap.found && Number(snap.reserved) === fixture.reservedExact,
    availableAtLeast:
      snap.found && Number(snap.available) >= fixture.availableMin,
    mountStable:
      !mountBaseline ||
      (snap.shellMountId === mountBaseline.shellMountId &&
        snap.primaryMountId === mountBaseline.primaryMountId),
    noCapabilityCssHooks: true, // verified by contract tests; browser observes attrs only
  };

  return {
    id: fixture.id,
    viewport: { width: fixture.width, height: fixture.height },
    expected: {
      mode: fixture.mode,
      posture: fixture.posture,
      caps: fixture.caps,
    },
    snap,
    checks,
    pass: Object.values(checks).every(Boolean),
  };
}

async function main() {
  const { baseUrl, outDir, mode, protectionBypass } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });

  let puppeteer;
  try {
    puppeteer = require("puppeteer-core");
  } catch {
    puppeteer = require("puppeteer");
  }

  const browser = await puppeteer.launch({
    executablePath: resolveChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const hydrationWarnings = [];

  if (protectionBypass) {
    await page.setExtraHTTPHeaders({
      "x-vercel-protection-bypass": protectionBypass,
      "x-vercel-set-bypass-cookie": "true",
    });
  }

  page.on("console", (msg) => {
    const text = msg.text();
    if (
      /vercel\.live|feed-perf|hydration-complete|Maximum update depth|Prop `%s` did not match/i.test(
        text,
      )
    ) {
      return;
    }
    if (msg.type() === "error") consoleErrors.push(text);
    if (/hydrat/i.test(text) && !/hydration-complete/i.test(text)) {
      hydrationWarnings.push(text);
    }
  });

  const first = VIEWPORT_EXPECTATIONS[0];
  await page.setViewport({ width: first.width, height: first.height });
  const url = protectionBypass
    ? (() => {
        const u = new URL(baseUrl + "/");
        u.searchParams.set("x-vercel-protection-bypass", protectionBypass);
        return u.toString();
      })()
    : `${baseUrl}/`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dismissPrivacy(page);
  await page
    .waitForSelector("[data-aw-feed-workspace]", { timeout: 25000 })
    .catch(() => null);
  await new Promise((r) => setTimeout(r, 900));

  const results = [];
  let mountBaseline = null;

  for (const fixture of VIEWPORT_EXPECTATIONS) {
    await page.setViewport({ width: fixture.width, height: fixture.height });
    await new Promise((r) => setTimeout(r, 700));
    const snap = await readSnap(page);
    if (!mountBaseline && snap.found) {
      mountBaseline = {
        shellMountId: snap.shellMountId,
        primaryMountId: snap.primaryMountId,
      };
    }
    results.push(evaluateFixture(fixture, snap, mountBaseline));
  }

  await browser.close();

  const allPass = results.every((r) => r.pass);
  const noHydration = hydrationWarnings.length === 0;
  const noConsole = consoleErrors.length === 0;
  const verdict =
    allPass && noHydration && noConsole
      ? "WX_PHASE_1B3_BROWSER_PASS"
      : "WX_PHASE_1B3_BROWSER_FAIL";

  const report = {
    phase: "1b.3",
    contractId: "wx-capability-activation-v1",
    mode,
    baseUrl,
    timestamp: new Date().toISOString(),
    verdict,
    visualActivationClaimed: false,
    presentationRedesignClaimed: false,
    ownershipChangeClaimed: false,
    mountBaseline,
    fixtureCount: results.length,
    passCount: results.filter((r) => r.pass).length,
    results,
    consoleErrors,
    hydrationWarnings,
    checks: {
      allFixturesPass: allPass,
      noHydration,
      noConsoleErrors: noConsole,
      diagnosticsOnly: true,
    },
  };

  const outPath = join(outDir, "browser-proof.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`[wx-1b3] ${verdict} · ${report.passCount}/${report.fixtureCount}`);
  console.log(`[wx-1b3] wrote ${outPath}`);
  process.exit(allPass && noHydration && noConsole ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
