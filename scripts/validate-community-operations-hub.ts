#!/usr/bin/env npx tsx
/**
 * Community Economy Phase 2B — operations hub completion validation.
 *
 * Verifies the "Mijn Afspraken" hub is a complete daily cockpit: pending
 * proposals outside chat, cancel flow, action-required surfacing, courier states,
 * polished timeline groups, unified history, a single cache refresh path,
 * mobile parity and nl/en i18n parity.
 *
 * Run: npx tsx scripts/validate-community-operations-hub.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AGREEMENT_AGENDA_BUCKETS,
  type AgreementHubItem,
} from '../lib/agreements/agreements-hub-types';
import {
  buildAgendaSummary,
  buildProposalAgenda,
  groupAgenda,
} from '../lib/agreements/agreement-agenda';
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

console.log('=== Community Operations Hub Validation (Phase CE-2B) ===\n');

const hubClient = read('components/profile/ProfileDealsClient.tsx');
const hubService = read('lib/agreements/agreements-hub-service.ts');
const proposalsSource = read('lib/agreements/list-pending-proposals-for-user.ts');
const filtersSource = read('lib/agreements/agreements-hub-filters.ts');
const courierStrip = read('components/agreements/CourierAgreementsStrip.tsx');

// ── CE-2B.1 Pending proposals outside chat ────────────────────────────────────
console.log('CE-2B.1 Pending proposals outside chat');
assert(
  proposalsSource.includes("'PENDING'") && proposalsSource.includes("'COUNTERED'"),
  'hub surfaces PENDING + COUNTERED (open) proposals',
);
assert(
  proposalsSource.includes("'EXPIRED'") &&
    proposalsSource.includes("'REJECTED'") &&
    proposalsSource.includes("'CANCELLED'"),
  'hub surfaces expired / rejected / cancelled proposals (history)',
);
assert(
  proposalsSource.includes('serializeProposal'),
  'reuses ProposalService serializer (no duplicate proposal storage)',
);
assert(
  hubService.includes('listPendingProposalsForUser'),
  'hub service aggregates proposals',
);

// ── CE-2B.2 Cancel flow ───────────────────────────────────────────────────────
console.log('\nCE-2B.2 Cancel flow');
assert(exists('app/api/community-orders/[id]/cancel/route.ts'), 'cancel API route exists');
const cancelService = read('lib/trust/community-order-service.ts');
assert(cancelService.includes('cancelCommunityOrder'), 'cancelCommunityOrder service exists');
assert(
  cancelService.includes("status === 'COMPLETED'") &&
    cancelService.includes("'CANCELLED'"),
  'cancel guards completed + sets CANCELLED status',
);
assert(
  cancelService.includes('deliveryRequest.updateMany') &&
    cancelService.includes('courierAssignment.updateMany'),
  'cancel cascades DeliveryRequest + CourierAssignment',
);
const dealCard = read('components/profile/ProfileDealCard.tsx');
assert(
  dealCard.includes('/cancel') && dealCard.includes('window.confirm'),
  'cancel CTA calls API behind a confirm dialog',
);
assert(dealCard.includes("deal.status === 'OPEN'"), 'cancel CTA only for OPEN deals');

// ── CE-2B.3 Action required ────────────────────────────────────────────────────
console.log('\nCE-2B.3 Action required');
assert(
  hubClient.includes('sections.actionRequired') && hubClient.includes('actionItems'),
  'dedicated action-required section in the hub',
);
assert(
  filtersSource.includes('ACTION_REQUIRED') &&
    filtersSource.includes('dealPrimaryCtaRequiresUserAction'),
  'action-required derived from existing dealUx (no recompute)',
);
assert(
  hubClient.includes('itemActionLabelKey') &&
    hubClient.includes('primaryCta.labelKey'),
  'next action label reuses dealUx primary CTA',
);

// ── CE-2B.4 Timeline polish ────────────────────────────────────────────────────
console.log('\nCE-2B.4 Timeline polish');
for (const bucket of ['today', 'tomorrow', 'thisWeek', 'nextWeek', 'later'] as const) {
  assert(
    (AGREEMENT_AGENDA_BUCKETS as readonly string[]).includes(bucket),
    `agenda bucket exists: ${bucket}`,
  );
}
assert(
  hubClient.includes('cockpit.nextAgreement') && hubClient.includes('cockpit.nextAction'),
  'cockpit always shows next agreement + next action',
);

const now = new Date('2026-07-07T12:00:00.000Z');
const iso = (day: number) =>
  new Date(2026, 6, day, 9, 0, 0).toISOString();
const bucketOf = (dayIso: string | null, status = 'PENDING') =>
  buildProposalAgenda({ requestedDate: dayIso, requestedTimeWindow: null, status } as unknown as ProposalDTO, now).bucket;

assert(bucketOf(iso(7)) === 'today', 'timeline: today');
assert(bucketOf(iso(8)) === 'tomorrow', 'timeline: tomorrow');
assert(bucketOf(iso(11)) === 'thisWeek', 'timeline: this week');
assert(bucketOf(iso(17)) === 'nextWeek', 'timeline: next week');
assert(bucketOf(iso(30)) === 'later', 'timeline: later');
assert(bucketOf(null) === 'unscheduled', 'timeline: unscheduled');

// ── CE-2B.5 Courier integration ────────────────────────────────────────────────
console.log('\nCE-2B.5 Courier integration');
assert(
  courierStrip.includes('community-requests') &&
    courierStrip.includes('/delivery/dashboard'),
  'courier strip reuses DeliveryRequestService feed + dashboard link (no 2nd dashboard)',
);
assert(
  courierStrip.includes('today') &&
    courierStrip.includes('awaitingAccept') &&
    courierStrip.includes('enRoute'),
  'courier states: today / awaiting acceptance / en route',
);
assert(hubClient.includes('CourierAgreementsStrip'), 'courier strip embedded in hub');

// ── CE-2B.6 Unified history ─────────────────────────────────────────────────────
console.log('\nCE-2B.6 Unified history');
assert(bucketOf(iso(1), 'EXPIRED') === 'completed', 'expired proposal → history');
assert(bucketOf(iso(1), 'CANCELLED') === 'completed', 'cancelled proposal → history');

const cancelledDeal = {
  kind: 'deal',
  id: 'cx',
  deal: { status: 'CANCELLED' },
  facets: ['CANCELLED'],
  agenda: { scheduledAt: null, timeLabel: null, locationLabel: null, bucket: 'unscheduled' },
} as unknown as AgreementHubItem;
const completedDeal = {
  kind: 'deal',
  id: 'cd',
  deal: { status: 'COMPLETED' },
  facets: ['COMPLETED'],
  agenda: { scheduledAt: null, timeLabel: null, locationLabel: null, bucket: 'completed' },
} as unknown as AgreementHubItem;
const history = groupAgenda([cancelledDeal, completedDeal]);
assert(history.completed.length === 2, 'history combines completed + cancelled deals');

// ── CE-2B.7 Cache consistency ───────────────────────────────────────────────────
console.log('\nCE-2B.7 Cache consistency');
const loadHubCalls = (hubClient.match(/loadHub\(/g) ?? []).length;
assert(hubClient.includes('const loadHub'), 'single loadHub refresh function');
assert(loadHubCalls >= 2, 'mutations re-run the same loadHub path (no divergent refresh)');
assert(
  hubService.includes('groupAgenda') && hubService.includes('buildAgendaSummary'),
  'one response feeds items + counts + agenda + summary together',
);

// ── CE-2B.4/summary sidebar-ready ───────────────────────────────────────────────
console.log('\nSidebar-ready summary');
const summaryItems: AgreementHubItem[] = [
  {
    kind: 'proposal',
    id: 'p',
    canRespond: true,
    facets: ['OPEN', 'ACTION_REQUIRED'],
    agenda: { scheduledAt: iso(7), timeLabel: null, locationLabel: null, bucket: 'today' },
  } as unknown as AgreementHubItem,
];
const summary = buildAgendaSummary(summaryItems, groupAgenda(summaryItems));
assert('nextAgreement' in summary && 'nextAction' in summary, 'summary exposes nextAgreement + nextAction');
assert(summary.nextAction !== null, 'summary resolves the next action item');

// ── CE-2B.8 Mobile parity ───────────────────────────────────────────────────────
console.log('\nCE-2B.8 Mobile parity');
assert(hubClient.includes('overflow-x-auto'), 'filter row scrolls horizontally on mobile');
assert(hubClient.includes('sm:grid-cols-2'), 'cockpit stacks on mobile, 2-up on wider screens');
assert(read('components/agreements/AgreementAgendaMeta.tsx').includes('flex-wrap'), 'agenda meta wraps on small screens');

// ── CE-2B.9 i18n parity ─────────────────────────────────────────────────────────
console.log('\nCE-2B.9 i18n parity (nl/en)');
const en = loadI18n('en');
const nl = loadI18n('nl');
const KEYS = [
  'marketplace.agreements.agenda.tomorrow',
  'marketplace.agreements.agenda.nextWeek',
  'marketplace.agreements.agenda.completed',
  'marketplace.agreements.cockpit.nextAgreement',
  'marketplace.agreements.cockpit.nextAction',
  'marketplace.agreements.cockpit.allClear',
  'marketplace.agreements.sections.actionRequired',
  'marketplace.agreements.sections.other',
  'marketplace.agreements.courier.today',
  'marketplace.agreements.courier.awaitingAccept',
  'marketplace.agreements.courier.enRoute',
];
for (const key of KEYS) {
  assert(typeof getNested(en, key) === 'string', `en: ${key}`);
  assert(typeof getNested(nl, key) === 'string', `nl: ${key}`);
}

// ── Docs ────────────────────────────────────────────────────────────────────────
console.log('\nDocumentation');
assert(exists('docs/progress/COMMUNITY_ECONOMY_PHASE2B.md'), 'CE-2B progress doc exists');
assert(exists('docs/audits/COMMUNITY_OPERATIONS_HUB_AUDIT.md'), 'operations hub audit exists');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
