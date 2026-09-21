import type { TaxJurisdiction } from '../domain/jurisdiction';

export const RULE_PACK_STATUSES = [
  'DRAFT',
  'CERTIFIED',
  'PUBLISHED',
  'RETIRED',
] as const;

export type RulePackStatus = (typeof RULE_PACK_STATUSES)[number];

export type RulePackModuleStatus =
  | RulePackStatus
  | 'CERTIFIED_FOR_ASSUMPTION_MODE'
  | 'CERTIFIED_FOR_REVIEW_ONLY'
  | 'CERTIFIED_FOR_STANDARD_WHITE_MONTHLY'
  | 'PARTIAL';

export type RuleParameter = {
  readonly value?: unknown;
  readonly formulaId?: string;
  readonly officialSource?: string | null;
  readonly officialSourceUrl?: string | null;
  readonly effectiveFrom?: string | null;
  readonly effectiveUntil?: string | null;
  readonly verifiedAt?: string | null;
  readonly status?: RulePackStatus;
};

export type RulePack = {
  readonly id: string;
  readonly jurisdiction: TaxJurisdiction;
  readonly year: number;
  readonly version: string;
  readonly status: RulePackStatus;
  readonly effectiveFrom: string;
  readonly effectiveUntil: string;
  readonly verifiedAt: string | null;
  readonly parameters: Readonly<Record<string, RuleParameter>>;
  readonly modules?: Readonly<Record<string, RulePackModuleStatus>>;
};

export type PackResolutionError =
  | 'PACK_NOT_FOUND'
  | 'PACK_NOT_CERTIFIED'
  | 'PACK_RETIRED'
  | 'PACK_NOT_AVAILABLE_FOR_JURISDICTION'
  | 'NO_FALLBACK_ALLOWED';

/**
 * Full-product user computation: PUBLISHED only.
 * Core NL-2026 income/Zvw/zorgtoeslag uses module flags, not this boolean.
 */
export function packAllowsUserFacingTaxComputation(
  pack: RulePack,
): boolean {
  return pack.status === 'PUBLISHED';
}

export function packAllowsTestTaxComputation(pack: RulePack): boolean {
  return pack.status === 'PUBLISHED' || pack.status === 'CERTIFIED';
}

export function packHasCertifiedFiscalParameters(pack: RulePack): boolean {
  return Object.keys(pack.parameters).length > 0 && pack.verifiedAt != null;
}

const CORE_MODULE_KEYS = [
  'incomeTax',
  'generalTaxCredit',
  'employmentTaxCredit',
  'row',
  'zvw',
  'healthcareAllowance',
] as const;

export function packAllowsCoreNl2026Computation(pack: RulePack): boolean {
  if (pack.jurisdiction !== 'NL' || pack.year !== 2026) return false;
  const mods = pack.modules;
  if (!mods) return false;
  return CORE_MODULE_KEYS.every((key) => {
    const s = mods[key];
    return s === 'CERTIFIED' || s === 'CERTIFIED_FOR_ASSUMPTION_MODE';
  });
}

export function freezeRulePack(pack: RulePack): RulePack {
  return Object.freeze({
    ...pack,
    parameters: Object.freeze({ ...pack.parameters }),
    modules: pack.modules ? Object.freeze({ ...pack.modules }) : undefined,
  });
}
