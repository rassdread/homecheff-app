/**
 * Invite neighbour + referral list guards.
 * Run: npx tsx scripts/validate-invite-neighbour.ts
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PERSONAL_INVITE_PATH,
  PERSONAL_REFERRAL_LANDING_PREFIX,
  buildPersonalReferralPath,
  buildPersonalReferralUrl,
  generatePersonalReferralCode,
} from '../lib/affiliates/personal-referral';
import { mapOwnedAttributionsToReferralList } from '../lib/affiliates/affiliate-referrals-view';
import { ACTIVITY_CARD_TYPE_REGISTRY } from '../lib/discovery/activity-cards/activity-card-type-registry';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

assert.equal(PERSONAL_INVITE_PATH, '/invite');
assert.equal(PERSONAL_REFERRAL_LANDING_PREFIX, '/welkom');
assert.equal(buildPersonalReferralPath('REFABC'), '/welkom/REFABC');
assert.equal(
  buildPersonalReferralUrl('https://homecheff.eu', 'REFABC'),
  'https://homecheff.eu/welkom/REFABC',
);

const code = generatePersonalReferralCode('user-1234-uuid');
assert.match(code, /^REF[A-Z0-9]{12}$/);

assert.equal(ACTIVITY_CARD_TYPE_REGISTRY.INVITE_FRIEND.actionHref, '/invite');
assert.doesNotMatch(read('lib/discovery/activity-cards/activity-card-type-registry.ts'), /actionHref: '\/welkom'/);
assert.doesNotMatch(read('lib/discovery/activity-cards/activity-card-taxonomy.ts'), /ctaHref: '\/welkom'/);
assert.doesNotMatch(read('lib/discovery/opportunities/opportunity-registry.ts'), /actionHref: '\/welkom'/);
assert.doesNotMatch(read('lib/discovery/surfaces/resolve-opportunity-modules.ts'), /actionHref: '\/welkom'/);
assert.doesNotMatch(read('lib/community/progress/progress-recommendations.ts'), /href: '\/welkom'/);

assert.ok(existsSync(resolve(root, 'app/invite/page.tsx')));
assert.ok(existsSync(resolve(root, 'app/en/invite/page.tsx')));
assert.ok(existsSync(resolve(root, 'app/welkom/[code]/page.tsx')));
assert.match(read('app/api/affiliate/referral-link/route.ts'), /export async function POST/);
assert.match(read('app/api/affiliate/referral-link/route.ts'), /ensurePersonalReferralLink/);
assert.match(read('lib/seo/known-root-path-segments.ts'), /'invite'/);

const nl = JSON.parse(read('public/i18n/nl.json')) as {
  inviteNeighbour: { title: string };
  activityCards: { types: { inviteFriend: { title: string } } };
};
const en = JSON.parse(read('public/i18n/en.json')) as {
  inviteNeighbour: { title: string };
  activityCards: { types: { inviteFriend: { title: string } } };
};
assert.equal(nl.inviteNeighbour.title, 'Nodig een buur uit');
assert.equal(nl.activityCards.types.inviteFriend.title, 'Nodig een buur uit');
assert.equal(en.inviteNeighbour.title, 'Invite a neighbour');
assert.equal(en.activityCards.types.inviteFriend.title, 'Invite a neighbour');

const owner = 'aff-a';
const now = new Date('2026-09-19T10:00:00.000Z');
const mapped = mapOwnedAttributionsToReferralList(
  owner,
  [
    {
      id: 'att-1',
      affiliateId: 'aff-a',
      userId: 'user-b',
      type: 'USER_SIGNUP',
      source: 'REF_LINK',
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2027-09-01T00:00:00.000Z'),
      user: { name: 'Buur B', username: 'buurb' },
    },
    {
      id: 'att-2',
      affiliateId: 'aff-b',
      userId: 'user-secret',
      type: 'USER_SIGNUP',
      source: 'REF_LINK',
      createdAt: new Date('2026-09-02T00:00:00.000Z'),
      startsAt: new Date('2026-09-02T00:00:00.000Z'),
      endsAt: new Date('2027-09-02T00:00:00.000Z'),
      user: { name: 'Should Hide', username: 'hidden' },
    },
  ],
  now,
);
assert.equal(mapped.length, 1);
assert.equal(mapped[0]?.id, 'att-1');
assert.equal(mapped[0]?.displayName, 'Buur B');
assert.equal(mapped[0]?.username, 'buurb');
assert.equal(mapped[0]?.windowStatus, 'active');
assert.equal(
  JSON.stringify(mapped).includes('Should Hide'),
  false,
  'cross-affiliate row must not leak',
);
assert.equal(JSON.stringify(mapped).toLowerCase().includes('email'), false);

const dashboardApi = read('app/api/affiliate/dashboard/route.ts');
assert.match(dashboardApi, /mapOwnedAttributionsToReferralList/);
assert.doesNotMatch(dashboardApi, /attribution\.user\.email/);
assert.match(read('app/api/auth/register-simple/route.ts'), /processAttributionOnSignup/);

console.log('validate-invite-neighbour: PASS');
