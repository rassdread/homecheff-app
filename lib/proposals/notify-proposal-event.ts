import { NotificationService } from '@/lib/notifications/notification-service';
import type { ProposalDTO } from './proposal-types';

export type ProposalNotificationKind =
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REJECTED'
  | 'PROPOSAL_COUNTERED';

const COPY: Record<
  ProposalNotificationKind,
  { title: string; body: (proposal: ProposalDTO) => string }
> = {
  PROPOSAL_RECEIVED: {
    title: 'Nieuw voorstel',
    body: (p) => p.title,
  },
  PROPOSAL_ACCEPTED: {
    title: 'Voorstel geaccepteerd',
    body: (p) => `"${p.title}" is geaccepteerd.`,
  },
  PROPOSAL_REJECTED: {
    title: 'Voorstel afgewezen',
    body: (p) => `"${p.title}" is afgewezen.`,
  },
  PROPOSAL_COUNTERED: {
    title: 'Tegenvoorstel ontvangen',
    body: (p) => `Nieuw tegenvoorstel: ${p.title}`,
  },
};

export async function notifyProposalEvent(
  recipientId: string,
  senderId: string,
  kind: ProposalNotificationKind,
  proposal: ProposalDTO,
): Promise<void> {
  if (recipientId === senderId) return;

  const copy = COPY[kind];
  await NotificationService.sendProposalNotification(
    recipientId,
    senderId,
    kind,
    copy.title,
    copy.body(proposal),
    proposal,
  );
}
