/**
 * TTL resolver unit checks for promo reservation cleanup.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_PROMO_RESERVATION_TTL_MINUTES,
  resolvePromoReservationTtlMinutes,
} from '../lib/promo-codes/promo-reservation-ttl';

const ROOT = process.cwd();

assert.equal(resolvePromoReservationTtlMinutes(undefined), DEFAULT_PROMO_RESERVATION_TTL_MINUTES);
assert.equal(resolvePromoReservationTtlMinutes(''), DEFAULT_PROMO_RESERVATION_TTL_MINUTES);
assert.equal(resolvePromoReservationTtlMinutes('90'), 90);
assert.equal(resolvePromoReservationTtlMinutes('2'), DEFAULT_PROMO_RESERVATION_TTL_MINUTES);
assert.equal(resolvePromoReservationTtlMinutes('99999'), DEFAULT_PROMO_RESERVATION_TTL_MINUTES);

const cron = join(ROOT, 'app/api/cron/expire-promo-reservations/route.ts');
assert.ok(existsSync(cron));
const cronSrc = readFileSync(cron, 'utf8');
assert.ok(cronSrc.includes('expireReservedPromoRedemptions'));
assert.ok(cronSrc.includes('CRON_SECRET'));

const liber = readFileSync(
  join(ROOT, 'lib/promo-codes/expire-reserved-redemptions.ts'),
  'utf8',
);
assert.ok(liber.includes('releasePromoRedemption'));
assert.ok(liber.includes('PROMO_RESERVATION_EXPIRED'));
assert.ok(liber.includes('RESERVED'));

const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
assert.ok(
  vercel.crons.some(
    (c: { path: string }) => c.path === '/api/cron/expire-promo-reservations',
  ),
);

console.log('HOMECHEFF_PROMO_RESERVATION_TTL_PASS');
