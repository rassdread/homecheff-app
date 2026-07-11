/**
 * Phase 13T — Authenticated GDPR data export (machine-readable JSON).
 * Exports only data belonging to the requesting user; omits secrets and third-party private data.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

export const GDPR_EXPORT_VERSION = '1.0';
export const GDPR_EXPORT_FORMAT = 'homecheff-gdpr-export';

/** Fields never included in export payloads. */
const USER_OMIT_FIELDS = new Set([
  'passwordHash',
  'emailVerificationToken',
  'emailVerificationCode',
  'emailVerificationExpires',
]);

export type GdprExportOmissions = {
  encryptedMessageBodies: string;
  thirdPartyPrivateProfiles: string;
  platformSecrets: string;
  moderationEvidenceAgainstOthers: string;
  fullPaymentInstrumentDetails: string;
  serverSideAuditLogs: string;
  attachmentBinaryContents: string;
};

export type GdprDataExportPayload = {
  format: typeof GDPR_EXPORT_FORMAT;
  version: typeof GDPR_EXPORT_VERSION;
  generatedAt: string;
  userId: string;
  omissions: GdprExportOmissions;
  account: Record<string, unknown>;
  sellerProfile: Record<string, unknown> | null;
  businessProfile: Record<string, unknown> | null;
  deliveryProfile: Record<string, unknown> | null;
  affiliate: Record<string, unknown> | null;
  listings: unknown[];
  ordersAsBuyer: unknown[];
  ordersAsSeller: unknown[];
  transactions: unknown[];
  reviewsGiven: unknown[];
  reviewsReceived: unknown[];
  favorites: unknown[];
  follows: unknown[];
  fanRequests: unknown[];
  notificationPreferences: Record<string, unknown> | null;
  notificationsSummary: unknown[];
  reportsSubmitted: unknown[];
  hcp: Record<string, unknown> | null;
  consentAndPrivacy: Record<string, unknown>;
  messagesSent: unknown[];
  conversationsParticipated: unknown[];
  proposals: unknown[];
  reservations: unknown[];
  csvSummaries?: Record<string, string>;
};

function stripUserSecrets<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (USER_OMIT_FIELDS.has(key)) continue;
    if (key === 'stripeConnectAccountId' && value) {
      out.stripeConnectConfigured = true;
      continue;
    }
    if (key === 'iban' && value) {
      out.ibanProvided = true;
      continue;
    }
    out[key] = value;
  }
  return out;
}

function summarizeMessage(msg: {
  id: string;
  conversationId: string;
  text: string | null;
  createdAt: Date;
  readAt: Date | null;
  attachmentName: string | null;
  attachmentType: string | null;
  attachmentUrl: string | null;
  messageType: string;
  isEncrypted: boolean;
  encryptedText: string | null;
}) {
  if (msg.isEncrypted || msg.encryptedText) {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      createdAt: msg.createdAt.toISOString(),
      readAt: msg.readAt?.toISOString() ?? null,
      messageType: msg.messageType,
      hasAttachment: Boolean(msg.attachmentUrl || msg.attachmentName),
      body: null,
      encrypted: true,
      note: 'Encrypted message body omitted — decrypt locally if you hold the key.',
    };
  }
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    createdAt: msg.createdAt.toISOString(),
    readAt: msg.readAt?.toISOString() ?? null,
    messageType: msg.messageType,
    hasAttachment: Boolean(msg.attachmentUrl || msg.attachmentName),
    attachmentName: msg.attachmentName,
    attachmentType: msg.attachmentType,
    body: msg.text,
    encrypted: false,
  };
}

function buildCsvSummaries(payload: Omit<GdprDataExportPayload, 'csvSummaries'>): Record<string, string> {
  const lines: string[] = [];
  lines.push('section,count');
  lines.push(`listings,${payload.listings.length}`);
  lines.push(`ordersAsBuyer,${payload.ordersAsBuyer.length}`);
  lines.push(`ordersAsSeller,${payload.ordersAsSeller.length}`);
  lines.push(`transactions,${payload.transactions.length}`);
  lines.push(`reviewsGiven,${payload.reviewsGiven.length}`);
  lines.push(`reviewsReceived,${payload.reviewsReceived.length}`);
  lines.push(`favorites,${payload.favorites.length}`);
  lines.push(`follows,${payload.follows.length}`);
  lines.push(`messagesSent,${payload.messagesSent.length}`);
  lines.push(`reportsSubmitted,${payload.reportsSubmitted.length}`);
  return { overview: lines.join('\n') };
}

export function buildSafeExportFilename(userId: string, generatedAt: Date): string {
  const stamp = generatedAt.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const shortId = userId.replace(/-/g, '').slice(0, 8);
  return `homecheff-data-export-${shortId}-${stamp}.json`;
}

export async function buildGdprDataExport(userId: string): Promise<GdprDataExportPayload> {
  const generatedAt = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      SellerProfile: {
        include: { Subscription: true },
      },
      Business: true,
      DeliveryProfile: true,
      affiliate: {
        include: {
          attributions: true,
          commissionLedgers: true,
        },
      },
      notificationPreferences: true,
      hcpStats: true,
      userBadges: { include: { badge: true } },
      userHcpRewards: true,
      hcpEvents: { orderBy: { createdAt: 'desc' }, take: 500 },
      Favorite: true,
      followsAsFollower: true,
      followsAsSeller: true,
      fanRequestsAsRequester: true,
      fanRequestsAsTarget: true,
      Report_Report_reporterIdToUser: true,
      Listing: {
        orderBy: { createdAt: 'desc' },
        take: 500,
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          items: {
            include: {
              Product: { select: { id: true, title: true, sellerId: true } },
            },
          },
        },
      },
      Transaction: { orderBy: { createdAt: 'desc' }, take: 500 },
      productReviewsAsBuyer: { orderBy: { createdAt: 'desc' }, take: 500 },
      reviewResponsesAsSeller: { orderBy: { createdAt: 'desc' }, take: 500 },
      ProposalsCreated: { orderBy: { createdAt: 'desc' }, take: 200 },
      ProposalsAsSeller: { orderBy: { createdAt: 'desc' }, take: 200 },
      ProposalsAsBuyer: { orderBy: { createdAt: 'desc' }, take: 200 },
      Reservation_Reservation_buyerIdToUser: { orderBy: { createdAt: 'desc' }, take: 200 },
      Reservation_Reservation_sellerIdToUser: { orderBy: { createdAt: 'desc' }, take: 200 },
      Message: { orderBy: { createdAt: 'desc' }, take: 1000 },
      ConversationParticipant: {
        include: {
          Conversation: {
            select: {
              id: true,
              createdAt: true,
              contextType: true,
              status: true,
              productId: true,
              orderId: true,
            },
          },
        },
        take: 200,
      },
      Notification: { orderBy: { createdAt: 'desc' }, take: 200 },
      Payout: { orderBy: { createdAt: 'desc' }, take: 200 },
    },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const sellerProfileId = user.SellerProfile?.id;
  let ordersAsSeller: unknown[] = [];
  if (sellerProfileId) {
    ordersAsSeller = await prisma.order.findMany({
      where: {
        items: { some: { Product: { sellerId: sellerProfileId } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        items: {
          where: { Product: { sellerId: sellerProfileId } },
          include: { Product: { select: { id: true, title: true } } },
        },
      },
    });
  }

  const omissions: GdprExportOmissions = {
    encryptedMessageBodies:
      'End-to-end encrypted message plaintext and encryption keys are omitted unless decryptable server-side.',
    thirdPartyPrivateProfiles:
      'Other users’ private contact details, passwords, and non-public profile fields are omitted.',
    platformSecrets:
      'Password hashes, OAuth tokens, push device tokens, and verification secrets are never exported.',
    moderationEvidenceAgainstOthers:
      'Reports filed against you by others and internal moderation notes are omitted.',
    fullPaymentInstrumentDetails:
      'Full IBAN and Stripe account identifiers are summarized; use earnings export for payout detail.',
    serverSideAuditLogs:
      'Platform audit logs are retained separately for security and are not included in user export.',
    attachmentBinaryContents:
      'Message/listing media URLs are included where applicable; binary files are not embedded.',
  };

  const { SellerProfile, Business, DeliveryProfile, affiliate, notificationPreferences, ...userCore } =
    user;

  const sellerExport = SellerProfile
    ? {
        ...SellerProfile,
        Subscription: SellerProfile.Subscription
          ? {
              id: SellerProfile.Subscription.id,
              name: SellerProfile.Subscription.name,
              stripePriceId: SellerProfile.Subscription.stripePriceId,
            }
          : null,
        stripeCustomerId: SellerProfile.stripeCustomerId ? 'configured' : null,
        stripeSubscriptionId: SellerProfile.stripeSubscriptionId ? 'configured' : null,
      }
    : null;

  const affiliateExport = affiliate
    ? {
        id: affiliate.id,
        status: affiliate.status,
        createdAt: affiliate.createdAt.toISOString(),
        stripeConnectConfigured: Boolean(affiliate.stripeConnectAccountId),
        attributions: affiliate.attributions.map((a) => ({
          id: a.id,
          type: a.type,
          source: a.source,
          startsAt: a.startsAt.toISOString(),
          endsAt: a.endsAt.toISOString(),
          createdAt: a.createdAt.toISOString(),
        })),
        commissionLedgers: affiliate.commissionLedgers.map((c) => ({
          id: c.id,
          amountCents: c.amountCents,
          status: c.status,
          eventType: c.eventType,
          createdAt: c.createdAt.toISOString(),
        })),
      }
    : null;

  const deliveryExport = DeliveryProfile ? { ...DeliveryProfile } : null;

  const base: Omit<GdprDataExportPayload, 'csvSummaries'> = {
    format: GDPR_EXPORT_FORMAT,
    version: GDPR_EXPORT_VERSION,
    generatedAt: generatedAt.toISOString(),
    userId,
    omissions,
    account: stripUserSecrets(userCore as unknown as Record<string, unknown>),
    sellerProfile: sellerExport,
    businessProfile: Business,
    deliveryProfile: deliveryExport,
    affiliate: affiliateExport,
    listings: user.Listing,
    ordersAsBuyer: user.orders,
    ordersAsSeller,
    transactions: user.Transaction,
    reviewsGiven: user.productReviewsAsBuyer,
    reviewsReceived: user.reviewResponsesAsSeller,
    favorites: user.Favorite,
    follows: [...user.followsAsFollower, ...user.followsAsSeller],
    fanRequests: [...user.fanRequestsAsRequester, ...user.fanRequestsAsTarget],
    notificationPreferences,
    notificationsSummary: user.Notification.map((n) => ({
      id: n.id,
      type: n.type,
      payload: n.payload,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    reportsSubmitted: user.Report_Report_reporterIdToUser.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      targetUserId: r.targetUserId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    hcp: {
      stats: user.hcpStats,
      badges: user.userBadges.map((ub) => ({
        slug: ub.badge.slug,
        name: ub.badge.name,
        awardedAt: ub.awardedAt.toISOString(),
      })),
      rewards: user.userHcpRewards,
      recentEvents: user.hcpEvents,
    },
    consentAndPrivacy: {
      termsAccepted: user.termsAccepted,
      termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
      privacyPolicyAccepted: user.privacyPolicyAccepted,
      privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt?.toISOString() ?? null,
      marketingAccepted: user.marketingAccepted,
      marketingAcceptedAt: user.marketingAcceptedAt?.toISOString() ?? null,
      taxResponsibilityAccepted: user.taxResponsibilityAccepted,
      taxResponsibilityAcceptedAt: user.taxResponsibilityAcceptedAt?.toISOString() ?? null,
      messageGuidelinesAccepted: user.messageGuidelinesAccepted,
      messageGuidelinesAcceptedAt: user.messageGuidelinesAcceptedAt?.toISOString() ?? null,
      messagePrivacy: user.messagePrivacy,
      allowProfileViews: user.allowProfileViews,
      showProfileToEveryone: user.showProfileToEveryone,
      downloadPermission: user.downloadPermission,
      printPermission: user.printPermission,
      encryptionEnabled: user.encryptionEnabled,
      hasEncryptionKey: user.hasEncryptionKey,
      suspendedAt: user.suspendedAt?.toISOString() ?? null,
      suspendReason: user.suspendReason ?? null,
    },
    messagesSent: user.Message.map(summarizeMessage),
    conversationsParticipated: user.ConversationParticipant.map((cp) => ({
      conversationId: cp.conversationId,
      joinedAt: cp.joinedAt?.toISOString?.() ?? cp.Conversation.createdAt.toISOString(),
      conversation: cp.Conversation,
    })),
    proposals: [
      ...user.ProposalsCreated,
      ...user.ProposalsAsSeller,
      ...user.ProposalsAsBuyer,
    ],
    reservations: [
      ...user.Reservation_Reservation_buyerIdToUser,
      ...user.Reservation_Reservation_sellerIdToUser,
    ],
  };

  return {
    ...base,
    csvSummaries: buildCsvSummaries(base),
  };
}

export async function logGdprExportAudit(userId: string, meta?: Record<string, unknown>): Promise<void> {
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId,
      action: 'GDPR_DATA_EXPORT',
      meta: {
        ...meta,
        at: new Date().toISOString(),
      },
    },
  });
}
