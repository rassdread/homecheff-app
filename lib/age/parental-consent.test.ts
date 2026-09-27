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
  PARENTAL_CONSENT_VERSION,
  parentalConsentAcceptedCopy,
  parentalConsentInviteCopy,
  revokeParentalConsent,
  validateGuardianConsentSubmission,
} from '@/lib/age/parental-consent';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/document-versions';

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

const submission = {
  guardianName: 'Ada Guardian',
  relationship: 'mother' as const,
  legalAuthorityDeclaration: true as const,
  informedConsent: true as const,
  guardianLanguage: 'nl' as const,
};

describe('parental consent lifecycle', () => {
  it('accepts once, records an audit row, and rejects reuse, expiry and unknown tokens', async () => {
    const db = memoryPrisma();
    const invite = await createParentalConsentInvite(db as never, {
      userId: 'minor-1',
      guardianEmail: 'parent@example.com',
      username: 'tuin',
    });
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-1'), false);
    const bad = await acceptParentalConsentToken(db as never, { token: 'nope', ...submission });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.reason, 'INVALID');

    const missing = await acceptParentalConsentToken(db as never, {
      token: invite.token,
      guardianName: 'Ada Guardian',
      relationship: 'mother',
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.reason, 'DECLARATION_REQUIRED');
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-1'), false);

    const accepted = await acceptParentalConsentToken(db as never, {
      token: invite.token,
      acceptedIp: '203.0.113.8',
      acceptedUserAgent: 'CertAgent',
      ...submission,
    });
    assert.equal(accepted.ok, true);
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-1'), true);
    const again = await acceptParentalConsentToken(db as never, { token: invite.token, ...submission });
    assert.equal(again.ok, false);
    if (!again.ok) assert.equal(again.reason, 'USED');

    const active = db.rows.find((row) => row.action === 'PARENTAL_CONSENT_ACTIVE');
    assert.ok(active);
    assert.equal(active.meta.guardianName, 'Ada Guardian');
    assert.equal(active.meta.guardianRelationship, 'mother');
    assert.equal(active.meta.legalAuthorityDeclaration, true);
    assert.equal(active.meta.consentVersion, PARENTAL_CONSENT_VERSION);
    assert.equal(active.meta.consentTextVersion, PARENTAL_CONSENT_VERSION);
    assert.equal(active.meta.termsVersion, TERMS_VERSION);
    assert.equal(active.meta.privacyVersion, PRIVACY_VERSION);
    assert.equal(JSON.stringify(active.meta).includes(invite.token), false);

    const publicStatus = await getParentalConsentPublic(db as never, 'minor-1');
    assert.equal(publicStatus.status, 'ACTIVE');
    const pub = JSON.stringify(publicStatus);
    assert.equal(pub.includes('parent@example.com'), false);
    assert.equal(pub.includes('203.0.113.8'), false);
    assert.equal(pub.includes('Ada Guardian'), false);
    assert.equal(pub.includes('CertAgent'), false);

    const expiredDb = memoryPrisma();
    const expiredInvite = await createParentalConsentInvite(expiredDb as never, {
      userId: 'minor-2',
      guardianEmail: 'parent@example.com',
    });
    const pending = expiredDb.rows.find((row) => row.action === 'PARENTAL_CONSENT_PENDING');
    assert.ok(pending);
    pending.meta.expiresAt = new Date(Date.now() - 1000).toISOString();
    const expired = await acceptParentalConsentToken(expiredDb as never, {
      token: expiredInvite.token,
      ...submission,
    });
    assert.equal(expired.ok, false);
    if (!expired.ok) assert.equal(expired.reason, 'EXPIRED');
  });

  it('does not let one minor token approve another, and a new invite does not drop active consent', async () => {
    const db = memoryPrisma();
    const a = await createParentalConsentInvite(db as never, {
      userId: 'minor-a',
      guardianEmail: 'a@example.com',
    });
    const b = await createParentalConsentInvite(db as never, {
      userId: 'minor-b',
      guardianEmail: 'b@example.com',
    });
    const accepted = await acceptParentalConsentToken(db as never, { token: a.token, ...submission });
    assert.equal(accepted.ok, true);
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-a'), true);
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-b'), false);
    await createParentalConsentInvite(db as never, {
      userId: 'minor-a',
      guardianEmail: 'a@example.com',
    });
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-a'), true);
    const other = await acceptParentalConsentToken(db as never, { token: b.token, ...submission });
    assert.equal(other.ok, true);
    if (other.ok && accepted.ok) assert.notEqual(other.userId, 'minor-a');
  });

  it('requires a fresh consent when the consent version changes', async () => {
    const db = memoryPrisma();
    const invite = await createParentalConsentInvite(db as never, {
      userId: 'minor-v',
      guardianEmail: 'parent@example.com',
    });
    await acceptParentalConsentToken(db as never, { token: invite.token, ...submission });
    const active = db.rows.find((row) => row.action === 'PARENTAL_CONSENT_ACTIVE');
    assert.ok(active);
    active.meta.consentVersion = 'nl-minor-seller-2026-09-27';
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-v'), false);
    assert.equal((await getParentalConsentPublic(db as never, 'minor-v')).status, 'RENEWAL_REQUIRED');
    assert.ok(db.rows.some((row) => row.action === 'PARENTAL_CONSENT_ACTIVE'));
  });

  it('rejects a pre-checked string and an other relationship without authority', () => {
    assert.equal(
      validateGuardianConsentSubmission({ ...submission, legalAuthorityDeclaration: 'true' }).ok,
      false,
    );
    assert.equal(validateGuardianConsentSubmission({ ...submission, guardianName: 'Ada' }).ok, false);
    const other = validateGuardianConsentSubmission({
      ...submission,
      relationship: 'other',
      otherAuthority: 'short',
    });
    assert.equal(other.ok, false);
    if (!other.ok) assert.equal(other.reason, 'OTHER_AUTHORITY_REQUIRED');
  });

  it('revokes consent without deleting the earlier audit row or orders', async () => {
    const db = memoryPrisma();
    const invite = await createParentalConsentInvite(db as never, {
      userId: 'minor-3',
      guardianEmail: 'parent@example.com',
    });
    const accepted = await acceptParentalConsentToken(db as never, { token: invite.token, ...submission });
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

    const again = await createParentalConsentInvite(db as never, {
      userId: 'minor-3',
      guardianEmail: 'parent@example.com',
    });
    const renewed = await acceptParentalConsentToken(db as never, { token: again.token, ...submission });
    assert.equal(renewed.ok, true);
    if (!renewed.ok) return;
    const oldToken = await revokeParentalConsent({
      prisma: db as never,
      revokeToken: accepted.revokeToken,
    });
    assert.equal(oldToken.ok, false);
    assert.equal(await hasActiveParentalConsent(db as never, 'minor-3'), true);

    const source = fs.readFileSync(path.join(process.cwd(), 'lib/age/parental-consent.ts'), 'utf8');
    const route = fs.readFileSync(path.join(process.cwd(), 'app/api/account/parental-consent/route.ts'), 'utf8');
    const page = fs.readFileSync(path.join(process.cwd(), 'app/account/ouderlijke-toestemming/page.tsx'), 'utf8');
    assert.equal(source.includes('order.delete'), false);
    assert.equal(source.includes('persons.create'), false);
    assert.equal(source.includes('legal_guardian'), false);
    assert.equal(route.includes('preferredLanguage'), false);
    assert.equal(page.includes('defaultChecked'), false);
    assert.equal(page.includes('useTranslation'), false);
    assert.match(page, /legalAuthorityDeclaration: authority/);
    assert.match(page, /useState\(false\)/);
  });

  it('sends one bilingual invite and keeps a later explicit language', () => {
    const link = 'https://homecheff.eu/account/ouderlijke-toestemming?token=abc';
    const invite = parentalConsentInviteCopy({ username: 'tuin', link });
    assert.equal(invite.subject, 'Toestemming voor HomeCheff / Consent for HomeCheff');
    assert.match(invite.text, /Nederlands/);
    assert.match(invite.text, /English/);
    assert.match(invite.text, /homecheff\.eu\/account\/ouderlijke-toestemming\?token=abc/);
    assert.equal(invite.text.includes('parent@'), false);
    assert.equal(invite.text.includes('geboorte'), false);
    assert.equal(invite.html.includes('guaranteed'), false);
    const nl = parentalConsentAcceptedCopy({
      language: 'nl',
      username: 'tuin',
      revokeLink: 'https://homecheff.eu/account/ouderlijke-toestemming?revoke=xyz',
    });
    const en = parentalConsentAcceptedCopy({
      language: 'en',
      username: 'tuin',
      revokeLink: 'https://homecheff.eu/account/ouderlijke-toestemming?revoke=xyz',
    });
    const both = parentalConsentAcceptedCopy({
      language: 'both',
      username: 'tuin',
      revokeLink: 'https://homecheff.eu/account/ouderlijke-toestemming?revoke=xyz',
    });
    assert.match(nl.text, /Bestaande bestellingen blijven staan/);
    assert.equal(nl.text.includes('Existing orders'), false);
    assert.match(en.text, /Existing orders stay in place/);
    assert.equal(en.text.includes('Bestaande bestellingen'), false);
    assert.match(both.text, /Nederlands/);
    assert.match(both.text, /English/);
    assert.match(nl.text, /revoke=xyz/);
  });
});
