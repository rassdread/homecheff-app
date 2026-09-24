import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function referralCodeForUser(userId: string): string {
  return `REF${userId.slice(0, 8).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
}

async function ensureReferralLink(affiliateId: string, userId: string): Promise<string> {
  const existing = await prisma.referralLink.findFirst({
    where: { affiliateId },
    select: { code: true },
  });
  if (existing?.code) return existing.code;
  const code = referralCodeForUser(userId);
  await prisma.referralLink.create({
    data: { affiliateId, code },
  });
  return code;
}

export type ActivateAffiliateResult = {
  affiliateId: string;
  referralCode: string;
  created: boolean;
  reactivated: boolean;
  alreadyActive: boolean;
};

/**
 * Idempotent personal-affiliate activation.
 * Writes Affiliate + ReferralLink only. Does not change User.role,
 * seller/delivery profiles, admin rights, or referral attribution.
 */
export async function activatePersonalAffiliate(
  userId: string,
): Promise<ActivateAffiliateResult> {
  const existing = await prisma.affiliate.findUnique({ where: { userId } });
  if (existing) {
    const reactivated = existing.status === 'SUSPENDED';
    if (reactivated) {
      await prisma.affiliate.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE' },
      });
    }
    const referralCode = await ensureReferralLink(existing.id, userId);
    return {
      affiliateId: existing.id,
      referralCode,
      created: false,
      reactivated,
      alreadyActive: existing.status === 'ACTIVE',
    };
  }

  try {
    const affiliate = await prisma.affiliate.create({
      data: { userId, status: 'ACTIVE' },
    });
    const referralCode = await ensureReferralLink(affiliate.id, userId);
    return {
      affiliateId: affiliate.id,
      referralCode,
      created: true,
      reactivated: false,
      alreadyActive: false,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const again = await prisma.affiliate.findUnique({ where: { userId } });
      if (again) {
        const referralCode = await ensureReferralLink(again.id, userId);
        return {
          affiliateId: again.id,
          referralCode,
          created: false,
          reactivated: false,
          alreadyActive: true,
        };
      }
    }
    throw error;
  }
}
