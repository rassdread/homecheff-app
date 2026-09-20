/**
 * Generic allowance kink detector. Engine-level, not UI.
 * Signals that an allowance changes if the user earns more.
 * Never advises staying under a threshold.
 */

import { UNKNOWN, isUnknown, type CentsOrUnknown } from '../domain/unknown';

export const ALLOWANCE_KINK_GUIDANCE_ID = 'ALLOWANCE_CHANGES_IF_YOU_EARN_MORE';

export type AllowanceKinkProbe = {
  extraCents: number;
  allowanceCents: CentsOrUnknown;
};

export type AllowanceKinkResult = {
  detected: boolean;
  guidanceId: typeof ALLOWANCE_KINK_GUIDANCE_ID | null;
  /** Never a “stay under €X” amount. */
  avoidThresholdCents: null;
  probes: AllowanceKinkProbe[];
};

export function detectAllowanceKink(input: {
  baselineAllowanceCents: CentsOrUnknown;
  probes: readonly AllowanceKinkProbe[];
}): AllowanceKinkResult {
  const probes = [...input.probes];
  if (isUnknown(input.baselineAllowanceCents)) {
    return {
      detected: false,
      guidanceId: null,
      avoidThresholdCents: null,
      probes,
    };
  }
  let detected = false;
  for (const probe of probes) {
    if (isUnknown(probe.allowanceCents)) continue;
    if (probe.allowanceCents !== input.baselineAllowanceCents) {
      detected = true;
      break;
    }
  }
  return {
    detected,
    guidanceId: detected ? ALLOWANCE_KINK_GUIDANCE_ID : null,
    avoidThresholdCents: null,
    probes,
  };
}

export const DEFAULT_KINK_EXTRAS_CENTS = [50_000, 100_000] as const;

export function sumKnownAllowances(values: readonly CentsOrUnknown[]): CentsOrUnknown {
  let sum = 0;
  for (const v of values) {
    if (isUnknown(v)) return UNKNOWN;
    sum += v;
  }
  return sum;
}
