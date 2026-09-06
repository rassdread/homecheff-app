/**
 * Server-side opportunity / Verdien funnel events → AnalyticsEvent (authoritative for BI).
 * Cert/test traffic: metadata.isCertification === true is excluded from commercial aggregates.
 */
import { prisma } from '@/lib/prisma';

export const OPPORTUNITY_ENTITY_TYPE = 'OPPORTUNITY' as const;

export type OpportunityServerEventType =
  | 'OPPORTUNITY_HUB_VIEW'
  | 'OPPORTUNITY_CARD_CLICK'
  | 'OPPORTUNITY_SHARE_INTENT'
  | 'OPPORTUNITY_SHARE_LINK_CREATED'
  | 'OPPORTUNITY_SHARE_NATIVE_OPENED'
  | 'OPPORTUNITY_SHARE_LINK_COPIED'
  | 'REFERRAL_LANDING'
  | 'SIGNUP_STARTED'
  | 'SIGNUP_COMPLETED'
  | 'CANONICAL_ATTRIBUTION_LOCKED'
  | 'DELIVERY_PROVIDER_ONBOARDING_STARTED'
  | 'DELIVERY_PROVIDER_PROFILE_CREATED'
  | 'DELIVERY_PROVIDER_ACTIVATED'
  | 'FIRST_ELIGIBLE_REVENUE_EVENT'
  | 'COMMISSION_CREATED'
  | 'COMMISSION_REVERSED'
  /** Client alias events normalized on ingest */
  | 'opportunity_hub_view'
  | 'opportunity_card_click'
  | 'opportunity_share_intent'
  | 'opportunity_share_link_copied'
  | 'opportunity_share_native_opened'
  | 'opportunity_share_link_created';

const CLIENT_TO_CANONICAL: Record<string, string> = {
  opportunity_hub_view: 'OPPORTUNITY_HUB_VIEW',
  opportunity_card_click: 'OPPORTUNITY_CARD_CLICK',
  opportunity_share_intent: 'OPPORTUNITY_SHARE_INTENT',
  opportunity_share_link_copied: 'OPPORTUNITY_SHARE_LINK_COPIED',
  opportunity_share_native_opened: 'OPPORTUNITY_SHARE_NATIVE_OPENED',
  opportunity_share_link_created: 'OPPORTUNITY_SHARE_LINK_CREATED',
};

export function normalizeOpportunityEventType(raw: string): string {
  const t = raw.trim();
  return CLIENT_TO_CANONICAL[t] ?? t;
}

export async function trackOpportunityEventServer(input: {
  eventType: string;
  userId?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; id?: string }> {
  try {
    const eventType = normalizeOpportunityEventType(input.eventType);
    if (!eventType || eventType.length > 120) return { ok: false };

    const row = await prisma.analyticsEvent.create({
      data: {
        eventType,
        entityType: OPPORTUNITY_ENTITY_TYPE,
        entityId: (input.entityId || eventType).slice(0, 80),
        userId: input.userId ?? null,
        metadata: {
          ...(input.metadata && typeof input.metadata === 'object' ? input.metadata : {}),
          persistedAt: new Date().toISOString(),
        },
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  } catch (e) {
    console.warn('[opportunity-analytics]', e);
    return { ok: false };
  }
}

/** Commercial BI must exclude certification / synthetic traffic. */
export function commercialOpportunityWhere() {
  return {
    entityType: OPPORTUNITY_ENTITY_TYPE,
    NOT: {
      OR: [
        { metadata: { path: ['isCertification'], equals: true } },
        { metadata: { path: ['cert'], equals: true } },
        { metadata: { path: ['excludeFromCommercialBi'], equals: true } },
      ],
    },
  } as const;
}
