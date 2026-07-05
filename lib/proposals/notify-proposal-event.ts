import { NotificationService } from '@/lib/notifications/notification-service';
import { pickProposalNotificationKind } from './proposal-settlement';
import type { ProposalDTO } from './proposal-types';

export type ProposalNotificationKind =
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REJECTED'
  | 'PROPOSAL_COUNTERED'
  | 'PROPOSAL_ALTERNATIVE_VALUE'
  | 'PROPOSAL_MIXED_ACCEPTED'
  | 'COMMUNITY_ORDER_CREATED';

const TITLE_KEYS: Record<ProposalNotificationKind, string> = {
  PROPOSAL_RECEIVED: 'proposal.notifications.received.title',
  PROPOSAL_ACCEPTED: 'proposal.notifications.accepted.title',
  PROPOSAL_REJECTED: 'proposal.notifications.rejected.title',
  PROPOSAL_COUNTERED: 'proposal.notifications.countered.title',
  PROPOSAL_ALTERNATIVE_VALUE: 'proposal.notifications.alternativeValue.title',
  PROPOSAL_MIXED_ACCEPTED: 'proposal.notifications.mixedAccepted.title',
  COMMUNITY_ORDER_CREATED: 'proposal.notifications.communityOrderCreated.title',
};

const BODY_KEYS: Record<ProposalNotificationKind, string> = {
  PROPOSAL_RECEIVED: 'proposal.notifications.received.body',
  PROPOSAL_ACCEPTED: 'proposal.notifications.accepted.body',
  PROPOSAL_REJECTED: 'proposal.notifications.rejected.body',
  PROPOSAL_COUNTERED: 'proposal.notifications.countered.body',
  PROPOSAL_ALTERNATIVE_VALUE: 'proposal.notifications.alternativeValue.body',
  PROPOSAL_MIXED_ACCEPTED: 'proposal.notifications.mixedAccepted.body',
  COMMUNITY_ORDER_CREATED: 'proposal.notifications.communityOrderCreated.body',
};

/** Default NL copy when push payload has no client-side i18n */
const TITLE_FALLBACK: Record<ProposalNotificationKind, string> = {
  PROPOSAL_RECEIVED: 'Nieuw voorstel ontvangen',
  PROPOSAL_ACCEPTED: 'Afspraak bevestigd',
  PROPOSAL_REJECTED: 'Voorstel afgewezen',
  PROPOSAL_COUNTERED: 'Tegenvoorstel ontvangen',
  PROPOSAL_ALTERNATIVE_VALUE: 'Voorstel met ruil ontvangen',
  PROPOSAL_MIXED_ACCEPTED: 'Afspraak bevestigd',
  COMMUNITY_ORDER_CREATED: 'Afspraak bevestigd',
};

const BODY_FALLBACK: Record<ProposalNotificationKind, (p: ProposalDTO) => string> = {
  PROPOSAL_RECEIVED: (p) => p.title,
  PROPOSAL_ACCEPTED: (p) => `"${p.title}" is geaccepteerd.`,
  PROPOSAL_REJECTED: (p) => `"${p.title}" is afgewezen.`,
  PROPOSAL_COUNTERED: (p) => `Nieuw tegenvoorstel: ${p.title}`,
  PROPOSAL_ALTERNATIVE_VALUE: (p) => `"${p.title}" bevat alternatieve waarde.`,
  PROPOSAL_MIXED_ACCEPTED: (p) => `"${p.title}" — afspraak bevestigd.`,
  COMMUNITY_ORDER_CREATED: (p) => `Jullie afspraak voor "${p.title}" is vastgelegd.`,
};

export async function notifyProposalEvent(
  recipientId: string,
  senderId: string,
  kind: ProposalNotificationKind,
  proposal: ProposalDTO,
  extra?: { communityOrderId?: string },
): Promise<void> {
  if (recipientId === senderId) return;

  await NotificationService.sendProposalNotification(
    recipientId,
    senderId,
    kind,
    TITLE_FALLBACK[kind],
    BODY_FALLBACK[kind](proposal),
    {
      ...proposal,
      titleKey: TITLE_KEYS[kind],
      bodyKey: BODY_KEYS[kind],
      communityOrderId: extra?.communityOrderId,
    },
  );
}

export async function notifyProposalReceived(
  recipientId: string,
  senderId: string,
  proposal: ProposalDTO,
): Promise<void> {
  const hasValue =
    proposal.requestedValueTaxonomyIds.length > 0 ||
    proposal.acceptedValueTaxonomyIds.length > 0;
  const kind = pickProposalNotificationKind(
    'received',
    proposal.settlementMode,
    hasValue,
  ) as ProposalNotificationKind;
  await notifyProposalEvent(recipientId, senderId, kind, proposal);
}

export async function notifyProposalAccepted(
  creatorId: string,
  accepterId: string,
  proposal: ProposalDTO,
  communityOrderId: string,
): Promise<void> {
  const hasValue =
    proposal.requestedValueTaxonomyIds.length > 0 ||
    proposal.acceptedValueTaxonomyIds.length > 0;
  const acceptKind = pickProposalNotificationKind(
    'accepted',
    proposal.settlementMode,
    hasValue,
  ) as ProposalNotificationKind;

  await notifyProposalEvent(creatorId, accepterId, acceptKind, proposal, {
    communityOrderId,
  });

  for (const uid of [proposal.buyerId, proposal.sellerId]) {
    await notifyProposalEvent(uid, accepterId, 'COMMUNITY_ORDER_CREATED', proposal, {
      communityOrderId,
    });
  }
}
