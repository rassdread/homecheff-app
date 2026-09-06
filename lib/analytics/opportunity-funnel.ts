/**
 * Opportunity funnel aggregates from AnalyticsEvent (entityType=OPPORTUNITY).
 * Cert/test traffic excluded from commercial mode via metadata flags.
 */
import { prisma } from '@/lib/prisma';
import {
  OPPORTUNITY_ENTITY_TYPE,
  commercialOpportunityWhere,
} from '@/lib/analytics/opportunity-analytics-server';

export type OpportunityFunnelBucket = {
  opportunityId: string;
  views: number;
  cardClicks: number;
  shareIntents: number;
  shareLinkCreated: number;
  shareNativeOpened: number;
  shareLinkCopied: number;
  referralLandings: number;
  signupsCompleted: number;
  attributionLocks: number;
  deliveryProfilesCreated: number;
  deliveryActivated: number;
};

export type OpportunityFunnelReport = {
  from: string;
  to: string;
  commercialOnly: boolean;
  shareToAttributionRate: number | null;
  shareToAttributionRateDefinition: string;
  shareToAttributionDenominatorReliable: boolean;
  attributedSignupsFromShares: number;
  uniqueShareSessions: number;
  companyShareLinkCreated: number;
  buckets: OpportunityFunnelBucket[];
  kpiDefinitions: Record<string, string>;
};

function opportunityIdFromMeta(meta: unknown): string {
  if (!meta || typeof meta !== 'object') return 'unknown';
  const m = meta as Record<string, unknown>;
  const id = m.opportunityId ?? m.id;
  return typeof id === 'string' && id ? id : 'unknown';
}

function shareSessionFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== 'object') return null;
  const m = meta as Record<string, unknown>;
  return typeof m.shareSessionId === 'string' ? m.shareSessionId : null;
}

export async function buildOpportunityFunnelReport(input: {
  from: Date;
  to: Date;
  commercialOnly?: boolean;
}): Promise<OpportunityFunnelReport> {
  const commercialOnly = input.commercialOnly !== false;
  const whereBase = commercialOnly
    ? commercialOpportunityWhere()
    : { entityType: OPPORTUNITY_ENTITY_TYPE };

  const events = await prisma.analyticsEvent.findMany({
    where: {
      ...whereBase,
      createdAt: { gte: input.from, lte: input.to },
    },
    select: {
      eventType: true,
      metadata: true,
      createdAt: true,
    },
    take: 20000,
    orderBy: { createdAt: 'asc' },
  });

  const bucketMap = new Map<string, OpportunityFunnelBucket>();
  const ensure = (id: string) => {
    let b = bucketMap.get(id);
    if (!b) {
      b = {
        opportunityId: id,
        views: 0,
        cardClicks: 0,
        shareIntents: 0,
        shareLinkCreated: 0,
        shareNativeOpened: 0,
        shareLinkCopied: 0,
        referralLandings: 0,
        signupsCompleted: 0,
        attributionLocks: 0,
        deliveryProfilesCreated: 0,
        deliveryActivated: 0,
      };
      bucketMap.set(id, b);
    }
    return b;
  };

  const shareSessions = new Set<string>();
  let companyShareLinkCreated = 0;
  let attributedSignupsFromShares = 0;

  for (const e of events) {
    const oid = opportunityIdFromMeta(e.metadata);
    const b = ensure(oid);
    const sid = shareSessionFromMeta(e.metadata);
    if (sid) shareSessions.add(sid);

    switch (e.eventType) {
      case 'OPPORTUNITY_HUB_VIEW':
        ensure('hub').views += 1;
        break;
      case 'OPPORTUNITY_CARD_CLICK':
        b.cardClicks += 1;
        break;
      case 'OPPORTUNITY_SHARE_INTENT':
        b.shareIntents += 1;
        break;
      case 'OPPORTUNITY_SHARE_LINK_CREATED':
        b.shareLinkCreated += 1;
        companyShareLinkCreated += 1;
        break;
      case 'OPPORTUNITY_SHARE_NATIVE_OPENED':
        b.shareNativeOpened += 1;
        break;
      case 'OPPORTUNITY_SHARE_LINK_COPIED':
        b.shareLinkCopied += 1;
        break;
      case 'REFERRAL_LANDING':
        b.referralLandings += 1;
        break;
      case 'SIGNUP_COMPLETED':
        b.signupsCompleted += 1;
        if (sid || (e.metadata as { shareKind?: string } | null)?.shareKind) {
          attributedSignupsFromShares += 1;
        }
        break;
      case 'CANONICAL_ATTRIBUTION_LOCKED':
        b.attributionLocks += 1;
        attributedSignupsFromShares += 1;
        break;
      case 'DELIVERY_PROVIDER_PROFILE_CREATED':
        b.deliveryProfilesCreated += 1;
        break;
      case 'DELIVERY_PROVIDER_ACTIVATED':
        b.deliveryActivated += 1;
        break;
      default:
        break;
    }
  }

  /**
   * SHARE_TO_ATTRIBUTION_RATE denominator is reliable only for company share assets
   * (OPPORTUNITY_SHARE_LINK_CREATED / trackingAsset ensure). Personal navigator.share
   * does not prove recipient engagement — so we withhold the percentage unless
   * company link-created denominator is available.
   */
  const denominatorReliable = companyShareLinkCreated > 0;
  const shareToAttributionRate = denominatorReliable
    ? attributedSignupsFromShares / companyShareLinkCreated
    : null;

  return {
    from: input.from.toISOString(),
    to: input.to.toISOString(),
    commercialOnly,
    shareToAttributionRate,
    shareToAttributionRateDefinition:
      'NEW canonical attribution / signup locks attributed to opportunity shares ÷ UNIQUE company share link-created events (tracking assets). Personal share intents are NOT a reliable denominator.',
    shareToAttributionDenominatorReliable: denominatorReliable,
    attributedSignupsFromShares,
    uniqueShareSessions: shareSessions.size,
    companyShareLinkCreated,
    buckets: [...bucketMap.values()].sort((a, b) =>
      a.opportunityId.localeCompare(b.opportunityId),
    ),
    kpiDefinitions: {
      VERDIEN_HUB_VISITORS: 'Count of OPPORTUNITY_HUB_VIEW events in range',
      OPPORTUNITY_CARD_CTR:
        'cardClicks / hub views (null if views=0)',
      OPPORTUNITY_SHARE_RATE:
        'shareIntents / cardClicks (null if clicks=0)',
      REFERRAL_LANDING_RATE:
        'referralLandings / shareIntents (null if intents=0)',
      REFERRAL_SIGNUP_RATE:
        'signupsCompleted / referralLandings (null if landings=0)',
      SHARE_TO_ATTRIBUTION_RATE:
        'attributedSignupsFromShares / companyShareLinkCreated when denominatorReliable',
      DELIVERY_PROVIDER_ONBOARDING_RATE:
        'deliveryProfilesCreated / delivery opportunity cardClicks',
      DELIVERY_PROVIDER_ACTIVATION_RATE:
        'deliveryActivated / deliveryProfilesCreated',
      DELIVERY_FIRST_ACTIVITY_RATE:
        'Measured via DeliveryOrder completion on referred providers (dashboard status), not this funnel alone',
      AFFILIATE_ACTIVATION_RATE:
        'Use ecosystem affiliate dashboards — first commission / attributions',
      CROSS_PRODUCT_REFERRAL_RATE:
        'Company analytics: attributed users with eligible events in ≥2 products',
      REPEAT_ECOSYSTEM_REVENUE:
        'Company analytics: eligible revenue after each referred user’s first commission',
    },
  };
}
