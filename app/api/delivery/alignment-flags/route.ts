import { NextResponse } from 'next/server';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';

export const dynamic = 'force-dynamic';

/** Public/client-safe delivery alignment flags for checkout UI. */
export async function GET() {
  const flags = getDeliveryAlignmentFlags();
  return NextResponse.json({
    namedProviderSelectionEnabled: flags.namedProviderSelectionEnabled,
    providerPricingEnabled: flags.providerPricingEnabled,
    namedProviderCopyEnabled: flags.namedProviderCopyEnabled,
    firstAcceptPoolRuntimeEnabled: flags.firstAcceptPoolRuntimeEnabled,
  });
}
