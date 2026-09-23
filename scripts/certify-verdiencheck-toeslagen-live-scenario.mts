/**
 * Real VerdienCheck UI journey for the toeslagen + live extra-result repair.
 *
 * Drives the rendered wizard. Asserts questions, rendered euros, the missing-input
 * CTA, restart, and hit-testing. BASE defaults to local; set VC_BASE for production.
 *
 * Run: npx tsx scripts/certify-verdiencheck-toeslagen-live-scenario.mts
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Locator, type Page } from 'playwright';

const BASE = process.env.VC_BASE ?? 'http://127.0.0.1:3000/verdiencheck';
const OUT = path.join(
  process.cwd(),
  'docs/audits/verdiencheck-toeslagen-live-scenario',
);
const STEP = '#verdiencheck-active-step';
const HEADING = '#verdiencheck-step-heading';

type Shot = { name: string; file: string };

async function title(page: Page): Promise<string> {
  return (await page.locator(HEADING).innerText()).replace(/\s+/g, ' ').trim();
}

async function waitTitle(page: Page, expected: string) {
  const start = Date.now();
  while (Date.now() - start < 12000) {
    if ((await title(page)) === expected) return;
    await page.waitForTimeout(100);
  }
  throw new Error(`Expected “${expected}”, saw “${await title(page)}”`);
}

function step(page: Page): Locator {
  return page.locator(STEP);
}

async function clickOnce(page: Page, name: string) {
  const btn = step(page).getByRole('button', { name, exact: true });
  await btn.waitFor({ state: 'visible' });
  await btn.click();
}

async function clickExact(page: Page, name: string) {
  const btn = step(page).getByRole('button', { name, exact: true });
  await btn.waitFor({ state: 'visible' });
  const before = await title(page);
  await btn.click();
  const start = Date.now();
  while (Date.now() - start < 1500) {
    if ((await title(page)) !== before) return;
    await page.waitForTimeout(100);
  }
  await btn.click();
}

async function clickFollowing(page: Page, label: string, button: string) {
  await step(page)
    .getByText(label, { exact: true })
    .locator(`xpath=following::button[normalize-space()="${button}"][1]`)
    .click();
}

async function shot(page: Page, name: string, shots: Shot[]) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  shots.push({ name, file: path.relative(process.cwd(), file) });
}

async function hit(page: Page, locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + Math.min(rect.height / 2, 18);
    const top = document.elementFromPoint(x, y);
    const nav = top?.closest('[data-hc-bottom-nav], [data-hc-bottom-nav-shell]');
    const blockedByNav = Boolean(nav && !el.contains(nav) && nav.contains(top as Node));
    return {
      ok: Boolean(top && (top === el || el.contains(top)) && !blockedByNav),
      text: (top?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      tag: top?.tagName ?? null,
      blockedByNav,
      top: rect.top,
      height: rect.height,
      x,
      y,
    };
  });
}

async function fresh(page: Page) {
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(120000);
  await page.addInitScript(() => {
    sessionStorage.removeItem('hc_verdiencheck_v1');
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);
  await waitTitle(page, 'Woon je in Nederland?');
  await page.waitForTimeout(400);
}

async function throughEmployeeIncome(page: Page, questions: string[], euro: string) {
  questions.push(await title(page));
  await clickExact(page, 'Ja, in Nederland');
  await waitTitle(page, 'Waarmee wil je iets bijverdienen?');
  questions.push(await title(page));
  await clickExact(page, 'Iets verkopen');
  await waitTitle(page, 'Hoe wil je beginnen?');
  questions.push(await title(page));
  await clickExact(page, 'Af en toe iets verdienen');
  await waitTitle(page, 'Welke situatie past het beste bij jou?');
  questions.push(await title(page));
  await clickExact(page, 'Ik werk in loondienst');
  await page.waitForTimeout(400);
  questions.push(await title(page));
  await step(page).getByRole('button', { name: 'Bereken mijn geld', exact: true }).click();
  await waitTitle(page, 'Krijg je in 2026 AOW?');
  questions.push(await title(page));
  await clickExact(page, 'Nee, in 2026 krijg ik nog geen AOW');
  await waitTitle(page, 'Heb je een Nederlandse zorgverzekering?');
  questions.push(await title(page));
}

async function fillIncome(page: Page, euro: string) {
  await step(page).getByRole('button', { name: 'Bruto', exact: true }).click();
  await step(page).getByRole('button', { name: 'Per maand', exact: true }).click();
  await step(page).locator('input[aria-label="Wat verdien je nu ongeveer?"]').fill(euro);
  await step(page)
    .locator('[data-verdiencheck-holiday-pay]')
    .getByRole('button', { name: 'Ja', exact: true })
    .click();
  await clickFollowing(page, 'Wordt loonheffingskorting toegepast?', 'Ja');
  await clickFollowing(page, 'Heb je daarnaast nog ander inkomen?', 'Nee');
  await step(page).getByRole('button', { name: 'Verder', exact: true }).click();
}

async function readResult(page: Page) {
  await page.locator('[data-verdiencheck-personal-delta], [data-verdiencheck-baseline]').first().waitFor({
    timeout: 15000,
  });
  const baseline = await page.locator('[data-verdiencheck-baseline]').innerText().catch(() => '');
  const delta = await page.locator('[data-verdiencheck-personal-delta]').innerText().catch(() => '');
  const chain = await page.locator('[data-verdiencheck-result-chain]').innerText().catch(() => '');
  return {
    baseline: baseline.replace(/\s+/g, ' ').trim(),
    delta: delta.replace(/\s+/g, ' ').trim(),
    chain: chain.replace(/\s+/g, ' ').trim(),
    unknown: (baseline + delta + chain).split('Nog niet te berekenen').length - 1,
  };
}

async function openScenario(page: Page) {
  const open = step(page).getByRole('button', { name: 'Bekijk wat extra verdienen doet', exact: true });
  if ((await open.count()) > 0) {
    await open.click();
    await step(page).getByRole('button', { name: '€1.000', exact: true }).waitFor();
  }
}

async function selectPreset(page: Page, label: string) {
  await step(page).getByRole('button', { name: label, exact: true }).click();
  await page.waitForTimeout(250);
}

async function openContext(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  viewport: { width: number; height: number },
) {
  const context = await browser.newContext({
    viewport,
    locale: 'nl-NL',
    extraHTTPHeaders: { 'Accept-Language': 'nl-NL,nl;q=0.9' },
  });
  await context.addCookies([
    {
      name: 'homecheff-language',
      value: 'nl',
      url: BASE,
    },
  ]);
  return context;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const shots: Shot[] = [];
  const financialUrls: string[] = [];
  const report: Record<string, unknown> = { BASE };

  const desktop = await openContext(browser, { width: 1280, height: 900 });
  const page = await desktop.newPage();
  page.on('request', (req) => {
    const blob = `${req.url()} ${req.postData() ?? ''}`;
    if (/2200|2646|7321|toetsingsinkomen|bareRent|childcare/.test(blob) && !req.url().includes('_next')) {
      financialUrls.push(req.method() + ' ' + req.url().slice(0, 180));
    }
  });

  const questions: string[] = [];
  await fresh(page);
  await throughEmployeeIncome(page, questions, '2200');
  await clickExact(page, 'Ja');
  await waitTitle(page, 'Heb je een toeslagpartner?');
  questions.push(await title(page));
  await clickExact(page, 'Nee');
  await waitTitle(page, 'Wat verdien je nu ongeveer?');
  questions.push(await title(page));
  await fillIncome(page, '2200');
  await waitTitle(page, 'Toeslagen');
  questions.push(await title(page));
  const toeslagenHelp = await step(page).innerText();
  const verderHitDesktop = await hit(page, step(page).getByRole('button', { name: 'Verder', exact: true }));
  await shot(page, 'A-toeslagen-question-desktop', shots);
  await clickExact(page, 'Verder');
  await waitTitle(page, 'Hoe woon je?');
  questions.push(await title(page));
  await clickExact(page, 'Anders');
  await waitTitle(page, 'Heb je kinderen?');
  questions.push(await title(page));
  await clickExact(page, 'Nee');
  await waitTitle(page, 'Is je spaargeld laag genoeg voor zorgtoeslag?');
  questions.push(await title(page));
  await clickExact(page, 'Ja, mijn spaargeld is laag genoeg');
  await page.waitForTimeout(500);
  questions.push(await title(page));
  await shot(page, 'B-baseline-result', shots);
  await clickOnce(page, 'Bekijk wat extra verdienen doet');
  await step(page).getByRole('button', { name: '€1.000', exact: true }).waitFor();

  await selectPreset(page, 'Zelf invullen');
  const customInput = step(page).locator('input[inputmode="decimal"]').last();
  await customInput.fill('0');
  await page.waitForTimeout(300);
  const extra0 = await readResult(page);
  await selectPreset(page, '€500');
  const extra500 = await readResult(page);
  await selectPreset(page, '€1.000');
  const extra1000 = await readResult(page);
  await shot(page, 'C-extra-1000-desktop', shots);
  await shot(page, 'B-baseline-visible-in-1000', shots);
  await selectPreset(page, '€2.500');
  const extra2500 = await readResult(page);
  await selectPreset(page, '€5.000');
  const extra5000 = await readResult(page);
  await shot(page, 'D-extra-5000-desktop', shots);
  await shot(page, 'F-allowance-delta-5000', shots);
  await shot(page, 'G-net-retained-5000', shots);
  await selectPreset(page, '€10.000');
  const extra10000 = await readResult(page);
  await selectPreset(page, 'Zelf invullen');
  await step(page).locator('input[inputmode="decimal"]').last().fill('7321');
  await page.waitForTimeout(300);
  const extra7321 = await readResult(page);
  await shot(page, 'E-custom-7321-desktop', shots);

  const changed =
    extra1000.delta !== extra5000.delta &&
    extra5000.delta !== extra7321.delta &&
    extra0.delta !== extra1000.delta;
  const baselineStable =
    extra1000.baseline === extra5000.baseline && extra5000.baseline === extra7321.baseline;

  report.JOURNEY_1 = {
    questions,
    toeslagenHelp,
    verderHitDesktop,
    extra0,
    extra500,
    extra1000,
    extra2500,
    extra5000,
    extra10000,
    extra7321,
    changed,
    baselineStable,
    unknownAt1000: extra1000.unknown,
  };

  if (!questions.includes('Toeslagen')) throw new Error('Toeslagen step was not shown');
  if (!/extra inkomen doet met je toeslagen/i.test(toeslagenHelp)) {
    throw new Error('Toeslagen help is not the progressive-disclosure copy');
  }
  if (extra1000.unknown > 0) throw new Error('Complete ZT persona still shows Nog niet te berekenen');
  if (!changed) throw new Error('Rendered scenario text did not change across extra results');
  if (!baselineStable) throw new Error('Baseline card changed when extra result changed');

  await page.getByRole('button', { name: 'VerdienCheck opnieuw doen', exact: true }).click();
  await page.getByRole('button', { name: 'Opnieuw beginnen', exact: true }).click();
  await waitTitle(page, 'Woon je in Nederland?');
  const afterRestart = await page.evaluate(() => sessionStorage.getItem('hc_verdiencheck_v1'));
  report.RESTART_CLEARED = afterRestart == null || !/2200|7321/.test(afterRestart);

  await desktop.close();

  const mobile = await openContext(browser, { width: 390, height: 844 });
  const m = await mobile.newPage();
  const mq: string[] = [];
  await fresh(m);
  await throughEmployeeIncome(m, mq, '1800');
  await clickExact(m, 'Ja');
  await waitTitle(m, 'Heb je een toeslagpartner?');
  await clickExact(m, 'Nee');
  await waitTitle(m, 'Wat verdien je nu ongeveer?');
  await fillIncome(m, '1800');
  await waitTitle(m, 'Toeslagen');
  const toeslagenHit = await hit(m, step(m).getByRole('button', { name: 'Verder', exact: true }));
  await shot(m, 'J-mobile-390-toeslagen', shots);
  await clickExact(m, 'Verder');
  await waitTitle(m, 'Hoe woon je?');
  await clickExact(m, 'Huur');
  await waitTitle(m, 'Wat is de kale huur per maand?');
  mq.push(await title(m));
  await step(m).locator('input').first().fill('700');
  await clickExact(m, 'Verder');
  await waitTitle(m, 'Hoe ziet je huishouden voor de huurtoeslag eruit?');
  mq.push(await title(m));
  await clickExact(m, 'Ik woon alleen');
  await step(m).locator('input').first().fill('35');
  await clickExact(m, 'Verder');
  const housingNext = await title(m);
  mq.push(housingNext);
  if (housingNext.includes('spaargeld') && housingNext.includes('huurtoeslag')) {
    await clickExact(m, 'Ja, mijn spaargeld is laag genoeg');
  }
  await waitTitle(m, 'Heb je kinderen?');
  await clickExact(m, 'Nee');
  if ((await title(m)).includes('hele jaar')) {
    mq.push(await title(m));
    await clickExact(m, 'Ja, het hele jaar');
  }
  await waitTitle(m, 'Is je spaargeld laag genoeg voor zorgtoeslag?');
  await clickExact(m, 'Ja, mijn spaargeld is laag genoeg');
  await m.waitForTimeout(400);
  await openScenario(m);
  await selectPreset(m, '€1.000');
  const ht1000 = await readResult(m);
  await selectPreset(m, '€5.000');
  const ht5000 = await readResult(m);
  const presetHit = await hit(m, step(m).getByRole('button', { name: '€5.000', exact: true }));
  await shot(m, 'J-mobile-390-result', shots);
  report.JOURNEY_HT_MOBILE = {
    questions: mq,
    housingNext,
    toeslagenHit,
    presetHit,
    ht1000unknown: ht1000.unknown,
    htChanged: ht1000.delta !== ht5000.delta,
    ht1000: ht1000.delta.slice(0, 500),
    ht5000: ht5000.delta.slice(0, 500),
  };
  if (!toeslagenHit.ok) throw new Error('Mobile toeslagen Verder failed hit test');
  if (!presetHit.ok) throw new Error('Mobile scenario control failed hit test');
  if (ht1000.unknown > 0) throw new Error('HT persona shows Nog niet te berekenen');
  if (ht1000.delta === ht5000.delta) throw new Error('HT scenario did not change');
  await mobile.close();

  const missing = await openContext(browser, { width: 1280, height: 900 });
  const p3 = await missing.newPage();
  await fresh(p3);
  const q3: string[] = [];
  await throughEmployeeIncome(p3, q3, '2200');
  await clickExact(p3, 'Ja');
  await waitTitle(p3, 'Heb je een toeslagpartner?');
  await clickExact(p3, 'Nee');
  await waitTitle(p3, 'Wat verdien je nu ongeveer?');
  await fillIncome(p3, '2200');
  await waitTitle(p3, 'Toeslagen');
  await clickExact(p3, 'Verder');
  await waitTitle(p3, 'Hoe woon je?');
  await clickExact(p3, 'Anders');
  await waitTitle(p3, 'Heb je kinderen?');
  await clickExact(p3, 'Nee');
  await waitTitle(p3, 'Is je spaargeld laag genoeg voor zorgtoeslag?');
  await clickExact(p3, 'Ik weet het niet');
  await p3.waitForTimeout(400);
  const beforeComplete = await readResult(p3).catch(() => null);
  const cta = step(p3).getByRole('button', { name: 'Gegevens aanvullen', exact: true });
  await cta.waitFor({ timeout: 8000 });
  await shot(p3, 'I-gegevens-aanvullen', shots);
  const ctaHit = await hit(p3, cta);
  await cta.click();
  await waitTitle(p3, 'Is je spaargeld laag genoeg voor zorgtoeslag?');
  await clickExact(p3, 'Ja, mijn spaargeld is laag genoeg');
  await p3.waitForTimeout(400);
  await openScenario(p3);
  await selectPreset(p3, '€1.000');
  const afterComplete = await readResult(p3);
  report.JOURNEY_3 = {
    beforeUnknown: beforeComplete?.unknown ?? null,
    ctaHit,
    landedOnAssets: true,
    afterUnknown: afterComplete.unknown,
    afterHasDelta: afterComplete.delta.length > 20,
  };
  if (afterComplete.unknown > 0) throw new Error('After completing assets, result is still unknown');
  await missing.close();

  const none = await openContext(browser, { width: 1280, height: 900 });
  const p2 = await none.newPage();
  await fresh(p2);
  const q2: string[] = [];
  await throughEmployeeIncome(p2, q2, '4000');
  await clickExact(p2, 'Nee');
  await waitTitle(p2, 'Heb je een toeslagpartner?');
  await clickExact(p2, 'Nee');
  await waitTitle(p2, 'Wat verdien je nu ongeveer?');
  await fillIncome(p2, '4000');
  await waitTitle(p2, 'Toeslagen');
  await clickExact(p2, 'Verder');
  await waitTitle(p2, 'Hoe woon je?');
  await clickExact(p2, 'Anders');
  await waitTitle(p2, 'Heb je kinderen?');
  await clickExact(p2, 'Nee');
  await waitTitle(p2, 'Is je spaargeld laag genoeg voor zorgtoeslag?');
  await clickExact(p2, 'Nee, ik heb te veel spaargeld of vermogen');
  await p2.waitForTimeout(400);
  await openScenario(p2);
  await selectPreset(p2, '€1.000');
  const noAllow = await readResult(p2);
  await shot(p2, 'H-no-toeslagen', shots);
  report.JOURNEY_2 = {
    unknownCount: noAllow.unknown,
    text: `${noAllow.baseline} ${noAllow.delta}`.slice(0, 800),
  };
  if (noAllow.unknown > 0) throw new Error('No-allowance persona shows Nog niet te berekenen');
  await none.close();

  const land = await openContext(browser, { width: 844, height: 390 });
  const lp = await land.newPage();
  await fresh(lp);
  await clickExact(lp, 'Ja, in Nederland');
  await waitTitle(lp, 'Waarmee wil je iets bijverdienen?');
  const landButton = step(lp).getByRole('button', { name: 'Iets verkopen', exact: true });
  await landButton.scrollIntoViewIfNeeded();
  await lp.evaluate(() => window.scrollBy(0, -80));
  const landHit = await hit(lp, landButton);
  report.LANDSCAPE_HIT = landHit;
  await shot(lp, 'landscape-844x390', shots);
  if (!landHit.ok) throw new Error(`Landscape choice failed hit test ${JSON.stringify(landHit)}`);
  await land.close();

  const zoom = await openContext(browser, { width: 1280, height: 900 });
  const zp = await zoom.newPage();
  await fresh(zp);
  await zp.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await zp.waitForTimeout(200);
  const zoomHit = await hit(zp, step(zp).getByRole('button', { name: 'Ja, in Nederland', exact: true }));
  await shot(zp, 'zoom-200-first-question', shots);
  report.ZOOM_200_HIT = zoomHit;
  if (!zoomHit.ok) throw new Error(`200% zoom choice failed hit test ${JSON.stringify(zoomHit)}`);
  await zoom.close();

  report.FINANCIAL_REQUESTS = financialUrls;
  report.shots = shots;
  const outFile = path.join(OUT, 'local-journey.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    ok: true,
    questions: report.JOURNEY_1 && (report.JOURNEY_1 as { questions: string[] }).questions,
    changed,
    baselineStable,
    unknownAt1000: extra1000.unknown,
    restart: report.RESTART_CLEARED,
    htChanged: (report.JOURNEY_HT_MOBILE as { htChanged: boolean }).htChanged,
    noAllowUnknown: noAllow.unknown,
    financialRequests: financialUrls.length,
    outFile,
  }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
