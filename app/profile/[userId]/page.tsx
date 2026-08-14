import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getPublicProfileHref, profileFallbackHref } from '@/lib/user/public-profile';

type LegacyProfileParams = {
  params: Promise<{ userId: string }> | { userId: string };
};

async function resolveLegacyPublicUser(userId: string) {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      userId,
    );

  return isUUID
    ? prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          showProfileToEveryone: true,
          accountDeletedAt: true,
        },
      })
    : prisma.user.findFirst({
        where: { username: { equals: userId, mode: 'insensitive' } },
        select: {
          id: true,
          username: true,
          showProfileToEveryone: true,
          accountDeletedAt: true,
        },
      });
}

export async function generateMetadata({
  params,
}: LegacyProfileParams): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const userId = typeof resolved?.userId === 'string' ? resolved.userId.trim() : '';
  if (!userId || userId === 'undefined' || userId === 'null') notFound();
  const user = await resolveLegacyPublicUser(userId);
  if (!user || user.accountDeletedAt || !user.showProfileToEveryone) notFound();
  return { robots: { index: false, follow: false } };
}

/**
 * Dead `/profile/[userId]` links (admin / legacy helpers) → `/user/[userId]`.
 * Owner dashboard remains at `/profile` (no dynamic segment).
 * Invalid / missing users: true not-found (do not bounce to homepage).
 */
export default async function LegacyProfileIdRedirectPage({
  params,
}: {
  params: Promise<{ userId: string }> | { userId: string };
}) {
  const resolved = await Promise.resolve(params);
  const userId = typeof resolved?.userId === 'string' ? resolved.userId.trim() : '';
  if (!userId || userId === 'undefined' || userId === 'null') {
    notFound();
  }

  const user = await resolveLegacyPublicUser(userId);

  if (!user || user.accountDeletedAt || !user.showProfileToEveryone) {
    notFound();
  }

  const canonical =
    getPublicProfileHref(user.id, user.username) ?? profileFallbackHref(user.id);
  redirect(canonical);
}
