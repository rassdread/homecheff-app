import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RecipeView from '@/components/recipes/RecipeView';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

async function getRecipe(id: string, userId?: string) {
  const recipe = await prisma.dish.findUnique({
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
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
          displayFullName: true,
          displayNameOption: true
        }
      }
    }
  });

  if (!recipe || recipe.category !== 'CHEFF') {
    return null;
  }

  // Check if user has access
  const isOwner = userId && recipe.userId === userId;
  const isPublic = recipe.status === 'PUBLISHED';

  if (!isOwner && !isPublic) {
    return null; // Private recipe, no access
  }

  return recipe;
}

export default async function RecipePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const recipe = await getRecipe(params.id, userId);

  if (!recipe) {
    notFound();
  }

  const isOwner = userId && recipe.userId === userId;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    }>
      <RecipeView 
        recipe={recipe} 
        isOwner={isOwner}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const recipe = await prisma.dish.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      description: true,
      photos: {
        where: { isMain: true },
        take: 1
      }
    }
  });

  if (!recipe) {
    return {
      title: 'Recept niet gevonden',
    };
  }

  return {
    title: `${recipe.title} - HomeCheff Keuken`,
    description: recipe.description || `Bekijk dit recept: ${recipe.title}`,
    openGraph: {
      title: recipe.title || 'Recept',
      description: recipe.description || undefined,
      images: recipe.photos[0]?.url ? [recipe.photos[0].url] : [],
    },
  };
}




