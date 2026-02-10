import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RecipeView from '@/components/recipes/RecipeView';
import InspirationNormalView from '@/components/inspiratie/InspirationNormalView';
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
      videos: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
          displayFullName: true,
          displayNameOption: true,
          downloadPermission: true,
          printPermission: true
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

export default async function RecipePage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const recipe = await getRecipe(params.id, userId);

  if (!recipe) {
    notFound();
  }

  const isOwner = userId && recipe.userId === userId;

  // Get current user info for permission checks
  let currentUserId: string | undefined = undefined;
  let isFanOfOwner = false;
  if (userId && !isOwner) {
    currentUserId = userId;
    // Check if current user is a fan of the recipe owner
    const fanRelation = await prisma.follow.findFirst({
      where: {
        sellerId: recipe.userId,
        followerId: userId
      }
    });
    isFanOfOwner = !!fanRelation;
  }

  // Check if print view is requested
  const showPrintView = searchParams?.view === 'print' || searchParams?.print === 'true';

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    }>
      {showPrintView ? (
        <RecipeView 
          recipe={{
            ...recipe,
            video: recipe.videos?.[0] || null
          }} 
          isOwner={isOwner}
          ownerPermissions={{
            downloadPermission: recipe.user.downloadPermission || 'EVERYONE',
            printPermission: recipe.user.printPermission || 'EVERYONE'
          }}
          currentUser={{
            id: currentUserId,
            isFanOfOwner
          }}
        />
      ) : (
        <InspirationNormalView
          item={{
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            category: recipe.category,
            subcategory: recipe.subcategory,
            photos: recipe.photos.map(p => ({ id: p.id, url: p.url, isMain: p.isMain, idx: p.idx })),
            video: recipe.videos && recipe.videos.length > 0 ? {
              url: recipe.videos[0].url,
              thumbnail: recipe.videos[0].thumbnail || null
            } : null,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            stepPhotos: recipe.stepPhotos.map(p => ({ 
              id: p.id, 
              url: p.url, 
              stepNumber: p.stepNumber, 
              description: p.description 
            })),
            createdAt: recipe.createdAt,
            user: {
              id: recipe.user.id,
              username: recipe.user.username,
              name: recipe.user.name,
              profileImage: recipe.user.profileImage
            }
          }}
          isOwner={isOwner}
          category="CHEFF"
        />
      )}
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

