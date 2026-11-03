import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { isHomeCheffDeliveryEnabled } from '@/lib/delivery/delivery-deployment-gate';
import {
  callerMaySeeDeliveryUi,
  courierOnboardingUiOpen,
  evaluateDeliveryAccess,
  isDeliveryPilotRestricted,
} from '@/lib/delivery/delivery-pilot-access';

export const dynamic = 'force-dynamic';

/** Client-safe delivery flags. Onboarding stays separate from paid pilot access. */
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
  const courierOnboardingAvailableToCaller = courierOnboardingUiOpen();
  return NextResponse.json({
    homeCheffDeliveryEnabled,
    deliveryAvailableToCaller,
    courierToolsAvailableToCaller,
    courierOnboardingAvailableToCaller,
    deliveryPilotRestricted: isDeliveryPilotRestricted(),
    namedProviderSelectionEnabled:
      deliveryAvailableToCaller && flags.namedProviderSelectionEnabled,
    providerPricingEnabled: deliveryAvailableToCaller && flags.providerPricingEnabled,
    namedProviderCopyEnabled: deliveryAvailableToCaller && flags.namedProviderCopyEnabled,
    firstAcceptPoolRuntimeEnabled: flags.firstAcceptPoolRuntimeEnabled,
  });
}
