import type { ProposalFulfillmentType } from '@prisma/client';
import type { FulfillmentOptions } from '@/lib/marketplace/listing-taxonomy';

export function allowedFulfillmentTypes(
  opts: FulfillmentOptions,
): ProposalFulfillmentType[] {
  const types: ProposalFulfillmentType[] = [];
  if (opts.pickup || opts.onSiteProvider) types.push('PICKUP');
  if (opts.delivery || opts.onSiteClient) types.push('DELIVERY');
  if (types.length === 0) types.push('PICKUP');
  return types;
}
