/**
 * Phase 7 production walk on homecheff.eu.
 *
 * Runs the certified personas end to end against the deployed build and reads
 * the resulting baseline card, so the numbers come from production rather than
 * from the local fixtures.
 *
 *   VC_BASE_URL=https://homecheff.eu npx tsx docs/audits/.../production-walk.mts
 */

import { chromium, type Page } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  answerCarGroup,
  fillCarField,
  forward,
  newDutchContext,
  walkToCompanyCar,
  wizardState,
} from './driver.mts';

const BASE = process.env.VC_BASE_URL ?? 'https://homecheff.eu';
const OUT = join(process.cwd(), 'docs/audits/verdiencheck-company-car-2026');
mkdirSync(OUT, { recursive: true });

const Q_CAR = /auto van de zaak die je ook priv/i;
const Q_PRIVATE = /meer dan 500 km/i;
const Q_CATEGORY = /Wat voor auto is het/i;
const Q_OWN = /bijdrage voor priv/i;

type CarSetup = {
  car: RegExp;
  privateUse?: RegExp;
  category?: RegExp;
  year?: string;
  month?: string;
  catalogue?: string;
  ownContribution?: RegExp;
  ownAmount?: string;
};

/** Reads the baseline card: the numbers a real user sees after the wizard. */
const JS_BASELINE = `(function () {
  var pick = function (sel) {
    var el = document.querySelector(sel);
    return el ? el.innerText.replace(/\\s+/g, ' ').trim() : null;
  };
  var root = document.querySelector('main') || document.body;
  return {
    car: pick('[data-verdiencheck-company-car]'),
    carDetails: pick('[data-verdiencheck-company-car-details]'),
    carNone: pick('[data-verdiencheck-company-car-none]'),
    carPartial: pick('[data-verdiencheck-company-car-partial]'),
    carUnknown: pick('[data-verdiencheck-company-car-unknown]'),
    text: root.innerText.replace(/\\n{2,}/g, '\\n')
  };
})()`;

/** Pull a labelled amount out of the baseline card text. */
function amountAfter(text: string, label: RegExp): string | null {
  const lines = text.split('\n').map((l) => l.trim());
  for (let i = 0; i < lines.length; i += 1) {
    if (!label.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j += 1) {
      if (/€/.test(lines[j])) return lines[j];
    }
  }
  return null;
}

async function configureCar(page: Page, setup: CarSetup): Promise<void> {
  await answerCarGroup(page, Q_CAR, setup.car);
  if (setup.privateUse) await answerCarGroup(page, Q_PRIVATE, setup.privateUse);
  if (setup.category) await answerCarGroup(page, Q_CATEGORY, setup.category);
  // Date fields are labelled "Datum eerste toelating — Jaar" / "— Maand".
  if (setup.year) await fillCarField(page, /toelating.*Jaar$/i, setup.year);
  if (setup.month) await fillCarField(page, /toelating.*Maand$/i, setup.month);
  if (setup.catalogue) await fillCarField(page, /^Cataloguswaarde/i, setup.catalogue);
  if (setup.ownContribution) await answerCarGroup(page, Q_OWN, setup.ownContribution);
  if (setup.ownAmount) await fillCarField(page, /^Hoeveel betaal/i, setup.ownAmount);
}

async function runPersona(name: string, setup: CarSetup) {
  const browser = await chromium.launch();
  const context = await newDutchContext(browser, BASE);
  const page = await context.newPage();
  await page.goto(`${BASE}/verdiencheck`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForTimeout(1_200);

  const walk = await walkToCompanyCar(page);
  if (!walk.reached) {
    await page.screenshot({ path: join(OUT, `prod-${name}-stuck.png`), fullPage: true });
    await browser.close();
    return { name, reached: false, trail: walk.trail };
  }

  await configureCar(page, setup);
  await page.screenshot({ path: join(OUT, `prod-${name}-input.png`), fullPage: true });

  // Leave the car step and land back on the result.
  for (let i = 0; i < 6; i += 1) {
    await forward(page);
    if (!(await wizardState(page)).hasCar) break;
  }
  await page.waitForTimeout(600);

  // Open the payslip and company-car disclosures so the detail rows render.
  for (const label of ['Bekijk loonberekening', 'Bekijk bijtelling']) {
    const button = page.locator('button', { hasText: label }).first();
    if (await button.count()) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(300);
    }
  }
  await page.screenshot({ path: join(OUT, `prod-${name}-result.png`), fullPage: true });

  const baseline = (await page.evaluate(JS_BASELINE)) as {
    car: string | null;
    carDetails: string | null;
    carNone: string | null;
    carPartial: string | null;
    carUnknown: string | null;
    text: string;
  };

  await browser.close();
  return {
    name,
    reached: true,
    car: baseline.car,
    carDetails: baseline.carDetails,
    carNone: baseline.carNone,
    carPartial: baseline.carPartial,
    carUnknown: baseline.carUnknown,
    grossIncome: amountAfter(baseline.text, /^Bruto inkomen$/i),
    fiscalIncome: amountAfter(baseline.text, /geschat jaarinkomen|Geschat fiscaal inkomen/i),
    incomeTax: amountAfter(baseline.text, /Geschatte inkomstenbelasting/i),
    healthcareAllowance: amountAfter(baseline.text, /^Zorgtoeslag$/i),
  };
}

async function run() {
  const personas: { name: string; setup: CarSetup }[] = [
    { name: 'p1-no-car', setup: { car: /^Nee$/ } },
    {
      name: 'p2-standard-car',
      setup: {
        car: /^Ja$/,
        privateUse: /^Ja$/,
        category: /Benzine/i,
        year: '2022',
        month: '3',
        catalogue: '30000',
        ownContribution: /^Nee$/,
      },
    },
    {
      name: 'p3-ev',
      setup: {
        car: /^Ja$/,
        privateUse: /^Ja$/,
        category: /Volledig elektrisch/i,
        year: '2026',
        month: '1',
        catalogue: '85000',
        ownContribution: /^Nee$/,
      },
    },
    {
      name: 'p4-own-contribution',
      setup: {
        car: /^Ja$/,
        privateUse: /^Ja$/,
        category: /Benzine/i,
        year: '2022',
        month: '3',
        catalogue: '30000',
        ownContribution: /^Ja$/,
        ownAmount: '600',
      },
    },
    {
      name: 'p10-unknown',
      setup: { car: /Weet ik niet/i },
    },
  ];

  const results = [];
  for (const persona of personas) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runPersona(persona.name, persona.setup);
    results.push(result);
    console.log(`--- ${persona.name}`, JSON.stringify(result, null, 2));
  }

  writeFileSync(
    join(OUT, 'production-walk.json'),
    JSON.stringify({ base: BASE, results }, null, 2),
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
