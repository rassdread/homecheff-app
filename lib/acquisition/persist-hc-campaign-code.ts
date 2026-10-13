import { prisma } from '@/lib/prisma';
import { parseHcCampaignCodeFromCookieHeader } from '@/lib/acquisition/hc-campaign-code';

/** First touch only. Does not overwrite an existing code or affiliate attribution. */
export async function persistHcCampaignCodeFirstTouch(
  userId: string,
  cookieHeader: string | null | undefined,
): Promise<void> {
  const code = parseHcCampaignCodeFromCookieHeader(cookieHeader);
  if (!code) return;
  await prisma.user.updateMany({
    where: { id: userId, hcCampaignCode: null },
    data: { hcCampaignCode: code },
  });
}
