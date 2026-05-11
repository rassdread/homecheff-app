import { prisma } from '@/lib/prisma';
import { awardHcp } from '@/lib/gamification/award-hcp';
import { HCP_ACTION_POINTS } from '@/lib/gamification/hcp-actions';
import { hcpIsoWeekKeyUtc } from '@/lib/gamification/weekly-challenges';

const PROPS_HCP_DAILY_CAP = 15;

function utcDayStart(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Nieuwe 1-op-1 chat gestart door `starterUserId` (één keer per gesprek). */
export async function tryAwardConversationStartedHcp(
  starterUserId: string,
  conversationId: string
): Promise<void> {
  await awardHcp({
    userId: starterUserId,
    action: 'CONVERSATION_STARTED',
    points: HCP_ACTION_POINTS.CONVERSATION_STARTED,
    sourceType: 'CONVERSATION',
    sourceId: conversationId,
  });
}

/** Props/favoriet op item van een ander (geen zelf-props). */
export async function tryAwardItemLikedOrSavedHcp(
  actorUserId: string,
  sourceType: 'PRODUCT' | 'DISH',
  sourceId: string,
  ownerUserId: string | null | undefined
): Promise<void> {
  if (!ownerUserId || ownerUserId === actorUserId) return;

  const todayCount = await prisma.hcpEvent.count({
    where: {
      userId: actorUserId,
      action: 'ITEM_LIKED_OR_SAVED',
      createdAt: { gte: utcDayStart() },
    },
  });
  if (todayCount >= PROPS_HCP_DAILY_CAP) return;

  await awardHcp({
    userId: actorUserId,
    action: 'ITEM_LIKED_OR_SAVED',
    points: HCP_ACTION_POINTS.ITEM_LIKED_OR_SAVED,
    sourceType,
    sourceId,
  });
}

/** Publieke review-/commenttekst (bron = review-id; `DISH_REVIEW` voor inspiratie). */
export async function tryAwardInteractionCommentHcp(
  authorUserId: string,
  reviewId: string,
  sourceType: 'REVIEW' | 'DISH_REVIEW' = 'REVIEW'
): Promise<void> {
  await awardHcp({
    userId: authorUserId,
    action: 'INTERACTION_COMMENT',
    points: HCP_ACTION_POINTS.INTERACTION_COMMENT,
    sourceType,
    sourceId: reviewId,
  });
}

/** Verkoperantwoord op review (response-id). */
export async function tryAwardReviewReplyPublishedHcp(
  sellerUserId: string,
  responseId: string
): Promise<void> {
  await awardHcp({
    userId: sellerUserId,
    action: 'REVIEW_REPLY_PUBLISHED',
    points: HCP_ACTION_POINTS.REVIEW_REPLY_PUBLISHED,
    sourceType: 'REVIEW_RESPONSE',
    sourceId: responseId,
  });
}

const QUICK_REPLY_WINDOW_MS = 30 * 60 * 1000;

/**
 * Beloning als je binnen ~30 min antwoordt op een bericht van de ander.
 * Maximaal één keer per ISO-week per gesprek (bron: weekKey in sourceId).
 */
export async function tryAwardChatQuickResponseHcp(
  senderUserId: string,
  conversationId: string
): Promise<void> {
  const lastOther = await prisma.message.findFirst({
    where: {
      conversationId,
      senderId: { not: senderUserId },
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (!lastOther?.createdAt) return;

  const delta = Date.now() - new Date(lastOther.createdAt).getTime();
  if (delta < 0 || delta > QUICK_REPLY_WINDOW_MS) return;

  const weekKey = hcpIsoWeekKeyUtc();
  await awardHcp({
    userId: senderUserId,
    action: 'CHAT_QUICK_RESPONSE',
    points: HCP_ACTION_POINTS.CHAT_QUICK_RESPONSE,
    sourceType: 'CONVERSATION',
    sourceId: `${conversationId}:${weekKey}`,
  });
}
