/**
 * Privacy-safe VerdienCheck funnel events.
 * Client GA4 only (existing consent-gated gtag). No Prisma, no wizard state.
 *
 * KPI definitions (no business targets):
 *   VERDIENCHECK_VISITS = verdiencheck_viewed
 *   STARTS = verdiencheck_started
 *   MIDPOINT_REACHED = verdiencheck_step_progress where progress_bucket = MIDDLE
 *   COMPLETIONS = verdiencheck_completed
 *   ACTION_CLICKS = signup | start_selling | exit | learn_more (action param)
 *   START_RATE = STARTS / VISITS
 *   COMPLETION_RATE = COMPLETIONS / STARTS
 *   RESULT_TO_ACTION_RATE = ACTION_CLICKS / COMPLETIONS
 */

import { trackEvent } from '@/components/GoogleAnalytics';
import {
  assertSafeVerdienCheckAnalyticsPayload,
  inspectVerdienCheckAnalyticsPayload,
  sanitizeVerdienCheckEntryPoint,
  type VerdienCheckAction,
  type VerdienCheckEntryPoint,
  type VerdienCheckProgressBucket,
} from '@/lib/verdiencheck/privacy/analytics-guard';

export const VERDIENCHECK_FUNNEL_EVENTS = {
  viewed: 'verdiencheck_viewed',
  started: 'verdiencheck_started',
  quickStarted: 'verdiencheck_quick_started',
  stepProgress: 'verdiencheck_step_progress',
  completed: 'verdiencheck_completed',
  quickCompleted: 'verdiencheck_quick_completed',
  moneyStarted: 'verdiencheck_money_started',
  moneyCompleted: 'verdiencheck_money_completed',
  resultViewed: 'verdiencheck_result_viewed',
  detailsOpened: 'verdiencheck_details_opened',
  officialLinkClicked: 'verdiencheck_official_link_clicked',
  restartClicked: 'verdiencheck_restart_clicked',
  exitToHomecheff: 'verdiencheck_exit_to_homecheff',
  signupClicked: 'verdiencheck_signup_clicked',
  startSellingClicked: 'verdiencheck_start_selling_clicked',
  wizardRenderError: 'verdiencheck_wizard_render_error',
  calculatorFailed: 'verdiencheck_calculator_failed',
} as const;

export type VerdienCheckFunnelEventName =
  (typeof VERDIENCHECK_FUNNEL_EVENTS)[keyof typeof VERDIENCHECK_FUNNEL_EVENTS];

export type VerdienCheckFunnelPayload = {
  entry_point?: VerdienCheckEntryPoint;
  progress_bucket?: VerdienCheckProgressBucket;
  step_number?: number;
  total_visible_steps?: number;
  action?: VerdienCheckAction;
  error_code?: 'WIZARD_RENDER' | 'CALCULATOR_FAILED';
  component?: 'VerdienCheckWizard' | 'VerdienCheckCalculator';
};

export type VerdienCheckFunnelSink = (
  eventName: VerdienCheckFunnelEventName,
  payload: Record<string, string | number>,
) => void;

type OccurrenceDedup = {
  started: boolean;
  quickStarted: boolean;
  completed: boolean;
  quickCompleted: boolean;
  moneyStarted: boolean;
  moneyCompleted: boolean;
  resultViewed: boolean;
  detailsOpened: boolean;
  calculatorFailed: boolean;
  wizardRenderError: boolean;
  progress: Set<string>;
};

function emptyOccurrence(): OccurrenceDedup {
  return {
    started: false,
    quickStarted: false,
    completed: false,
    quickCompleted: false,
    moneyStarted: false,
    moneyCompleted: false,
    resultViewed: false,
    detailsOpened: false,
    calculatorFailed: false,
    wizardRenderError: false,
    progress: new Set(),
  };
}

const sessionDedup = { viewed: false };
let occurrence = emptyOccurrence();
let testSink: VerdienCheckFunnelSink | null = null;
let rememberedEntry: VerdienCheckEntryPoint = 'direct';

export function rememberVerdienCheckEntryPoint(entry: VerdienCheckEntryPoint): void {
  rememberedEntry = entry;
}

export function currentVerdienCheckEntryPoint(): VerdienCheckEntryPoint {
  return rememberedEntry;
}

function defaultSink(
  eventName: VerdienCheckFunnelEventName,
  payload: Record<string, string | number>,
): void {
  if (typeof window === 'undefined') return;
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== 'function') return;
  trackEvent(eventName, payload);
}

function compactPayload(input: VerdienCheckFunnelPayload): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  out.entry_point = input.entry_point ?? rememberedEntry;
  if (input.progress_bucket) out.progress_bucket = input.progress_bucket;
  if (typeof input.step_number === 'number') out.step_number = input.step_number;
  if (typeof input.total_visible_steps === 'number') {
    out.total_visible_steps = input.total_visible_steps;
  }
  if (input.action) out.action = input.action;
  if (input.error_code) out.error_code = input.error_code;
  if (input.component) out.component = input.component;
  return out;
}

function shouldEmit(eventName: VerdienCheckFunnelEventName, payload: VerdienCheckFunnelPayload): boolean {
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.viewed) {
    if (sessionDedup.viewed) return false;
    sessionDedup.viewed = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.started) {
    if (occurrence.started) return false;
    occurrence.started = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.quickStarted) {
    if (occurrence.quickStarted) return false;
    occurrence.quickStarted = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.stepProgress) {
    const bucket = payload.progress_bucket ?? '';
    if (!bucket || occurrence.progress.has(bucket)) return false;
    occurrence.progress.add(bucket);
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.completed) {
    if (occurrence.completed) return false;
    occurrence.completed = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.quickCompleted) {
    if (occurrence.quickCompleted) return false;
    occurrence.quickCompleted = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.moneyStarted) {
    if (occurrence.moneyStarted) return false;
    occurrence.moneyStarted = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.moneyCompleted) {
    if (occurrence.moneyCompleted) return false;
    occurrence.moneyCompleted = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.resultViewed) {
    if (occurrence.resultViewed) return false;
    occurrence.resultViewed = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.detailsOpened) {
    if (occurrence.detailsOpened) return false;
    occurrence.detailsOpened = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.calculatorFailed) {
    if (occurrence.calculatorFailed) return false;
    occurrence.calculatorFailed = true;
    return true;
  }
  if (eventName === VERDIENCHECK_FUNNEL_EVENTS.wizardRenderError) {
    if (occurrence.wizardRenderError) return false;
    occurrence.wizardRenderError = true;
    return true;
  }
  return true;
}

export function resetVerdienCheckFunnelOccurrence(): void {
  occurrence = emptyOccurrence();
}

export function resetVerdienCheckFunnelForTests(): void {
  sessionDedup.viewed = false;
  occurrence = emptyOccurrence();
  testSink = null;
  rememberedEntry = 'direct';
}

export function setVerdienCheckFunnelSinkForTests(sink: VerdienCheckFunnelSink | null): void {
  testSink = sink;
}

export function readVerdienCheckEntryPointFromLocation(): VerdienCheckEntryPoint {
  if (typeof window === 'undefined') return 'direct';
  try {
    const from = sanitizeVerdienCheckEntryPoint(
      new URLSearchParams(window.location.search).get('from'),
    );
    rememberVerdienCheckEntryPoint(from);
    return from;
  } catch {
    return 'direct';
  }
}

export function trackVerdienCheckFunnelEvent(
  eventName: VerdienCheckFunnelEventName,
  payload: VerdienCheckFunnelPayload = {},
): boolean {
  const compact = compactPayload(payload);
  const inspected = inspectVerdienCheckAnalyticsPayload(compact);
  if (!inspected.ok) return false;
  assertSafeVerdienCheckAnalyticsPayload(compact);
  if (!shouldEmit(eventName, payload)) return false;
  const sink = testSink ?? defaultSink;
  sink(eventName, compact);
  return true;
}

export { sanitizeVerdienCheckEntryPoint, inspectVerdienCheckAnalyticsPayload };
