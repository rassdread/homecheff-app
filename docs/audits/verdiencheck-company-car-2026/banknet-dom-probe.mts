/** Reads the rendered bank-net row straight out of the baseline card. */

import { chromium } from 'playwright';
import { forward, newDutchContext, walkToCompanyCar, answerCarGroup, wizardState } from './driver.mts';

const BASE = process.env.VC_BASE_URL ?? 'http://localhost:3000';

const JS_ROWS = `(function () {
  var out = {};
  var el = document.querySelector('[data-verdiencheck-bank-net]');
  out.bankNetNode = el ? el.innerText.trim() : null;
  var pay = document.querySelector('[data-verdiencheck-payslip]');
  out.payslipBlock = pay ? pay.innerText.replace(/\\n+/g, ' | ') : null;
  var main = document.querySelector('main') || document.body;
  out.incomeSection = main.innerText.split('BELASTING')[0].replace(/\\n+/g, ' | ');
  return out;
})()`;

const browser = await chromium.launch();
const context = await newDutchContext(browser, BASE);
const page = await context.newPage();
await page.goto(`${BASE}/verdiencheck`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
await page.waitForTimeout(1_000);

const walk = await walkToCompanyCar(page);
console.log('reached car step:', walk.reached);
await answerCarGroup(page, /auto van de zaak die je ook priv/i, /^Nee$/);
for (let i = 0; i < 4; i += 1) {
  await forward(page);
  if (!(await wizardState(page)).hasCar) break;
}
await page.waitForTimeout(600);
const payslipToggle = page.locator('button', { hasText: 'Bekijk loonberekening' }).first();
if (await payslipToggle.count()) {
  await payslipToggle.click();
  await page.waitForTimeout(400);
}
console.log(JSON.stringify(await page.evaluate(JS_ROWS), null, 2));
await browser.close();
