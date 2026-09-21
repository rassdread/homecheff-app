/**
 * Geometry smoke: VerdienCheck last presets / result table / last control
 * must be able to scroll above the fixed HomeCheff bottom nav.
 *
 *   BASE_URL=https://homecheff.eu npx tsx scripts/test-verdiencheck-mobile-bottom-nav-geometry.ts
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, type Locator, type Page } from 'playwright';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyDirectResultMode,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';

const VERDIENCHECK_SESSION_KEY = 'hc_verdiencheck_v1';

function loadEnv(file: string) {
  const o: Record<string, string> = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    o[m[1]!] = v;
  }
  return o;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const BASE_URL = (process.env.BASE_URL || process.env.PROD_URL || 'https://homecheff.eu').replace(
  /\/$/,
  '',
);

function resultSessionState(): WizardState {
  let next: WizardState = {
    ...EMPTY_WIZARD_STATE,
    taxResidence: 'NL',
    activityChoice: 'MAKE',
    activityKinds: applyActivityChoice('MAKE'),
    ageTaxRegime: 'BELOW_AOW_2026',
    allowances: ['NONE'],
    currentIncomeEuro: '2646',
    currentIncomePeriod: 'MONTH',
    currentIncomeBasis: 'GROSS',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    hasOtherIncome: false,
    dutchHealthInsurance: true,
    hasPartner: false,
    rentsHome: false,
    hasChildren: false,
    assetsEligibility: 'ELIGIBLE',
    scenarioPreset: 10000,
  };
  next = applyGrowthStartChoice(next, 'OCCASIONAL_EARNING');
  next = applySituationGroup(next, 'EMPLOYEE');
  next = applyMoneyDepthChoice({ ...next, taxResidence: 'NL' }, 'YES');
  next = applyDirectResultMode({
    ...next,
    moneyDepthCompleted: true,
    scenarioLayerRequested: true,
    scenarioPreset: 10000,
  });
  return next;
}

type Box = { top: number; right: number; bottom: number; left: number; width: number; height: number };

function overlaps(a: Box, b: Box, slop = 1): boolean {
  return (
    a.bottom > b.top + slop &&
    a.top < b.bottom - slop &&
    a.right > b.left + slop &&
    a.left < b.right - slop
  );
}

async function seedAndOpen(page: Page) {
  const state = resultSessionState();
  await page.addInitScript(
    ({ key, payload }) => {
      sessionStorage.setItem(key, JSON.stringify(payload));
    },
    {
      key: VERDIENCHECK_SESSION_KEY,
      payload: { version: 1, currentStep: 'result', state },
    },
  );
  await page.goto(`${BASE_URL}/verdiencheck`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('#verdiencheck-money-result').waitFor({ state: 'visible', timeout: 30_000 });
}

async function navBox(page: Page): Promise<Box | null> {
  return page.evaluate(() => {
    const el =
      (document.querySelector('[data-hc-bottom-nav]') as HTMLElement | null) ??
      (document.querySelector('[data-hc-bottom-nav-shell]') as HTMLElement | null);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.height < 8 || r.width < 8) return null;
    return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
  });
}

async function boxOf(locator: Locator): Promise<Box> {
  await locator.waitFor({ state: 'visible', timeout: 15_000 });
  const box = await locator.boundingBox();
  if (!box) throw new Error('no box');
  return {
    top: box.y,
    left: box.x,
    right: box.x + box.width,
    bottom: box.y + box.height,
    width: box.width,
    height: box.height,
  };
}

async function scrollFullyAboveNav(page: Page, locator: Locator) {
  await locator.evaluate((el) => {
    el.scrollIntoView({ block: 'end', inline: 'nearest' });
  });
  await page.waitForTimeout(160);
}

async function clearOfNav(
  page: Page,
  locator: Locator,
  navExpected: boolean,
): Promise<{ visible: boolean; overlap: boolean; navPresent: boolean }> {
  await scrollFullyAboveNav(page, locator);
  const el = await boxOf(locator);
  const nav = await navBox(page);
  const vh = page.viewportSize()?.height ?? 0;
  const visible = el.bottom > 8 && el.height > 0 && (el.top < vh - 8 || el.bottom <= (nav?.top ?? vh));
  const overlap = navExpected && nav ? overlaps(el, nav) : false;
  return { visible, overlap, navPresent: Boolean(nav) };
}

type CaseResult = {
  name: string;
  lastPresetVisible: boolean;
  resultTableVisible: boolean;
  lastControlReachable: boolean;
  noOverlap: boolean;
  navPresent: boolean;
};

async function runCase(page: Page, name: string, navExpected: boolean): Promise<CaseResult> {
  await seedAndOpen(page);
  const lastPreset = page.locator('#verdiencheck-money-result button').filter({ hasText: '€10.000' });
  const table = page.locator('[data-verdiencheck-personal-delta]');
  const lastControl = page
    .locator('#verdiencheck-active-step button')
    .filter({ hasText: /^(Terug|Back)$/ });

  const presetHit = await clearOfNav(page, lastPreset, navExpected);
  const tableHit = await clearOfNav(page, table, navExpected);
  const lastHit = await clearOfNav(page, lastControl, navExpected);

  return {
    name,
    lastPresetVisible: presetHit.visible && !presetHit.overlap,
    resultTableVisible: tableHit.visible && !tableHit.overlap,
    lastControlReachable: lastHit.visible && !lastHit.overlap,
    noOverlap: !presetHit.overlap && !tableHit.overlap && !lastHit.overlap,
    navPresent: presetHit.navPresent || tableHit.navPresent || lastHit.navPresent,
  };
}

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

async function main() {
  const outDir = path.join(os.tmpdir(), 'hc-vc-bottom-nav');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results: CaseResult[] = [];

  try {
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const mobilePage = await mobile.newPage();
    const mobile390 = await runCase(mobilePage, 'MOBILE_390', true);
    await mobilePage.screenshot({
      path: path.join(outDir, 'mobile-390.png'),
      fullPage: false,
    });
    results.push(mobile390);
    await mobile.close();

    const landscape = await browser.newContext({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    const landscapePage = await landscape.newPage();
    const landscapeRes = await runCase(landscapePage, 'LANDSCAPE_844x390', false);
    await landscapePage.screenshot({
      path: path.join(outDir, 'landscape-844x390.png'),
      fullPage: false,
    });
    results.push(landscapeRes);
    await landscape.close();

    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktop.newPage();
    const desktopRes = await runCase(desktopPage, 'DESKTOP', false);
    await desktopPage.screenshot({
      path: path.join(outDir, 'desktop.png'),
      fullPage: false,
    });
    results.push(desktopRes);
    await desktop.close();

    const zoom = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const zoomPage = await zoom.newPage();
    await zoomPage.addInitScript(() => {
      document.documentElement.style.zoom = '2';
    });
    const zoomRes = await runCase(zoomPage, 'ZOOM_200', true);
    await zoomPage.screenshot({
      path: path.join(outDir, 'zoom-200.png'),
      fullPage: false,
    });
    results.push(zoomRes);
    await zoom.close();
  } finally {
    await browser.close();
  }

  const report = { baseUrl: BASE_URL, results };
  fs.writeFileSync(path.join(outDir, 'geometry.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  const mobile = results.find((r) => r.name === 'MOBILE_390');
  if (!mobile) fail('MOBILE_390 missing');
  if (!mobile.lastPresetVisible) fail('MOBILE_390_LAST_PRESET_VISIBLE FAIL');
  if (!mobile.resultTableVisible) fail('MOBILE_390_RESULT_TABLE_VISIBLE FAIL');
  if (!mobile.lastControlReachable) fail('MOBILE_390_LAST_CONTROL_REACHABLE FAIL');
  if (!mobile.noOverlap) fail('NO_BOTTOM_NAV_OVERLAP FAIL');

  const landscape = results.find((r) => r.name === 'LANDSCAPE_844x390');
  if (!landscape?.lastControlReachable) fail('LANDSCAPE_844x390 FAIL');

  const desktop = results.find((r) => r.name === 'DESKTOP');
  if (!desktop?.lastControlReachable || !desktop.lastPresetVisible) fail('DESKTOP_REGRESSION FAIL');

  const zoom = results.find((r) => r.name === 'ZOOM_200');
  if (!zoom?.lastControlReachable) fail('ZOOM_200 FAIL');

  console.log('verdiencheck-mobile-bottom-nav-geometry: PASS');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
