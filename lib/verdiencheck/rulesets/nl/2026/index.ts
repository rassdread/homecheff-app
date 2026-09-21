import type { TaxJurisdiction } from '../../../domain/jurisdiction';
import { freezeRulePack, type RulePack } from '../../types';
import { NL_2026_MODULE_STATUS } from './modules';
import { NL_2026_PARAMETERS } from './parameters';
import { NL_2026_EFFECTIVE } from './sources';

/**
 * Overall pack stays DRAFT (not published). Certified modules are gated by
 * NL_2026_MODULE_STATUS, not this boolean.
 */
export const NL_2026_PACK: RulePack = freezeRulePack({
  id: 'NL-2026',
  jurisdiction: 'NL' satisfies TaxJurisdiction,
  year: 2026,
  version: '2026.7-owner-occupied-home',
  status: 'DRAFT',
  effectiveFrom: NL_2026_EFFECTIVE.effectiveFrom,
  effectiveUntil: NL_2026_EFFECTIVE.effectiveUntil,
  verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
  parameters: NL_2026_PARAMETERS,
  modules: NL_2026_MODULE_STATUS,
});
