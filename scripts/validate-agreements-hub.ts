#!/usr/bin/env npx tsx
/**
 * Community Economy Phase 2A — unified agreements hub validation.
 *
 * Verifies that /profile/deals is the single central hub "Mijn Afspraken"
 * (no parallel second hub) and that the CE-2A capabilities are wired.
 *
 * Run: npx tsx scripts/validate-agreements-hub.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { AGREEMENTS_HUB_FILTERS } from '../lib/agreements/agreements-hub-types';
import {
  AGREEMENTS_HUB_PATH,
  DEALS_PROFILE_PATH,
  PROFILE_DEALS_NAV,
} from '../lib/profile/deals-navigation';
import {
  buildAgendaSummary,
  buildDealAgenda,
  buildProposalAgenda,
  groupAgenda,
} from '../lib/agreements/agreement-agenda';
import {
  buildAgreementCalendarEvent,
  buildAgreementCalendarEvents,
} from '../lib/agreements/agreement-calendar-event';
import type {
  AgreementHubItem,
} from '../lib/agreements/agreements-hub-types';
import type { ProfileDealDTO } from '../lib/proposals/profile-deal-types';
import type { ProposalDTO } from '../lib/proposals/proposal-types';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  \u2713 ${label}`);
    passed += 1;
  } else {
    console.log(`  \u2717 FAIL: ${label}`);
    failed += 1;
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function loadI18n(locale: 'en' | 'nl'): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), `public/i18n/${locale}.json`), 'utf8'),
  ) as Record<string, unknown>;
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

const I18N_KEYS = [
  'community.agreements.title',
  'community.agreements.navLabel',
  'marketplace.agreements.filters.actionRequired',
  'marketplace.agreements.filters.inProgress',
  'marketplace.agreements.filters.waitingPayment',
  'marketplace.agreements.filters.waitingDelivery',
  'marketplace.agreements.timeline.proposal',
  'marketplace.agreements.timeline.complete',
  'marketplace.agreements.proposal.nextRespond',
  'marketplace.agreements.actions.openChat',
  'marketplace.agreements.courier.heading',
  'marketplace.agreements.courier.dashboard',
  'marketplace.agreements.kind.REQUEST',
  'marketplace.agreements.kind.SERVICE',
  'marketplace.agreements.kind.DELIVERY',
  'marketplace.deals.actions.cancel',
  'marketplace.deals.cancelConfirm',
  'trust.errors.cannotCancelCompleted',
  'roleQuickLinks.agreements',
  'marketplace.agreements.view.list',
  'marketplace.agreements.view.agenda',
  'marketplace.agreements.agenda.today',
  'marketplace.agreements.agenda.thisWeek',
  'marketplace.agreements.agenda.later',
  'marketplace.agreements.agenda.completed',
  'marketplace.agreements.calendar.title',
  'marketplace.agreements.calendar.description',
] as const;

console.log('=== Agreements Hub Validation (Phase CE-2A) ===\n');

console.log('CE-2A.2 / 2A.7 Single hub at /profile/deals');
assert(DEALS_PROFILE_PATH === '/profile/deals', 'DEALS_PROFILE_PATH = /profile/deals');
assert(PROFILE_DEALS_NAV.href === '/profile/deals', 'profile nav \u2192 /profile/deals');
assert(AGREEMENTS_HUB_PATH === '/agreements', '/agreements alias constant kept');
const profileDealsPage = read('app/profile/deals/page.tsx');
assert(
  profileDealsPage.includes('ProfileDealsClient') &&
    !profileDealsPage.includes("redirect('/agreements')"),
  '/profile/deals renders the hub (no redirect away)',
);
const agreementsAlias = read('app/agreements/page.tsx');
assert(
  agreementsAlias.includes("redirect('/profile/deals')"),
  '/agreements is a redirect alias to /profile/deals',
);

console.log('\nCE-2A.2 / 2A.3 Hub shows deals + proposals');
const hubClient = read('components/profile/ProfileDealsClient.tsx');
assert(hubClient.includes('/api/agreements'), 'hub client loads /api/agreements');
assert(hubClient.includes('AgreementHubDealCard'), 'hub renders community-order deals');
assert(hubClient.includes('AgreementHubProposalCard'), 'hub renders pending/countered proposals');
const hubService = read('lib/agreements/agreements-hub-service.ts');
assert(hubService.includes('listPendingProposalsForUser'), 'hub service aggregates proposals');
assert(hubService.includes('listProfileDealsForUser'), 'hub service aggregates deals');

console.log('\nCE-2A.1 User-wide proposals API');
assert(exists('app/api/profile/proposals/route.ts'), 'GET /api/profile/proposals exists');
const proposalsApi = read('app/api/profile/proposals/route.ts');
assert(proposalsApi.includes('listUserProposals'), 'proposals API uses shared service');
const proposalsService = read('lib/proposals/list-user-proposals.ts');
assert(
  ['PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'CANCELLED'].every((s) =>
    proposalsService.includes(`'${s}'`),
  ),
  'proposals API supports pending/countered/accepted/rejected/cancelled',
);
assert(
  proposalsService.includes('serializeProposal'),
  'proposals service reuses serializeProposal (no duplicate logic)',
);

console.log('\nCE-2A.4 CommunityOrder cancel API');
assert(
  exists('app/api/community-orders/[id]/cancel/route.ts'),
  'POST /api/community-orders/[id]/cancel exists',
);
const orderService = read('lib/trust/community-order-service.ts');
assert(orderService.includes('cancelCommunityOrder'), 'cancel service exists');
assert(
  orderService.includes("status === 'COMPLETED'") &&
    orderService.includes('cannotCancelCompleted'),
  'completed orders cannot be cancelled',
);
assert(
  orderService.includes("status === 'CANCELLED'"),
  'cancel is idempotent / only affects non-cancelled orders',
);
assert(
  orderService.includes('deliveryRequest.updateMany') &&
    orderService.includes('courierAssignment.updateMany'),
  'cancel also cancels active delivery request + assignment',
);

console.log('\nCE-2A.5 Cancel CTA (with confirm)');
const dealCard = read('components/profile/ProfileDealCard.tsx');
assert(dealCard.includes('/cancel'), 'deal card calls cancel endpoint');
assert(dealCard.includes('window.confirm'), 'cancel requires confirmation');
assert(dealCard.includes("deal.status === 'OPEN'"), 'cancel CTA only for OPEN deals');

console.log('\nCE-2A.6 Main nav "Mijn afspraken"');
const roleLinks = read('lib/navigation/role-quick-links.ts');
assert(roleLinks.includes("id: 'agreements'"), 'role quick links include agreements');
assert(roleLinks.includes("href: '/profile/deals'"), 'nav points to /profile/deals');
const sidepanel = read('components/profile/v2/ProfileV2OwnerSidepanel.tsx');
assert(sidepanel.includes('PROFILE_DEALS_NAV'), 'profile sidepanel exposes agreements');

console.log('\nCE-2A.8 Courier perspective + delivery dashboard link');
assert(
  exists('components/agreements/CourierAgreementsStrip.tsx'),
  'courier strip component exists',
);
const courierStrip = read('components/agreements/CourierAgreementsStrip.tsx');
assert(courierStrip.includes('/delivery/dashboard'), 'delivery dashboard link present');
assert(
  courierStrip.includes('/api/delivery/community-requests'),
  'courier strip reuses courier jobs API',
);
assert(hubClient.includes('CourierAgreementsStrip'), 'hub embeds courier strip');

console.log('\nCE-2A.9 Filters');
for (const f of [
  'ACTION_REQUIRED',
  'OPEN',
  'IN_PROGRESS',
  'WAITING_PAYMENT',
  'WAITING_DELIVERY',
  'COMPLETED',
  'CANCELLED',
]) {
  assert(
    (AGREEMENTS_HUB_FILTERS as readonly string[]).includes(f),
    `filter ${f} exists`,
  );
}
assert(hubClient.includes('WAITING_PAYMENT'), 'hub UI exposes waiting-payment filter');
assert(hubClient.includes('WAITING_DELIVERY'), 'hub UI exposes waiting-delivery filter');

console.log('\nCE-2A.7 Chat CTA');
const proposalCard = read('components/agreements/AgreementHubProposalCard.tsx');
assert(proposalCard.includes('/messages/'), 'proposal card chat CTA');
assert(dealCard.includes('/messages/'), 'deal card open chat link');

console.log('\nCE-2A.9 Mobile parity');
assert(hubClient.includes('overflow-x-auto'), 'horizontal scroll filters on mobile');
assert(proposalCard.includes('w-full'), 'full-width primary CTA on mobile');
const timelineUi = read('components/agreements/AgreementTimeline.tsx');
assert(timelineUi.includes('overflow-x-auto'), 'timeline scrolls on narrow screens');

console.log('\nCE-2A.10 i18n parity (en / nl)');
const en = loadI18n('en');
const nl = loadI18n('nl');
for (const key of I18N_KEYS) {
  const enVal = getNested(en, key);
  const nlVal = getNested(nl, key);
  assert(typeof enVal === 'string' && enVal.length > 0, `en: ${key}`);
  assert(typeof nlVal === 'string' && nlVal.length > 0, `nl: ${key}`);
}

console.log('\nAgenda / planning view');
assert(exists('lib/agreements/agreement-agenda.ts'), 'agenda module exists');
assert(
  hubService.includes('groupAgenda') && hubService.includes('buildAgendaSummary'),
  'hub service returns agenda + summary',
);
assert(hubClient.includes("view === 'agenda'"), 'hub client has agenda view');
assert(
  hubClient.includes('AGENDA_LABEL_KEYS') && hubClient.includes('AGREEMENT_AGENDA_BUCKETS'),
  'agenda groups today/thisWeek/later/completed',
);
const agendaMeta = read('components/agreements/AgreementAgendaMeta.tsx');
assert(agendaMeta.includes('timeLabel') && agendaMeta.includes('locationLabel'), 'agenda meta shows time + location');
const hubDealCard = read('components/agreements/AgreementHubDealCard.tsx');
assert(
  proposalCard.includes('AgreementAgendaMeta') && hubDealCard.includes('AgreementAgendaMeta'),
  'cards render agenda timing',
);

// Runtime behaviour (pure functions — no DB).
const now = new Date('2026-07-07T12:00:00.000Z');
const todayIso = new Date('2026-07-07T09:00:00.000Z').toISOString();
const thisWeekIso = new Date('2026-07-10T09:00:00.000Z').toISOString();
const laterIso = new Date('2026-08-01T09:00:00.000Z').toISOString();

const dealFor = (over: Record<string, unknown>): ProfileDealDTO =>
  ({
    status: 'OPEN',
    requestedWindowLabel: null,
    pickupLabel: 'Keuken A',
    dropoffLabel: 'Adres B',
    deliveryRequired: true,
    deliveryRequest: {
      deliveryDate: todayIso,
      pickupDate: null,
      deliveryTimeWindow: '13:00-14:00',
      pickupTimeWindow: null,
    },
    proposal: { requestedDate: todayIso, requestedTimeWindow: '10:00-12:00' },
    userRoleInDeal: 'BUYER',
    ...over,
  }) as unknown as ProfileDealDTO;

const dealAgendaToday = buildDealAgenda(dealFor({}), now);
assert(dealAgendaToday.bucket === 'today', 'deal scheduled today \u2192 today bucket');
assert(dealAgendaToday.timeLabel === '13:00-14:00', 'delivery time window surfaces where available');
assert(dealAgendaToday.locationLabel === 'Adres B', 'delivery location surfaces where available');

const buyerView = buildDealAgenda(dealFor({ userRoleInDeal: 'BUYER' }), now);
const sellerView = buildDealAgenda(dealFor({ userRoleInDeal: 'SELLER' }), now);
assert(
  buyerView.scheduledAt === sellerView.scheduledAt &&
    buyerView.bucket === sellerView.bucket &&
    buyerView.timeLabel === sellerView.timeLabel,
  'buyer and seller see the same agreement timing from their own role',
);

const proposalAgenda = buildProposalAgenda(
  { requestedDate: laterIso, requestedTimeWindow: '15:00-16:00' } as unknown as ProposalDTO,
  now,
);
assert(proposalAgenda.bucket === 'later', 'far-future proposal \u2192 later bucket');

const mkItem = (bucket: string): AgreementHubItem =>
  ({
    kind: 'deal',
    id: `deal-${bucket}-${Math.random()}`,
    deal: { status: 'OPEN' },
    facets: [],
    agenda: { scheduledAt: null, timeLabel: null, locationLabel: null, bucket },
  }) as unknown as AgreementHubItem;

const grouped = groupAgenda([
  mkItem('today'),
  mkItem('thisWeek'),
  mkItem('thisWeek'),
  mkItem('later'),
  mkItem('completed'),
]);
assert(grouped.today.length === 1, 'grouping: today bucket');
assert(grouped.thisWeek.length === 2, 'grouping: this-week bucket');
assert(grouped.later.length === 1, 'grouping: later bucket');
assert(grouped.completed.length === 1, 'grouping: completed bucket');

const summaryItems: AgreementHubItem[] = [
  {
    kind: 'proposal',
    id: 'p1',
    canRespond: true,
    facets: ['ACTION_REQUIRED'],
    agenda: { scheduledAt: todayIso, timeLabel: null, locationLabel: null, bucket: 'today' },
  } as unknown as AgreementHubItem,
  {
    kind: 'deal',
    id: 'd1',
    deal: { status: 'OPEN' },
    facets: ['WAITING_PAYMENT'],
    agenda: { scheduledAt: thisWeekIso, timeLabel: null, locationLabel: null, bucket: 'thisWeek' },
  } as unknown as AgreementHubItem,
  {
    kind: 'deal',
    id: 'd2',
    deal: { status: 'OPEN' },
    facets: ['WAITING_DELIVERY'],
    agenda: { scheduledAt: todayIso, timeLabel: null, locationLabel: null, bucket: 'today' },
  } as unknown as AgreementHubItem,
];
const summary = buildAgendaSummary(summaryItems, groupAgenda(summaryItems));
assert('nextAgreement' in summary, 'sidebar summary exposes nextAgreement');
assert(summary.plannedTodayCount === 2, 'sidebar summary: planned today count');
assert(summary.openActionCount === 1, 'sidebar summary: open action count');
assert(summary.waitingPaymentCount === 1, 'sidebar summary: waiting-payment count');
assert(summary.activeDeliveryCount === 1, 'sidebar summary: active-delivery count');
assert(summary.proposalsToRespondCount === 1, 'sidebar summary: proposals-to-respond count');

console.log('\nCalendar-sync readiness (no OAuth / ICS built)');
assert(exists('lib/agreements/agreement-calendar-event.ts'), 'calendar-event helper exists');

const calProposalItem = {
  kind: 'proposal',
  id: 'prop-123',
  displayKind: 'MEAL',
  counterpartName: 'Sanne',
  userRoleInDeal: 'BUYER',
  proposal: { id: 'prop-123', title: 'Verse lasagne', status: 'PENDING' },
  agenda: {
    scheduledAt: todayIso,
    timeLabel: '10:00-12:00',
    locationLabel: 'Adres B',
    bucket: 'today',
  },
} as unknown as AgreementHubItem;

const calEvent = buildAgreementCalendarEvent(calProposalItem);
assert(calEvent.id === 'homecheff:proposal:prop-123', 'stable event id from source type + id');
assert(calEvent.sourceType === 'proposal' && calEvent.sourceId === 'prop-123', 'source type + source id present');
assert(typeof calEvent.title === 'string' && calEvent.title.length > 0, 'event has title');
assert(typeof calEvent.description === 'string' && calEvent.description.length > 0, 'event has description');
assert(!!calEvent.start && calEvent.start.includes('T10:00:00'), 'start datetime derived from window start');
assert(!!calEvent.end && calEvent.end.includes('T12:00:00'), 'end datetime derived from window end');
assert(calEvent.timeWindowLabel === '10:00-12:00', 'raw time-window label kept');
assert(calEvent.locationLabel === 'Adres B', 'location label present');
assert(calEvent.role === 'BUYER', 'role of current user present');
assert(calEvent.status === 'PENDING', 'status present');
assert(
  !!calEvent.titleKey && !!calEvent.descriptionKey && !!calEvent.labelParams,
  'i18n keys + params exposed for future localized export',
);

const calDealItem = {
  kind: 'deal',
  id: 'order-9',
  displayKind: 'DELIVERY',
  deal: {
    id: 'order-9',
    title: 'Bezorging',
    proposalTitle: 'Bezorging maaltijd',
    counterpartName: 'Koen',
    userRoleInDeal: 'SELLER',
    status: 'OPEN',
  },
  agenda: {
    scheduledAt: thisWeekIso,
    timeLabel: null,
    locationLabel: null,
    bucket: 'thisWeek',
  },
} as unknown as AgreementHubItem;

const dealEvent = buildAgreementCalendarEvent(calDealItem);
assert(dealEvent.id === 'homecheff:community_order:order-9', 'deal → community_order event id');
assert(dealEvent.end === null, 'no window → end is null (start-only event)');

const cancelledDeal = {
  kind: 'deal',
  id: 'order-x',
  displayKind: 'MEAL',
  deal: { id: 'order-x', title: 'x', proposalTitle: 'x', counterpartName: null, userRoleInDeal: 'BUYER', status: 'CANCELLED' },
  agenda: { scheduledAt: null, timeLabel: null, locationLabel: null, bucket: 'unscheduled' },
} as unknown as AgreementHubItem;
const events = buildAgreementCalendarEvents([calProposalItem, calDealItem, cancelledDeal]);
assert(events.length === 2, 'calendar mapping skips cancelled deals');

const localized = buildAgreementCalendarEvent(calProposalItem, {
  translate: (key) => `T:${key}`,
});
assert(
  localized.title === 'T:marketplace.agreements.calendar.title',
  'translate option localizes title via i18n key',
);

console.log('\nAudit artifacts');
assert(exists('docs/audits/AGREEMENTS_HUB_AUDIT.md'), 'AGREEMENTS_HUB_AUDIT.md exists');
assert(
  exists('docs/progress/COMMUNITY_ECONOMY_PHASE2A_AGREEMENTS_HUB.md'),
  'phase progress doc exists',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
