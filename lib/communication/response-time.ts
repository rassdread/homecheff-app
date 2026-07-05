import { prisma } from '@/lib/prisma';

const MAX_SAMPLES = 40;
const MIN_SAMPLES_FOR_DISPLAY = 3;

export type ResponseTimeStats = {
  medianMinutes: number | null;
  sampleCount: number;
  /** Human label e.g. "Binnen 2 uur" — null when insufficient data. */
  label: string | null;
};

function formatResponseTimeLabel(minutes: number): string {
  if (minutes < 60) {
    const rounded = Math.max(1, Math.round(minutes));
    return rounded === 1 ? 'Binnen 1 minuut' : `Binnen ${rounded} minuten`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    const rounded = Math.max(1, Math.round(hours));
    return rounded === 1 ? 'Binnen 1 uur' : `Binnen ${rounded} uur`;
  }
  const days = Math.round(hours / 24);
  return days === 1 ? 'Binnen 1 dag' : `Binnen ${days} dagen`;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/**
 * Median first-response time (minutes) for a seller/maker user.
 * Measures: first inbound message → first outbound reply per conversation.
 */
export async function computeSellerResponseTimeStats(
  sellerUserId: string,
): Promise<ResponseTimeStats> {
  const conversations = await prisma.conversation.findMany({
    where: {
      ConversationParticipant: {
        some: { userId: sellerUserId, isHidden: false },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: MAX_SAMPLES,
    select: {
      Message: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { senderId: true, createdAt: true },
        take: 20,
      },
    },
  });

  const deltasMinutes: number[] = [];

  for (const row of conversations) {
    const messages = row.Message;
    if (messages.length < 2) continue;

    let firstInboundIdx = -1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i]!.senderId !== sellerUserId) {
        firstInboundIdx = i;
        break;
      }
    }
    if (firstInboundIdx < 0) continue;

    const inbound = messages[firstInboundIdx]!;
    let firstReply: (typeof messages)[number] | null = null;
    for (let j = firstInboundIdx + 1; j < messages.length; j++) {
      if (messages[j]!.senderId === sellerUserId) {
        firstReply = messages[j]!;
        break;
      }
    }
    if (!firstReply) continue;

    const deltaMs =
      firstReply.createdAt.getTime() - inbound.createdAt.getTime();
    if (deltaMs >= 0) {
      deltasMinutes.push(deltaMs / 60_000);
    }
  }

  const med = median(deltasMinutes);
  const sampleCount = deltasMinutes.length;

  return {
    medianMinutes: med,
    sampleCount,
    label:
      med != null && sampleCount >= MIN_SAMPLES_FOR_DISPLAY
        ? formatResponseTimeLabel(med)
        : null,
  };
}

export { formatResponseTimeLabel };
