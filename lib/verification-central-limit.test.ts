import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertCentralAttempts,
  beginCentralResend,
  clearCentralEmail,
  endCentralResend,
  markCentralResendSent,
  recordCentralFailure,
  type LimitToken,
  type LimitTokenStore,
} from './verification-central-limit';

function memoryTokens(): LimitTokenStore {
  const rows: LimitToken[] = [];
  return {
    async countUnexpired(identifier, now) {
      return rows.filter((row) => row.identifier === identifier && row.expires > now).length;
    },
    async oldestExpiry(identifier, now) {
      const open = rows
        .filter((row) => row.identifier === identifier && row.expires > now)
        .sort((a, b) => a.expires.getTime() - b.expires.getTime());
      return open[0]?.expires ?? null;
    },
    async insert(row) {
      if (rows.some((existing) => existing.token === row.token)) return 'duplicate';
      rows.push(row);
      return 'ok';
    },
    async deleteExpired(identifier, now) {
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        if (rows[i].identifier === identifier && rows[i].expires < now) rows.splice(i, 1);
      }
    },
    async deleteIdentifier(identifier) {
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        if (rows[i].identifier === identifier) rows.splice(i, 1);
      }
    },
    async findByToken(token) {
      return rows.find((row) => row.token === token) ?? null;
    },
    async deleteToken(token) {
      const index = rows.findIndex((row) => row.token === token);
      if (index >= 0) rows.splice(index, 1);
    },
    async upsert(row) {
      const index = rows.findIndex((existing) => existing.token === row.token);
      if (index >= 0) rows[index] = row;
      else rows.push(row);
    },
  };
}

describe('VERIFICATION_CENTRAL_ATTEMPT_LIMIT', () => {
  it('blocks the ninth guess for one address and leaves another address open', async () => {
    const store = memoryTokens();
    const now = Date.now();
    for (let i = 0; i < 8; i += 1) {
      await recordCentralFailure(store, { email: 'a@example.com', ip: `203.0.113.${i}` }, now);
    }
    const blocked = await assertCentralAttempts(store, { email: 'a@example.com' }, now + 1000);
    assert.equal(blocked.ok, false);
    const other = await assertCentralAttempts(store, { email: 'b@example.com' }, now + 1000);
    assert.equal(other.ok, true);
    await clearCentralEmail(store, 'a@example.com');
    const cleared = await assertCentralAttempts(store, { email: 'a@example.com' }, now + 1000);
    assert.equal(cleared.ok, true);
  });

  it('ignores failures that are already outside the window', async () => {
    const store = memoryTokens();
    const now = Date.now();
    for (let i = 0; i < 8; i += 1) {
      await recordCentralFailure(store, { email: 'a@example.com' }, now);
    }
    const later = now + 16 * 60 * 1000;
    const open = await assertCentralAttempts(store, { email: 'a@example.com' }, later);
    assert.equal(open.ok, true);
  });
});

describe('VERIFICATION_CENTRAL_RESEND_LOCK', () => {
  it('allows one in-flight send and keeps the cooldown after it succeeds', async () => {
    const store = memoryTokens();
    const now = Date.now();
    const first = await beginCentralResend(store, 'a@example.com', now);
    const second = await beginCentralResend(store, 'a@example.com', now + 10);
    assert.equal(first.ok, true);
    assert.equal(second.ok, false);
    await endCentralResend(store, 'a@example.com');
    await markCentralResendSent(store, 'a@example.com', now + 20);
    const duringCooldown = await beginCentralResend(store, 'a@example.com', now + 30_000);
    assert.equal(duringCooldown.ok, false);
    const afterCooldown = await beginCentralResend(store, 'a@example.com', now + 61_000);
    assert.equal(afterCooldown.ok, true);
  });

  it('releases a lock when the send fails so the previous code can still be used', async () => {
    const store = memoryTokens();
    const now = Date.now();
    assert.equal((await beginCentralResend(store, 'a@example.com', now)).ok, true);
    await endCentralResend(store, 'a@example.com');
    const again = await beginCentralResend(store, 'a@example.com', now + 1000);
    assert.equal(again.ok, true);
  });
});
