import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { AgreementHubItem } from './agreements-hub-types';

/**
 * Calendar-sync READINESS (CE-2A add-on). This maps an internal agreement agenda
 * item to a normalized, export-ready calendar-event shape. It does NOT perform any
 * sync — no Google/Outlook/Apple OAuth, no ICS writer, no token storage, no
 * background jobs. It only guarantees every agenda item CAN become a calendar
 * event later (ICS download, calendar feed, or two-way OAuth). See the docs in
 * docs/progress/COMMUNITY_ECONOMY_PHASE2A_AGREEMENTS_HUB.md for the export options.
 */

export type AgreementCalendarSourceType = 'proposal' | 'community_order';

export type AgreementCalendarRole = 'BUYER' | 'SELLER';

export type AgreementCalendarEvent = {
  /** Stable, globally-unique event id — safe as an ICS/Google UID across syncs. */
  id: string;
  title: string;
  description: string;
  /** ISO datetime (may be a floating local time when derived from a window). */
  start: string | null;
  /** ISO datetime — derived from the time-window end, or null when unknown. */
  end: string | null;
  /** Raw human window label, kept for exporters that show it verbatim. */
  timeWindowLabel: string | null;
  locationLabel: string | null;
  /** True when there is no clock time (date-only or unscheduled). */
  allDay: boolean;
  role: AgreementCalendarRole;
  status: string;
  kind: ListingKind | 'DELIVERY';
  sourceType: AgreementCalendarSourceType;
  sourceId: string;
  /** i18n keys + params so a future exporter can localize title/description. */
  titleKey: string;
  descriptionKey: string;
  labelParams: {
    title: string;
    counterpart: string;
    role: AgreementCalendarRole;
    status: string;
    time: string;
    location: string;
  };
};

export type AgreementCalendarEventOptions = {
  /** Optional translator; when omitted, neutral fallback strings are used. */
  translate?: (key: string, params?: Record<string, string>) => string;
};

const TITLE_KEY = 'marketplace.agreements.calendar.title';
const DESCRIPTION_KEY = 'marketplace.agreements.calendar.description';

const TIME_RE = /(\d{1,2}):(\d{2})/g;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Parse the first (and optional second) HH:MM out of a free-form window label. */
function parseWindowTimes(label: string | null): {
  startH: number;
  startM: number;
  endH: number | null;
  endM: number | null;
} | null {
  if (!label) return null;
  const matches = [...label.matchAll(TIME_RE)];
  if (matches.length === 0) return null;
  const first = matches[0];
  const second = matches[1] ?? null;
  return {
    startH: Number(first[1]),
    startM: Number(first[2]),
    endH: second ? Number(second[1]) : null,
    endM: second ? Number(second[2]) : null,
  };
}

/** Combine an ISO date (date part only) with a floating wall-clock time. */
function floatingDateTime(isoDate: string, h: number, m: number): string {
  return `${isoDate.slice(0, 10)}T${pad(h)}:${pad(m)}:00`;
}

function resolveTimes(
  scheduledAt: string | null,
  timeWindowLabel: string | null,
): { start: string | null; end: string | null; allDay: boolean } {
  const window = parseWindowTimes(timeWindowLabel);

  if (scheduledAt && window) {
    const start = floatingDateTime(scheduledAt, window.startH, window.startM);
    const end =
      window.endH !== null && window.endM !== null
        ? floatingDateTime(scheduledAt, window.endH, window.endM)
        : null;
    return { start, end, allDay: false };
  }

  if (scheduledAt) {
    // Date-only ISO (midnight UTC) → treat as all-day; otherwise a real instant.
    const allDay = /T00:00(:00)?(\.000)?Z?$/.test(scheduledAt);
    return { start: scheduledAt, end: null, allDay };
  }

  return { start: null, end: null, allDay: true };
}

function extract(item: AgreementHubItem): {
  sourceType: AgreementCalendarSourceType;
  sourceId: string;
  title: string;
  counterpart: string;
  role: AgreementCalendarRole;
  status: string;
} {
  if (item.kind === 'proposal') {
    return {
      sourceType: 'proposal',
      sourceId: item.id,
      title: item.proposal.title,
      counterpart: item.counterpartName ?? '',
      role: item.userRoleInDeal,
      status: item.proposal.status,
    };
  }
  return {
    sourceType: 'community_order',
    sourceId: item.deal.id,
    title: item.deal.proposalTitle || item.deal.title,
    counterpart: item.deal.counterpartName ?? '',
    role: item.deal.userRoleInDeal,
    status: item.deal.status,
  };
}

/**
 * Convert a single agreement hub item into a normalized calendar event.
 * Pure and deterministic — safe to unit test and reuse in any future exporter.
 */
export function buildAgreementCalendarEvent(
  item: AgreementHubItem,
  options: AgreementCalendarEventOptions = {},
): AgreementCalendarEvent {
  const base = extract(item);
  const { scheduledAt, timeLabel, locationLabel } = item.agenda;
  const { start, end, allDay } = resolveTimes(scheduledAt, timeLabel);

  const labelParams = {
    title: base.title,
    counterpart: base.counterpart,
    role: base.role,
    status: base.status,
    time: timeLabel ?? '',
    location: locationLabel ?? '',
  };

  const fallbackTitle = base.counterpart
    ? `${base.title} · ${base.counterpart}`
    : base.title;
  const fallbackDescription = [
    base.counterpart,
    timeLabel,
    locationLabel,
    base.status,
  ]
    .filter((v) => typeof v === 'string' && v.length > 0)
    .join(' · ');

  const title = options.translate
    ? options.translate(TITLE_KEY, labelParams) || fallbackTitle
    : fallbackTitle;
  const description = options.translate
    ? options.translate(DESCRIPTION_KEY, labelParams) || fallbackDescription
    : fallbackDescription;

  return {
    id: `homecheff:${base.sourceType}:${base.sourceId}`,
    title,
    description,
    start,
    end,
    timeWindowLabel: timeLabel,
    locationLabel,
    allDay,
    role: base.role,
    status: base.status,
    kind: item.displayKind,
    sourceType: base.sourceType,
    sourceId: base.sourceId,
    titleKey: TITLE_KEY,
    descriptionKey: DESCRIPTION_KEY,
    labelParams,
  };
}

/** Map many agreement items to calendar events (skips cancelled deals). */
export function buildAgreementCalendarEvents(
  items: AgreementHubItem[],
  options: AgreementCalendarEventOptions = {},
): AgreementCalendarEvent[] {
  return items
    .filter((item) => !(item.kind === 'deal' && item.deal.status === 'CANCELLED'))
    .map((item) => buildAgreementCalendarEvent(item, options));
}
