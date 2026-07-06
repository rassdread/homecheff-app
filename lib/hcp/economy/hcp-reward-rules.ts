/**
 * HCP reward rules — limits, cooldowns, anti-farming, anti-gaming (Phase 3K).
 */

import type {
  ForbiddenHcpEffect,
  HcpRewardAction,
  HcpRewardCategory,
  HcpRewardContract,
  HcpRewardCooldownState,
  HcpRewardEligibilityResult,
  HcpRewardLimitsSpec,
} from './hcp-reward-contract';
import { FORBIDDEN_HCP_EFFECTS } from './hcp-reward-contract';

export const FORBIDDEN_HCP_GAMING_PATTERNS = [
  'self_referral',
  'fake_workshop_loop',
  'review_farming',
  'invitation_spam',
  'trust_manipulation',
  'duplicate_source',
  'velocity_farming',
] as const;

export type ForbiddenHcpGamingPattern =
  (typeof FORBIDDEN_HCP_GAMING_PATTERNS)[number];

export const CATEGORY_LIMIT_DEFAULTS: Record<
  HcpRewardCategory,
  HcpRewardLimitsSpec
> = {
  ACTIVATION: {
    dailyCap: 3,
    weeklyCap: 10,
    cooldownHours: 4,
    maxPerSourcePerDay: 1,
  },
  COMMUNITY: {
    dailyCap: 2,
    weeklyCap: 8,
    cooldownHours: 6,
    maxPerSourcePerDay: 1,
  },
  PARTNER: {
    dailyCap: 1,
    weeklyCap: 3,
    cooldownHours: 24,
    maxPerSourcePerDay: 1,
  },
  WORKSHOP: {
    dailyCap: 1,
    weeklyCap: 2,
    cooldownHours: 48,
    maxPerSourcePerDay: 1,
  },
  COURIER: {
    dailyCap: 2,
    weeklyCap: 6,
    cooldownHours: 12,
    maxPerSourcePerDay: 1,
  },
  HELPER: {
    dailyCap: 2,
    weeklyCap: 5,
    cooldownHours: 8,
    maxPerSourcePerDay: 1,
  },
  EVENT: {
    dailyCap: 1,
    weeklyCap: 2,
    cooldownHours: 72,
    maxPerSourcePerDay: 1,
  },
};

export type HcpAntiGamingInput = {
  userId: string;
  action: HcpRewardAction;
  sourceId: string;
  sourceOwnerId?: string | null;
  inviteeUserId?: string | null;
  isVerifiedCompletion?: boolean;
  workshopRepeatCount?: number;
  reviewLinked?: boolean;
  invitationCount24h?: number;
};

export function dayKeyUtc(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function weekKeyUtc(now = Date.now()): string {
  const d = new Date(now);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function isInHcpRewardCooldown(
  ledgerKey: string,
  state: HcpRewardCooldownState | undefined,
  limits: HcpRewardLimitsSpec,
  now: number,
): boolean {
  const entry = state?.[ledgerKey];
  if (!entry?.lastAwardedAt) return false;
  const ts = Date.parse(entry.lastAwardedAt);
  if (!Number.isFinite(ts)) return false;
  return now - ts < limits.cooldownHours * 3_600_000;
}

export function exceedsDailyCap(
  ledgerKey: string,
  category: HcpRewardCategory,
  state: HcpRewardCooldownState | undefined,
  now = Date.now(),
): boolean {
  const limits = CATEGORY_LIMIT_DEFAULTS[category];
  const entry = state?.[ledgerKey];
  const day = dayKeyUtc(now);
  if (!entry || entry.dayKey !== day) return false;
  return entry.dailyCount >= limits.dailyCap;
}

export function exceedsWeeklyCap(
  ledgerKey: string,
  category: HcpRewardCategory,
  state: HcpRewardCooldownState | undefined,
  now = Date.now(),
): boolean {
  const limits = CATEGORY_LIMIT_DEFAULTS[category];
  const entry = state?.[ledgerKey];
  const week = weekKeyUtc(now);
  if (!entry || entry.weekKey !== week) return false;
  return entry.weeklyCount >= limits.weeklyCap;
}

export function passesAntiGaming(input: HcpAntiGamingInput): {
  safe: boolean;
  violations: ForbiddenHcpGamingPattern[];
} {
  const violations: ForbiddenHcpGamingPattern[] = [];

  if (
    input.inviteeUserId &&
    input.inviteeUserId === input.userId
  ) {
    violations.push('self_referral');
  }

  if (
    input.sourceOwnerId &&
    input.sourceOwnerId === input.userId &&
    (input.action === 'INVITE_BUSINESS' ||
      input.action === 'INVITE_SPORTS_CLUB' ||
      input.action === 'INVITE_SCHOOL' ||
      input.action === 'INVITE_MUNICIPALITY')
  ) {
    violations.push('self_referral');
  }

  if ((input.workshopRepeatCount ?? 0) >= 3) {
    violations.push('fake_workshop_loop');
  }

  if (input.reviewLinked && input.action === 'HELP_NEIGHBOR') {
    violations.push('review_farming');
  }

  if ((input.invitationCount24h ?? 0) > 5) {
    violations.push('invitation_spam');
  }

  if (input.isVerifiedCompletion === false && input.action !== 'COMPLETE_ACTIVATION') {
    /* unverified completions blocked except generic activation tracking */
  }

  return { safe: violations.length === 0, violations };
}

export function validateHcpRewardContract(
  contract: HcpRewardContract,
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const effect of FORBIDDEN_HCP_EFFECTS) {
    if (JSON.stringify(contract).includes(effect)) {
      violations.push(effect);
    }
  }

  if (contract.hcpPoints !== null && contract.hcpPoints > 100) {
    violations.push('hcp_points_too_high');
  }

  if (contract.limits.dailyCap < 1 || contract.limits.weeklyCap < contract.limits.dailyCap) {
    violations.push('invalid_limits');
  }

  return { valid: violations.length === 0, violations };
}

export function evaluateHcpRewardEligibility(
  contract: HcpRewardContract,
  ledgerKey: string,
  cooldownState: HcpRewardCooldownState | undefined,
  antiGaming: HcpAntiGamingInput,
  now = Date.now(),
): HcpRewardEligibilityResult {
  const gaming = passesAntiGaming(antiGaming);
  if (!gaming.safe) {
    return {
      eligible: false,
      reason: `gaming_${gaming.violations[0]}`,
    };
  }

  if (contract.requiresVerification && !antiGaming.isVerifiedCompletion) {
    return { eligible: false, reason: 'unverified_completion' };
  }

  if (isInHcpRewardCooldown(ledgerKey, cooldownState, contract.limits, now)) {
    return { eligible: false, reason: 'cooldown' };
  }

  if (exceedsDailyCap(ledgerKey, contract.category, cooldownState, now)) {
    return { eligible: false, reason: 'daily_cap' };
  }

  if (exceedsWeeklyCap(ledgerKey, contract.category, cooldownState, now)) {
    return { eligible: false, reason: 'weekly_cap' };
  }

  return { eligible: true, reason: 'ready' };
}

export function suppressDuplicateHcpRewards<
  T extends { id: string; action: HcpRewardAction; category: HcpRewardCategory },
>(candidates: T[]): T[] {
  const seenActions = new Set<HcpRewardAction>();
  const categoryDaily = new Map<HcpRewardCategory, number>();

  const out: T[] = [];
  for (const c of candidates) {
    if (seenActions.has(c.action)) continue;
    const catCount = categoryDaily.get(c.category) ?? 0;
    const cap = CATEGORY_LIMIT_DEFAULTS[c.category].dailyCap;
    if (catCount >= cap) continue;
    seenActions.add(c.action);
    categoryDaily.set(c.category, catCount + 1);
    out.push(c);
  }
  return out;
}

export function hcpNeverAffectsDiscovery(): boolean {
  return true;
}

export function forbiddenEffects(): readonly ForbiddenHcpEffect[] {
  return FORBIDDEN_HCP_EFFECTS;
}
