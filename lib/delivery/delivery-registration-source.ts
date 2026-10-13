/**
 * First-party delivery registration source.
 *
 * UTM cookies (hc_marketplace_utm_v1) are essential attribution, same class as
 * marketplace signup. They are not marketing cookies and are not gated on
 * advertising consent. This module never reads hc_ref and never writes
 * affiliate Attribution.
 *
 * User.acquisitionFirstTouch stays first-touch: an existing capture is not
 * overwritten. The delivery registration itself is one AnalyticsEvent per user.
 */
import { prisma } from '@/lib/prisma';
import { upsertMarketplaceAcquisitionFirstTouch } from '@/lib/acquisition/marketplace-acquisition';
import {
  hasMarketplaceUtmSignal,
  parseMarketplaceUtmFromCookieHeader,
} from '@/lib/acquisition/utm-persistence';
import { trackOpportunityEventServer } from '@/lib/analytics/opportunity-analytics-server';
import {
  buildDeliveryRegistrationSource,
  DELIVERY_REGISTRATION_SOURCE_EVENT,
  scrubDeliveryRegion,
} from '@/lib/delivery/delivery-registration-source-record';

export {
  buildDeliveryRegistrationSource,
  DELIVERY_REGISTRATION_SOURCE_EVENT,
  scrubDeliveryRegion,
};
export type { DeliveryRegistrationSourceRecord } from '@/lib/delivery/delivery-registration-source-record';

/**
 * Store campaign source after a successful delivery signup.
 * Does not throw. Does not change affiliate attribution.
 */
export async function persistDeliveryRegistrationSource(input: {
  userId: string;
  cookieHeader: string | null;
  providerType: string;
  deliveryRegion: string | null;
  profileId: string;
}): Promise<void> {
  try {
    const capture = parseMarketplaceUtmFromCookieHeader(input.cookieHeader);
    const registeredAt = new Date().toISOString();
    const record = buildDeliveryRegistrationSource({
      capture,
      providerType: input.providerType,
      deliveryRegion: input.deliveryRegion,
      registeredAt,
    });

    if (hasMarketplaceUtmSignal(capture) && capture) {
      const touch = {
        ...capture,
        provider_type: record.provider_type,
        ...(record.delivery_region ? { delivery_region: record.delivery_region } : {}),
        registered_at: record.registered_at,
      };
      await upsertMarketplaceAcquisitionFirstTouch(input.userId, touch);
    }

    const existing = await prisma.analyticsEvent.findFirst({
      where: {
        userId: input.userId,
        eventType: DELIVERY_REGISTRATION_SOURCE_EVENT,
      },
      select: { id: true },
    });
    if (existing) return;

    await trackOpportunityEventServer({
      eventType: DELIVERY_REGISTRATION_SOURCE_EVENT,
      userId: input.userId,
      entityId: input.profileId,
      metadata: record,
    });
  } catch (error) {
    console.error('[delivery-registration-source] persist failed', error);
  }
}
