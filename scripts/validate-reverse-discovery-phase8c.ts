#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 8C — Reverse discovery & value economy guard.
 *
 * Run: npx tsx scripts/validate-reverse-discovery-phase8c.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  extractItemAcceptedValueIds,
  itemMatchesAcceptedValuesDiscoveryFilter,
  taxonomyIdAllowedInDiscoveryFilter,
} from '@/lib/marketplace/discovery/accepted-values-discovery';
import { suggestAcceptedValueAlternatives } from '@/lib/marketplace/discovery/suggest-accepted-value-alternatives';
import {
  isPendingAcceptedValueId,
  toPendingAcceptedValueId,
} from '@/lib/marketplace/pending-accepted-values/constants';
import { buildPendingAcceptedValueCanonicalKey } from '@/lib/marketplace/pending-accepted-values/canonical-key';
import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import { resolveProposalPrefill } from '@/lib/proposals/proposal-prefill';
import { getAcceptedValueTaxonomyItems } from '@/lib/marketplace/taxonomy-resolve';

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}
function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

console.log('=== UX-FIN Phase 8C — Reverse discovery & value economy ===\n');

// --- 8C.1 Bidirectional discovery UI ----------------------------------------
console.log('8C.1 Bidirectional discovery');
const geo = read('components/feed/GeoFeed.tsx');
const sidebar = read('components/feed/FeedSidebarFilters.tsx');
const mobile = read('components/feed/FeedMobileFilterSheet.tsx');
const direction = read('components/feed/DiscoveryDirectionToggle.tsx');

assert(exists('components/feed/DiscoveryDirectionToggle.tsx'), 'DiscoveryDirectionToggle exists');
assert(direction.includes("want") && direction.includes('offer'), 'direction toggle has want/offer');
assert(geo.includes('discoveryDirection'), 'GeoFeed tracks discovery direction');
assert(geo.includes('DiscoveryDirectionToggle'), 'GeoFeed renders direction toggle');
assert(sidebar.includes('discoveryDirection'), 'FeedSidebarFilters wires direction');
assert(mobile.includes('discoveryDirection'), 'FeedMobileFilterSheet wires direction');
assert(
  sidebar.includes("discoveryDirection === 'offer'"),
  'offer mode promotes accepted-values filter',
);

// --- 8C.2 Reverse discovery session + proposal -------------------------------
console.log('\n8C.2 Proposal continuity from reverse discovery');
const session = read('lib/marketplace/discovery/reverse-discovery-session.ts');
const prefill = read('lib/proposals/proposal-prefill.ts');
const startChat = read('components/chat/StartChatButton.tsx');
const proposalSheet = read('components/chat/proposals/CreateProposalSheet.tsx');

assert(session.includes('syncReverseDiscoveryOfferIds'), 'reverse discovery session sync');
assert(geo.includes('syncReverseDiscoveryOfferIds'), 'GeoFeed syncs offer ids to session');
assert(prefill.includes('reverseDiscoveryOfferIds'), 'proposal prefill accepts reverse ids');
assert(prefill.includes('requestedValueTaxonomyIds'), 'prefill maps to requested values');
assert(startChat.includes('peekReverseDiscoveryOfferIds'), 'StartChatButton reads reverse session');
assert(proposalSheet.includes('reverseDiscoveryOfferIds'), 'CreateProposalSheet passes reverse ids');

{
  const pendingId = toPendingAcceptedValueId('test123');
  const result = resolveProposalPrefill({
    source: 'reverse_discovery',
    reverseDiscoveryOfferIds: [pendingId],
  });
  assert(
    result.form.requestedValueTaxonomyIds.includes(pendingId),
    'reverse discovery prefill includes pending id in requested values',
  );
  assert(result.meta.reverseDiscoveryUsed, 'prefill meta flags reverse discovery');
}

// --- 8C.3 Pending taxonomy proposals ----------------------------------------
console.log('\n8C.3 Pending accepted-value proposals');
const schema = read('prisma/schema.prisma');
const api = read('app/api/marketplace/pending-accepted-values/route.ts');
const normalize = read('lib/marketplace/taxonomy-normalize.ts');

assert(schema.includes('PendingAcceptedValueProposal'), 'Prisma pending proposal model');
assert(schema.includes('PendingAcceptedValueProposalUser'), 'Prisma pending user dedup model');
assert(exists('app/api/marketplace/pending-accepted-values/route.ts'), 'pending values API');
assert(api.includes('upsertPendingAcceptedValueProposal'), 'API upserts/merges proposals');
assert(normalize.includes('isPendingAcceptedValueId'), 'normalize preserves pending ids');
assert(
  exists('components/marketplace/PendingAcceptedValueProposalForm.tsx'),
  'pending proposal form component',
);
assert(
  read('components/feed/AcceptedValuesDiscoveryFilter.tsx').includes(
    'PendingAcceptedValueProposalForm',
  ),
  'discovery filter includes pending fallback',
);

{
  const key = buildPendingAcceptedValueCanonicalKey({
    category: 'CREATE',
    label: '  Zelfgemaakte  Kimchi ',
    language: 'nl',
  });
  assert(key === 'CREATE:nl:zelfgemaakte kimchi', 'canonical key normalizes label');
  const pendingId = 'pending:abc';
  const normalized = normalizeAcceptedTaxonomyIds(['create.fruit', pendingId, 'bogus']);
  assert(normalized.includes(pendingId), 'normalize keeps pending id');
  assert(taxonomyIdAllowedInDiscoveryFilter(pendingId), 'pending id allowed in discovery');
}

// --- 8C.4 Discovery integrity (OR + pending) --------------------------------
console.log('\n8C.4 Discovery matching integrity');
{
  const fruitId = getAcceptedValueTaxonomyItems().find((i) =>
    i.id.includes('fruit') || (i.searchTerms ?? []).some((t) => t.includes('fruit')),
  )?.id;
  const pendingId = toPendingAcceptedValueId('merge1');
  if (fruitId) {
    assert(
      itemMatchesAcceptedValuesDiscoveryFilter(
        { acceptedSpecializations: [fruitId] },
        [fruitId],
      ),
      'official value OR match',
    );
  }
  assert(
    itemMatchesAcceptedValuesDiscoveryFilter(
      { acceptedSpecializations: [pendingId] },
      [pendingId],
    ),
    'pending value OR match',
  );
  const extracted = extractItemAcceptedValueIds({ acceptedSpecializations: [pendingId] });
  assert(extracted.includes(pendingId), 'extract includes pending ids');
}

// --- 8C.5 Empty-state suggestions ---------------------------------------------
console.log('\n8C.5 Taxonomy-only empty suggestions');
assert(
  exists('lib/marketplace/discovery/suggest-accepted-value-alternatives.ts'),
  'suggestion helper exists',
);
assert(geo.includes('suggestAcceptedValueAlternatives'), 'GeoFeed uses taxonomy suggestions');
{
  const fruitId = getAcceptedValueTaxonomyItems().find((i) => i.id.includes('fruit'))?.id;
  if (fruitId) {
    const alts = suggestAcceptedValueAlternatives([fruitId]);
    assert(Array.isArray(alts), 'suggestions return array');
  }
}

// --- 8C.6 Chips & detail clarity ----------------------------------------------
console.log('\n8C.6 Chips & detail copy');
assert(exists('components/marketplace/AcceptedValueChip.tsx'), 'AcceptedValueChip component');
assert(geo.includes('shoppingWithPrefix'), 'GeoFeed shopping-with chip framing');
const detail = read('components/product/detail/ProductDetailAcceptedValuesSection.tsx');
assert(detail.includes('sellerAcceptsHeading'), 'detail uses seller accepts heading');

// --- 8C.7 i18n parity ---------------------------------------------------------
console.log('\n8C.7 i18n parity');
const nl = read('public/i18n/nl.json');
const en = read('public/i18n/en.json');
const keys = [
  'marketplace.discovery.direction.offer',
  'marketplace.discovery.acceptedValuesFilter.offerHeading',
  'marketplace.discovery.acceptedValuesFilter.shoppingWithPrefix',
  'marketplace.pendingAcceptedValue.proposeCta',
  'marketplace.detail.acceptedValues.sellerAcceptsHeading',
];
for (const key of keys) {
  const parts = key.split('.');
  let o: unknown = JSON.parse(nl);
  for (const p of parts) o = (o as Record<string, unknown>)?.[p];
  assert(typeof o === 'string' && o.length > 0, `nl ${key}`);
  o = JSON.parse(en);
  for (const p of parts) o = (o as Record<string, unknown>)?.[p];
  assert(typeof o === 'string' && o.length > 0, `en ${key}`);
}

// --- 8C.8 Performance guards --------------------------------------------------
console.log('\n8C.8 Performance guards');
assert(!geo.includes('/api/feed?') || !geo.match(/acceptedValues.*fetch\(/), 'no extra feed fetch for accepted values');
assert(!geo.includes('key={appliedAcceptedValues'), 'GeoFeed not remounted on accepted values');
assert(
  read('lib/marketplace/pending-accepted-values/client-registry.ts').includes('ensurePendingAcceptedValueRegistry'),
  'pending registry client cache',
);

// --- 8C.9 No hardcoded value lists --------------------------------------------
console.log('\n8C.9 Taxonomy integrity — no parallel lists');
const filterUi = read('components/feed/AcceptedValuesDiscoveryFilter.tsx');
assert(filterUi.includes('getAcceptedValueTaxonomyItems'), 'filter uses canonical taxonomy');
assert(!/const\s+OFFER_EXAMPLES\s*=\s*\[/.test(filterUi + geo), 'no hardcoded offer example arrays');

// --- 8C.10 Deliverables -------------------------------------------------------
console.log('\n8C.10 Deliverables');
assert(exists('docs/audits/REVERSE_DISCOVERY_PHASE8C_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE8C_REVERSE_DISCOVERY.md'), 'progress doc');

console.log(`\n=== Phase 8C: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
