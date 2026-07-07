import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { ProfileDealDTO } from '@/lib/proposals/profile-deal-types';
import type { ProposalDTO } from '@/lib/proposals/proposal-types';

export const AGREEMENTS_HUB_FILTERS = [
  '',
  'ACTION_REQUIRED',
  'OPEN',
  'IN_PROGRESS',
  'WAITING_PAYMENT',
  'WAITING_DELIVERY',
  'COMPLETED',
  'CANCELLED',
] as const;

export type AgreementsHubFilter = (typeof AGREEMENTS_HUB_FILTERS)[number];

export type AgreementTimelineStepId =
  | 'proposal'
  | 'accepted'
  | 'payment'
  | 'delivery'
  | 'complete';

export type AgreementTimelineStepState =
  | 'done'
  | 'active'
  | 'upcoming'
  | 'skipped';

export type AgreementTimelineStep = {
  id: AgreementTimelineStepId;
  labelKey: string;
  state: AgreementTimelineStepState;
};

/** Agenda / planning grouping (CE-2A agenda add-on; CE-2B timeline polish). */
export type AgreementAgendaBucket =
  | 'today'
  | 'tomorrow'
  | 'thisWeek'
  | 'nextWeek'
  | 'later'
  | 'unscheduled'
  | 'completed';

export type AgreementAgendaInfo = {
  /** ISO datetime this agreement is planned for, if known. */
  scheduledAt: string | null;
  /** Requested / delivery time-window label. */
  timeLabel: string | null;
  /** Pickup / dropoff location indication. */
  locationLabel: string | null;
  bucket: AgreementAgendaBucket;
};

export type AgreementHubProposalItem = {
  kind: 'proposal';
  id: string;
  updatedAt: string;
  conversationId: string;
  displayKind: ListingKind | 'DELIVERY';
  proposal: ProposalDTO;
  counterpartName: string | null;
  userRoleInDeal: 'BUYER' | 'SELLER';
  canRespond: boolean;
  nextStepHintKey: string;
  primaryCtaLabelKey: string;
  timeline: AgreementTimelineStep[];
  facets: AgreementsHubFilter[];
  agenda: AgreementAgendaInfo;
};

export type AgreementHubDealItem = {
  kind: 'deal';
  id: string;
  updatedAt: string;
  displayKind: ListingKind | 'DELIVERY';
  deal: ProfileDealDTO;
  timeline: AgreementTimelineStep[];
  facets: AgreementsHubFilter[];
  agenda: AgreementAgendaInfo;
};

export type AgreementHubItem = AgreementHubProposalItem | AgreementHubDealItem;

export const AGREEMENT_AGENDA_BUCKETS = [
  'today',
  'tomorrow',
  'thisWeek',
  'nextWeek',
  'later',
  'unscheduled',
  'completed',
] as const;

export type AgreementsHubAgenda = Record<
  AgreementAgendaBucket,
  AgreementHubItem[]
>;

/** Sidebar-ready quick-insight summary (data only — no sidebar redesign). */
export type AgreementsHubSummary = {
  nextAgreement: AgreementHubItem | null;
  /** First item that requires the user to act (ACTION_REQUIRED), if any. */
  nextAction: AgreementHubItem | null;
  plannedTodayCount: number;
  openActionCount: number;
  activeDeliveryCount: number;
  waitingPaymentCount: number;
  proposalsToRespondCount: number;
};

export type AgreementsHubResponse = {
  items: AgreementHubItem[];
  counts: Record<AgreementsHubFilter, number>;
  agenda: AgreementsHubAgenda;
  summary: AgreementsHubSummary;
};
