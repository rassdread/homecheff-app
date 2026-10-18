import { NextResponse } from 'next/server';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { isHomeCheffDeliveryEnabled } from '@/lib/delivery/delivery-deployment-gate';

export const dynamic = 'force-dynamic';

/** Public/client-safe delivery alignment flags for checkout UI. */
export async function GET() {
  const flags = getDeliveryAlignmentFlags();
  const homeCheffDeliveryEnabled = isHomeCheffDeliveryEnabled();
  return NextResponse.json({
    homeCheffDeliveryEnabled,
    namedProviderSelectionEnabled:
      homeCheffDeliveryEnabled && flags.namedProviderSelectionEnabled,
    providerPricingEnabled: homeCheffDeliveryEnabled && flags.providerPricingEnabled,
    namedProviderCopyEnabled: homeCheffDeliveryEnabled && flags.namedProviderCopyEnabled,
    firstAcceptPoolRuntimeEnabled: flags.firstAcceptPoolRuntimeEnabled,
  });
}
