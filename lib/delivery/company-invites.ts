/**
 * Company driver invitations — email invite + accept token.
 */

import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { assertCompanyDispatcher, canInviteDrivers } from '@/lib/delivery/company-auth';

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export function hashInviteToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createCompanyDriverInvite(input: {
  companyProfileId: string;
  actorUserId: string;
  email: string;
  role?: 'DRIVER' | 'DISPATCHER';
}) {
  const auth = await assertCompanyDispatcher(input.actorUserId, input.companyProfileId);
  if (!canInviteDrivers(auth.role)) {
    throw Object.assign(new Error('FORBIDDEN'), { code: 'FORBIDDEN', status: 403 });
  }

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw Object.assign(new Error('INVALID_EMAIL'), { code: 'INVALID_EMAIL', status: 400 });
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashInviteToken(rawToken);
  const invite = await prisma.deliveryCompanyInvite.create({
    data: {
      companyProfileId: input.companyProfileId,
      email,
      role: input.role ?? 'DRIVER',
      tokenHash,
      invitedByUserId: input.actorUserId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      status: 'PENDING',
      updatedAt: new Date(),
    },
  });

  return { invite, rawToken };
}

export async function acceptCompanyDriverInvite(input: {
  rawToken: string;
  userId: string;
  userEmail: string;
}) {
  const tokenHash = hashInviteToken(input.rawToken);
  const invite = await prisma.deliveryCompanyInvite.findUnique({
    where: { tokenHash },
  });
  if (!invite || invite.status !== 'PENDING') {
    throw Object.assign(new Error('INVITE_INVALID'), { code: 'INVITE_INVALID', status: 404 });
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.deliveryCompanyInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED', updatedAt: new Date() },
    });
    throw Object.assign(new Error('INVITE_EXPIRED'), { code: 'INVITE_EXPIRED', status: 410 });
  }

  const email = input.userEmail.trim().toLowerCase();
  if (email !== invite.email.toLowerCase()) {
    throw Object.assign(new Error('INVITE_EMAIL_MISMATCH'), {
      code: 'INVITE_EMAIL_MISMATCH',
      status: 403,
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.deliveryCompanyInvite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedUserId: input.userId,
        updatedAt: new Date(),
      },
    });

    const member = await tx.deliveryCompanyMember.upsert({
      where: {
        companyProfileId_userId: {
          companyProfileId: invite.companyProfileId,
          userId: input.userId,
        },
      },
      create: {
        companyProfileId: invite.companyProfileId,
        userId: input.userId,
        role: invite.role,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
      update: {
        role: invite.role,
        status: 'ACTIVE',
        disabledAt: null,
        updatedAt: new Date(),
      },
    });

    return { member, companyProfileId: invite.companyProfileId };
  });
}

export async function revokeCompanyInvite(input: {
  inviteId: string;
  companyProfileId: string;
  actorUserId: string;
}) {
  await assertCompanyDispatcher(input.actorUserId, input.companyProfileId);
  return prisma.deliveryCompanyInvite.updateMany({
    where: {
      id: input.inviteId,
      companyProfileId: input.companyProfileId,
      status: 'PENDING',
    },
    data: { status: 'REVOKED', updatedAt: new Date() },
  });
}

export async function disableCompanyMember(input: {
  companyProfileId: string;
  memberUserId: string;
  actorUserId: string;
}) {
  await assertCompanyDispatcher(input.actorUserId, input.companyProfileId);
  // Never delete — preserve history
  return prisma.deliveryCompanyMember.updateMany({
    where: {
      companyProfileId: input.companyProfileId,
      userId: input.memberUserId,
      role: { not: 'OWNER' },
    },
    data: {
      status: 'DISABLED',
      disabledAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
