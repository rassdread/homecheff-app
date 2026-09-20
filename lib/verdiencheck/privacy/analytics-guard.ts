/**
 * Privacy allowlist for VerdienCheck product analytics.
 * Rejects wizard answers, financial results, benefit status, and legal route.
 */

export const VERDIENCHECK_ALLOWED_ANALYTICS_KEYS = [
  'entry_point',
  'progress_bucket',
  'step_number',
  'total_visible_steps',
  'action',
  'error_code',
  'component',
] as const;

export const VERDIENCHECK_ENTRY_POINTS = [
  'faq',
  'seller',
  'careers',
  'werken-bij',
  'direct',
] as const;
export type VerdienCheckEntryPoint = (typeof VERDIENCHECK_ENTRY_POINTS)[number];

export const VERDIENCHECK_PROGRESS_BUCKETS = [
  'START',
  'EARLY',
  'MIDDLE',
  'LATE',
  'RESULT',
] as const;
export type VerdienCheckProgressBucket = (typeof VERDIENCHECK_PROGRESS_BUCKETS)[number];

export const VERDIENCHECK_ACTIONS = [
  'SIGN_UP',
  'START_SELLING',
  'RETURN_TO_HOMECHEFF',
  'LEARN_MORE',
] as const;
export type VerdienCheckAction = (typeof VERDIENCHECK_ACTIONS)[number];

export const VERDIENCHECK_ERROR_CODES = [
  'WIZARD_RENDER',
  'CALCULATOR_FAILED',
] as const;

export const VERDIENCHECK_ERROR_COMPONENTS = [
  'VerdienCheckWizard',
  'VerdienCheckCalculator',
] as const;

/** Keys/concepts that must never appear in analytics payloads. */
export const FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS = [
  'income',
  'inkomen',
  'amount',
  'bedrag',
  'turnover',
  'omzet',
  'result',
  'uitkering',
  'benefit',
  'benefittype',
  'toeslag',
  'allowance',
  'partner',
  'partnerincome',
  'rent',
  'huur',
  'assets',
  'vermogen',
  'children',
  'kinderen',
  'childcare',
  'kinderopvang',
  'costs',
  'kosten',
  'tax',
  'belasting',
  'aow',
  'ww',
  'wia',
  'wajong',
  'zw',
  'wao',
  'waz',
  'bijstand',
  'nvwa',
  'kvk',
  'btw',
  'vat',
  'kor',
  'food',
  'allergen',
  'question',
  'question_id',
  'answer',
  'wizard',
  'state',
  'payload',
  'net_extra',
  'tax_delta',
  'benefit_delta',
  'estimated_tax',
  'government_route',
  'proceed_semantics',
  'person_situation',
] as const;

const FORBIDDEN_VALUE_TOKENS = [
  'WW',
  'WIA',
  'WAJONG',
  'ZW',
  'WAO',
  'WAZ',
  'BIJSTAND',
  'NVWA',
  'KVK',
  'KOR',
  'BTW',
] as const;

const ALLOWED_KEY_SET = new Set<string>(VERDIENCHECK_ALLOWED_ANALYTICS_KEYS);
const ENTRY_SET = new Set<string>(VERDIENCHECK_ENTRY_POINTS);
const BUCKET_SET = new Set<string>(VERDIENCHECK_PROGRESS_BUCKETS);
const ACTION_SET = new Set<string>(VERDIENCHECK_ACTIONS);
const ERROR_CODE_SET = new Set<string>(VERDIENCHECK_ERROR_CODES);
const COMPONENT_SET = new Set<string>(VERDIENCHECK_ERROR_COMPONENTS);

export function sanitizeVerdienCheckEntryPoint(raw: string | null | undefined): VerdienCheckEntryPoint {
  const value = String(raw ?? '').trim().toLowerCase();
  if (ENTRY_SET.has(value)) return value as VerdienCheckEntryPoint;
  return 'direct';
}

export function verdienCheckProgressBucket(input: {
  stepIndex: number;
  totalVisibleSteps: number;
  isResult: boolean;
}): VerdienCheckProgressBucket {
  if (input.isResult) return 'RESULT';
  const total = Math.max(1, input.totalVisibleSteps);
  if (input.stepIndex <= 0) return 'START';
  const ratio = input.stepIndex / Math.max(total - 1, 1);
  if (ratio < 0.33) return 'EARLY';
  if (ratio < 0.66) return 'MIDDLE';
  return 'LATE';
}

function forbiddenKeyHit(key: string): string | null {
  const compact = key.toLowerCase().replace(/[^a-z0-9]+/g, '');
  for (const needle of FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS) {
    if (compact === needle || compact.includes(needle)) return needle;
  }
  return null;
}

function forbiddenValueHit(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const upper = value.toUpperCase();
  for (const token of FORBIDDEN_VALUE_TOKENS) {
    if (upper === token || new RegExp(`(^|[^A-Z])${token}([^A-Z]|$)`).test(upper)) {
      return token;
    }
  }
  return null;
}

function keyAllowedForValue(key: string, value: unknown): string | null {
  if (key === 'entry_point') {
    return typeof value === 'string' && ENTRY_SET.has(value) ? null : 'entry_point';
  }
  if (key === 'progress_bucket') {
    return typeof value === 'string' && BUCKET_SET.has(value) ? null : 'progress_bucket';
  }
  if (key === 'action') {
    return typeof value === 'string' && ACTION_SET.has(value) ? null : 'action';
  }
  if (key === 'error_code') {
    return typeof value === 'string' && ERROR_CODE_SET.has(value) ? null : 'error_code';
  }
  if (key === 'component') {
    return typeof value === 'string' && COMPONENT_SET.has(value) ? null : 'component';
  }
  if (key === 'step_number' || key === 'total_visible_steps') {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 99) {
      return key;
    }
    return null;
  }
  return key;
}

export function inspectVerdienCheckAnalyticsPayload(payload: unknown): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (payload == null) return { ok: true, errors };
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, errors: ['payload must be a flat object'] };
  }
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (!ALLOWED_KEY_SET.has(key)) {
      errors.push(`key not allowlisted: ${key}`);
    }
    const forbiddenKey = forbiddenKeyHit(key);
    if (forbiddenKey) {
      errors.push(`forbidden key concept: ${forbiddenKey}`);
    }
    const badValue = keyAllowedForValue(key, value);
    if (badValue) {
      errors.push(`invalid value for ${badValue}`);
    }
    const forbiddenValue = forbiddenValueHit(value);
    if (forbiddenValue) {
      errors.push(`forbidden value token: ${forbiddenValue}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function assertSafeVerdienCheckAnalyticsPayload(payload: unknown): void {
  const result = inspectVerdienCheckAnalyticsPayload(payload);
  if (!result.ok) {
    throw new Error(`VerdienCheck analytics payload rejected: ${result.errors.join('; ')}`);
  }
}
