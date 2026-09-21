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

/**
 * Parse user euro input without float drift.
 * Dutch thousands (`1.000`, `1.250`) stay whole euros; `19,99` / `19.99` are cents.
 */
export function parseEuroInputToCents(raw: string): Cents | null {
  const trimmed = raw.trim().replace(/\s/g, '').replace(/^€/, '');
  if (trimmed === '' || trimmed === '-' || trimmed === '+') return null;
  const sign = trimmed.startsWith('-') ? -1 : 1;
  const body = trimmed.replace(/^[+-]/, '');
  if (body === '') return null;

  const lastComma = body.lastIndexOf(',');
  const lastDot = body.lastIndexOf('.');
  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      if (!/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(body)) return null;
      normalized = body.replace(/\./g, '').replace(',', '.');
    } else {
      if (!/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(body)) return null;
      normalized = body.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    if (!/^\d+,\d{1,2}$/.test(body)) return null;
    normalized = body.replace(',', '.');
  } else if (lastDot >= 0) {
    const parts = body.split('.');
    const last = parts[parts.length - 1] ?? '';
    if (parts.length === 2 && last.length <= 2) {
      if (!/^\d+\.\d{1,2}$/.test(body)) return null;
      normalized = body;
    } else if (parts.every((part, index) => (index === 0 ? /^\d{1,3}$/.test(part) : /^\d{3}$/.test(part)))) {
      normalized = parts.join('');
    } else {
      return null;
    }
  } else {
    if (!/^\d+$/.test(body)) return null;
    normalized = body;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, frac = ''] = normalized.split('.');
  const frac2 = (frac + '00').slice(0, 2);
  return sign * (Number(whole) * 100 + Number(frac2));
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

/** Parseable euro string for wizard inputs. Not a display format. */
export function centsToPlainEuroInput(cents: Cents): string {
  assertCents(cents, 'cents');
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  if (frac === 0) return `${sign}${whole}`;
  return `${sign}${whole}.${frac.toString().padStart(2, '0')}`;
}
