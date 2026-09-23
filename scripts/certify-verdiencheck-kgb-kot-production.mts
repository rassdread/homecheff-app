/**
 * Production UI proof for kindgebonden budget and kinderopvangtoeslag.
 * Run: VC_BASE=https://homecheff.eu/verdiencheck npx tsx scripts/certify-verdiencheck-kgb-kot-production.mts
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

const BASE = process.env.VC_BASE ?? 'https://homecheff.eu/verdiencheck';
const OUT = path.join(process.cwd(), 'docs/audits/verdiencheck-toeslagen-live-scenario/production');
const STEP = '#verdiencheck-active-step';

async function title(page: Page) {
  return (await page.locator('#verdiencheck-step-heading').innerText()).replace(/\s+/g, ' ').trim();
}

async function waitTitle(page: Page, expected: string) {
  const start = Date.now();
  while (Date.now() - start < 15000) {
    if ((await title(page)) === expected) return;
    await page.waitForTimeout(100);
  }
  throw new Error(`Expected “${expected}”, saw “${await title(page)}”`);
}

async function click(page: Page, name: string) {
  const btn = page.locator(STEP).getByRole('button', { name, exact: true });
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

async function start(page: Page, income: string) {
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(90000);
  await page.addInitScript(() => sessionStorage.removeItem('hc_verdiencheck_v1'));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => undefined);
  await waitTitle(page, 'Woon je in Nederland?');
  await page.waitForTimeout(500);
  await click(page, 'Ja, in Nederland');
  await waitTitle(page, 'Waarmee wil je iets bijverdienen?');
  await click(page, 'Iets verkopen');
  await waitTitle(page, 'Hoe wil je beginnen?');
  await click(page, 'Af en toe iets verdienen');
  await waitTitle(page, 'Welke situatie past het beste bij jou?');
  await click(page, 'Ik werk in loondienst');
  await page.locator(STEP).getByRole('button', { name: 'Bereken mijn geld', exact: true }).click();
  await waitTitle(page, 'Krijg je in 2026 AOW?');
  await click(page, 'Nee, in 2026 krijg ik nog geen AOW');
  await waitTitle(page, 'Heb je een Nederlandse zorgverzekering?');
  await click(page, 'Ja');
  await waitTitle(page, 'Heb je een toeslagpartner?');
  await click(page, 'Nee');
  await waitTitle(page, 'Wat verdien je nu ongeveer?');
  const step = page.locator(STEP);
  await step.getByRole('button', { name: 'Bruto', exact: true }).click();
  await step.getByRole('button', { name: 'Per maand', exact: true }).click();
  await step.locator('input[aria-label="Wat verdien je nu ongeveer?"]').fill(income);
  await step.locator('[data-verdiencheck-holiday-pay]').getByRole('button', { name: 'Ja', exact: true }).click();
  await step.getByText('Wordt loonheffingskorting toegepast?', { exact: true }).locator('xpath=following::button[normalize-space()="Ja"][1]').click();
  await step.getByText('Heb je daarnaast nog ander inkomen?', { exact: true }).locator('xpath=following::button[normalize-space()="Nee"][1]').click();
  await step.getByRole('button', { name: 'Verder', exact: true }).click();
  await waitTitle(page, 'Toeslagen');
  await click(page, 'Verder');
  await waitTitle(page, 'Hoe woon je?');
  await click(page, 'Anders');
  await waitTitle(page, 'Heb je kinderen?');
  await click(page, 'Ja');
}

async function kgb(page: Page) {
  await waitTitle(page, 'Hoe oud zijn je kinderen?');
  await page.locator(STEP).locator('input').first().fill('8');
  await page.locator(STEP).getByRole('button', { name: 'Verder', exact: true }).click();
  await waitTitle(page, 'Woont je kind minstens een half jaar bij jou?');
  await click(page, 'Ja');
  await waitTitle(page, 'Heb je voor de belasting een fiscale partner?');
  await click(page, 'Nee');
  const next = await title(page);
  if (next !== 'Is je spaargeld laag genoeg voor kindgebonden budget?') {
    throw new Error(`KGB unexpected step: ${next}`);
  }
  await click(page, 'Ja, mijn spaargeld is laag genoeg');
  await waitTitle(page, 'Gebruik je kinderopvang?');
  await click(page, 'Nee');
  if ((await title(page)).includes('hele jaar')) await click(page, 'Ja, het hele jaar');
  await waitTitle(page, 'Is je spaargeld laag genoeg voor zorgtoeslag?');
  await click(page, 'Ja, mijn spaargeld is laag genoeg');
  await page.waitForTimeout(400);
  await page.locator(STEP).getByRole('button', { name: 'Bekijk wat extra verdienen doet', exact: true }).click();
  await page.locator(STEP).getByRole('button', { name: '€1.000', exact: true }).click();
  await page.waitForTimeout(300);
  const a = await page.locator('[data-verdiencheck-personal-delta]').innerText();
  await page.locator(STEP).getByRole('button', { name: '€5.000', exact: true }).click();
  await page.waitForTimeout(300);
  const b = await page.locator('[data-verdiencheck-personal-delta]').innerText();
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, 'C-kgb-extra-5000.png'), fullPage: true });
  const line = (text: string) => text.replace(/\s+/g, ' ').match(/Kindgebonden budget [^H]+/)?.[0] ?? '';
  return { at1000: line(a), at5000: line(b), changed: line(a) !== line(b) && !/Nog niet te berekenen/.test(a + b) };
}

async function kot(page: Page) {
  await waitTitle(page, 'Hoe oud zijn je kinderen?');
  await page.locator(STEP).locator('input').first().fill('4');
  await page.locator(STEP).getByRole('button', { name: 'Verder', exact: true }).click();
  await waitTitle(page, 'Woont je kind minstens een half jaar bij jou?');
  await click(page, 'Ja');
  await waitTitle(page, 'Heb je voor de belasting een fiscale partner?');
  await click(page, 'Nee');
  await waitTitle(page, 'Is je spaargeld laag genoeg voor kindgebonden budget?');
  await click(page, 'Ja, mijn spaargeld is laag genoeg');
  await waitTitle(page, 'Gebruik je kinderopvang?');
  await click(page, 'Ja');
  await waitTitle(page, 'Welke opvang gebruik je?');
  const step = page.locator(STEP);
  await step.getByRole('button', { name: 'Kinderdagverblijf', exact: true }).click();
  const inputs = step.locator('input');
  await inputs.nth(0).fill('120');
  await inputs.nth(1).fill('10');
  await step.getByRole('button', { name: 'Ja, deze opvang telt voor toeslag', exact: true }).click();
  await step.getByRole('button', { name: 'Verder', exact: true }).click();
  await waitTitle(page, 'Werk of studeer je het hele jaar 2026?');
  await click(page, 'Ja');
  if ((await title(page)).includes('hele jaar')) await click(page, 'Ja, het hele jaar');
  await waitTitle(page, 'Is je spaargeld laag genoeg voor zorgtoeslag?');
  await click(page, 'Ja, mijn spaargeld is laag genoeg');
  await page.waitForTimeout(400);
  await page.locator(STEP).getByRole('button', { name: 'Bekijk wat extra verdienen doet', exact: true }).click();
  await page.locator(STEP).getByRole('button', { name: '€1.000', exact: true }).click();
  await page.waitForTimeout(300);
  const a = await page.locator('[data-verdiencheck-personal-delta]').innerText();
  await page.locator(STEP).getByRole('button', { name: '€5.000', exact: true }).click();
  await page.waitForTimeout(300);
  const b = await page.locator('[data-verdiencheck-personal-delta]').innerText();
  await page.screenshot({ path: path.join(OUT, 'D-kot-extra-5000.png'), fullPage: true });
  const line = (text: string) => text.replace(/\s+/g, ' ').match(/Kinderopvangtoeslag [^T]+/)?.[0] ?? text.replace(/\s+/g, ' ').slice(0, 400);
  return { at1000: line(a), at5000: line(b), unknown: /Nog niet te berekenen/.test(a + b) };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'nl-NL',
  });
  await context.addCookies([{ name: 'homecheff-language', value: 'nl', url: BASE }]);
  const page = await context.newPage();
  await start(page, '2200');
  const kgbResult = await kgb(page);
  await context.close();

  const context2 = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'nl-NL',
  });
  await context2.addCookies([{ name: 'homecheff-language', value: 'nl', url: BASE }]);
  const page2 = await context2.newPage();
  await start(page2, '5000');
  const kotResult = await kot(page2);
  const out = { BASE, kgbResult, kotResult };
  fs.writeFileSync(path.join(OUT, 'kgb-kot.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  if (!kgbResult.changed) throw new Error('KGB did not change between €1.000 and €5.000');
  if (kotResult.unknown) throw new Error('KOT still unknown');
  if (kotResult.at1000 === kotResult.at5000) throw new Error('KOT did not change');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
