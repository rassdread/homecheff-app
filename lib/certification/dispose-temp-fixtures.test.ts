import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

describe('disposeTempCertificationUsers source contract', () => {
  it('uses performUserAccountDeletion and never nulls Stripe Connect', () => {
    const src = readFileSync(
      new URL('./dispose-temp-fixtures.ts', import.meta.url),
      'utf8',
    );
    assert.match(src, /performUserAccountDeletion/);
    assert.doesNotMatch(src, /stripeConnectAccountId:\s*null/);
  });
});
