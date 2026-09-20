/**
 * Year-locked rule pack registry.
 * No fallback BE/SR/OTHER → NL.
 * Adding a year must not mutate another year.
 */

import type { TaxJurisdiction } from '../domain/jurisdiction';
import { NL_2026_PACK } from './nl/2026';
import type { PackResolutionError, RulePack, RulePackStatus } from './types';
import { packAllowsTestTaxComputation, packAllowsUserFacingTaxComputation } from './types';

export type PackLookupResult =
  | { ok: true; pack: RulePack }
  | { ok: false; error: PackResolutionError };

export type RulePackRegistry = ReadonlyMap<string, RulePack>;

export function packKey(jurisdiction: TaxJurisdiction, year: number): string {
  return `${jurisdiction}-${year}`;
}

export function createRulePackRegistry(
  packs: readonly RulePack[],
): RulePackRegistry {
  const map = new Map<string, RulePack>();
  for (const pack of packs) {
    const key = packKey(pack.jurisdiction, pack.year);
    if (map.has(key)) {
      throw new Error(`Duplicate rule pack ${key}`);
    }
    map.set(key, pack);
  }
  return map;
}

export const PRODUCTION_RULE_PACK_REGISTRY: RulePackRegistry =
  createRulePackRegistry([NL_2026_PACK]);

export function getRulePack(
  jurisdiction: TaxJurisdiction,
  year: number,
  registry: RulePackRegistry = PRODUCTION_RULE_PACK_REGISTRY,
): PackLookupResult {
  if (jurisdiction !== 'NL') {
    return { ok: false, error: 'PACK_NOT_AVAILABLE_FOR_JURISDICTION' };
  }
  const pack = registry.get(packKey(jurisdiction, year));
  if (!pack) {
    return { ok: false, error: 'PACK_NOT_FOUND' };
  }
  return { ok: true, pack };
}

export function resolvePackForUserComputation(input: {
  jurisdiction: TaxJurisdiction;
  year: number;
  registry?: RulePackRegistry;
  allowCertifiedForTest?: boolean;
}): PackLookupResult {
  const found = getRulePack(
    input.jurisdiction,
    input.year,
    input.registry ?? PRODUCTION_RULE_PACK_REGISTRY,
  );
  if (!found.ok) return found;
  const pack = found.pack;
  if (pack.status === 'RETIRED') {
    return { ok: false, error: 'PACK_RETIRED' };
  }
  const allowed = input.allowCertifiedForTest
    ? packAllowsTestTaxComputation(pack)
    : packAllowsUserFacingTaxComputation(pack);
  if (!allowed) {
    return { ok: false, error: 'PACK_NOT_CERTIFIED' };
  }
  return found;
}

export function assertPackImmutable(
  original: RulePack,
  otherYear: RulePack,
): void {
  if (original.year === otherYear.year && original.jurisdiction === otherYear.jurisdiction) {
    throw new Error('Year packs must stay distinct');
  }
}

export function defaultYearPackStatus(
  registry: RulePackRegistry = PRODUCTION_RULE_PACK_REGISTRY,
  jurisdiction: TaxJurisdiction = 'NL',
  year = 2026,
): RulePackStatus | null {
  return registry.get(packKey(jurisdiction, year))?.status ?? null;
}
