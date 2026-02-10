import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import InspiratieDetail from '@/components/inspiratie/InspiratieDetail';

const CATEGORY_VALUES = ['CHEFF', 'GROWN', 'DESIGNER'] as const;
type InspirationCategory = (typeof CATEGORY_VALUES)[number];

type PageProps = {
  params: { id: string };
};

async function getInspiratieItem(id: string) {
  const item = await prisma.dish.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { idx: 'asc' }
      },
      stepPhotos: {
        orderBy: [
          { stepNumber: 'asc' },
          { idx: 'asc' }
        ]
      },
      growthPhotos: {
        orderBy: [
          { phaseNumber: 'asc' },
          { idx: 'asc' }
        ]
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
        }
      }
    }
  });

  if (!item || item.status !== 'PUBLISHED') {
    return null;
  }

  const category = CATEGORY_VALUES.includes(item.category as InspirationCategory)
    ? (item.category as InspirationCategory)
    : 'CHEFF';

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    category,
    subcategory: item.subcategory,
    tags: item.tags ?? [],
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    difficulty: item.difficulty,
    prepTime: item.prepTime,
    servings: item.servings,
    ingredients: item.ingredients ?? [],
    instructions: item.instructions ?? [],
    materials: item.materials ?? [],
    dimensions: item.dimensions,
    notes: item.notes,
    growthDuration: item.growthDuration,
    harvestDate: item.harvestDate,
    location: item.location,
    plantDate: item.plantDate,
    plantDistance: item.plantDistance,
    plantType: item.plantType,
    soilType: item.soilType,
    sunlight: item.sunlight,
    waterNeeds: item.waterNeeds,
    user: {
      id: item.user.id,
      name: item.user.name,
      username: item.user.username,
      profileImage: item.user.profileImage ?? item.user.image ?? null,
      displayFullName: item.user.displayFullName,
      displayNameOption: item.user.displayNameOption,
    },
    photos: item.photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      idx: photo.idx,
      isMain: photo.isMain,
    })),
    stepPhotos: item.stepPhotos.map(photo => ({
      id: photo.id,
      url: photo.url,
      idx: photo.idx,
      stepNumber: photo.stepNumber,
      description: photo.description,
    })),
    growthPhotos: item.growthPhotos.map(photo => ({
      id: photo.id,
      url: photo.url,
      idx: photo.idx,
      phaseNumber: photo.phaseNumber,
      description: photo.description,
    })),
    videos: [] as Array<{ id: string; url: string; thumbnail?: string | null }>,
  };
}

export default async function InspiratieItemPage({ params }: PageProps) {
  const item = await getInspiratieItem(params.id);

  if (!item) {
    notFound();
  }

  return (
    <InspiratieDetail item={item} />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const item = await prisma.dish.findUnique({
    where: { id: params.id },
    include: {
      photos: {
        where: { isMain: true },
        take: 1,
      },
    },
  });

  if (!item || item.status !== 'PUBLISHED') {
    return {
      title: 'Inspiratie-item niet gevonden',
    };
  }

  const mainPhoto = item.photos[0];

  return {
    title: item.title ? `${item.title} - HomeCheff Inspiratie` : 'Inspiratie-item',
    description: item.description ?? undefined,
    openGraph: {
      title: item.title ?? 'Inspiratie-item',
      description: item.description ?? undefined,
      images: mainPhoto?.url ? [mainPhoto.url] : [],
    },
  };
}

