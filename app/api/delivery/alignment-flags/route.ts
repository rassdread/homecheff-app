import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { isHomeCheffDeliveryEnabled } from '@/lib/delivery/delivery-deployment-gate';
import {
  callerMaySeeDeliveryUi,
  evaluateDeliveryAccess,
  isDeliveryPilotRestricted,
} from '@/lib/delivery/delivery-pilot-access';

export const dynamic = 'force-dynamic';

/** Client-safe delivery flags. The public flag stays separate from one caller's pilot access. */
export async function GET() {
  const flags = getDeliveryAlignmentFlags();
  const homeCheffDeliveryEnabled = isHomeCheffDeliveryEnabled();
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  } catch {
    userId = null;
  }
  const deliveryAvailableToCaller = userId
    ? evaluateDeliveryAccess({ requesterUserId: userId, requireCourier: false }).allowed
    : homeCheffDeliveryEnabled && !isDeliveryPilotRestricted();
  const courierToolsAvailableToCaller = callerMaySeeDeliveryUi(userId);
  return NextResponse.json({
    homeCheffDeliveryEnabled,
    deliveryAvailableToCaller,
    courierToolsAvailableToCaller,
    deliveryPilotRestricted: homeCheffDeliveryEnabled && isDeliveryPilotRestricted(),
    namedProviderSelectionEnabled:
      deliveryAvailableToCaller && flags.namedProviderSelectionEnabled,
    providerPricingEnabled: deliveryAvailableToCaller && flags.providerPricingEnabled,
    namedProviderCopyEnabled: deliveryAvailableToCaller && flags.namedProviderCopyEnabled,
    firstAcceptPoolRuntimeEnabled: flags.firstAcceptPoolRuntimeEnabled,
  });
}
