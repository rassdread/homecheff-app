import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { tryNormalizeEmail } from '@/lib/auth/normalize-email';
import {
  decideAcceptPartnerInvite,
  type HierarchyRejectCode,
} from '@/lib/affiliates/partner-hierarchy';

export type AcceptPartnerInviteResult =
  | {
      ok: true;
      affiliateId: string;
      created: boolean;
      alreadyLinked: boolean;
      parentAffiliateId: string;
    }
  | { ok: false; code: HierarchyRejectCode | 'INVITE_NOT_FOUND' };

function referralCodeForUser(userId: string): string {
  return `REF${userId.slice(0, 8).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
}

async function ensureReferralLink(affiliateId: string, userId: string): Promise<void> {
  const existing = await prisma.referralLink.findFirst({
    where: { affiliateId },
    select: { id: true },
  });
  if (existing) return;
  await prisma.referralLink.create({
    data: { affiliateId, code: referralCodeForUser(userId) },
  });
}

/**
 * Bind a verified partner invite to an existing User.
 * Creates an Affiliate only when the user does not have one.
 * Does not create a User, Stripe Connect account, or referral code replacement.
 */
export async function acceptPartnerInviteForUser(input: {
  userId: string;
  token: string;
}): Promise<AcceptPartnerInviteResult> {
  const token = input.token.trim();
  const invite = await prisma.subAffiliateInvite.findUnique({
    where: { inviteToken: token },
    include: {
      parentAffiliate: {
        select: {
          id: true,
          userId: true,
          parentAffiliateId: true,
          status: true,
        },
      },
    },
  });
  if (!invite?.parentAffiliate) return { ok: false, code: 'INVITE_NOT_FOUND' };

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      affiliate: { select: { id: true, parentAffiliateId: true } },
    },
  });
  if (!user?.email) return { ok: false, code: 'EMAIL_MISMATCH' };

  const userEmail = tryNormalizeEmail(user.email) ?? user.email.trim().toLowerCase();
  const inviteEmail = tryNormalizeEmail(invite.email) ?? invite.email.trim().toLowerCase();
  const decision = decideAcceptPartnerInvite({
    inviteStatus: invite.status,
    inviteExpiresAt: invite.expiresAt,
    inviteEmail,
    inviteParentAffiliateId: invite.parentAffiliateId,
    parentAffiliateIdOfInviter: invite.parentAffiliate?.parentAffiliateId ?? null,
    inviterStatus: invite.parentAffiliate?.status ?? 'SUSPENDED',
    inviterUserId: invite.parentAffiliate?.userId ?? '',
    userId: user.id,
    userEmail,
    existingAffiliate: user.affiliate,
  });

  if (decision.action === 'REJECT') return { ok: false, code: decision.code };
  if (decision.action === 'ALREADY_LINKED') {
    if (invite.status !== 'ACCEPTED') {
      await prisma.subAffiliateInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });
    }
    return {
      ok: true,
      affiliateId: decision.affiliateId,
      created: false,
      alreadyLinked: true,
      parentAffiliateId: invite.parentAffiliateId,
    };
  }

  try {
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: user.id,
        parentAffiliateId: decision.parentAffiliateId,
        status: 'ACTIVE',
      },
    });
    await ensureReferralLink(affiliate.id, user.id);
    const { enrollAffiliate } = await import('@/lib/affiliate/program-store');
    const parentEnrollment = await prisma.affiliateProgramEnrollment.findUnique({
      where: { affiliateId: decision.parentAffiliateId },
      include: { program: { select: { code: true } } },
    });
    await enrollAffiliate({
      affiliateId: affiliate.id,
      source: 'SIGNUP',
      acceptedTerms: false,
      programCode: parentEnrollment?.program.code,
    });
    await prisma.subAffiliateInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });
    void import('@/lib/affiliates/ecosystem-attribution-bridge').then(
      ({ bridgeMarketplaceParentEdgeToEcosystem }) =>
        bridgeMarketplaceParentEdgeToEcosystem({
          childUserId: user.id,
          parentUserId: invite.parentAffiliate.userId,
          context: 'marketplace_partner_invite_accept',
        }),
    );
    return {
      ok: true,
      affiliateId: affiliate.id,
      created: true,
      alreadyLinked: false,
      parentAffiliateId: decision.parentAffiliateId,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const again = await prisma.affiliate.findUnique({
        where: { userId: user.id },
        select: { id: true, parentAffiliateId: true },
      });
      if (again?.parentAffiliateId === decision.parentAffiliateId) {
        await prisma.subAffiliateInvite.update({
          where: { id: invite.id },
          data: { status: 'ACCEPTED' },
        });
        return {
          ok: true,
          affiliateId: again.id,
          created: false,
          alreadyLinked: true,
          parentAffiliateId: decision.parentAffiliateId,
        };
      }
      return { ok: false, code: 'ALREADY_AFFILIATE' };
    }
    throw error;
  }
}

export async function maybeAcceptPartnerInviteFromRequest(input: {
  userId: string;
  bodyToken?: unknown;
  cookieHeader?: string | null;
}): Promise<void> {
  const { resolvePartnerInviteToken } = await import('@/lib/affiliates/partner-hierarchy');
  const token = resolvePartnerInviteToken({
    bodyToken: input.bodyToken,
    cookieHeader: input.cookieHeader,
  });
  if (!token) return;
  try {
    const result = await acceptPartnerInviteForUser({ userId: input.userId, token });
    if (!result.ok && result.code !== 'INVITE_NOT_FOUND' && result.code !== 'EMAIL_MISMATCH') {
      console.error('[partner-invite] accept skipped', result.code);
    }
  } catch (error) {
    console.error('[partner-invite] accept failed', error);
  }
}
