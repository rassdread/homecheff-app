import { redirect } from 'next/navigation';

/**
 * Dead `/profile/[userId]` links (admin / legacy helpers) → `/user/[userId]`.
 * Owner dashboard remains at `/profile` (no dynamic segment).
 */
export default async function LegacyProfileIdRedirectPage({
  params,
}: {
  params: Promise<{ userId: string }> | { userId: string };
}) {
  const resolved = await Promise.resolve(params);
  const userId = typeof resolved?.userId === 'string' ? resolved.userId.trim() : '';
  if (!userId || userId === 'undefined' || userId === 'null') {
    redirect('/');
  }
  redirect(`/user/${encodeURIComponent(userId)}`);
}
