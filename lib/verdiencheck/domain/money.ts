/**
 * Integer cents only. No floats for money.
 * Commercial result ≠ taxable income.
 */

export type Cents = number;

export function assertCents(value: number, label: string): Cents {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be integer cents, got ${value}`);
  }
  return value;
}

export function commercialResultCents(
  turnoverCents: Cents,
  costsCents: Cents,
): Cents {
  assertCents(turnoverCents, 'turnoverCents');
  assertCents(costsCents, 'costsCents');
  return turnoverCents - costsCents;
}

/** Parse user euro input without float drift (19.99 * 100). */
export function parseEuroInputToCents(raw: string): Cents | null {
  const t = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (t === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [whole, frac = ''] = t.split('.');
  const frac2 = (frac + '00').slice(0, 2);
  return Number(whole) * 100 + Number(frac2);
}

export function formatCentsAsEuro(cents: Cents): string {
  assertCents(cents, 'cents');
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole},${frac.toString().padStart(2, '0')}`;
}

/** UI only. Certified engines keep integer cents and formatCentsAsEuro. */
export function formatCentsAsEuroDisplay(cents: Cents): string {
  const formatted = formatCentsAsEuro(cents);
  return formatted.endsWith(',00') ? formatted.slice(0, -3) : formatted;
}

/** UI headline rounding. Engine remains integer cents. */
export function roundCentsToWholeEuroCents(cents: Cents): Cents {
  assertCents(cents, 'cents');
  const sign = cents < 0 ? -1 : 1;
  const euros = Math.floor((Math.abs(cents) + 50) / 100);
  return sign * euros * 100;
}

export function formatCentsAsWholeEuroDisplay(cents: Cents): string {
  const whole = roundCentsToWholeEuroCents(cents);
  const sign = whole < 0 ? '-' : '';
  const euros = Math.abs(whole) / 100;
  return `${sign}${String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export const SCENARIO_PRESET_EUROS = [500, 1000, 2500, 5000, 10000] as const;
export type ScenarioPresetEuro = (typeof SCENARIO_PRESET_EUROS)[number];

export const SCENARIO_PRESET_CENTS: readonly Cents[] = SCENARIO_PRESET_EUROS.map(
  (euro) => euro * 100,
);

export function scenarioPresetToCents(euro: ScenarioPresetEuro): Cents {
  return euro * 100;
}
