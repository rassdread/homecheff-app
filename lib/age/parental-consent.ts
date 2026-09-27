/**
 * HomeCheff parental / legal-representative consent.
 *
 * This is not Stripe legal_guardian KYC. Nothing in this module creates a
 * Stripe Person or sends a guardian to Stripe.
 *
 * Records are append-only AuditLog rows so production does not need a new
 * table. Guardian email and IP stay in the audit meta and are not returned
 * on public APIs.
 */

import { createHash, randomBytes } from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/document-versions';

export const PARENTAL_CONSENT_VERSION = 'nl-minor-seller-2026-09-27';
export const PARENTAL_CONSENT_METHOD = 'EMAIL_LINK';
export const PARENTAL_CONSENT_SOURCE = 'homecheff_parental_consent';

export const PARENTAL_CONSENT_PENDING = 'PARENTAL_CONSENT_PENDING';
export const PARENTAL_CONSENT_ACTIVE = 'PARENTAL_CONSENT_ACTIVE';
export const PARENTAL_CONSENT_REVOKED = 'PARENTAL_CONSENT_REVOKED';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AuditClient = Pick<PrismaClient, 'auditLog'>;

export type ParentalConsentStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'REVOKED';

export type ParentalConsentPublic = {
  status: ParentalConsentStatus;
  consentVersion: string | null;
  termsVersion: string | null;
  privacyVersion: string | null;
  method: string | null;
  source: string | null;
  consentedAt: string | null;
  revokedAt: string | null;
};

type ConsentMeta = {
  status?: string;
  consentVersion?: string;
  termsVersion?: string;
  privacyVersion?: string;
  method?: string;
  source?: string;
  guardianEmail?: string;
  tokenHash?: string;
  revokeTokenHash?: string;
  expiresAt?: string;
  usedAt?: string | null;
  consentedAt?: string | null;
  revokedAt?: string | null;
  acceptedIp?: string | null;
  username?: string | null;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function asMeta(value: unknown): ConsentMeta {
  if (!value || typeof value !== 'object') return {};
  return value as ConsentMeta;
}

export function emptyParentalConsentPublic(): ParentalConsentPublic {
  return {
    status: 'NONE',
    consentVersion: null,
    termsVersion: null,
    privacyVersion: null,
    method: null,
    source: null,
    consentedAt: null,
    revokedAt: null,
  };
}

export function toPublicConsent(meta: ConsentMeta, action: string): ParentalConsentPublic {
  const status: ParentalConsentStatus =
    action === PARENTAL_CONSENT_ACTIVE
      ? 'ACTIVE'
      : action === PARENTAL_CONSENT_REVOKED
        ? 'REVOKED'
        : action === PARENTAL_CONSENT_PENDING
          ? 'PENDING'
          : 'NONE';
  return {
    status,
    consentVersion: meta.consentVersion ?? null,
    termsVersion: meta.termsVersion ?? null,
    privacyVersion: meta.privacyVersion ?? null,
    method: meta.method ?? null,
    source: meta.source ?? null,
    consentedAt: meta.consentedAt ?? null,
    revokedAt: meta.revokedAt ?? null,
  };
}

export async function getLatestParentalConsent(
  prisma: AuditClient,
  userId: string,
): Promise<{ action: string; meta: ConsentMeta; id: string } | null> {
  const row = await prisma.auditLog.findFirst({
    where: {
      userId,
      action: {
        in: [
          PARENTAL_CONSENT_PENDING,
          PARENTAL_CONSENT_ACTIVE,
          PARENTAL_CONSENT_REVOKED,
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, action: true, meta: true },
  });
  if (!row) return null;
  return { id: row.id, action: row.action, meta: asMeta(row.meta) };
}

export async function getParentalConsentPublic(
  prisma: AuditClient,
  userId: string,
): Promise<ParentalConsentPublic> {
  const latest = await getLatestParentalConsent(prisma, userId);
  if (!latest) return emptyParentalConsentPublic();
  return toPublicConsent(latest.meta, latest.action);
}

export async function hasActiveParentalConsent(
  prisma: AuditClient,
  userId: string,
): Promise<boolean> {
  const latest = await getLatestParentalConsent(prisma, userId);
  return latest?.action === PARENTAL_CONSENT_ACTIVE;
}

export async function createParentalConsentInvite(
  prisma: AuditClient,
  params: {
    userId: string;
    guardianEmail: string;
    username?: string | null;
  },
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const { randomUUID } = await import('crypto');
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId: params.userId,
      action: PARENTAL_CONSENT_PENDING,
      meta: {
        status: 'PENDING',
        consentVersion: PARENTAL_CONSENT_VERSION,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        method: PARENTAL_CONSENT_METHOD,
        source: PARENTAL_CONSENT_SOURCE,
        guardianEmail: params.guardianEmail.trim().toLowerCase(),
        tokenHash: hashToken(token),
        expiresAt: expiresAt.toISOString(),
        usedAt: null,
        username: params.username ?? null,
      },
    },
  });
  return { token, expiresAt };
}

export async function acceptParentalConsentToken(
  prisma: AuditClient,
  params: { token: string; acceptedIp?: string | null },
): Promise<
  | { ok: true; userId: string; revokeToken: string }
  | { ok: false; reason: 'INVALID' | 'EXPIRED' | 'USED' }
> {
  const tokenHash = hashToken(params.token);
  const pending = await prisma.auditLog.findFirst({
    where: {
      action: PARENTAL_CONSENT_PENDING,
      meta: { path: ['tokenHash'], equals: tokenHash },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!pending?.userId) return { ok: false, reason: 'INVALID' };
  const meta = asMeta(pending.meta);
  if (meta.usedAt) return { ok: false, reason: 'USED' };
  if (meta.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: 'EXPIRED' };
  }

  const latest = await getLatestParentalConsent(prisma, pending.userId);
  if (latest && latest.action === PARENTAL_CONSENT_REVOKED && latest.id !== pending.id) {
    const revokedAt = latest.meta.revokedAt ? new Date(latest.meta.revokedAt).getTime() : 0;
    const pendingAt = pending.createdAt.getTime();
    if (revokedAt > pendingAt) return { ok: false, reason: 'INVALID' };
  }

  const revokeToken = randomBytes(32).toString('hex');
  const consentedAt = new Date().toISOString();
  const { randomUUID } = await import('crypto');
  await prisma.auditLog.update({
    where: { id: pending.id },
    data: {
      meta: {
        ...meta,
        usedAt: consentedAt,
      },
    },
  });
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId: pending.userId,
      action: PARENTAL_CONSENT_ACTIVE,
      meta: {
        status: 'ACTIVE',
        consentVersion: meta.consentVersion ?? PARENTAL_CONSENT_VERSION,
        termsVersion: meta.termsVersion ?? TERMS_VERSION,
        privacyVersion: meta.privacyVersion ?? PRIVACY_VERSION,
        method: PARENTAL_CONSENT_METHOD,
        source: PARENTAL_CONSENT_SOURCE,
        guardianEmail: meta.guardianEmail ?? null,
        consentedAt,
        revokedAt: null,
        acceptedIp: params.acceptedIp ?? null,
        revokeTokenHash: hashToken(revokeToken),
        username: meta.username ?? null,
      },
    },
  });
  return { ok: true, userId: pending.userId, revokeToken };
}

export async function revokeParentalConsent(params: {
  prisma: AuditClient;
  userId?: string | null;
  revokeToken?: string | null;
}): Promise<{ ok: true; userId: string } | { ok: false; reason: 'NOT_FOUND' }> {
  let userId = params.userId ?? null;
  if (!userId && params.revokeToken) {
    const tokenHash = hashToken(params.revokeToken);
    const active = await params.prisma.auditLog.findFirst({
      where: {
        action: PARENTAL_CONSENT_ACTIVE,
        meta: { path: ['revokeTokenHash'], equals: tokenHash },
      },
      orderBy: { createdAt: 'desc' },
    });
    userId = active?.userId ?? null;
  }
  if (!userId) return { ok: false, reason: 'NOT_FOUND' };
  const latest = await getLatestParentalConsent(params.prisma, userId);
  if (!latest || latest.action !== PARENTAL_CONSENT_ACTIVE) {
    return { ok: false, reason: 'NOT_FOUND' };
  }
  const { randomUUID } = await import('crypto');
  const revokedAt = new Date().toISOString();
  await params.prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId,
      action: PARENTAL_CONSENT_REVOKED,
      meta: {
        ...latest.meta,
        status: 'REVOKED',
        revokedAt,
        guardianEmail: latest.meta.guardianEmail ?? null,
      },
    },
  });
  return { ok: true, userId };
}
