import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideCertHygiene, type CertHygieneFacts } from './cert-hygiene';

function facts(over: Partial<CertHygieneFacts> = {}): CertHygieneFacts {
  return {
    email: 'cert.1@homecheff.test',
    username: 'cert1',
    bio: 'certificationFixture=true',
    accountDeletedAt: null,
    stripeConnectAccountId: null,
    sellerStripeCustomerId: null,
    sellerStripeSubscriptionId: null,
    affiliateStripeAccountId: null,
    paymentEvidence: false,
    crossAccountFinancial: false,
    activePublicProducts: 0,
    publishedDishes: 0,
    follows: 0,
    messages: 0,
    ...over,
  };
}

describe('certification hygiene predicates', () => {
  it('disposes a live empty certification account', () => {
    assert.equal(decideCertHygiene(facts()), 'DISPOSE_LIVE');
  });

  it('retains the MediaCert keep fixture', () => {
    assert.equal(
      decideCertHygiene(
        facts({
          email: 'mediacert+homecheff@example.com',
          username: 'MediaCertHC',
        }),
      ),
      'RETAIN_FIXTURE',
    );
  });

  it('retains a temp_ Google signup', () => {
    assert.equal(
      decideCertHygiene(
        facts({
          email: 'person@gmail.com',
          username: 'temp_1763833239379_g0ctb9e2x',
          bio: null,
        }),
      ),
      'RETAIN_ORDINARY',
    );
  });

  it('retains an ordinary dormant user', () => {
    assert.equal(
      decideCertHygiene(
        facts({
          email: 'quiet.person@outlook.com',
          username: 'quietperson',
          bio: null,
        }),
      ),
      'RETAIN_ORDINARY',
    );
  });

  it('finishes a deleted certification row that still has its cert email', () => {
    assert.equal(
      decideCertHygiene(facts({ accountDeletedAt: new Date('2026-09-01') })),
      'FINISH_TOMBSTONE',
    );
  });

  it('retains a deleted certification row with payment evidence', () => {
    assert.equal(
      decideCertHygiene(
        facts({ accountDeletedAt: new Date('2026-09-01'), paymentEvidence: true }),
      ),
      'RETAIN_FINANCIAL',
    );
  });

  it('retains a deleted certification row with a Stripe reference', () => {
    assert.equal(
      decideCertHygiene(
        facts({
          accountDeletedAt: new Date('2026-09-01'),
          stripeConnectAccountId: 'acct_present',
        }),
      ),
      'RETAIN_FINANCIAL',
    );
  });

  it('retains a certification account with a cross-account financial relation', () => {
    assert.equal(
      decideCertHygiene(facts({ crossAccountFinancial: true })),
      'RETAIN_FINANCIAL',
    );
  });

  it('leaves an already-correct tombstone unchanged', () => {
    assert.equal(
      decideCertHygiene(
        facts({
          email: 'deleted+abc@accounts.homecheff.internal',
          username: 'deleted_abc',
          bio: null,
          accountDeletedAt: new Date('2026-09-01'),
        }),
      ),
      'NOOP_TOMBSTONE',
    );
  });

  it('never infers a gmail user is technical', () => {
    assert.equal(
      decideCertHygiene(
        facts({
          email: 'someone@gmail.com',
          username: 'someone',
          bio: 'test kitchen',
        }),
      ),
      'RETAIN_ORDINARY',
    );
  });
});
