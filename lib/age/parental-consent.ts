/**
 * HomeCheff parental / legal-representative consent.
 *
 * This is not a Stripe identity check for a guardian. Nothing in this module
 * creates a Stripe Person or sends a guardian to Stripe.
 *
 * Records are append-only AuditLog rows so production does not need a new
 * table. Guardian name, email, relationship, IP and user-agent stay in the
 * audit meta and are not returned on public APIs.
 *
 * PARENTAL_CONSENT_VERSION is the consent-text version. Bump it only when
 * the substance of what the guardian authorises changes. A wording tweak
 * that does not change that substance must not bump it. An ACTIVE row whose
 * consentVersion differs is not active: the public status becomes
 * RENEWAL_REQUIRED and selling stays blocked until a new consent is accepted.
 * Historical rows are kept.
 *
 * Marketplace and seller participation use the HomeCheff Terms document.
 * There is no separate seller-terms version to store.
 */

import { createHash, randomBytes } from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/document-versions';
import {
  PARENTAL_CONSENT_TEXT_VERSION,
  PARENTAL_CONSENT_VERSION,
  type GuardianLanguage,
  type GuardianRelationship,
} from '@/lib/age/parental-consent-copy';

export {
  parentalConsentAcceptedCopy,
  parentalConsentInviteCopy,
  parentalConsentRevokedCopy,
  PARENTAL_CONSENT_SUBJECT,
  PARENTAL_CONSENT_VERSION,
  PARENTAL_CONSENT_TEXT_VERSION,
  LEGAL_AUTHORITY_DECLARATION_NL,
  LEGAL_AUTHORITY_DECLARATION_EN,
} from '@/lib/age/parental-consent-copy';

export type { GuardianRelationship, GuardianLanguage } from '@/lib/age/parental-consent-copy';
export const PARENTAL_CONSENT_METHOD = 'EMAIL_LINK';
export const PARENTAL_CONSENT_SOURCE = 'homecheff_parental_consent';

export const PARENTAL_CONSENT_PENDING = 'PARENTAL_CONSENT_PENDING';
export const PARENTAL_CONSENT_ACTIVE = 'PARENTAL_CONSENT_ACTIVE';
export const PARENTAL_CONSENT_REVOKED = 'PARENTAL_CONSENT_REVOKED';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AuditClient = Pick<PrismaClient, 'auditLog'>;

export type ParentalConsentStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'REVOKED' | 'RENEWAL_REQUIRED';

export type ParentalConsentPublic = {
  status: ParentalConsentStatus;
  consentVersion: string | null;
  consentTextVersion: string | null;
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
  consentTextVersion?: string;
  termsVersion?: string;
  privacyVersion?: string;
  method?: string;
  source?: string;
  guardianEmail?: string;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  otherAuthority?: string | null;
  legalAuthorityDeclaration?: boolean;
  informedConsent?: boolean;
  guardianLanguage?: GuardianLanguage | null;
  tokenHash?: string;
  revokeTokenHash?: string;
  inviteAuditId?: string;
  expiresAt?: string;
  usedAt?: string | null;
  consentedAt?: string | null;
  revokedAt?: string | null;
  acceptedIp?: string | null;
  acceptedUserAgent?: string | null;
  revokedIp?: string | null;
  revokedUserAgent?: string | null;
  username?: string | null;
};

export type ConsentTokenFailure = 'INVALID' | 'EXPIRED' | 'USED' | 'DECLARATION_REQUIRED' | 'NAME_REQUIRED' | 'RELATIONSHIP_REQUIRED' | 'OTHER_AUTHORITY_REQUIRED';

const NAME_PARTICLES = new Set([
  'de', 'den', 'der', 'van', 'von', 'da', 'di', 'le', 'la', 'het', 'ten', 'ter',
]);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function asMeta(value: unknown): ConsentMeta {
  if (!value || typeof value !== 'object') return {};
  return value as ConsentMeta;
}

function isCurrentConsent(meta: ConsentMeta): boolean {
  return (
    meta.consentVersion === PARENTAL_CONSENT_VERSION &&
    meta.legalAuthorityDeclaration === true &&
    meta.informedConsent === true
  );
}

export function emptyParentalConsentPublic(): ParentalConsentPublic {
  return {
    status: 'NONE',
    consentVersion: null,
    consentTextVersion: null,
    termsVersion: null,
    privacyVersion: null,
    method: null,
    source: null,
    consentedAt: null,
    revokedAt: null,
  };
}

export function toPublicConsent(meta: ConsentMeta, status: ParentalConsentStatus): ParentalConsentPublic {
  return {
    status,
    consentVersion: meta.consentVersion ?? null,
    consentTextVersion: meta.consentTextVersion ?? meta.consentVersion ?? null,
    termsVersion: meta.termsVersion ?? null,
    privacyVersion: meta.privacyVersion ?? null,
    method: meta.method ?? null,
    source: meta.source ?? null,
    consentedAt: meta.consentedAt ?? null,
    revokedAt: meta.revokedAt ?? null,
  };
}

type AuditRow = { id: string; action: string; meta: unknown; createdAt: Date; userId?: string | null };

async function latestAction(
  prisma: AuditClient,
  userId: string,
  action: string,
): Promise<AuditRow | null> {
  const row = await prisma.auditLog.findFirst({
    where: { userId, action },
    orderBy: { createdAt: 'desc' },
    select: { id: true, action: true, meta: true, createdAt: true, userId: true },
  });
  return row ?? null;
}

export async function resolveParentalConsentState(
  prisma: AuditClient,
  userId: string,
): Promise<{ status: ParentalConsentStatus; meta: ConsentMeta }> {
  const [active, revoked, pending] = await Promise.all([
    latestAction(prisma, userId, PARENTAL_CONSENT_ACTIVE),
    latestAction(prisma, userId, PARENTAL_CONSENT_REVOKED),
    latestAction(prisma, userId, PARENTAL_CONSENT_PENDING),
  ]);
  const activeAt = active?.createdAt.getTime() ?? 0;
  const revokedAt = revoked?.createdAt.getTime() ?? 0;
  if (active && activeAt > revokedAt) {
    const meta = asMeta(active.meta);
    if (isCurrentConsent(meta)) return { status: 'ACTIVE', meta };
    return { status: 'RENEWAL_REQUIRED', meta };
  }
  if (revoked && revokedAt >= activeAt) {
    return { status: 'REVOKED', meta: asMeta(revoked.meta) };
  }
  if (pending) return { status: 'PENDING', meta: asMeta(pending.meta) };
  return { status: 'NONE', meta: {} };
}

export async function getParentalConsentPublic(
  prisma: AuditClient,
  userId: string,
): Promise<ParentalConsentPublic> {
  const state = await resolveParentalConsentState(prisma, userId);
  if (state.status === 'NONE') return emptyParentalConsentPublic();
  return toPublicConsent(state.meta, state.status);
}

export async function hasActiveParentalConsent(
  prisma: AuditClient,
  userId: string,
): Promise<boolean> {
  const state = await resolveParentalConsentState(prisma, userId);
  return state.status === 'ACTIVE';
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
        consentTextVersion: PARENTAL_CONSENT_TEXT_VERSION,
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

export function validateGuardianConsentSubmission(input: {
  guardianName?: unknown;
  relationship?: unknown;
  otherAuthority?: unknown;
  legalAuthorityDeclaration?: unknown;
  informedConsent?: unknown;
  guardianLanguage?: unknown;
}):
  | {
      ok: true;
      value: {
        guardianName: string;
        relationship: GuardianRelationship;
        otherAuthority: string | null;
        legalAuthorityDeclaration: true;
        informedConsent: true;
        guardianLanguage: GuardianLanguage | null;
      };
    }
  | { ok: false; reason: ConsentTokenFailure } {
  const name = typeof input.guardianName === 'string' ? input.guardianName.trim().replace(/\s+/g, ' ') : '';
  const parts = name.split(' ').filter(Boolean);
  const significant = parts.filter((part) => {
    if (NAME_PARTICLES.has(part.toLowerCase())) return false;
    return /^[\p{L}][\p{L}'’.-]{1,}$/u.test(part);
  });
  if (name.length < 5 || name.length > 120 || name.includes('@') || significant.length < 2) {
    return { ok: false, reason: 'NAME_REQUIRED' };
  }
  const relationship = input.relationship;
  if (
    relationship !== 'mother' &&
    relationship !== 'father' &&
    relationship !== 'guardian' &&
    relationship !== 'other'
  ) {
    return { ok: false, reason: 'RELATIONSHIP_REQUIRED' };
  }
  let otherAuthority: string | null = null;
  if (relationship === 'other') {
    const text = typeof input.otherAuthority === 'string' ? input.otherAuthority.trim() : '';
    if (text.length < 10 || text.length > 500) return { ok: false, reason: 'OTHER_AUTHORITY_REQUIRED' };
    otherAuthority = text;
  }
  if (input.legalAuthorityDeclaration !== true || input.informedConsent !== true) {
    return { ok: false, reason: 'DECLARATION_REQUIRED' };
  }
  const guardianLanguage =
    input.guardianLanguage === 'nl' || input.guardianLanguage === 'en' ? input.guardianLanguage : null;
  return {
    ok: true,
    value: {
      guardianName: name,
      relationship,
      otherAuthority,
      legalAuthorityDeclaration: true,
      informedConsent: true,
      guardianLanguage,
    },
  };
}

export async function lookupParentalConsentToken(
  prisma: AuditClient,
  params: { token?: string | null; revokeToken?: string | null },
): Promise<
  | { ok: true; purpose: 'accept' | 'revoke'; userId: string }
  | { ok: false; reason: 'INVALID' | 'EXPIRED' | 'USED' }
> {
  if (params.revokeToken) {
    const tokenHash = hashToken(params.revokeToken);
    const active = await prisma.auditLog.findFirst({
      where: {
        action: PARENTAL_CONSENT_ACTIVE,
        meta: { path: ['revokeTokenHash'], equals: tokenHash },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!active?.userId) return { ok: false, reason: 'INVALID' };
    const state = await resolveParentalConsentState(prisma, active.userId);
    if (state.status !== 'ACTIVE' && state.status !== 'RENEWAL_REQUIRED') {
      return { ok: false, reason: 'USED' };
    }
    if (asMeta(active.meta).revokeTokenHash !== tokenHash) return { ok: false, reason: 'INVALID' };
    const current = await latestAction(prisma, active.userId, PARENTAL_CONSENT_ACTIVE);
    if (!current || asMeta(current.meta).revokeTokenHash !== tokenHash) {
      return { ok: false, reason: 'USED' };
    }
    return { ok: true, purpose: 'revoke', userId: active.userId };
  }
  const token = params.token?.trim() ?? '';
  if (!token) return { ok: false, reason: 'INVALID' };
  const tokenHash = hashToken(token);
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
  return { ok: true, purpose: 'accept', userId: pending.userId };
}

export async function acceptParentalConsentToken(
  prisma: AuditClient,
  params: {
    token: string;
    guardianName?: unknown;
    relationship?: unknown;
    otherAuthority?: unknown;
    legalAuthorityDeclaration?: unknown;
    informedConsent?: unknown;
    guardianLanguage?: unknown;
    acceptedIp?: string | null;
    acceptedUserAgent?: string | null;
  },
): Promise<
  | { ok: true; userId: string; revokeToken: string; guardianLanguage: GuardianLanguage | null }
  | { ok: false; reason: ConsentTokenFailure }
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

  const revoked = await latestAction(prisma, pending.userId, PARENTAL_CONSENT_REVOKED);
  if (revoked) {
    const revokedAt = revoked.createdAt.getTime();
    if (revokedAt > pending.createdAt.getTime()) return { ok: false, reason: 'INVALID' };
  }

  const submission = validateGuardianConsentSubmission(params);
  if (!submission.ok) return submission;

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
        consentVersion: PARENTAL_CONSENT_VERSION,
        consentTextVersion: PARENTAL_CONSENT_TEXT_VERSION,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        method: PARENTAL_CONSENT_METHOD,
        source: PARENTAL_CONSENT_SOURCE,
        guardianEmail: meta.guardianEmail ?? null,
        guardianName: submission.value.guardianName,
        guardianRelationship: submission.value.relationship,
        otherAuthority: submission.value.otherAuthority,
        legalAuthorityDeclaration: true,
        informedConsent: true,
        guardianLanguage: submission.value.guardianLanguage,
        consentedAt,
        revokedAt: null,
        acceptedIp: params.acceptedIp ?? null,
        acceptedUserAgent: params.acceptedUserAgent?.slice(0, 400) ?? null,
        revokeTokenHash: hashToken(revokeToken),
        inviteAuditId: pending.id,
        username: meta.username ?? null,
      },
    },
  });
  return {
    ok: true,
    userId: pending.userId,
    revokeToken,
    guardianLanguage: submission.value.guardianLanguage,
  };
}

export async function revokeParentalConsent(params: {
  prisma: AuditClient;
  userId?: string | null;
  revokeToken?: string | null;
  revokedIp?: string | null;
  revokedUserAgent?: string | null;
}): Promise<{ ok: true; userId: string } | { ok: false; reason: 'NOT_FOUND' }> {
  let userId = params.userId ?? null;
  let matchedHash: string | null = null;
  if (params.revokeToken) {
    matchedHash = hashToken(params.revokeToken);
    const active = await params.prisma.auditLog.findFirst({
      where: {
        action: PARENTAL_CONSENT_ACTIVE,
        meta: { path: ['revokeTokenHash'], equals: matchedHash },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!active?.userId) return { ok: false, reason: 'NOT_FOUND' };
    userId = active.userId;
  }
  if (!userId) return { ok: false, reason: 'NOT_FOUND' };
  // Revocation only appends an audit row. Open and paid orders are left as they are.
  const current = await latestAction(params.prisma, userId, PARENTAL_CONSENT_ACTIVE);
  const revoked = await latestAction(params.prisma, userId, PARENTAL_CONSENT_REVOKED);
  if (!current) return { ok: false, reason: 'NOT_FOUND' };
  if (revoked && revoked.createdAt.getTime() >= current.createdAt.getTime()) {
    return { ok: false, reason: 'NOT_FOUND' };
  }
  const currentMeta = asMeta(current.meta);
  if (matchedHash && currentMeta.revokeTokenHash !== matchedHash) {
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
        status: 'REVOKED',
        consentVersion: currentMeta.consentVersion ?? null,
        consentTextVersion: currentMeta.consentTextVersion ?? null,
        termsVersion: currentMeta.termsVersion ?? null,
        privacyVersion: currentMeta.privacyVersion ?? null,
        method: currentMeta.method ?? PARENTAL_CONSENT_METHOD,
        source: currentMeta.source ?? PARENTAL_CONSENT_SOURCE,
        guardianEmail: currentMeta.guardianEmail ?? null,
        guardianName: currentMeta.guardianName ?? null,
        guardianRelationship: currentMeta.guardianRelationship ?? null,
        otherAuthority: currentMeta.otherAuthority ?? null,
        legalAuthorityDeclaration: currentMeta.legalAuthorityDeclaration === true,
        informedConsent: currentMeta.informedConsent === true,
        guardianLanguage: currentMeta.guardianLanguage ?? null,
        consentedAt: currentMeta.consentedAt ?? null,
        revokedAt,
        revokedIp: params.revokedIp ?? null,
        revokedUserAgent: params.revokedUserAgent?.slice(0, 400) ?? null,
        username: currentMeta.username ?? null,
        inviteAuditId: currentMeta.inviteAuditId ?? null,
      },
    },
  });
  return { ok: true, userId };
}

export async function readGuardianContact(
  prisma: AuditClient,
  userId: string,
): Promise<{ email: string | null; language: GuardianLanguage | null; username: string | null }> {
  const state = await resolveParentalConsentState(prisma, userId);
  const language =
    state.meta.guardianLanguage === 'nl' || state.meta.guardianLanguage === 'en'
      ? state.meta.guardianLanguage
      : null;
  const email = typeof state.meta.guardianEmail === 'string' ? state.meta.guardianEmail : null;
  return { email, language, username: state.meta.username ?? null };
}
