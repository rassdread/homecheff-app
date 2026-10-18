import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  correctCanonicalDateOfBirth,
  foreignDateOfBirthTarget,
  persistCanonicalDateOfBirth,
} from './date-of-birth';

type StoredUser = {
  id: string;
  dateOfBirth: Date | null;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
};

function harness(user: StoredUser) {
  const audits: Array<{ action: string; meta: Record<string, unknown> }> = [];
  const updates: Array<Record<string, unknown>> = [];
  const prisma = {
    user: {
      findUnique: async (): Promise<StoredUser | null> => user,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        user.dateOfBirth = data.dateOfBirth as Date;
        return user;
      },
    },
    deliveryProfile: {
      updateMany: async () => ({ count: 1 }),
    },
    auditLog: {
      create: async ({ data }: { data: { action: string; meta: Record<string, unknown> } }) => {
        audits.push({ action: data.action, meta: data.meta });
        return data;
      },
    },
  };
  return { prisma, audits, updates, user };
}

describe('date of birth correction', () => {
  it('rejects another user, a logged-out target, an invalid date, a future date and an unrealistic date', async () => {
    assert.equal(foreignDateOfBirthTarget('owner', 'someone-else'), true);
    assert.equal(foreignDateOfBirthTarget('owner', 'owner'), false);
    assert.equal(foreignDateOfBirthTarget('owner', ''), false);

    const { prisma } = harness({
      id: 'owner',
      dateOfBirth: new Date('1990-01-01T12:00:00.000Z'),
      stripeConnectAccountId: null,
      stripeConnectOnboardingCompleted: false,
    });

    const missing = await correctCanonicalDateOfBirth(prisma as never, {
      userId: 'missing',
      raw: '',
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.code, 'MISSING_DOB');

    const invalid = await correctCanonicalDateOfBirth(prisma as never, {
      userId: 'owner',
      raw: '2024-02-31',
    });
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.code, 'INVALID_DOB');

    const future = await correctCanonicalDateOfBirth(prisma as never, {
      userId: 'owner',
      raw: '2099-01-01',
    });
    assert.equal(future.ok, false);
    if (!future.ok) assert.equal(future.code, 'INVALID_DOB');

    const unrealistic = await correctCanonicalDateOfBirth(prisma as never, {
      userId: 'owner',
      raw: '1900-01-01',
    });
    assert.equal(unrealistic.ok, false);
    if (!unrealistic.ok) assert.equal(unrealistic.code, 'UNREALISTIC_DOB');
  });

  it('rejects an under-13 date and keeps the first-write lock on POST', async () => {
    const stored = harness({
      id: 'owner',
      dateOfBirth: new Date('2000-01-01T12:00:00.000Z'),
      stripeConnectAccountId: null,
      stripeConnectOnboardingCompleted: false,
    });
    const under = await correctCanonicalDateOfBirth(stored.prisma as never, {
      userId: 'owner',
      raw: '2020-01-01',
    });
    assert.equal(under.ok, false);
    if (!under.ok) assert.equal(under.code, 'UNDER_13');
    assert.equal(stored.updates.length, 0);

    const locked = await persistCanonicalDateOfBirth(stored.prisma as never, {
      userId: 'owner',
      raw: '1992-04-04',
      onLocked: 'error',
    });
    assert.equal(locked.ok, false);
    if (!locked.ok) assert.equal(locked.code, 'DOB_LOCKED');
  });

  it('saves an adult correction and a minor correction without touching Stripe', async () => {
    const stored = harness({
      id: 'owner',
      dateOfBirth: new Date('2010-01-01T12:00:00.000Z'),
      stripeConnectAccountId: 'acct_test_isolated',
      stripeConnectOnboardingCompleted: true,
    });

    const adult = await correctCanonicalDateOfBirth(stored.prisma as never, {
      userId: 'owner',
      raw: '1990-06-15',
    });
    assert.equal(adult.ok, true);
    if (adult.ok) {
      assert.equal(adult.wrote, true);
      assert.equal(adult.ageBand, 'AGE_18_PLUS');
      assert.equal(adult.previousAgeBand, 'AGE_16_17');
      assert.equal(adult.ageBandChanged, true);
      assert.equal(adult.stripeIdentityPreserved, true);
      assert.equal(adult.dateOfBirthIso, '1990-06-15');
    }
    assert.deepEqual(Object.keys(stored.updates[0] || {}).sort(), ['dateOfBirth']);
    assert.equal(stored.user.stripeConnectOnboardingCompleted, true);
    assert.equal(stored.audits.length, 1);
    assert.equal(stored.audits[0]?.action, 'DATE_OF_BIRTH_CORRECTED');
    const meta = JSON.stringify(stored.audits[0]?.meta);
    assert.equal(meta.includes('1990'), false);
    assert.equal(meta.includes('2010'), false);

    const minor = await correctCanonicalDateOfBirth(stored.prisma as never, {
      userId: 'owner',
      raw: '2010-03-03',
    });
    assert.equal(minor.ok, true);
    if (minor.ok) {
      assert.equal(minor.ageBand, 'AGE_16_17');
      assert.equal(minor.ageBandChanged, true);
      assert.equal(minor.stripeIdentityPreserved, true);
    }
    assert.equal(stored.user.stripeConnectAccountId, 'acct_test_isolated');
    assert.equal(stored.audits.length, 2);

    const same = await correctCanonicalDateOfBirth(stored.prisma as never, {
      userId: 'owner',
      raw: '2010-03-03',
    });
    assert.equal(same.ok, true);
    if (same.ok) assert.equal(same.wrote, false);
    assert.equal(stored.audits.length, 2);
  });

  it('returns not found for a missing account and does not invent a user', async () => {
    const stored = harness({
      id: 'owner',
      dateOfBirth: null,
      stripeConnectAccountId: null,
      stripeConnectOnboardingCompleted: false,
    });
    stored.prisma.user.findUnique = async () => null;
    const missing = await correctCanonicalDateOfBirth(stored.prisma as never, {
      userId: 'owner',
      raw: '1991-01-01',
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.code, 'USER_NOT_FOUND');
    assert.equal(stored.updates.length, 0);
  });
});
