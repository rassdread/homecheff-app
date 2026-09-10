import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveAffiliateConnectDestination,
} from '@/lib/stripe/affiliate-connect-mirror';

describe('admin affiliate hierarchy', () => {
  it('documents supported operations and Stripe reuse rules', () => {
    const src = readFileSync(
      join(process.cwd(), 'lib/affiliates/admin-affiliate-hierarchy.ts'),
      'utf8',
    );
    assert.match(src, /PROMOTE_TO_MAIN/);
    assert.match(src, /DEMOTE_TO_SUB/);
    assert.match(src, /REPARENT/);
    assert.match(src, /DETACH/);
    assert.match(src, /SELF_PARENT/);
    assert.match(src, /CYCLE/);
    assert.match(src, /HAS_ACTIVE_CHILDREN/);
    assert.match(src, /AFFILIATE_HIERARCHY_STRIPE_MUTATION_FORBIDDEN/);
    assert.match(src, /Never creates\/deletes Stripe Connect/);
    assert.doesNotMatch(src, /accounts\.create/);
  });

  it('admin hierarchy API requires admin + confirmation', () => {
    const route = readFileSync(
      join(process.cwd(), 'app/api/admin/affiliates/[id]/hierarchy/route.ts'),
      'utf8',
    );
    assert.match(route, /requireAdminPermission\('canViewPaymentInfo'\)/);
    assert.match(route, /CONFIRMATION_REQUIRED/);
    assert.match(route, /AFFILIATE_HIERARCHY_UPDATE/);
    assert.match(route, /stripeUnchanged: true/);
  });

  it('role change reuses User Connect and does not invent a second account', () => {
    const before = resolveAffiliateConnectDestination({
      userStripeConnectAccountId: 'acct_CANONICAL123',
      userStripeConnectOnboardingCompleted: true,
      affiliateStripeConnectAccountId: 'acct_MIRROR_OLD',
      affiliateStripeConnectOnboardingCompleted: false,
    });
    assert.equal(before.source, 'user');
    assert.equal(before.accountId, 'acct_CANONICAL123');

    const afterSameUser = resolveAffiliateConnectDestination({
      userStripeConnectAccountId: 'acct_CANONICAL123',
      userStripeConnectOnboardingCompleted: true,
      affiliateStripeConnectAccountId: 'acct_MIRROR_OLD',
      affiliateStripeConnectOnboardingCompleted: false,
    });
    assert.equal(afterSameUser.accountId, before.accountId);
  });

  it('Sergio-like promote path is PROMOTE_TO_MAIN / DETACH without Connect recreate', () => {
    const src = readFileSync(
      join(process.cwd(), 'lib/affiliates/admin-affiliate-hierarchy.ts'),
      'utf8',
    );
    assert.match(
      src,
      /input\.action === 'PROMOTE_TO_MAIN' \|\| input\.action === 'DETACH'/,
    );
    assert.match(src, /newParent = null/);
    assert.match(src, /newRole = 'MAIN'/);
  });

  it('ecosystem bridge exposes admin reparent/detach', () => {
    const bridge = readFileSync(
      join(process.cwd(), 'lib/affiliates/ecosystem-attribution-bridge.ts'),
      'utf8',
    );
    assert.match(bridge, /bridgeAdminHierarchyEdgeToEcosystem/);
    assert.match(bridge, /edge\/admin-mutate/);
  });
});
