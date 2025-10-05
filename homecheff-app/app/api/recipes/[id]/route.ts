import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = params.id;

    // First try to find in WorkspaceContent (new recipe system)
    let recipe = await prisma.workspaceContent.findFirst({
      where: {
        id: recipeId,
        type: 'RECIPE',
        isPublic: true
      },
      include: {
        photos: true,
        sellerProfile: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      }
    });

    // If not found in WorkspaceContent, try Dish model (old recipe system)
    if (!recipe) {
      const dish = await prisma.dish.findFirst({
        where: {
          id: recipeId,
          status: 'PUBLISHED',
          category: 'CHEFF'
        },
        include: {
          photos: true,
          stepPhotos: {
            orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        }
      });

      if (dish) {
        // Transform Dish to Recipe format
        recipe = {
          id: dish.id,
          title: dish.title,
          description: dish.description,
          type: 'RECIPE' as const,
          isPublic: dish.status === 'PUBLISHED',
          createdAt: dish.createdAt,
          updatedAt: dish.updatedAt,
          photos: [
            ...dish.photos.map(photo => ({
              id: photo.id,
              url: photo.url,
              isMain: photo.isMain || false,
              stepNumber: undefined,
              description: undefined
            })),
            ...dish.stepPhotos.map(stepPhoto => ({
              id: stepPhoto.id,
              url: stepPhoto.url,
              isMain: false,
              stepNumber: stepPhoto.stepNumber,
              description: stepPhoto.description
            }))
          ],
          sellerProfile: {
            User: dish.user
          },
          // Transform JSON fields to arrays
          ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
          instructions: Array.isArray(dish.instructions) ? dish.instructions : [],
          prepTime: dish.prepTime,
          servings: dish.servings,
          difficulty: dish.difficulty,
          category: dish.category,
          tags: Array.isArray(dish.tags) ? dish.tags : []
        } as any;
      }
    }

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Transform the recipe to the expected format
    const transformedRecipe = {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: Array.isArray((recipe as any).ingredients) ? (recipe as any).ingredients : [],
      instructions: Array.isArray((recipe as any).instructions) ? (recipe as any).instructions : [],
      prepTime: (recipe as any).prepTime,
      servings: (recipe as any).servings,
      difficulty: (recipe as any).difficulty,
      category: (recipe as any).category,
      tags: Array.isArray((recipe as any).tags) ? (recipe as any).tags : [],
      photos: recipe.photos.map(photo => ({
        id: photo.id,
        url: photo.fileUrl,
        isMain: false,
        stepNumber: undefined,
        description: undefined
      })),
      isPrivate: !recipe.isPublic,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      author: recipe.sellerProfile?.User || null
    };

    return NextResponse.json({ recipe: transformedRecipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
