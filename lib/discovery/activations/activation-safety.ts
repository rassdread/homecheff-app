/**
 * Activation safety rules — Phase 3G.
 */

import type { RealWorldActivationDefinition } from './activation-contract';

export const ACTIVATION_SAFETY_RULES = [
  'no_harassment',
  'no_romantic_targeting',
  'no_manipulation',
  'no_unsafe_challenges',
  'no_legal_risk',
  'no_public_shaming',
  'no_pressure_mechanics',
] as const;

export type ActivationSafetyRule = (typeof ACTIVATION_SAFETY_RULES)[number];

const BLOCKED_COPY_PATTERNS = [
  /shame/i,
  /you must/i,
  /or else/i,
  /only \d+ minutes left/i,
  /date me/i,
  /flirt/i,
  /leaderboard/i,
  /ranking boost/i,
  /pay to win/i,
];

const BLOCKED_SAFETY_TAGS = new Set([
  'romantic',
  'dating',
  'challenge_chain',
  'public_shame',
  'unsafe_meetup',
  'legal_risk',
]);

export function passesActivationSafety(
  def: RealWorldActivationDefinition,
): { safe: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const tag of def.safetyTags) {
    if (BLOCKED_SAFETY_TAGS.has(tag)) {
      violations.push(`blocked_tag:${tag}`);
    }
  }

  const copyBlob = [
    def.titleKey,
    def.descriptionKey,
    def.actionLabelKey,
  ].join(' ');

  for (const pattern of BLOCKED_COPY_PATTERNS) {
    if (pattern.test(copyBlob)) {
      violations.push(`blocked_copy:${pattern.source}`);
    }
  }

  if (def.priority >= 95 && def.category === 'COMMUNITY_SUPPORT') {
    violations.push('pressure_mechanics:high_priority_support');
  }

  return { safe: violations.length === 0, violations };
}

export function assertActivationLibrarySafety(
  definitions: RealWorldActivationDefinition[],
): { safe: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const def of definitions) {
    const result = passesActivationSafety(def);
    if (!result.safe) {
      failures.push(`${def.id}: ${result.violations.join(', ')}`);
    }
  }
  return { safe: failures.length === 0, failures };
}
