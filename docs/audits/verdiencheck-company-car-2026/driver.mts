/**
 * Shared VerdienCheck wizard driver for the Phase 7 audits.
 *
 * Drives the real wizard with real gestures so React state updates the same way
 * it does for a person. Both the responsive walk and the production persona
 * walk use this, so local and production runs exercise identical paths.
 */

import type { BrowserContext, Page } from 'playwright';

/**
 * Enumerates the wizard's option groups. Groups share a parent element; the
 * prompt is the last heading/paragraph seen before the group in document order,
 * which survives the wrapper-div nesting the wizard uses.
 */
const JS_GROUPS_FN = `function () {
  var root = document.querySelector('[data-verdiencheck-wizard]') || document.querySelector('main') || document.body;
  var vis = function (el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  var parents = [];
  var groups = [];
  var lastText = '';
  Array.prototype.slice.call(root.querySelectorAll('h1,h2,h3,h4,p,legend,label,button')).forEach(function (el) {
    if (el.tagName !== 'BUTTON') {
      var t = (el.innerText || '').trim();
      if (t && t.length < 200) lastText = t.split('\\n')[0];
      return;
    }
    if (!el.hasAttribute('aria-pressed') || !vis(el)) return;
    var p = el.parentElement;
    var gi = parents.indexOf(p);
    if (gi < 0) {
      gi = parents.length;
      parents.push(p);
      groups.push({ prompt: lastText, options: [], answered: false, buttons: [] });
    }
    groups[gi].options.push((el.textContent || '').trim());
    groups[gi].buttons.push(el);
    if (el.getAttribute('aria-pressed') === 'true') groups[gi].answered = true;
  });
  return { root: root, groups: groups, vis: vis };
}`;

export const JS_WIZARD_STATE = `(function () {
  var collected = (${JS_GROUPS_FN})();
  var root = collected.root;
  return {
    text: root.innerText,
    buttons: Array.prototype.slice.call(root.querySelectorAll('button')).filter(collected.vis).map(function (b) {
      return { text: (b.textContent || '').trim(), pressed: b.getAttribute('aria-pressed') };
    }),
    groups: collected.groups.map(function (g) {
      return { prompt: g.prompt, options: g.options, answered: g.answered };
    }),
    inputs: Array.prototype.slice.call(root.querySelectorAll('input')).filter(collected.vis).length,
    hasCar: !!document.querySelector('[data-verdiencheck-company-car]')
  };
})()`;

/** Clicks one option inside one group, so identical labels never collide. */
export function jsClickInGroup(groupIndex: number, label: string): string {
  return `(function () {
    var groups = (${JS_GROUPS_FN})().groups;
    var g = groups[${groupIndex}];
    if (!g) return 'no-group';
    var i = g.options.indexOf(${JSON.stringify(label)});
    if (i < 0) return 'no-option';
    g.buttons[i].click();
    return 'ok';
  })()`;
}

export type OptionGroup = { prompt: string; options: string[]; answered: boolean };

export type WizardSnapshot = {
  text: string;
  buttons: { text: string; pressed: string | null }[];
  groups: OptionGroup[];
  inputs: number;
  hasCar: boolean;
};

export async function wizardState(page: Page): Promise<WizardSnapshot> {
  return page.evaluate(JS_WIZARD_STATE) as Promise<WizardSnapshot>;
}

/** Question title -> exact option label the persona should choose. */
const ANSWERS: readonly (readonly [RegExp, string])[] = [
  [/Woon je in Nederland/i, 'Ja, in Nederland'],
  [/Waarmee wil je iets bijverdienen/i, 'Eten of drinken verkopen'],
  [/Hoe wil je beginnen/i, 'Regelmatig bijverdienen'],
  [/Welke situatie past het beste/i, 'Ik werk in loondienst'],
  [/Hoe vaak denk je dit ongeveer te verkopen/i, 'Meerdere keren per jaar / regelmatig'],
];

/** Options a deterministic persona should never pick when something else fits. */
const AVOID = /^(Weet ik|Ik weet het|Terug|Deel VerdienCheck|Nee, ergens anders)/i;

/** Prompt-specific option choices, so the persona stays the certified one. */
const GROUP_ANSWERS: readonly (readonly [RegExp, RegExp])[] = [
  [/zorgverzekering/i, /^Ja/],
  [/AOW/i, /^Nee/],
  [/toeslagpartner/i, /^Nee/],
  [/loonheffingskorting|heffingskorting/i, /^Ja/],
  [/vakantiegeld/i, /^Nee$/],
  [/ander inkomen|andere inkomsten/i, /^Nee/],
  [/Hoe woon je/i, /^Huur/],
  [/spaargeld/i, /^Ja/],
  [/kinderen/i, /^Nee/],
  [/per maand of per jaar|Wat verdien je/i, /^Per maand$/],
];

function chooseOption(group: OptionGroup): string | null {
  for (const [prompt, want] of GROUP_ANSWERS) {
    if (!prompt.test(group.prompt)) continue;
    const match = group.options.find((o) => want.test(o));
    if (match) return match;
  }
  return (
    group.options.find((o) => /^Nee$/i.test(o)) ??
    group.options.find((o) => !AVOID.test(o)) ??
    group.options[0] ??
    null
  );
}

export async function dismissCookies(page: Page): Promise<void> {
  for (const label of ['Alleen noodzakelijk', 'Only necessary']) {
    const button = page.locator('button', { hasText: label }).first();
    if (await button.count()) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(150);
      return;
    }
  }
}

export async function clickExact(page: Page, label: string): Promise<boolean> {
  const button = page
    .locator('button')
    .filter({ hasText: new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
    .first();
  if (!(await button.count())) return false;
  await button.scrollIntoViewIfNeeded().catch(() => undefined);
  await button.click({ timeout: 4_000 }).catch(() => undefined);
  await page.waitForTimeout(150);
  return true;
}

export async function forward(page: Page): Promise<boolean> {
  for (const label of ['Verder', 'Volgende', 'Bereken', 'Ga verder']) {
    const button = page.locator('button', { hasText: label }).last();
    if (await button.count()) {
      await button.scrollIntoViewIfNeeded().catch(() => undefined);
      await button.click({ timeout: 4_000 }).catch(() => undefined);
      await page.waitForTimeout(300);
      return true;
    }
  }
  return false;
}

export async function onCompanyCarStep(page: Page): Promise<boolean> {
  return (await page.locator('[data-verdiencheck-company-car]').count()) > 0;
}

/** Answer whatever the current step asks, then advance. */
async function answerStep(page: Page, trail: string[], salaryEuro: string): Promise<void> {
  const state = await wizardState(page);
  const question = state.text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== 'Deel VerdienCheck')
    .slice(1, 2)
    .join('');

  for (const [pattern, label] of ANSWERS) {
    if (pattern.test(state.text) && (await clickExact(page, label))) {
      trail.push(`answer:${label}`);
      await forward(page);
      return;
    }
  }

  // Only the income step gets the salary. Other steps also have empty decimal
  // inputs (pension, other deductions) and must stay empty, or the persona
  // silently acquires a EUR 2.646/month deduction and a negative bank net.
  if (/Wat verdien je nu ongeveer/i.test(state.text)) {
    const amount = page.locator('input[inputmode="decimal"]').first();
    if ((await amount.count()) && (await amount.inputValue()) === '') {
      await amount.fill(salaryEuro);
      trail.push(`salary=${salaryEuro}`);
      await clickExact(page, 'Per maand');
    }
  }

  const holiday = page.locator('[data-verdiencheck-holiday-pay]');
  if (await holiday.count()) {
    if ((await holiday.locator('button[aria-pressed="true"]').count()) === 0) {
      await holiday.locator('button', { hasText: /^\s*Nee\s*$/ }).first().click();
      trail.push('holiday=NO');
      await page.waitForTimeout(150);
    }
  }

  // Answer every unanswered group: leaving one blank (e.g. "ander inkomen")
  // silently disqualifies the payroll route and hides the advanced CTA.
  for (let gi = 0; gi < state.groups.length; gi += 1) {
    const groups = (await wizardState(page)).groups;
    const group = groups[gi];
    if (!group || group.answered) continue;
    const prompt = group.prompt.trim().endsWith('?') ? group.prompt : question || group.prompt;
    const choice = chooseOption({ ...group, prompt });
    if (!choice) continue;
    await page.evaluate(jsClickInGroup(gi, choice));
    await page.waitForTimeout(150);
    trail.push(`answer[${prompt.slice(0, 48)}]:${choice}`);
  }

  if (await clickExact(page, 'Maak mijn loonstrook nauwkeuriger')) return;
  if (await forward(page)) return;

  // Steps without a forward button advance on the option click itself.
  const preselected = state.buttons.find((b) => b.pressed === 'true');
  if (preselected && (await clickExact(page, preselected.text))) {
    trail.push(`re-click:${preselected.text}`);
  }
}

/** Walks from the landing page to the AUTO VAN DE ZAAK step. */
export async function walkToCompanyCar(
  page: Page,
  options: { salaryEuro?: string } = {},
): Promise<{ reached: boolean; trail: string[] }> {
  const trail: string[] = [];
  const salaryEuro = options.salaryEuro ?? '2646';
  await dismissCookies(page);
  await clickExact(page, 'Bereken wat ik overhoud');

  let lastText = '';
  let stalls = 0;
  for (let i = 0; i < 45 && !(await onCompanyCarStep(page)); i += 1) {
    const before = (await wizardState(page)).text;
    await answerStep(page, trail, salaryEuro);
    const after = (await wizardState(page)).text;
    if (after === before && after === lastText) {
      stalls += 1;
      if (stalls >= 3) break;
    } else {
      stalls = 0;
    }
    lastText = after;
  }
  return { reached: await onCompanyCarStep(page), trail };
}

export async function newDutchContext(
  browser: import('playwright').Browser,
  base: string,
  viewport = { width: 1440, height: 900 },
): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport, locale: 'nl-NL' });
  // Language comes from the hc_locale cookie, not Accept-Language.
  await context.addCookies([
    { name: 'hc_locale', value: 'nl', url: base },
    { name: 'homecheff-language', value: 'nl', url: base },
  ]);
  return context;
}

/** Answers one question inside the company-car section by prompt. */
export async function answerCarGroup(
  page: Page,
  prompt: RegExp,
  want: RegExp,
): Promise<string | null> {
  const groups = (await wizardState(page)).groups;
  const gi = groups.findIndex((g) => prompt.test(g.prompt));
  if (gi < 0) return null;
  const choice = groups[gi].options.find((o) => want.test(o));
  if (!choice) return null;
  await page.evaluate(jsClickInGroup(gi, choice));
  await page.waitForTimeout(250);
  return choice;
}

/** Fills a company-car numeric field by its accessible label. */
export async function fillCarField(page: Page, label: RegExp, value: string): Promise<boolean> {
  const inputs = page.locator('[data-verdiencheck-company-car] input');
  for (let i = 0; i < (await inputs.count()); i += 1) {
    const input = inputs.nth(i);
    const aria = (await input.getAttribute('aria-label')) ?? '';
    if (label.test(aria)) {
      await input.fill(value);
      await page.waitForTimeout(150);
      return true;
    }
  }
  return false;
}
