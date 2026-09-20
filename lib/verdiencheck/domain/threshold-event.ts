/**
 * Generic threshold-event labels. Legal operators stay per-rule.
 * Never reuse one >= operator for VAT, KOR and DAC7.
 */

export const THRESHOLD_EVENT_STATES = [
  'NONE',
  'APPROACHING',
  'REACHED',
  'EXCEEDED',
] as const;

export type ThresholdEventState = (typeof THRESHOLD_EVENT_STATES)[number];

export const THRESHOLD_KINDS = [
  'VAT_REGISTRATION_2200',
  'KOR_20000',
  'DAC7_GOODS_TRANSACTIONS',
  'DAC7_GOODS_CONSIDERATION',
] as const;

export type ThresholdKind = (typeof THRESHOLD_KINDS)[number];

export type ThresholdEvent = {
  kind: ThresholdKind;
  calendarYear: number;
  state: ThresholdEventState;
};
