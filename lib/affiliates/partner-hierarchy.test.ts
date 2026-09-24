/**
 * MAIN → partner hierarchy, invite token survival, and 40/10 line split.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { REFERRAL_COOKIE_NAME } from '@/lib/affiliate-attribution-contract';
import { allocateMarketplaceAffiliatePool } from '@/lib/marketplace-affiliate-pool';
import {
  calculateBusinessSubscriptionCommission,
  calculateParentAffiliateBusinessCommission,
} from '@/lib/affiliate-config';
import { splitAffiliateLineForHierarchy } from '@/lib/affiliates/main-partner-split';
import {
  PARTNER_INVITE_COOKIE,
  canManagePartner,
  canManagePartners,
  decideAcceptPartnerInvite,
  decideMainCanInvite,
  forgedParentRejected,
  resolvePartnerInviteToken,
} from '@/lib/affiliates/partner-hierarchy';

const TOKEN = 'a'.repeat(64);
const root = resolve(process.cwd());

describe('partner invite is not a customer referral', () => {
  it('uses a different cookie than hc_ref', () => {
    assert.notEqual(PARTNER_INVITE_COOKIE, REFERRAL_COOKIE_NAME);
    assert.equal(
      resolvePartnerInviteToken({
        cookieHeader: `${REFERRAL_COOKIE_NAME}=REFABC; other=1`,
      }),
      null,
    );
    assert.equal(
      resolvePartnerInviteToken({
        cookieHeader: `${PARTNER_INVITE_COOKIE}=${TOKEN}`,
      }),
      TOKEN,
    );
  });

  it('keeps the invite token from the body when the referral cookie is also present', () => {
    assert.equal(
      resolvePartnerInviteToken({
        bodyToken: TOKEN,
        cookieHeader: `${REFERRAL_COOKIE_NAME}=REFABC`,
      }),
      TOKEN,
    );
  });

  it('falls back to the httpOnly partner cookie when the URL token was dropped', () => {
    assert.equal(
      resolvePartnerInviteToken({
        bodyToken: null,
        cookieHeader: `session=1; ${PARTNER_INVITE_COOKIE}=${TOKEN}`,
      }),
      TOKEN,
    );
  });
});

describe('MAIN partner permissions', () => {
  it('MAIN can invite; a partner cannot; a suspended seat cannot', () => {
    assert.equal(canManagePartners({ parentAffiliateId: null, status: 'ACTIVE' }), true);
    assert.equal(
      canManagePartners({ parentAffiliateId: 'parent-1', status: 'ACTIVE' }),
      false,
    );
    assert.equal(canManagePartners({ parentAffiliateId: null, status: 'SUSPENDED' }), false);
    assert.deepEqual(
      decideMainCanInvite({
        parentAffiliateId: null,
        status: 'ACTIVE',
        email: 'main@example.com',
        targetEmail: 'partner@example.com',
      }),
      { ok: true },
    );
    assert.equal(
      decideMainCanInvite({
        parentAffiliateId: 'main-aff',
        status: 'ACTIVE',
        email: 'partner@example.com',
        targetEmail: 'other@example.com',
      }).ok,
      false,
    );
    assert.equal(
      (
        decideMainCanInvite({
          parentAffiliateId: 'main-aff',
          status: 'ACTIVE',
          email: 'partner@example.com',
          targetEmail: 'other@example.com',
        }) as { code: string }
      ).code,
      'PARENT_IS_PARTNER',
    );
  });

  it('rejects self-parenting and forged parent ids', () => {
    assert.equal(
      (
        decideMainCanInvite({
          parentAffiliateId: null,
          status: 'ACTIVE',
          email: 'main@example.com',
          targetEmail: 'MAIN@example.com',
        }) as { code: string }
      ).code,
      'SELF_PARENT',
    );
    assert.equal(forgedParentRejected('other-main', 'session-main'), true);
    assert.equal(forgedParentRejected('session-main', 'session-main'), false);
    assert.equal(forgedParentRejected(undefined, 'session-main'), false);
  });

  it('MAIN-A can manage PARTNER-A; MAIN-B cannot', () => {
    assert.equal(canManagePartner('main-a', 'main-a'), true);
    assert.equal(canManagePartner('main-b', 'main-a'), false);
    assert.equal(canManagePartner('partner-a', null), false);
  });
});

describe('accept partner invite', () => {
  const base = {
    inviteStatus: 'PENDING',
    inviteExpiresAt: new Date('2026-12-01T00:00:00.000Z'),
    inviteEmail: 'partner@example.com',
    inviteParentAffiliateId: 'main-aff',
    parentAffiliateIdOfInviter: null as string | null,
    inviterStatus: 'ACTIVE',
    inviterUserId: 'main-user',
    userId: 'partner-user',
    userEmail: 'partner@example.com',
    existingAffiliate: null as { id: string; parentAffiliateId: string | null } | null,
    now: new Date('2026-09-24T00:00:00.000Z'),
  };

  it('links a new user to the inviting MAIN', () => {
    const decision = decideAcceptPartnerInvite(base);
    assert.equal(decision.action, 'LINK');
    if (decision.action === 'LINK') {
      assert.equal(decision.parentAffiliateId, 'main-aff');
    }
  });

  it('rejects a partner inviting another partner', () => {
    const decision = decideAcceptPartnerInvite({
      ...base,
      parentAffiliateIdOfInviter: 'higher-main',
    });
    assert.deepEqual(decision, { action: 'REJECT', code: 'PARENT_IS_PARTNER' });
  });

  it('does not duplicate an affiliate or convert a direct affiliate', () => {
    assert.equal(
      decideAcceptPartnerInvite({
        ...base,
        existingAffiliate: { id: 'aff-1', parentAffiliateId: null },
      }).action,
      'REJECT',
    );
    const same = decideAcceptPartnerInvite({
      ...base,
      inviteStatus: 'ACCEPTED',
      existingAffiliate: { id: 'aff-1', parentAffiliateId: 'main-aff' },
    });
    assert.deepEqual(same, { action: 'ALREADY_LINKED', affiliateId: 'aff-1' });
  });

  it('rejects a different parent and self-parenting', () => {
    assert.equal(
      (
        decideAcceptPartnerInvite({
          ...base,
          existingAffiliate: { id: 'aff-1', parentAffiliateId: 'other-main' },
        }) as { code: string }
      ).code,
      'ALREADY_AFFILIATE',
    );
    assert.equal(
      (
        decideAcceptPartnerInvite({
          ...base,
          inviterUserId: 'partner-user',
          userId: 'partner-user',
        }) as { code: string }
      ).code,
      'SELF_PARENT',
    );
  });

  it('survives an already-accepted invite when the affiliate row is missing', () => {
    const decision = decideAcceptPartnerInvite({
      ...base,
      inviteStatus: 'ACCEPTED',
      existingAffiliate: null,
    });
    assert.equal(decision.action, 'LINK');
  });
});

describe('MAIN/partner commission waterfall', () => {
  it('qualifying full pool: partner 40 and MAIN 10 of a 100.00 fee, exactly the 50 pool', () => {
    const feeCents = 10_000;
    const pool = allocateMarketplaceAffiliatePool({
      platformFeeCents: feeCents,
      buyerAffiliateId: 'partner',
      sellerAffiliateId: null,
    });
    assert.equal(pool.poolCents, 5_000);
    assert.equal(pool.lines[0].commissionCents, 5_000);
    const split = splitAffiliateLineForHierarchy({
      lineCents: pool.lines[0].commissionCents,
      isPartner: true,
    });
    assert.equal(split.partnerOrDirectCents, 4_000);
    assert.equal(split.mainOverrideCents, 1_000);
    assert.equal(split.totalCents, 5_000);
    assert.ok(split.totalCents <= pool.poolCents);
    assert.notEqual(split.totalCents, 9_000);
    assert.notEqual(split.totalCents, 10_000);
  });

  it('direct affiliate keeps the full line', () => {
    const pool = allocateMarketplaceAffiliatePool({
      platformFeeCents: 10_000,
      buyerAffiliateId: 'direct',
      sellerAffiliateId: null,
    });
    const split = splitAffiliateLineForHierarchy({
      lineCents: pool.lines[0].commissionCents,
      isPartner: false,
    });
    assert.equal(split.partnerOrDirectCents, 5_000);
    assert.equal(split.mainOverrideCents, 0);
    assert.equal(split.totalCents, 5_000);
  });

  it('subscription base stays 40/10 of the subscription amount and 50 for a direct affiliate', () => {
    const base = 10_000;
    const direct = calculateBusinessSubscriptionCommission(base, 0, false);
    assert.equal(direct.affiliateCommissionCents, 5_000);
    const partner = calculateBusinessSubscriptionCommission(base, 0, true);
    const main = calculateParentAffiliateBusinessCommission(base);
    assert.equal(partner.affiliateCommissionCents, 4_000);
    assert.equal(main, 1_000);
    assert.equal(partner.affiliateCommissionCents + main, 5_000);
  });

  it('split is deterministic so a retry does not add a second component', () => {
    const once = splitAffiliateLineForHierarchy({ lineCents: 5_000, isPartner: true });
    const twice = splitAffiliateLineForHierarchy({ lineCents: 5_000, isPartner: true });
    assert.deepEqual(once, twice);
  });
});

describe('partner flow source contracts', () => {
  it('order commission stays exactly-once and uses the hierarchy split', () => {
    const src = readFileSync(resolve(root, 'lib/affiliate-commission.ts'), 'utf8');
    assert.match(src, /Commission already processed for order/);
    assert.match(src, /startsWith: `\$\{orderId\}:`/);
    assert.match(src, /splitAffiliateLineForHierarchy/);
    assert.match(src, /\$\{orderId\}:\$\{line\.affiliateId\}:\$\{line\.side\}/);
    assert.match(src, /\$\{orderId\}:\$\{affiliate\.parentAffiliateId\}:PARENT:\$\{line\.side\}/);
  });

  it('create-sub ignores a forged parent id and blocks a second partner layer', () => {
    const src = readFileSync(resolve(root, 'app/api/affiliate/create-sub/route.ts'), 'utf8');
    assert.match(src, /forgedParentRejected/);
    assert.match(src, /decideMainCanInvite/);
    assert.match(src, /FORGED_PARENT/);
    assert.doesNotMatch(src, /parentAffiliateId:\s*body\.parentAffiliateId/);
  });

  it('Mijn partners is a first-class affiliate route and partners cannot open it', () => {
    const page = readFileSync(resolve(root, 'app/affiliate/partners/page.tsx'), 'utf8');
    assert.match(page, /parentAffiliateId/);
    assert.match(page, /redirect\('\/affiliate\/dashboard'\)/);
    const dash = readFileSync(resolve(root, 'app/affiliate/dashboard/page-client.tsx'), 'utf8');
    assert.match(dash, /\/affiliate\/partners/);
    assert.match(dash, /isSubAffiliate/);
  });
});
