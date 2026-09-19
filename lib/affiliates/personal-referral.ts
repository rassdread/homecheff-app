/**
 * Personal invite / referral identity.
 *
 * Source of truth:
 *   Affiliate (one per user) → ReferralLink.code → public /welkom/{code}
 *   Attribution (first-touch, hc_ref cookie) on signup
 *
 * Invite does not change commission percentages or reconstruct ledger history.
 */

import { randomBytes } from 'crypto';

/** Inviter-facing share page (logged-in). Visitor landing stays /welkom/{code}. */
export const PERSONAL_INVITE_PATH = '/invite';

/** Public first-touch landing used in shared links. */
export const PERSONAL_REFERRAL_LANDING_PREFIX = '/welkom';

export function buildPersonalReferralPath(code: string): string {
  return `${PERSONAL_REFERRAL_LANDING_PREFIX}/${encodeURIComponent(code)}`;
}

export function buildPersonalReferralUrl(origin: string, code: string): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}${buildPersonalReferralPath(code)}`;
}

export function generatePersonalReferralCode(userId: string): string {
  const idPart = String(userId || '')
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase()
    .padEnd(8, 'X');
  const entropy = randomBytes(2).toString('hex').toUpperCase();
  return `REF${idPart}${entropy}`;
}

export type EnsuredPersonalReferral = {
  affiliateId: string;
  code: string;
  createdAffiliate: boolean;
  createdLink: boolean;
};

/**
 * Ensure the user has an Affiliate seat + ReferralLink so they can share a personal invite.
 * Does not reactivate SUSPENDED seats. Does not alter commission config.
 */
export async function ensurePersonalReferralLink(
  userId: string,
): Promise<EnsuredPersonalReferral | null> {
  const { prisma } = await import('@/lib/prisma');
  const uid = String(userId || '').trim();
  if (!uid) return null;

  let createdAffiliate = false;
  let affiliate = await prisma.affiliate.findUnique({
    where: { userId: uid },
    select: { id: true, status: true },
  });

  if (!affiliate) {
    affiliate = await prisma.affiliate.create({
      data: { userId: uid, status: 'ACTIVE' },
      select: { id: true, status: true },
    });
    createdAffiliate = true;
  }

  const existing = await prisma.referralLink.findFirst({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });
  if (existing?.code) {
    return {
      affiliateId: affiliate.id,
      code: existing.code,
      createdAffiliate,
      createdLink: false,
    };
  }

  if (affiliate.status !== 'ACTIVE') {
    return null;
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generatePersonalReferralCode(uid);
    try {
      const created = await prisma.referralLink.create({
        data: { affiliateId: affiliate.id, code },
        select: { code: true },
      });
      return {
        affiliateId: affiliate.id,
        code: created.code,
        createdAffiliate,
        createdLink: true,
      };
    } catch {
      // Unique code collision — retry.
    }
  }

  return null;
}
