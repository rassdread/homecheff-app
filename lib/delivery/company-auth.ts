/**
 * Server-side authorization for delivery company membership / dispatch.
 */

import { prisma } from '@/lib/prisma';
import type {
  DeliveryCompanyMemberRole,
  DeliveryCompanyMemberStatus,
} from '@prisma/client';
import { isDeliveryBusinessProvider } from '@/lib/delivery/provider-identity';

export type CompanyAuthContext = {
  profileId: string;
  userId: string;
  role: DeliveryCompanyMemberRole;
  status: DeliveryCompanyMemberStatus;
  providerType: string;
};

const DISPATCH_ROLES: DeliveryCompanyMemberRole[] = ['OWNER', 'DISPATCHER'];
const SETTINGS_ROLES: DeliveryCompanyMemberRole[] = ['OWNER'];

export async function getActiveCompanyMembership(
  userId: string,
  companyProfileId: string,
): Promise<CompanyAuthContext | null> {
  const member = await prisma.deliveryCompanyMember.findUnique({
    where: {
      companyProfileId_userId: { companyProfileId, userId },
    },
    include: {
      companyProfile: { select: { id: true, providerType: true } },
    },
  });
  if (!member || member.status !== 'ACTIVE') return null;
  if (!isDeliveryBusinessProvider(member.companyProfile.providerType)) return null;
  return {
    profileId: member.companyProfileId,
    userId: member.userId,
    role: member.role,
    status: member.status,
    providerType: member.companyProfile.providerType,
  };
}

export function canManageCompanySettings(role: DeliveryCompanyMemberRole): boolean {
  return SETTINGS_ROLES.includes(role);
}

export function canDispatch(role: DeliveryCompanyMemberRole): boolean {
  return DISPATCH_ROLES.includes(role);
}

export function canInviteDrivers(role: DeliveryCompanyMemberRole): boolean {
  return DISPATCH_ROLES.includes(role);
}

/** Owner of the DeliveryProfile (settlement identity) always has full company control. */
export async function assertCompanyDispatcher(
  userId: string,
  companyProfileId: string,
): Promise<CompanyAuthContext> {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: companyProfileId },
    select: { id: true, userId: true, providerType: true },
  });
  if (!profile || !isDeliveryBusinessProvider(profile.providerType)) {
    throw Object.assign(new Error('COMPANY_NOT_FOUND'), { code: 'COMPANY_NOT_FOUND', status: 404 });
  }
  if (profile.userId === userId) {
    return {
      profileId: profile.id,
      userId,
      role: 'OWNER',
      status: 'ACTIVE',
      providerType: profile.providerType,
    };
  }
  const membership = await getActiveCompanyMembership(userId, companyProfileId);
  if (!membership || !canDispatch(membership.role)) {
    throw Object.assign(new Error('FORBIDDEN'), { code: 'FORBIDDEN', status: 403 });
  }
  return membership;
}

export async function assertCompanyDriver(
  userId: string,
  companyProfileId: string,
): Promise<CompanyAuthContext> {
  const membership = await getActiveCompanyMembership(userId, companyProfileId);
  if (!membership || membership.role !== 'DRIVER') {
    // OWNER/DISPATCHER may also act operationally on mobile
    if (membership && canDispatch(membership.role)) return membership;
    throw Object.assign(new Error('FORBIDDEN'), { code: 'FORBIDDEN', status: 403 });
  }
  return membership;
}

export async function listActiveCompanyDrivers(companyProfileId: string) {
  return prisma.deliveryCompanyMember.findMany({
    where: {
      companyProfileId,
      status: 'ACTIVE',
      role: 'DRIVER',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          place: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}
