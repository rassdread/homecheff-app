import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { shownCourierLeftPaidList } from './paid-courier-selection';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('a lost payout or agreement drops the shown courier without a customer explanation', () => {
  for (const code of [
    'COURIER_CONNECT_REQUIRED',
    'COURIER_CONNECT_INCOMPLETE',
    'COURIER_CONNECT_STALE',
    'COURIER_CONNECT_UNVERIFIED',
    'COURIER_PAYOUT_NOT_READY',
    'AGREEMENT_ACCEPTANCE_REQUIRED',
    'DELIVERY_PROVIDER_INELIGIBLE',
  ]) {
    assert.equal(shownCourierLeftPaidList(code), true);
  }
  assert.equal(shownCourierLeftPaidList('DELIVERY_QUOTE_CHANGED'), false);
  assert.equal(shownCourierLeftPaidList(null), false);
});

test('paid lists use the booking payout gate after distance and schedule', () => {
  const quote = read('lib/delivery/standalone-delivery.ts');
  const quoteFn = quote.slice(quote.indexOf('export async function createStandaloneQuote'));
  const schedule = quoteFn.indexOf('assertCourierBookableAt(');
  const identity = quoteFn.indexOf('ensureCourierIdentityFreshForListing(');
  const payable = quoteFn.indexOf('courierCanBeListedForPaidJob(');
  const alternatives = quoteFn.indexOf('unavailable.push(');
  const push = quoteFn.indexOf('couriers.push(');
  assert.ok(schedule > 0 && identity > schedule && payable > identity && alternatives > payable && push > payable);

  const match = read('app/api/delivery/match-deliverers/route.ts');
  const distance = match.indexOf('marketplaceDistanceEligible(');
  const listedIdentity = match.indexOf('await ensureCourierIdentityFreshForListing(');
  const listed = match.indexOf('await courierCanBeListedForPaidJob(');
  const response = match.indexOf('matchedDeliverers: payableDeliverers');
  assert.ok(distance > 0 && listedIdentity > distance && listed > listedIdentity && response > listed);
  assert.match(match, /delivererCandidateWhere\(/);
  assert.doesNotMatch(match, /refreshStaleCourierIdentityForMatching\(/);

  const book = read('lib/delivery/booking-request-service.ts');
  const proposal = read('lib/delivery/transport-proposal-service.ts');
  const checkout = read('app/api/checkout/route.ts');
  assert.match(book, /ensureCourierPayable\(prisma, profile\.id, \{ live: true \}\)/);
  assert.match(proposal, /ensureCourierPayable\(prisma, deliveryProfileId, \{ live: true \}\)/);
  assert.match(checkout, /ensureCourierPayable\(prisma, selectedProviderId\)/);
  assert.doesNotMatch(quoteFn.slice(quoteFn.indexOf('courierCanBeListedForPaidJob(')), /live: true/);
});
