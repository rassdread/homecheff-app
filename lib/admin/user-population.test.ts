import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ADMIN_USER_LIST_VIEWS,
  classifyUserPopulation,
  DEFAULT_ADMIN_USER_LIST_VIEW,
  emptyRetentionDeps,
  hardDeleteIsObjectivelySafe,
  isAnonymizedUser,
  isDemonstrableTestUser,
  isMetaUtmSource,
  readAcquisitionTouch,
  registrationOrigin,
  retentionBlocksHardDelete,
  userPopulationWhere,
  realUserWhere,
  demonstrableTestUserWhere,
  anonymizedUserWhere,
} from './user-population';

describe('user population partition', () => {
  it('treats tombstone email and deletedAt as anonymized, not as a test account', () => {
    const tombstone = {
      email: 'deleted+abc@accounts.homecheff.internal',
      username: 'deleted_abc',
      accountDeletedAt: null,
    };
    assert.equal(isAnonymizedUser(tombstone), true);
    assert.equal(isDemonstrableTestUser(tombstone), false);
    assert.equal(classifyUserPopulation(tombstone), 'deleted');
    assert.equal(
      classifyUserPopulation({
        email: 'jan@example.nl',
        accountDeletedAt: '2026-01-01T00:00:00.000Z',
      }),
      'deleted',
    );
  });

  it('does not treat unverified or inactive people as test accounts', () => {
    assert.equal(
      classifyUserPopulation({
        email: 'jan@gmail.com',
        username: 'jan',
        accountDeletedAt: null,
      }),
      'real',
    );
  });

  it('recognises disposable certification identities and keep-fixtures as test', () => {
    assert.equal(
      classifyUserPopulation({
        email: 'run@homecheff-validation.test',
        username: 'run1',
      }),
      'test',
    );
    assert.equal(
      classifyUserPopulation({
        email: 'mediacert+homecheff@example.com',
        username: 'mediacerthc',
      }),
      'test',
    );
    assert.equal(
      classifyUserPopulation({
        email: 'someone@homecheff.eu',
        bio: 'certificationFixture=true;internalTest=true',
      }),
      'test',
    );
  });

  it('keeps a homecheff.eu address real when it has no fixture marker', () => {
    assert.equal(
      classifyUserPopulation({
        email: 'founder@homecheff.eu',
        username: 'founder',
      }),
      'real',
    );
    assert.equal(classifyUserPopulation({ email: 'jan@gmail.com', username: 'jan' }), 'real');
  });

  it('treats reserved certification domains as test accounts', () => {
    assert.equal(
      classifyUserPopulation({ email: 'run@homecheff-cert.invalid', username: 'run' }),
      'test',
    );
    assert.equal(
      classifyUserPopulation({ email: 'ops@homecheff.internal', username: 'ops' }),
      'test',
    );
  });
});

describe('admin user list views', () => {
  it('defaults to real accounts and exposes the four display filters', () => {
    assert.equal(DEFAULT_ADMIN_USER_LIST_VIEW, 'real');
    assert.deepEqual([...ADMIN_USER_LIST_VIEWS], ['real', 'test', 'deleted', 'all']);
    assert.deepEqual(userPopulationWhere('real'), realUserWhere());
    assert.deepEqual(userPopulationWhere('test'), demonstrableTestUserWhere());
    assert.deepEqual(userPopulationWhere('deleted'), anonymizedUserWhere());
    assert.deepEqual(userPopulationWhere('all'), {});
  });
});

describe('registration origin', () => {
  it('counts a stored Meta UTM once, ahead of an affiliate attribution', () => {
    assert.equal(isMetaUtmSource('Meta'), true);
    assert.equal(isMetaUtmSource('newsletter'), false);
    assert.equal(
      registrationOrigin({
        acquisitionFirstTouch: {
          utm_source: 'meta',
          utm_medium: 'paid',
          utm_campaign: 'sellers',
          captured_at: '2026-01-01T00:00:00.000Z',
        },
        hasAffiliateAttribution: true,
      }),
      'meta',
    );
  });

  it('does not invent Meta or organic when nothing was stored', () => {
    assert.equal(readAcquisitionTouch(null), null);
    assert.equal(readAcquisitionTouch({ captured_at: 'x' }), null);
    assert.equal(
      registrationOrigin({ acquisitionFirstTouch: null, hasAffiliateAttribution: false }),
      'unknown',
    );
    assert.equal(
      registrationOrigin({ acquisitionFirstTouch: null, hasAffiliateAttribution: true }),
      'affiliate',
    );
  });

  it('keeps a recorded non-meta paid source out of organic', () => {
    assert.equal(
      registrationOrigin({
        acquisitionFirstTouch: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'search' },
        hasAffiliateAttribution: false,
      }),
      'recorded_other',
    );
    assert.equal(
      registrationOrigin({
        acquisitionFirstTouch: { utm_source: 'google', utm_medium: 'organic' },
        hasAffiliateAttribution: false,
      }),
      'organic',
    );
  });
});

describe('hard-delete safety', () => {
  it('blocks real users, keep-fixtures, admins, and any financial residue', () => {
    const empty = emptyRetentionDeps();
    assert.equal(
      hardDeleteIsObjectivelySafe({
        population: 'real',
        role: 'USER',
        keepFixture: false,
        deps: empty,
      }),
      false,
    );
    assert.equal(
      hardDeleteIsObjectivelySafe({
        population: 'test',
        role: 'USER',
        keepFixture: true,
        deps: empty,
      }),
      false,
    );
    assert.equal(
      hardDeleteIsObjectivelySafe({
        population: 'deleted',
        role: 'ADMIN',
        keepFixture: false,
        deps: empty,
      }),
      false,
    );
    const withOrder = { ...empty, ordersBuyer: 1 };
    assert.equal(retentionBlocksHardDelete(withOrder), true);
    assert.equal(
      hardDeleteIsObjectivelySafe({
        population: 'deleted',
        role: 'USER',
        keepFixture: false,
        deps: withOrder,
      }),
      false,
    );
  });

  it('allows an empty disposable test row with no retained records', () => {
    assert.equal(
      hardDeleteIsObjectivelySafe({
        population: 'test',
        role: 'USER',
        keepFixture: false,
        deps: emptyRetentionDeps(),
      }),
      true,
    );
  });
});
