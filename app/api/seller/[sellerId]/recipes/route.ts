import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const { sellerId } = params;

    // Get seller profile to verify it exists
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      select: { 
        id: true,
        User: { select: { id: true } } 
      }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get recipes from both workspace content and dish model
    const [workspaceContent, dishes] = await Promise.all([
      // Get workspace content recipes
      prisma.workspaceContent.findMany({
        where: {
          sellerProfileId: sellerProfile.id,
          type: 'RECIPE',
          isPublic: true
        },
        include: {
          recipe: true,
          photos: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      // Get dish recipes (from recipe form)
      prisma.dish.findMany({
        where: {
          userId: sellerProfile.User.id,
          status: 'PUBLISHED',
          category: 'CHEFF' // Only get recipe dishes, not products
        },
        include: {
          photos: {
            orderBy: { idx: 'asc' }
          },
          stepPhotos: {
            orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    let transformedRecipes: any[] = [];

    // Transform workspace content recipes
    const workspaceRecipes = workspaceContent.map(content => {
      const recipe = content.recipe;
      if (!recipe) return null;

      return {
        id: content.id,
        title: content.title,
        description: content.description,
        prepTime: recipe.prepTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        category: content.type,
        tags: recipe.tags,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map((ing: any) => 
          typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim()
        ) : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions.map((inst: any) => 
          typeof inst === 'string' ? inst : inst.description || inst.step || ''
        ) : [],
        createdAt: content.createdAt.toISOString(),
        photos: content.photos.map(photo => ({
          id: photo.id,
          url: photo.fileUrl,
          idx: photo.sortOrder,
          isMain: photo.sortOrder === 0
        }))
      };
    }).filter(Boolean);

    // Transform dish recipes
    const dishRecipes = dishes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      category: recipe.category,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      createdAt: recipe.createdAt.toISOString(),
      photos: [
        ...recipe.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          idx: photo.idx,
          isMain: photo.isMain
        })),
        ...recipe.stepPhotos.map(stepPhoto => ({
          id: stepPhoto.id,
          url: stepPhoto.url,
          idx: stepPhoto.idx,
          stepNumber: stepPhoto.stepNumber,
          description: stepPhoto.description
        }))
      ]
    }));

    // Combine both types of recipes
    transformedRecipes = [...workspaceRecipes, ...dishRecipes];

    return NextResponse.json({ recipes: transformedRecipes });
  } catch (error) {
    console.error("Error fetching seller recipes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
