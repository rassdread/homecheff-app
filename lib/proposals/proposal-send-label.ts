import type { MarketplaceCategory } from '@prisma/client';
import { PROPOSAL_I18N } from './proposal-i18n-keys';

const SERVICE_CATEGORIES: MarketplaceCategory[] = [
  'ARTISTIC_SERVICE',
  'PRACTICAL_SERVICE',
  'KNOWLEDGE',
];

/** User-facing send-button label: "Offerte sturen" for service listings, else "Voorstel sturen". */
export function resolveProposalSendLabelKey(
  marketplaceCategory?: MarketplaceCategory | string | null,
): string {
  if (
    marketplaceCategory &&
    SERVICE_CATEGORIES.includes(marketplaceCategory as MarketplaceCategory)
  ) {
    return PROPOSAL_I18N.actions.sendQuote;
  }
  return PROPOSAL_I18N.actions.send;
}
