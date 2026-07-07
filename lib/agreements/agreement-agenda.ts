import type { ProfileDealDTO } from '@/lib/proposals/profile-deal-types';
import type { ProposalDTO } from '@/lib/proposals/proposal-types';
import {
  AGREEMENT_AGENDA_BUCKETS,
  type AgreementAgendaBucket,
  type AgreementAgendaInfo,
  type AgreementHubItem,
  type AgreementsHubAgenda,
  type AgreementsHubSummary,
} from './agreements-hub-types';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(input: Date): number {
  return new Date(
    input.getFullYear(),
    input.getMonth(),
    input.getDate(),
  ).getTime();
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return null;
}

/** Terminal proposal statuses that belong in history rather than upcoming. */
const TERMINAL_PROPOSAL_STATUSES = new Set(['EXPIRED', 'CANCELLED', 'REJECTED', 'ACCEPTED']);

/**
 * Bucket an active (non-completed) agreement by its scheduled date (CE-2B timeline
 * polish): Today / Tomorrow / This week / Next week / Later. Past-or-today lands in
 * `today` (so overdue items stay visible); no date → `unscheduled`.
 */
function bucketForScheduledAt(
  scheduledAt: string | null,
  now: Date,
): Exclude<AgreementAgendaBucket, 'completed'> {
  if (!scheduledAt) return 'unscheduled';
  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) return 'unscheduled';

  const day = startOfDay(parsed);
  const today = startOfDay(now);
  const diffDays = Math.round((day - today) / DAY_MS);

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays <= 7) return 'thisWeek';
  if (diffDays <= 14) return 'nextWeek';
  return 'later';
}

/**
 * Role-independent scheduling: buyer and seller derive the SAME date/time/location
 * for the same agreement (only userRoleInDeal + next action differ per party).
 */
export function buildDealAgenda(
  deal: ProfileDealDTO,
  now: Date = new Date(),
): AgreementAgendaInfo {
  const delivery = deal.deliveryRequest;

  const scheduledAt = firstNonEmpty(
    delivery?.deliveryDate,
    delivery?.pickupDate,
    deal.proposal.requestedDate,
  );

  const timeLabel = firstNonEmpty(
    deal.requestedWindowLabel,
    delivery?.deliveryTimeWindow,
    delivery?.pickupTimeWindow,
    deal.proposal.requestedTimeWindow,
  );

  const locationLabel = firstNonEmpty(deal.dropoffLabel, deal.pickupLabel);

  const bucket: AgreementAgendaBucket =
    deal.status === 'COMPLETED'
      ? 'completed'
      : bucketForScheduledAt(scheduledAt, now);

  return { scheduledAt, timeLabel, locationLabel, bucket };
}

export function buildProposalAgenda(
  proposal: ProposalDTO,
  now: Date = new Date(),
): AgreementAgendaInfo {
  const scheduledAt = firstNonEmpty(proposal.requestedDate);
  const timeLabel = firstNonEmpty(proposal.requestedTimeWindow);
  const bucket: AgreementAgendaBucket = TERMINAL_PROPOSAL_STATUSES.has(proposal.status)
    ? 'completed'
    : bucketForScheduledAt(scheduledAt, now);
  return {
    scheduledAt,
    timeLabel,
    locationLabel: null,
    bucket,
  };
}

function compareScheduled(a: AgreementHubItem, b: AgreementHubItem): number {
  const ta = a.agenda.scheduledAt ? new Date(a.agenda.scheduledAt).getTime() : Infinity;
  const tb = b.agenda.scheduledAt ? new Date(b.agenda.scheduledAt).getTime() : Infinity;
  return ta - tb;
}

/**
 * Group agreements into Today / Tomorrow / This week / Next week / Later /
 * Unscheduled / History (CE-2B). Cancelled deals land in history (unified
 * history, CE-2B.6) instead of being dropped. Active buckets sort by date.
 */
export function groupAgenda(items: AgreementHubItem[]): AgreementsHubAgenda {
  const agenda: AgreementsHubAgenda = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: [],
    later: [],
    unscheduled: [],
    completed: [],
  };

  for (const item of items) {
    // Cancelled deals belong in unified history, not the upcoming buckets.
    if (item.kind === 'deal' && item.deal.status === 'CANCELLED') {
      agenda.completed.push(item);
      continue;
    }
    agenda[item.agenda.bucket].push(item);
  }

  for (const bucket of AGREEMENT_AGENDA_BUCKETS) {
    if (bucket === 'completed') continue;
    agenda[bucket].sort(compareScheduled);
  }

  return agenda;
}

export function buildAgendaSummary(
  items: AgreementHubItem[],
  agenda: AgreementsHubAgenda,
): AgreementsHubSummary {
  const upcoming = [
    ...agenda.today,
    ...agenda.tomorrow,
    ...agenda.thisWeek,
    ...agenda.nextWeek,
    ...agenda.later,
  ];
  const nextAgreement = upcoming.length > 0 ? upcoming[0] : null;

  // Next action prefers the soonest-scheduled action-required item, else the most
  // recently updated one (items arrive pre-sorted by updatedAt desc).
  const actionItems = items.filter((item) => item.facets.includes('ACTION_REQUIRED'));
  const scheduledAction = [...actionItems]
    .filter((item) => item.agenda.scheduledAt)
    .sort(compareScheduled)[0];
  const nextAction = scheduledAction ?? actionItems[0] ?? null;

  let openActionCount = 0;
  let activeDeliveryCount = 0;
  let waitingPaymentCount = 0;
  let proposalsToRespondCount = 0;

  for (const item of items) {
    if (item.facets.includes('ACTION_REQUIRED')) openActionCount += 1;
    if (item.facets.includes('WAITING_DELIVERY')) activeDeliveryCount += 1;
    if (item.facets.includes('WAITING_PAYMENT')) waitingPaymentCount += 1;
    if (item.kind === 'proposal' && item.canRespond) proposalsToRespondCount += 1;
  }

  return {
    nextAgreement,
    nextAction,
    plannedTodayCount: agenda.today.length,
    openActionCount,
    activeDeliveryCount,
    waitingPaymentCount,
    proposalsToRespondCount,
  };
}
