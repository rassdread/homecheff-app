import { ProductCategory, WorkspaceContentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  CATEGORY_ECOSYSTEM_SLUGS,
  type CategoryEcosystemSlug,
} from '@/lib/community/categoryEcosystemSlugs';

export { CATEGORY_ECOSYSTEM_SLUGS, type CategoryEcosystemSlug } from '@/lib/community/categoryEcosystemSlugs';

export type CategoryEcosystemPayload = {
  slug: CategoryEcosystemSlug;
  generatedAt: string;
  activeListings: number;
  newListingsWeek: number;
  activeCreatorsWeek: number;
  inspirationPostsWeek: number;
  savesWeekApprox: number;
  risingUsername: string | null;
  risingListingCount: number;
};

function displayUsername(username: string | null | undefined, name: string | null | undefined): string | null {
  const u = username?.trim();
  if (u) return u;
  const n = name?.trim()?.split(/\s+/)?.[0];
  return n || null;
}

function productCategoryForSlug(slug: Exclude<CategoryEcosystemSlug, 'inspiratie' | 'community'>): ProductCategory {
  if (slug === 'keuken') return ProductCategory.CHEFF;
  if (slug === 'tuin') return ProductCategory.GROWN;
  return ProductCategory.DESIGNER;
}

function workspaceTypeForSlug(slug: Exclude<CategoryEcosystemSlug, 'inspiratie' | 'community'>): WorkspaceContentType {
  if (slug === 'keuken') return WorkspaceContentType.RECIPE;
  if (slug === 'tuin') return WorkspaceContentType.GROWING_PROCESS;
  return WorkspaceContentType.DESIGN_ITEM;
}

export async function getCategoryEcosystem(slug: string): Promise<CategoryEcosystemPayload | null> {
  if (!CATEGORY_ECOSYSTEM_SLUGS.includes(slug as CategoryEcosystemSlug)) return null;
  const key = slug as CategoryEcosystemSlug;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (key === 'community') {
    const [activeAffiliates, newAffiliatesWeek, newProductsWeekGlobal] = await Promise.all([
      prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
      prisma.affiliate.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.product.count({ where: { isActive: true, createdAt: { gte: weekAgo } } }),
    ]);
    return {
      slug: 'community',
      generatedAt: new Date().toISOString(),
      activeListings: activeAffiliates,
      newListingsWeek: newProductsWeekGlobal,
      activeCreatorsWeek: newAffiliatesWeek,
      inspirationPostsWeek: 0,
      savesWeekApprox: 0,
      risingUsername: null,
      risingListingCount: 0,
    };
  }

  if (key === 'inspiratie') {
    const [dishWeek, recipeWeek, savesWeek, dishCreatorsWeek, workspaceProfileIds] = await Promise.all([
      prisma.dish.count({
        where: { status: 'PUBLISHED', createdAt: { gte: weekAgo } },
      }),
      prisma.recipe.count({
        where: {
          createdAt: { gte: weekAgo },
          workspaceContent: { isPublic: true },
        },
      }),
      prisma.favorite.count({
        where: {
          createdAt: { gte: weekAgo },
          OR: [{ dishId: { not: null } }, { listingId: { not: null } }, { productId: { not: null } }],
        },
      }),
      prisma.dish.groupBy({
        by: ['userId'],
        where: { status: 'PUBLISHED', createdAt: { gte: weekAgo } },
      }),
      prisma.workspaceContent
        .groupBy({
          by: ['sellerProfileId'],
          where: { isPublic: true, createdAt: { gte: weekAgo } },
        })
        .then((r) => r.map((row) => row.sellerProfileId))
        .catch(() => [] as string[]),
    ]);

    const profileIds = [...new Set(workspaceProfileIds)].filter(Boolean);
    const workspaceUserIds =
      profileIds.length > 0
        ? await prisma.sellerProfile.findMany({
            where: { id: { in: profileIds } },
            select: { userId: true },
          })
        : [];

    const inspirationCreatorIds = new Set<string>();
    for (const d of dishCreatorsWeek) {
      if (d.userId) inspirationCreatorIds.add(d.userId);
    }
    for (const sp of workspaceUserIds) {
      if (sp.userId) inspirationCreatorIds.add(sp.userId);
    }
    const activeCreatorsWeekCount = inspirationCreatorIds.size;

    const inspirationPostsWeek = dishWeek + recipeWeek;
    return {
      slug: 'inspiratie',
      generatedAt: new Date().toISOString(),
      activeListings: await prisma.dish.count({ where: { status: 'PUBLISHED' } }),
      newListingsWeek: inspirationPostsWeek,
      activeCreatorsWeek: activeCreatorsWeekCount,
      inspirationPostsWeek,
      savesWeekApprox: savesWeek,
      risingUsername: null,
      risingListingCount: 0,
    };
  }

  const pc = productCategoryForSlug(key);
  const wt = workspaceTypeForSlug(key);

  const [
    activeListings,
    newProductsWeek,
    inspirationPostsWeek,
    risingGroup,
    savesWeekApprox,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true, category: pc } }),
    prisma.product.count({ where: { isActive: true, category: pc, createdAt: { gte: weekAgo } } }),
    prisma.workspaceContent.count({
      where: { isPublic: true, type: wt, createdAt: { gte: weekAgo } },
    }),
    prisma.product
      .groupBy({
        by: ['sellerId'],
        where: { isActive: true, category: pc, createdAt: { gte: weekAgo } },
        _count: { sellerId: true },
        orderBy: { _count: { sellerId: 'desc' } },
        take: 1,
      })
      .catch(() => [] as { sellerId: string; _count: { sellerId: number } }[]),
    prisma.favorite.count({
      where: {
        createdAt: { gte: weekAgo },
        productId: { not: null },
        Product: { category: pc },
      },
    }),
  ]);

  const sellerWeekRows = await prisma.product.findMany({
    where: { isActive: true, category: pc, createdAt: { gte: weekAgo } },
    select: { seller: { select: { userId: true } } },
    take: 400,
  });
  const creators = new Set<string>();
  for (const r of sellerWeekRows) {
    const id = r.seller?.userId;
    if (id) creators.add(id);
  }

  let risingUsername: string | null = null;
  let risingListingCount = 0;
  const top = risingGroup[0];
  if (top?.sellerId) {
    risingListingCount = top._count.sellerId;
    const sp = await prisma.sellerProfile.findUnique({
      where: { id: top.sellerId },
      select: { User: { select: { username: true, name: true } } },
    });
    risingUsername = displayUsername(sp?.User?.username, sp?.User?.name);
  }

  return {
    slug: key,
    generatedAt: new Date().toISOString(),
    activeListings,
    newListingsWeek: newProductsWeek,
    activeCreatorsWeek: creators.size,
    inspirationPostsWeek,
    savesWeekApprox,
    risingUsername,
    risingListingCount,
  };
}
