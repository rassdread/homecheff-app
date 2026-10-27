import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCentralUserId } from '@/lib/hc/marketplace-hc-order-service';

test('central identity uses the database client passed by checkout', async () => {
  let calls = 0;
  const db = {
    authIdentityLink: {
      findFirst: async () => {
        calls += 1;
        return { centralUserId: 'central-1' };
      },
    },
  };
  const centralUserId = await resolveCentralUserId(
    'local-1',
    db as never,
  );
  assert.equal(calls, 1);
  assert.equal(centralUserId, 'central-1');
});

test('a missing identity link falls back to the local user on the same client', async () => {
  const db = {
    authIdentityLink: {
      findFirst: async () => null,
    },
  };
  assert.equal(await resolveCentralUserId('local-9', db as never), 'local-9');
});
