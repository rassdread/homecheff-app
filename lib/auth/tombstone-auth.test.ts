import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isTombstonedAccount, passwordResetEligible } from '@/lib/auth/tombstone-auth';

describe('tombstone auth', () => {
  it('treats accountDeletedAt as tombstoned', () => {
    assert.equal(isTombstonedAccount({ accountDeletedAt: new Date() }), true);
    assert.equal(isTombstonedAccount({ accountDeletedAt: null }), false);
    assert.equal(isTombstonedAccount(null), false);
  });

  it('blocks password reset for tombstones even when a hash remains', () => {
    assert.equal(
      passwordResetEligible({
        passwordHash: 'hash',
        accountDeletedAt: new Date(),
      }),
      false,
    );
    assert.equal(
      passwordResetEligible({
        passwordHash: 'hash',
        accountDeletedAt: null,
      }),
      true,
    );
    assert.equal(
      passwordResetEligible({
        passwordHash: null,
        accountDeletedAt: null,
      }),
      false,
    );
  });
});
