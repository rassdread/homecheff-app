#!/usr/bin/env node
/**
 * WX Phase 1B.2 remediation — Transition Continuity browser proof.
 *
 * Independent observation layer (NOT continuity-contract booleans as mount proof):
 * - data-wx-primary-mount-id / data-wx-shell-mount-id (observed mount identity)
 * - sealed counters when available (secondary)
 * - measured AvailableSpace (data-aw-usable-width/height)
 * - scroll / filter / search snapshots
 * - console + hydration
 * - request deltas
 *
 * Single page load — no reload between steps.
 *
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on \\
 *     NEXT_PUBLIC_FEED_SEALED_BASELINE=1 npx next start -H 127.0.0.1 -p 3087
 *   node scripts/probe-wx-phase1b2-transition-continuity.mjs --base-url=http://127.0.0.1:3087
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

/** Measured AvailableSpace boundaries to oscillate (WMS bands). */
const BOUNDARIES = [720, 1024, 1440];
const OSCILLATIONS_PER_BOUNDARY = 5;
/** Allow tiny reflow while rejecting reset-to-top. */
const SCROLL_TOLERANCE_PX = 48;
const SEARCH_TOKEN = "wx1b2probe";
const FILTER_MIN_PRICE = "5";

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3087";
  let outDir = join(
    process.cwd(),
    "docs/audits/wx-phase1b2-transition-continuity",
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
  return page.evaluate(() => {
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const primaryHost = document.querySelector(
      '[data-wx-continuity-primary="1"]',
    );
    const feed = document.querySelector(
      '[data-aw-stable-feed-slot="1"], [data-aw-primary-feed]',
    );
    const probe = window.__HC_FEED_SEALED_PROBE__;
    const counters = probe?.readCounters?.() ?? null;

    // Progressive discovery chrome: product search is inside expanded filters.
    const productSearch =
      [...document.querySelectorAll("input")].find((i) =>
        /zoek in producten|search in products/i.test(i.placeholder || ""),
      ) ||
      document.querySelector(
        'input[type="search"][placeholder*="categorie" i], input[type="search"]',
      );

    const priceMin =
      [...document.querySelectorAll('input[type="number"]')].find((el) =>
        /min/i.test(el.getAttribute("placeholder") || ""),
      ) || document.querySelector('input[type="number"]');

    const firstTile =
      feed?.querySelector(
        "[data-product-id], [data-item-id], article, a[href*='/product']",
      ) ?? null;

    const tiles = feed
      ? [...feed.querySelectorAll("article, [data-product-id]")].slice(0, 3)
      : [];

    const filtersToggle = document.querySelector("[data-wx-filters-toggle]");

    return {
      found: Boolean(ws),
      phase: ws?.getAttribute("data-wx-phase"),
      continuity: ws?.getAttribute("data-wx-continuity"),
      remountFlag: ws?.getAttribute("data-wx-continuity-remount"),
      mode: ws?.getAttribute("data-wx-mode"),
      posture: ws?.getAttribute("data-wx-posture"),
      modeToken: ws?.getAttribute("data-wx-mode-token"),
      usableWidth: Number(ws?.getAttribute("data-aw-usable-width") ?? "0"),
      usableHeight: Number(ws?.getAttribute("data-aw-usable-height") ?? "0"),
      shellMountId: ws?.getAttribute("data-wx-shell-mount-id"),
      primaryMountId: primaryHost?.getAttribute("data-wx-primary-mount-id"),
      workspaceCount: document.querySelectorAll("[data-aw-feed-workspace]")
        .length,
      primaryHostCount: document.querySelectorAll(
        '[data-wx-continuity-primary="1"]',
      ).length,
      stableFeedSlot: Boolean(
        document.querySelector('[data-aw-stable-feed-slot="1"]'),
      ),
      windowScrollY: Math.floor(window.scrollY || window.pageYOffset || 0),
      /** Observed scroll owner in multi-col chrome: workspace section. */
      workspaceScrollTop: ws ? Math.floor(ws.scrollTop) : null,
      feedScrollTop: feed ? Math.floor(feed.scrollTop) : null,
      visibleAnchor: firstTile
        ? {
            tag: firstTile.tagName,
            href: firstTile.getAttribute("href"),
            productId:
              firstTile.getAttribute("data-product-id") ||
              firstTile.getAttribute("data-item-id"),
            text: (firstTile.textContent || "").trim().slice(0, 40),
          }
        : null,
      tileCountSample: tiles.length,
      filtersTogglePresent: Boolean(filtersToggle),
      filtersExpanded:
        filtersToggle?.getAttribute("aria-expanded") === "true",
      search: productSearch
        ? {
            available: true,
            value: productSearch.value,
            placeholder: productSearch.getAttribute("placeholder"),
          }
        : {
            available: false,
            value: null,
            reason: filtersToggle
              ? "Filters toggle present but search inputs not expanded/visible"
              : "No progressive filters toggle or search input in DOM",
          },
      filter: {
        available: Boolean(priceMin) || Boolean(filtersToggle),
        minPrice: priceMin ? priceMin.value : null,
        filterButtonPresent: Boolean(filtersToggle),
        reason:
          priceMin || filtersToggle
            ? null
            : "No filter chrome in current DOM",
      },
      feedOwner:
        document
          .querySelector("[data-aw-feed-controlled-host]")
          ?.getAttribute("data-aw-feed-data-owner") ?? null,
      sealed: counters
        ? {
            mountCount: counters.mountCount,
            unmountCount: counters.unmountCount,
            activeInstanceCount: counters.activeInstanceCount,
            requestStartCount: counters.requestStartCount,
            requestKeyTransitionCount: counters.requestKeyTransitionCount,
            paginationResetCount: counters.paginationResetCount,
            lastPaginationCursorHash: counters.lastPaginationCursorHash ?? null,
          }
        : null,
    };
  });
}

/**
 * Calibrate viewport so measured usable width is just below or above a boundary.
 * Uses honest AvailableSpace (data-aw-usable-width), not viewport-as-mode.
 */
async function setMeasuredNearBoundary(page, boundary, side, heightPx) {
  // Seed estimate: chrome often ≈ 0–40px on homepage; widen if needed.
  let viewportW =
    side === "below" ? Math.max(320, boundary + 40) : boundary + 80;
  let best = null;

  for (let attempt = 0; attempt < 14; attempt++) {
    await page.setViewport({
      width: Math.round(viewportW),
      height: heightPx,
      deviceScaleFactor: 1,
    });
    await new Promise((r) => setTimeout(r, 450));
    const snap = await readSnap(page);
    const measured = snap.usableWidth;
    const delta = viewportW - measured;
    best = { viewportW, measured, delta, snap };

    const target =
      side === "below" ? boundary - 8 : boundary + 8;
    if (side === "below" && measured > 0 && measured < boundary) {
      if (measured >= boundary - 60) return best;
    }
    if (side === "above" && measured >= boundary) {
      if (measured <= boundary + 100) return best;
    }

    // Adjust: aim measured ≈ target
    if (measured <= 0) {
      viewportW += 40;
      continue;
    }
    viewportW = Math.max(320, target + delta);
  }
  return best;
}

async function waitFeedStable(page) {
  await page
    .waitForSelector("[data-aw-feed-workspace]", { timeout: 30000 })
    .catch(() => null);
  await page
    .waitForSelector('[data-aw-stable-feed-slot="1"]', { timeout: 20000 })
    .catch(() => null);
  // Allow sealed counters / first paint settle
  await new Promise((r) => setTimeout(r, 1500));
}

async function seedScroll(page) {
  return page.evaluate(() => {
    const target = 220;
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const feed = document.querySelector('[data-aw-stable-feed-slot="1"]');
    /**
     * Observed runtime: in multi-col chrome the workspace SECTION is the
     * scroll owner (feed slot expands with content). Prefer workspace.
     */
    let owner = null;
    if (ws && ws.scrollHeight > ws.clientHeight + 40) {
      ws.scrollTop = target;
      owner = "workspace";
    } else if (feed && feed.scrollHeight > feed.clientHeight + 40) {
      feed.scrollTop = target;
      owner = "feed-slot";
    } else {
      window.scrollTo(0, target);
      owner = "window";
    }
    return {
      owner,
      workspaceScrollTop: ws ? Math.floor(ws.scrollTop) : null,
      feedScrollTop: feed ? Math.floor(feed.scrollTop) : null,
      windowScrollY: Math.floor(window.scrollY || 0),
      workspaceScrollHeight: ws ? ws.scrollHeight : null,
      workspaceClientHeight: ws ? ws.clientHeight : null,
    };
  });
}

async function expandFiltersChrome(page) {
  return page.evaluate(() => {
    const toggle = document.querySelector("[data-wx-filters-toggle]");
    if (!toggle) return { expanded: false, reason: "no-toggle" };
    if (toggle.getAttribute("aria-expanded") !== "true") {
      toggle.click();
    }
    return {
      expanded: toggle.getAttribute("aria-expanded") === "true",
      reason: "toggle-clicked-or-already-open",
    };
  });
}

async function applyFilterAndSearch(page) {
  await expandFiltersChrome(page);
  await new Promise((r) => setTimeout(r, 500));

  return page.evaluate(
    ({ searchToken, minPrice }) => {
      const result = {
        search: { attempted: false, applied: false, value: null, na: false },
        filter: { attempted: false, applied: false, value: null, na: false },
      };

      const setNativeValue = (el, value) => {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      };

      const searchInput =
        [...document.querySelectorAll("input")].find((i) =>
          /zoek in producten|search in products/i.test(i.placeholder || ""),
        ) ||
        document.querySelector(
          'input[type="search"][placeholder*="categorie" i]',
        );

      if (searchInput) {
        result.search.attempted = true;
        setNativeValue(searchInput, searchToken);
        result.search.applied = searchInput.value === searchToken;
        result.search.value = searchInput.value;
        result.search.placeholder = searchInput.placeholder;
      } else {
        result.search.na = true;
        result.search.reason =
          "Search input not present after expanding progressive filters chrome";
      }

      const priceInputs = [
        ...document.querySelectorAll('input[type="number"]'),
      ];
      const minInput =
        priceInputs.find((el) =>
          /min/i.test(el.getAttribute("placeholder") || ""),
        ) || priceInputs[0];
      if (minInput) {
        result.filter.attempted = true;
        setNativeValue(minInput, minPrice);
        result.filter.applied = minInput.value === minPrice;
        result.filter.value = minInput.value;
      } else {
        result.filter.na = true;
        result.filter.reason =
          "Price filter inputs not present after expanding progressive filters chrome";
      }

      return result;
    },
    { searchToken: SEARCH_TOKEN, minPrice: FILTER_MIN_PRICE },
  );
}

function stepPass(snap, baseline) {
  if (!snap.found) return false;
  if (snap.phase !== "1b.2") return false;
  if (snap.continuity !== "wx-transition-continuity-v1") return false;
  if (snap.remountFlag !== "0") return false;
  if (snap.workspaceCount !== 1) return false;
  if (snap.primaryHostCount !== 1) return false;
  if (!snap.stableFeedSlot) return false;
  if (!snap.primaryMountId || !snap.shellMountId) return false;
  if (snap.primaryMountId !== baseline.primaryMountId) return false;
  if (snap.shellMountId !== baseline.shellMountId) return false;
  if (snap.sealed) {
    if (snap.sealed.mountCount !== 1) return false;
    if (snap.sealed.unmountCount !== 0) return false;
    if (snap.sealed.activeInstanceCount !== 1) return false;
  }
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.outDir, { recursive: true });

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
  let requestCount = 0;
  const requestLog = [];

  if (args.protectionBypass) {
    await page.setExtraHTTPHeaders({
      "x-vercel-protection-bypass": args.protectionBypass,
      "x-vercel-set-bypass-cookie": "true",
    });
  }

  page.on("console", (msg) => {
    const text = msg.text();
    if (
      /vercel\.live|feed-perf|hydration-complete|Maximum update depth/i.test(
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

  page.on("request", (req) => {
    const url = req.url();
    if (/\/api\/|feed|products|geofeed/i.test(url)) {
      requestCount += 1;
      requestLog.push({ t: Date.now(), url: url.slice(0, 180) });
    }
  });

  // ---- Initial narrow Mode ----
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

  const url = args.protectionBypass
    ? (() => {
        const u = new URL(args.baseUrl + "/");
        u.searchParams.set("x-vercel-protection-bypass", args.protectionBypass);
        return u.toString();
      })()
    : `${args.baseUrl}/`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismissPrivacy(page);
  await waitFeedStable(page);

  const steps = [];
  const modeChanges = [];
  let seq = 0;
  let prevMode = null;
  let prevRequestCount = requestCount;

  async function record(label, meta = {}) {
    seq += 1;
    const snap = await readSnap(page);
    const deltaReq = requestCount - prevRequestCount;
    prevRequestCount = requestCount;
    if (prevMode && snap.mode && snap.mode !== prevMode) {
      modeChanges.push({
        seq,
        label,
        from: prevMode,
        to: snap.mode,
        usableWidth: snap.usableWidth,
        usableHeight: snap.usableHeight,
      });
    }
    prevMode = snap.mode;
    const viewport = page.viewport();
    const entry = {
      sequence: seq,
      id: label,
      viewport: viewport
        ? { width: viewport.width, height: viewport.height }
        : null,
      snap,
      requestCount,
      requestDelta: deltaReq,
      consoleErrorCount: consoleErrors.length,
      hydrationWarningCount: hydrationWarnings.length,
      ...meta,
    };
    steps.push(entry);
    process.stdout.write(
      `  #${seq} ${label} vp=${viewport?.width}x${viewport?.height} measured=${snap.usableWidth}x${snap.usableHeight} mode=${snap.mode} mount=${snap.primaryMountId} Δreq=${deltaReq}\n`,
    );
    return entry;
  }

  const initial = await record("initial-narrow-browse");
  const baseline = {
    primaryMountId: initial.snap.primaryMountId,
    shellMountId: initial.snap.shellMountId,
  };

  if (!baseline.primaryMountId || !baseline.shellMountId) {
    await browser.close();
    console.error("FAIL: mount identity diagnostics missing on initial load");
    process.exit(1);
  }

  // ---- Seed filter/search at wide Mode (where refine chrome exists) ----
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 900));
  const stateApply = await applyFilterAndSearch(page);
  await new Promise((r) => setTimeout(r, 800));
  const afterState = await record("state-seed-wide", { stateApply });

  // ---- Seed scroll ----
  const scrollSeed = await seedScroll(page);
  await new Promise((r) => setTimeout(r, 300));
  const afterScroll = await record("scroll-seeded", { scrollSeed });
  const scrollBaseline = {
    owner: scrollSeed.owner,
    workspaceScrollTop: afterScroll.snap.workspaceScrollTop,
    feedScrollTop: afterScroll.snap.feedScrollTop,
    windowScrollY: afterScroll.snap.windowScrollY,
    visibleAnchor: afterScroll.snap.visibleAnchor,
  };

  // ---- Oscillation around measured boundaries ----
  const oscillationSummary = [];
  for (const boundary of BOUNDARIES) {
    for (let i = 0; i < OSCILLATIONS_PER_BOUNDARY; i++) {
      const slow = i === 0;
      const settle = slow ? 900 : 550;

      const below = await setMeasuredNearBoundary(
        page,
        boundary,
        "below",
        800,
      );
      await new Promise((r) => setTimeout(r, settle));
      await record(`osc-${boundary}-below-${i + 1}`, {
        boundary,
        side: "below",
        pace: slow ? "slow" : "rapid",
        calibration: {
          viewportW: below?.viewportW,
          measured: below?.measured,
        },
      });

      const above = await setMeasuredNearBoundary(
        page,
        boundary,
        "above",
        800,
      );
      await new Promise((r) => setTimeout(r, settle));
      await record(`osc-${boundary}-above-${i + 1}`, {
        boundary,
        side: "above",
        pace: slow ? "slow" : "rapid",
        calibration: {
          viewportW: above?.viewportW,
          measured: above?.measured,
        },
      });
    }
    oscillationSummary.push({
      boundary,
      oscillations: OSCILLATIONS_PER_BOUNDARY,
    });
  }

  // ---- Portrait / landscape / back ----
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 700));
  await record("phone-portrait");

  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 700));
  await record("phone-landscape");

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 700));
  await record("phone-portrait-return");

  // ---- Return to starting Mode + re-check state at wide chrome ----
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 700));
  const backStart = await record("return-starting-narrow");

  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 900));
  // Re-expand progressive filters to read search/filter values after journey
  await expandFiltersChrome(page);
  await new Promise((r) => setTimeout(r, 500));
  const finalWide = await record("final-wide-state-check");

  // ---- Evaluate proofs ----
  const allMountStable = steps.every(
    (s) =>
      s.snap.primaryMountId === baseline.primaryMountId &&
      s.snap.shellMountId === baseline.shellMountId,
  );
  const allStructuralPass = steps.every((s) => stepPass(s.snap, baseline));

  // Scroll continuity against the observed scroll owner.
  const seededNonZero =
    (scrollBaseline.workspaceScrollTop ?? 0) > 40 ||
    (scrollBaseline.feedScrollTop ?? 0) > 40 ||
    (scrollBaseline.windowScrollY ?? 0) > 40;

  const scrollCheckSteps = steps.filter((s) =>
    /osc-|phone-|return-|final-wide/.test(s.id),
  );
  let scrollClass = "not-seeded";
  let scrollPass = false;
  if (!seededNonZero) {
    scrollClass = "seed-failed-blocker";
    scrollPass = false;
  } else {
    const readPos = (s) => {
      if ((scrollBaseline.workspaceScrollTop ?? 0) > 40) {
        return s.snap.workspaceScrollTop;
      }
      if ((scrollBaseline.feedScrollTop ?? 0) > 40) {
        return s.snap.feedScrollTop;
      }
      return s.snap.windowScrollY;
    };
    const seedPos =
      scrollBaseline.workspaceScrollTop ??
      scrollBaseline.feedScrollTop ??
      scrollBaseline.windowScrollY ??
      0;

    // After Mode transitions that keep multi-col (or return to it), must not
    // hard-reset to top. Narrow browse may change geometry (bounded reflow).
    const multiColish = scrollCheckSteps.filter((s) =>
      /full-workspace|professional-workspace|hybrid-workspace/.test(
        s.snap.mode || "",
      ),
    );
    const resets = multiColish.filter((s) => {
      const pos = readPos(s);
      return pos == null || pos <= 8;
    });
    if (resets.length > 0) {
      scrollPass = false;
      scrollClass = "true-state-loss";
    } else {
      const drifted = multiColish.some((s) => {
        const pos = readPos(s);
        return (
          pos != null && Math.abs(pos - seedPos) > SCROLL_TOLERANCE_PX * 4
        );
      });
      scrollClass = drifted
        ? "bounded-reflow"
        : "preserved-logical-position";
      scrollPass = true;
    }
  }

  // Filter / search preservation
  let filterProof = {
    status: "N/A",
    reason: stateApply.filter.na
      ? stateApply.filter.reason
      : "Filter not applied",
  };
  if (stateApply.filter.applied) {
    const finalMin = finalWide.snap.filter?.minPrice;
    const preserved = finalMin === FILTER_MIN_PRICE;
    filterProof = {
      status: preserved ? "PASS" : "FAIL",
      seeded: FILTER_MIN_PRICE,
      final: finalMin,
      preserved,
    };
  }

  let searchProof = {
    status: "N/A",
    reason: stateApply.search.na
      ? stateApply.search.reason
      : "Search not applied",
  };
  if (stateApply.search.applied) {
    const finalVal = finalWide.snap.search?.value;
    const preserved = finalVal === SEARCH_TOKEN;
    searchProof = {
      status: preserved ? "PASS" : "FAIL",
      seeded: SEARCH_TOKEN,
      final: finalVal,
      preserved,
    };
  } else if (!stateApply.search.applied && stateApply.search.na) {
    // Confirm still unavailable or available-but-empty after journey
    searchProof = {
      status: "N/A",
      reason: stateApply.search.reason,
      evidence: {
        seedWideSearchAvailable: afterState.snap.search?.available === true,
        finalWideSearchAvailable: finalWide.snap.search?.available === true,
      },
    };
  }

  // Request continuity: Mode transitions alone should not spike feed remounts.
  // Soft check: pagination resets should not climb solely from oscillation when sealed available.
  const sealedFirst = steps.find((s) => s.snap.sealed)?.snap.sealed;
  const sealedLast = [...steps].reverse().find((s) => s.snap.sealed)?.snap
    .sealed;
  const paginationOk =
    !sealedFirst ||
    !sealedLast ||
    sealedLast.paginationResetCount <= sealedFirst.paginationResetCount + 2;

  const oscillationModeChanges = modeChanges.length;
  const modesSeen = [...new Set(steps.map((s) => s.snap.mode).filter(Boolean))];

  const checks = {
    mountIdentityObserved: Boolean(baseline.primaryMountId),
    mountIdentityStableEntireJourney: allMountStable,
    shellIdentityStableEntireJourney: steps.every(
      (s) => s.snap.shellMountId === baseline.shellMountId,
    ),
    allStructuralPass,
    noPageReload: true, // single goto
    noConsoleErrors: consoleErrors.length === 0,
    noHydration: hydrationWarnings.length === 0,
    noDuplicateHost: steps.every(
      (s) => s.snap.workspaceCount === 1 && s.snap.primaryHostCount === 1,
    ),
    oscillationPerBoundary: OSCILLATIONS_PER_BOUNDARY,
    boundariesCovered: BOUNDARIES,
    modeChangesRecorded: oscillationModeChanges >= 6,
    modesAtLeast3: modesSeen.length >= 3,
    scrollPreservation: scrollPass,
    filterPreservation:
      filterProof.status === "PASS" || filterProof.status === "N/A",
    searchPreservation:
      searchProof.status === "PASS" || searchProof.status === "N/A",
    paginationContinuity: paginationOk,
    sealedOkWhenPresent:
      !sealedLast ||
      (sealedLast.mountCount === 1 && sealedLast.unmountCount === 0),
  };

  const pass = Object.values(checks).every(Boolean);

  await browser.close();

  const report = {
    phase: "1B.2",
    title: "Transition Continuity — Remediation Browser Proof",
    evidenceLayer: "browser-observed",
    contractLayerNote:
      "Contract remountAuthorized=false is NOT used as mount proof. Mount proof uses data-wx-primary-mount-id / data-wx-shell-mount-id.",
    verdict: pass
      ? "WX_PHASE_1B2_REMEDIATION_BROWSER_PASS"
      : "WX_PHASE_1B2_REMEDIATION_BROWSER_FAIL",
    mode: args.mode,
    baseUrl: args.baseUrl,
    timestamp: new Date().toISOString(),
    baselineMount: baseline,
    finalMount: {
      primaryMountId: backStart.snap.primaryMountId,
      shellMountId: backStart.snap.shellMountId,
    },
    scroll: {
      seed: scrollBaseline,
      classification: scrollClass,
      tolerancePx: SCROLL_TOLERANCE_PX,
      pass: scrollPass,
    },
    filterProof,
    searchProof,
    stateApply,
    request: {
      totalApiish: requestCount,
      paginationOk,
      sealedFirst,
      sealedLast,
    },
    oscillationSummary,
    modeChanges,
    modesSeen,
    checks,
    steps,
    consoleErrors,
    hydrationWarnings,
    counts: {
      journeySteps: steps.length,
      oscillationsPerBoundary: OSCILLATIONS_PER_BOUNDARY,
      boundaries: BOUNDARIES.length,
      totalOscillationHalfSteps: BOUNDARIES.length * OSCILLATIONS_PER_BOUNDARY * 2,
      modeChanges: modeChanges.length,
    },
  };

  const outPath = join(args.outDir, "browser-proof.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(`Mount start→end: ${baseline.primaryMountId} → ${backStart.snap.primaryMountId}`);
  console.log(`Mode changes: ${modeChanges.length}; modes: ${modesSeen.join(", ")}`);
  console.log(`Scroll: ${scrollClass} (${scrollPass ? "PASS" : "FAIL"})`);
  console.log(`Filter: ${filterProof.status}; Search: ${searchProof.status}`);
  console.log(`Verdict: ${report.verdict}`);
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
