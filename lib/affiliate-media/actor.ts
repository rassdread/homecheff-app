import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlatformAdmin } from '@/lib/admin-guard';

export type PromoActor = {
  userId: string;
  email: string;
  isAdmin: boolean;
  isAffiliate: boolean;
  affiliateId: string | null;
  affiliateStatus: string | null;
  referralCode: string | null;
};

export async function getPromoActor(): Promise<PromoActor | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      role: true,
      adminRoles: true,
      accountDeletedAt: true,
      affiliate: {
        select: {
          id: true,
          status: true,
          referralLinks: { orderBy: { createdAt: 'desc' }, take: 1, select: { code: true } },
        },
      },
    },
  });
  if (!user || user.accountDeletedAt) return null;
  const admin = await getPlatformAdmin();
  const isAdmin = admin.ok;
  return {
    userId: user.id,
    email: user.email,
    isAdmin,
    isAffiliate: Boolean(user.affiliate && user.affiliate.status === 'ACTIVE'),
    affiliateId: user.affiliate?.id ?? null,
    affiliateStatus: user.affiliate?.status ?? null,
    referralCode: user.affiliate?.referralLinks[0]?.code ?? null,
  };
}

export function canAccessPromoLibrary(actor: PromoActor): boolean {
  return actor.isAffiliate || actor.isAdmin;
}
