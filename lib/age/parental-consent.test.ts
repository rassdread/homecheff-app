/**
 * HomeCheff parental consent lifecycle. Not Stripe legal_guardian.
 * Run: npx tsx --test lib/age/parental-consent.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  acceptParentalConsentToken,
  createParentalConsentInvite,
  getParentalConsentPublic,
  hasActiveParentalConsent,
  parentalConsentAcceptedCopy,
  parentalConsentInviteCopy,
  revokeParentalConsent,
} from '@/lib/age/parental-consent';

type Row = {
  id: string;
  userId: string | null;
  action: string;
  meta: Record<string, unknown>;
  createdAt: Date;
};

function memoryPrisma() {
  const rows: Row[] = [];
  let n = 0;
  const matches = (row: Row, where: Record<string, unknown> | undefined): boolean => {
    if (!where) return true;
    if (typeof where.userId === 'string' && row.userId !== where.userId) return false;
    if (typeof where.action === 'string' && row.action !== where.action) return false;
    if (where.action && typeof where.action === 'object' && 'in' in where.action) {
      const list = (where.action as { in: string[] }).in;
      if (!list.includes(row.action)) return false;
    }
    const metaFilter = where.meta as { path?: string[]; equals?: string } | undefined;
    if (metaFilter?.path && metaFilter.equals != null) {
      const key = metaFilter.path[0];
      if (row.meta[key] !== metaFilter.equals) return false;
    }
    return true;
  };
  return {
    rows,
    auditLog: {
      async create({ data }: { data: { id: string; userId: string; action: string; meta: Record<string, unknown> } }) {
        rows.push({
          id: data.id,
          userId: data.userId,
          action: data.action,
          meta: { ...data.meta },
          createdAt: new Date(Date.now() + n++),
        });
        return rows[rows.length - 1];
      },
      async update({ where, data }: { where: { id: string }; data: { meta: Record<string, unknown> } }) {
        const row = rows.find((item) => item.id === where.id);
        if (!row) throw new Error('missing');
        row.meta = { ...data.meta };
        return row;
      },
      async findFirst({
        where,
        orderBy,
      }: {
        where?: Record<string, unknown>;
        orderBy?: { createdAt: 'desc' };
      }) {
        const found = rows.filter((row) => matches(row, where));
        if (orderBy?.createdAt === 'desc') {
          found.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return found[0] ?? null;
      },
    },
  };
}

describe('parental consent lifecycle', () => {
  it('accepts once, records an audit row, and rejects reuse, expiry and unknown tokens', async () => {
    const db = memoryPrisma();
    const invite = await createParentalConsentInvite(db as never, {
      userId: 'minor-1',
      guardianEmail: 'parent@example.com',
      username: 'tuin',
    });
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-1'), false);
    const bad = await acceptParentalConsentToken(db as never, { token: 'nope' });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.reason, 'INVALID');

    const accepted = await acceptParentalConsentToken(db as never, {
      token: invite.token,
      acceptedIp: '203.0.113.8',
    });
    assert.equal(accepted.ok, true);
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-1'), true);
    const again = await acceptParentalConsentToken(db as never, { token: invite.token });
    assert.equal(again.ok, false);
    if (!again.ok) assert.equal(again.reason, 'USED');

    const publicStatus = await getParentalConsentPublic(db as never, 'minor-1');
    assert.equal(publicStatus.status, 'ACTIVE');
    assert.equal(JSON.stringify(publicStatus).includes('parent@example.com'), false);
    assert.equal(JSON.stringify(publicStatus).includes('203.0.113.8'), false);

    const expiredDb = memoryPrisma();
    const expiredInvite = await createParentalConsentInvite(expiredDb as never, {
      userId: 'minor-2',
      guardianEmail: 'parent@example.com',
    });
    const pending = expiredDb.rows.find((row) => row.action === 'PARENTAL_CONSENT_PENDING');
    assert.ok(pending);
    pending.meta.expiresAt = new Date(Date.now() - 1000).toISOString();
    const expired = await acceptParentalConsentToken(expiredDb as never, { token: expiredInvite.token });
    assert.equal(expired.ok, false);
    if (!expired.ok) assert.equal(expired.reason, 'EXPIRED');
  });

  it('revokes consent without deleting the earlier audit row or orders', async () => {
    const db = memoryPrisma();
    const invite = await createParentalConsentInvite(db as never, {
      userId: 'minor-3',
      guardianEmail: 'parent@example.com',
    });
    const accepted = await acceptParentalConsentToken(db as never, { token: invite.token });
    assert.equal(accepted.ok, true);
    if (!accepted.ok) return;
    const before = db.rows.length;
    const revoked = await revokeParentalConsent({
      prisma: db as never,
      revokeToken: accepted.revokeToken,
    });
    assert.equal(revoked.ok, true);
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-3'), false);
    assert.ok(db.rows.length > before);
    assert.ok(db.rows.some((row) => row.action === 'PARENTAL_CONSENT_ACTIVE'));
    assert.equal((await getParentalConsentPublic(db as never, 'minor-3')).status, 'REVOKED');
    const reused = await revokeParentalConsent({
      prisma: db as never,
      revokeToken: accepted.revokeToken,
    });
    assert.equal(reused.ok, false);

    const source = fs.readFileSync(path.join(process.cwd(), 'lib/age/parental-consent.ts'), 'utf8');
    assert.equal(source.includes('order.delete'), false);
    assert.equal(source.includes('persons.create'), false);
    assert.equal(source.includes('legal_guardian'), false);
  });

  it('builds NL and EN mail on the public host without the guardian address in the body', () => {
    const link = 'https://homecheff.eu/account/ouderlijke-toestemming?token=abc';
    const nl = parentalConsentInviteCopy({ en: false, username: 'tuin', link });
    const en = parentalConsentInviteCopy({ en: true, username: 'tuin', link });
    assert.match(nl.subject, /Toestemming/);
    assert.match(nl.text, /homecheff\.eu\/account\/ouderlijke-toestemming\?token=abc/);
    assert.match(en.subject, /Permission/);
    assert.equal(nl.text.includes('parent@'), false);
    assert.equal(en.html.includes('parent@'), false);
    const accepted = parentalConsentAcceptedCopy({
      en: false,
      username: 'tuin',
      revokeLink: 'https://homecheff.eu/account/ouderlijke-toestemming?revoke=xyz',
    });
    assert.match(accepted.text, /Bestaande bestellingen blijven staan/);
    assert.match(accepted.text, /revoke=xyz/);
  });
});
