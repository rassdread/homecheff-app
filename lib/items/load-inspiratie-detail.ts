import { prisma } from '@/lib/prisma';

const CATEGORY_VALUES = ['CHEFF', 'GROWN', 'DESIGNER'] as const;
export type InspirationCategory = (typeof CATEGORY_VALUES)[number];

export type InspiratieDetailItem = {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  category: InspirationCategory;
  subcategory?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  difficulty?: string | null;
  prepTime?: number | null;
  servings?: number | null;
  ingredients: string[];
  instructions: string[];
  materials: string[];
  dimensions?: string | null;
  notes?: string | null;
  growthDuration?: number | null;
  harvestDate?: string | null;
  location?: string | null;
  plantDate?: string | null;
  plantDistance?: string | null;
  plantType?: string | null;
  soilType?: string | null;
  sunlight?: string | null;
  waterNeeds?: string | null;
  priceCents?: number | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
  photos: Array<{ id: string; url: string; idx: number; isMain?: boolean }>;
  stepPhotos: Array<{
    id: string;
    url: string;
    idx: number;
    stepNumber: number;
    description?: string | null;
  }>;
  growthPhotos: Array<{
    id: string;
    url: string;
    idx: number;
    phaseNumber: number;
    description?: string | null;
  }>;
  videos: Array<{ id: string; url: string; thumbnail?: string | null }>;
  viewCount: number;
  propsCount: number;
};

type LoadResult = {
  item: InspiratieDetailItem;
  isOwner: boolean;
} | null;

export async function loadInspiratieDetail(
  id: string,
  viewerUserId?: string | null,
  options?: { category?: InspirationCategory },
): Promise<LoadResult> {
  const row = await prisma.dish.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { idx: 'asc' } },
      stepPhotos: { orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }] },
      growthPhotos: { orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }] },
      videos: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { id: true, url: true, thumbnail: true },
      },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
          image: true,
          displayFullName: true,
          displayNameOption: true,
        },
      },
    },
  });

  if (!row) return null;
  if (options?.category && row.category !== options.category) return null;

  const isOwner = Boolean(viewerUserId && row.userId === viewerUserId);
  if (!isOwner && row.status !== 'PUBLISHED') return null;

  const [viewAgg, propsCount] = await Promise.all([
    prisma.analyticsEvent
      .groupBy({
        by: ['entityId'],
        where: { entityId: row.id, eventType: 'VIEW', entityType: 'DISH' },
        _count: { entityId: true },
      })
      .catch(() => []),
    prisma.favorite.count({ where: { dishId: row.id } }).catch(() => 0),
  ]);

  const viewCount =
    (viewAgg as Array<{ entityId: string; _count: { entityId: number } }>)[0]
      ?._count.entityId ?? 0;

  const category = CATEGORY_VALUES.includes(row.category as InspirationCategory)
    ? (row.category as InspirationCategory)
    : 'CHEFF';

  const item: InspiratieDetailItem = {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    category,
    subcategory: row.subcategory,
    tags: row.tags ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    difficulty: row.difficulty,
    prepTime: row.prepTime,
    servings: row.servings,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    materials: row.materials ?? [],
    dimensions: row.dimensions,
    notes: row.notes,
    growthDuration: row.growthDuration,
    harvestDate: row.harvestDate,
    location: row.location ?? row.place,
    plantDate: row.plantDate,
    plantDistance: row.plantDistance,
    plantType: row.plantType,
    soilType: row.soilType,
    sunlight: row.sunlight,
    waterNeeds: row.waterNeeds,
    priceCents: row.priceCents,
    user: {
      id: row.user.id,
      name: row.user.name,
      username: row.user.username,
      profileImage: row.user.profileImage ?? row.user.image ?? null,
      displayFullName: row.user.displayFullName,
      displayNameOption: row.user.displayNameOption,
    },
    photos: row.photos.map((p) => ({
      id: p.id,
      url: p.url,
      idx: p.idx,
      isMain: p.isMain ?? undefined,
    })),
    stepPhotos: row.stepPhotos.map((p) => ({
      id: p.id,
      url: p.url,
      idx: p.idx,
      stepNumber: p.stepNumber,
      description: p.description,
    })),
    growthPhotos: row.growthPhotos.map((p) => ({
      id: p.id,
      url: p.url,
      idx: p.idx,
      phaseNumber: p.phaseNumber,
      description: p.description,
    })),
    videos: row.videos.map((v) => ({
      id: v.id,
      url: v.url,
      thumbnail: v.thumbnail,
    })),
    viewCount,
    propsCount,
  };

  return { item, isOwner };
}
