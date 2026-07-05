import { prisma } from '@/lib/prisma';

/** Whether the viewer may fetch fan/follow lists for targetUserId (owner always can). */
export async function canViewerSeeFanList(
  targetUserId: string,
  viewerEmail?: string | null
): Promise<boolean> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { showFansList: true },
  });
  if (target?.showFansList !== false) return true;
  if (!viewerEmail) return false;
  const viewer = await prisma.user.findUnique({
    where: { email: viewerEmail },
    select: { id: true },
  });
  return viewer?.id === targetUserId;
}
