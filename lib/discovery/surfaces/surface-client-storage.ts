/**
 * Client persistence for opportunity module dismiss / cooldown.
 */

import type { OpportunityModuleId } from './surface-contract';
import type { OpportunityType } from '@/lib/discovery/opportunities/opportunity-contract';
import type { OpportunityCooldownState } from './surface-context';

const STORAGE_PREFIX = 'hc:surfaces:opportunity';
const COOLDOWN_KEY = `${STORAGE_PREFIX}:cooldowns`;
const ECONOMY_COOLDOWN_KEY = `${STORAGE_PREFIX}:economy-cooldowns`;

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readOpportunityCooldownState(): OpportunityCooldownState {
  return readJson<OpportunityCooldownState>(COOLDOWN_KEY) ?? {};
}

export function recordOpportunityDismissed(moduleId: OpportunityModuleId): void {
  const cooldowns = readOpportunityCooldownState();
  cooldowns[moduleId] = {
    dismissedAt: new Date().toISOString(),
    lastShownAt: cooldowns[moduleId]?.lastShownAt ?? null,
  };
  writeJson(COOLDOWN_KEY, cooldowns);
}

export function recordOpportunityShown(moduleId: OpportunityModuleId): void {
  const cooldowns = readOpportunityCooldownState();
  cooldowns[moduleId] = {
    dismissedAt: cooldowns[moduleId]?.dismissedAt ?? null,
    lastShownAt: new Date().toISOString(),
  };
  writeJson(COOLDOWN_KEY, cooldowns);
}

export function readEconomyOpportunityCooldownState(): Partial<
  Record<
    OpportunityType,
    {
      dismissedAt: string | null;
      lastShownAt: string | null;
      acceptedAt: string | null;
      completedAt: string | null;
      lifecycle: string;
    }
  >
> {
  return readJson<EconomyOpportunityCooldownState>(ECONOMY_COOLDOWN_KEY) ?? {};
}

type EconomyOpportunityCooldownState = Partial<
  Record<
    OpportunityType,
    {
      dismissedAt: string | null;
      lastShownAt: string | null;
      acceptedAt: string | null;
      completedAt: string | null;
      lifecycle: string;
    }
  >
>;

export function recordEconomyOpportunityDismissed(type: OpportunityType): void {
  const cooldowns = readEconomyOpportunityCooldownState();
  cooldowns[type] = {
    dismissedAt: new Date().toISOString(),
    lastShownAt: cooldowns[type]?.lastShownAt ?? null,
    acceptedAt: cooldowns[type]?.acceptedAt ?? null,
    completedAt: cooldowns[type]?.completedAt ?? null,
    lifecycle: 'archived',
  };
  writeJson(ECONOMY_COOLDOWN_KEY, cooldowns);
}

export function recordEconomyOpportunityShown(type: OpportunityType): void {
  const cooldowns = readEconomyOpportunityCooldownState();
  cooldowns[type] = {
    dismissedAt: cooldowns[type]?.dismissedAt ?? null,
    lastShownAt: new Date().toISOString(),
    acceptedAt: cooldowns[type]?.acceptedAt ?? null,
    completedAt: cooldowns[type]?.completedAt ?? null,
    lifecycle: 'shown',
  };
  writeJson(ECONOMY_COOLDOWN_KEY, cooldowns);
}
