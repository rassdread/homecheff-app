import { prisma } from '@/lib/prisma';
import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';

/** `Dish` rows used as inspiration / dorpsplein-style content (not the Product catalog row). */
export const HCP_SOURCE_DISH = 'dish';

/** Seller workspace posts (Recipe / Growing / Design studio). */
export const HCP_SOURCE_WORKSPACE_CONTENT = 'WorkspaceContent';

/**
 * When a `Dish` shares its primary key with a `Product` (e.g. GROWN product flow), product HCP
 * already covers that bundle — skip inspiration content awards to avoid double HCP.
 */
export async function dishIsLinkedToProduct(dishId: string): Promise<boolean> {
  const p = await prisma.product.findUnique({
    where: { id: dishId },
    select: { id: true },
  });
  return Boolean(p);
}

async function awardContentMilestones(
  userId: string,
  sourceType: string,
  sourceId: string,
  imageLikeCount: number,
  hasVideo: boolean,
): Promise<void> {
  await awardHcp({
    userId,
    action: 'CONTENT_POST_CREATED',
    points: HCP_ACTION_POINTS.CONTENT_POST_CREATED,
    sourceType,
    sourceId,
  });

  if (imageLikeCount >= 3) {
    await awardHcp({
      userId,
      action: 'CONTENT_HAS_3_MEDIA',
      points: HCP_ACTION_POINTS.CONTENT_HAS_3_MEDIA,
      sourceType,
      sourceId,
    });
  }

  if (hasVideo) {
    await awardHcp({
      userId,
      action: 'CONTENT_HAS_VIDEO',
      points: HCP_ACTION_POINTS.CONTENT_HAS_VIDEO,
      sourceType,
      sourceId,
    });
  }
}

/**
 * HomeCheff Points for non-sale inspiration `Dish` content (recipe / design / garden as Dish).
 * Idempotent per action + sourceType + sourceId. Skips when the dish id is also a Product.
 */
export async function awardDishInspirationContentHcp(
  userId: string,
  dishId: string,
  imageLikeCount: number,
  hasVideo: boolean,
): Promise<void> {
  if (await dishIsLinkedToProduct(dishId)) return;
  await awardContentMilestones(
    userId,
    HCP_SOURCE_DISH,
    dishId,
    imageLikeCount,
    hasVideo,
  );
}

/** Workspace studio posts are never Products; awards are idempotent per content id. */
export async function awardWorkspaceContentHcp(
  userId: string,
  workspaceContentId: string,
  imageLikeCount: number,
  hasVideo: boolean,
): Promise<void> {
  await awardContentMilestones(
    userId,
    HCP_SOURCE_WORKSPACE_CONTENT,
    workspaceContentId,
    imageLikeCount,
    hasVideo,
  );
}

/** Load current media counts for a dish after create/update. */
export async function getDishContentMetrics(dishId: string): Promise<{
  imageLikeCount: number;
  hasVideo: boolean;
}> {
  const row = await prisma.dish.findUnique({
    where: { id: dishId },
    select: {
      _count: {
        select: {
          photos: true,
          stepPhotos: true,
          growthPhotos: true,
          videos: true,
        },
      },
    },
  });
  const c = row?._count;
  const imageLikeCount =
    (c?.photos ?? 0) + (c?.stepPhotos ?? 0) + (c?.growthPhotos ?? 0);
  const hasVideo = (c?.videos ?? 0) > 0;
  return { imageLikeCount, hasVideo };
}

export async function getWorkspaceContentMetrics(workspaceContentId: string): Promise<{
  imageLikeCount: number;
  hasVideo: boolean;
}> {
  const row = await prisma.workspaceContent.findUnique({
    where: { id: workspaceContentId },
    select: {
      _count: {
        select: { photos: true },
      },
    },
  });
  return {
    imageLikeCount: row?._count.photos ?? 0,
    hasVideo: false,
  };
}
