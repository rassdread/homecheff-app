/**
 * Phase 7 responsive / accessibility walk for the AUTO VAN DE ZAAK wizard step.
 *
 * Drives the real wizard with real user gestures so React state updates the
 * same way it does for a person, then measures overflow, bottom-nav overlap,
 * progressive disclosure and keyboard reachability at four viewports.
 */

import { chromium, type Page } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.VC_BASE_URL ?? 'http://localhost:3000';
const OUT = join(process.cwd(), 'docs/audits/verdiencheck-company-car-2026');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { id: 'DESKTOP', width: 1440, height: 900, scale: 1 },
  { id: 'MOBILE_390', width: 390, height: 844, scale: 1 },
  { id: 'LANDSCAPE', width: 844, height: 390, scale: 1 },
  { id: 'ZOOM_200', width: 195, height: 422, scale: 2 },
] as const;

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

async function dismissCookies(page: Page): Promise<void> {
  for (const label of ['Alleen noodzakelijk', 'Only necessary']) {
    const button = page.locator('button', { hasText: label }).first();
    if (await button.count()) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(150);
      return;
    }
  }
}

async function onCompanyCarStep(page: Page): Promise<boolean> {
  return (await page.locator('[data-verdiencheck-company-car]').count()) > 0;
}

/**
 * Browser-side snippets are passed as strings: the TypeScript loader rewrites
 * inline closures with a `__name` helper that does not exist in the page.
 */
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

const JS_WIZARD_STATE = `(function () {
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
function jsClickInGroup(groupIndex: number, label: string): string {
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

const JS_MEASURE = `(function () {
  var doc = document.documentElement;
  var nav = document.querySelector('[data-hc-bottom-nav-shell], [data-hc-bottom-nav]');
  var navVisible = false;
  var navTop = null;
  if (nav) {
    var nr = nav.getBoundingClientRect();
    navVisible = nr.height > 0 && getComputedStyle(nav).display !== 'none';
    navTop = nr.top;
  }
  // Scroll to the end: the forward button must stay clear of the fixed nav.
  window.scrollTo(0, doc.scrollHeight);
  var fwd = Array.prototype.slice.call(document.querySelectorAll('button')).filter(function (b) {
    return /verder|volgende|bereken/i.test(b.textContent || '');
  });
  var navTopAfter = nav ? nav.getBoundingClientRect().top : null;
  var covered = (!navVisible || navTopAfter == null) ? [] : fwd.map(function (b) {
    var r = b.getBoundingClientRect();
    return { t: (b.textContent || '').trim(), bottom: Math.round(r.bottom), navTop: Math.round(navTopAfter) };
  }).filter(function (b) { return b.bottom > b.navTop; });
  var section = document.querySelector('[data-verdiencheck-company-car]');
  return {
    overflow: doc.scrollWidth - doc.clientWidth,
    navFound: !!nav,
    navVisible: navVisible,
    navTop: navTop,
    covered: covered,
    sectionRightOverflow: section ? Math.max(0, Math.round(section.getBoundingClientRect().right - doc.clientWidth)) : null
  };
})()`;

const JS_DISCLOSED = `(function () {
  var s = document.querySelector('[data-verdiencheck-company-car]');
  return s ? s.querySelectorAll('input, select, button[aria-pressed]').length : -1;
})()`;

const JS_A11Y = `(function () {
  var s = document.querySelector('[data-verdiencheck-company-car]');
  if (!s) return null;
  var c = Array.prototype.slice.call(s.querySelectorAll('button,[role="button"],input,select'));
  return {
    total: c.length,
    nonNativeControls: c.filter(function (e) { return !/^(BUTTON|INPUT|SELECT)$/.test(e.tagName); }).length,
    unreachable: c.filter(function (e) { return e.tabIndex < 0; }).length,
    buttonsWithoutType: c.filter(function (e) { return e.tagName === 'BUTTON' && e.getAttribute('type') !== 'button'; }).length,
    inputsWithoutLabel: c.filter(function (e) {
      return e.tagName === 'INPUT' && !e.getAttribute('aria-label') && !e.closest('label') &&
        !(e.id && document.querySelector('label[for="' + e.id + '"]'));
    }).length,
    ariaPressedButtons: c.filter(function (e) { return e.hasAttribute('aria-pressed'); }).length,
    whyTextPresent: /Als je een auto van de zaak ook priv/.test(s.innerText)
  };
})()`;

const JS_ACTIVE = `(function () {
  var el = document.activeElement;
  if (!el) return 'none';
  return el.tagName + ':' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40);
})()`;

type OptionGroup = { prompt: string; options: string[]; answered: boolean };

type WizardSnapshot = {
  text: string;
  buttons: { text: string; pressed: string | null }[];
  groups: OptionGroup[];
  inputs: number;
  hasCar: boolean;
};

/** Everything the wizard is currently showing, used to drive and to detect stalls. */
async function wizardState(page: Page): Promise<WizardSnapshot> {
  return page.evaluate(JS_WIZARD_STATE) as Promise<WizardSnapshot>;
}

async function clickExact(page: Page, label: string): Promise<boolean> {
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

async function forward(page: Page): Promise<boolean> {
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

/**
 * Answer whatever the current step asks, then advance. Unselected option groups
 * get a deterministic persona answer so we never leave a step invalid.
 */
async function answerStep(page: Page, trail: string[]): Promise<void> {
  const state = await wizardState(page);
  const question = state.text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== 'Deel VerdienCheck')
    .slice(1, 2)
    .join('');
  trail.push(`Q: ${question}`);

  for (const [pattern, label] of ANSWERS) {
    if (pattern.test(state.text) && (await clickExact(page, label))) {
      trail.push(`answer:${label}`);
      await forward(page);
      return;
    }
  }

  // Salary step: amount, period, payroll tax credit and holiday pay.
  const amount = page.locator('input[inputmode="decimal"]').first();
  if ((await amount.count()) && (await amount.inputValue()) === '') {
    await amount.fill('2646');
    trail.push('salary=2646');
    await clickExact(page, 'Per maand');
  }

  const holiday = page.locator('[data-verdiencheck-holiday-pay]');
  if (await holiday.count()) {
    const pressed = await holiday.locator('button[aria-pressed="true"]').count();
    if (pressed === 0) {
      await holiday.locator('button', { hasText: /^\s*Nee\s*$/ }).first().click();
      trail.push('holiday=NO');
      await page.waitForTimeout(150);
    }
  }

  // Answer every unanswered option group on this step, not just the first one:
  // leaving one blank (e.g. "ander inkomen") silently disqualifies the payroll
  // route and hides the advanced CTA we need to reach.
  for (let gi = 0; gi < state.groups.length; gi += 1) {
    // Re-read: answering one group can re-render and disclose or remove others.
    const groups = (await wizardState(page)).groups;
    const group = groups[gi];
    if (!group || group.answered) continue;
    // Single-question steps render the prompt as a heading outside the group,
    // so fall back to the step question when the nearest text is not a question.
    const prompt = group.prompt.trim().endsWith('?') ? group.prompt : question || group.prompt;
    const choice = chooseOption({ ...group, prompt });
    if (!choice) continue;
    const result = await page.evaluate(jsClickInGroup(gi, choice));
    await page.waitForTimeout(150);
    trail.push(`answer[${prompt.slice(0, 48)}]:${choice}${result === 'ok' ? '' : ` (${result})`}`);
  }

  if (await clickExact(page, 'Maak mijn loonstrook nauwkeuriger')) return;
  if (await forward(page)) return;

  // Steps without a forward button advance on the option click itself, so a
  // pre-selected answer needs re-clicking to move on.
  const preselected = state.buttons.find((b) => b.pressed === 'true');
  if (preselected && (await clickExact(page, preselected.text))) {
    trail.push(`re-click:${preselected.text}`);
  }
}

type Measurement = {
  overflow: number;
  navFound: boolean;
  navVisible: boolean;
  navTop: number | null;
  covered: { t: string; bottom: number; navTop: number }[];
  sectionRightOverflow: number | null;
};

async function measure(page: Page): Promise<Measurement> {
  return page.evaluate(JS_MEASURE) as Promise<Measurement>;
}

/** Count disclosed sub-fields so we can prove "Nee" collapses them again. */
async function disclosedFields(page: Page): Promise<number> {
  return page.evaluate(JS_DISCLOSED) as Promise<number>;
}

/**
 * Walks the whole progressive chain (car -> private use -> category -> date ->
 * catalogue value -> own contribution) so the widest possible form is measured.
 */
async function expandCompanyCar(page: Page): Promise<number> {
  // Each answer discloses the next question, so resolve groups by prompt and
  // click inside the matching group: several groups share the label "Ja".
  const chain: readonly (readonly [RegExp, RegExp])[] = [
    [/auto van de zaak die je ook priv/i, /^Ja$/],
    [/meer dan 500 km/i, /^Ja$/],
    [/Wat voor auto is het/i, /Benzine/i],
    [/bijdrage voor priv/i, /^Ja$/],
  ];
  for (const [prompt, want] of chain) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const groups = (await wizardState(page)).groups;
      const gi = groups.findIndex((g) => prompt.test(g.prompt));
      if (gi < 0) break;
      const choice = groups[gi].options.find((o) => want.test(o));
      if (!choice) break;
      await page.evaluate(jsClickInGroup(gi, choice));
      await page.waitForTimeout(250);
      break;
    }
  }

  // Fill the disclosed numeric fields by their accessible label.
  // Most specific first: "Hoeveel betaal je per jaar..." also contains "jaar".
  const values: readonly (readonly [RegExp, string])[] = [
    [/^Cataloguswaarde/i, '30000'],
    [/^Hoeveel betaal/i, '600'],
    [/^Jaar$/i, '2022'],
    [/^Maand$/i, '3'],
  ];
  const inputs = page.locator('[data-verdiencheck-company-car] input');
  for (let i = 0; i < (await inputs.count()); i += 1) {
    const input = inputs.nth(i);
    const label = (await input.getAttribute('aria-label')) ?? '';
    const match = values.find(([pattern]) => pattern.test(label));
    await input.fill(match ? match[1] : '1').catch(() => undefined);
  }
  await page.waitForTimeout(300);
  return disclosedFields(page);
}

async function carButton(page: Page, label: string) {
  return page
    .locator('[data-verdiencheck-company-car] button')
    .filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) })
    .first();
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'nl-NL',
  });
  // Language comes from the hc_locale cookie, not Accept-Language.
  await context.addCookies([
    { name: 'hc_locale', value: 'nl', url: BASE },
    { name: 'homecheff-language', value: 'nl', url: BASE },
  ]);
  const page = await context.newPage();
  const report: Record<string, unknown> = { base: BASE, viewports: {} };
  const trail: string[] = [];

  await page.goto(`${BASE}/verdiencheck`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForTimeout(1_500);
  await dismissCookies(page);
  await clickExact(page, 'Bereken wat ik zou overhouden');

  let lastText = '';
  let stalls = 0;
  for (let i = 0; i < 45 && !(await onCompanyCarStep(page)); i += 1) {
    const before = (await wizardState(page)).text;
    await answerStep(page, trail);
    const after = (await wizardState(page)).text;
    if (after === before && after === lastText) {
      stalls += 1;
      if (stalls >= 3) break;
    } else {
      stalls = 0;
    }
    lastText = after;
  }

  report.trail = trail;
  report.reachedCompanyCar = await onCompanyCarStep(page);

  if (!report.reachedCompanyCar) {
    await page.screenshot({ path: join(OUT, 'stuck.png'), fullPage: true });
    const state = await wizardState(page);
    report.stuckAt = state.text.slice(0, 900);
    report.stuckButtons = state.buttons;
    writeFileSync(join(OUT, 'responsive.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
    process.exit(1);
  }

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    if (vp.scale !== 1) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.scale,
        mobile: true,
      });
    }
    await page.waitForTimeout(300);

    const disclosed = await expandCompanyCar(page);
    const measured = await measure(page);
    await page.screenshot({ path: join(OUT, `car-${vp.id}.png`), fullPage: true });

    await (await carButton(page, 'Nee')).click();
    await page.waitForTimeout(250);
    const collapsed = await disclosedFields(page);
    const redisclosed = await expandCompanyCar(page);

    (report.viewports as Record<string, unknown>)[vp.id] = {
      ...measured,
      disclosedFields: disclosed,
      collapsedFields: collapsed,
      redisclosedFields: redisclosed,
      progressiveDisclosureOk: collapsed < disclosed && redisclosed === disclosed,
      overflowOk: measured.overflow <= 1,
      bottomNavOk: measured.covered.length === 0,
    };
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(250);
  report.a11y = await page.evaluate(JS_A11Y);

  const focusTrail: string[] = [];
  await page.locator('[data-verdiencheck-company-car] button').first().focus();
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press('Tab');
    focusTrail.push((await page.evaluate(JS_ACTIVE)) as string);
  }
  report.focusTrail = focusTrail;
  report.focusTrapped = new Set(focusTrail).size <= 2;

  writeFileSync(join(OUT, 'responsive.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
