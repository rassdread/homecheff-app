import { NextRequest, NextResponse } from "next/server";
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
      select: { User: { select: { id: true } } }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get published recipes for this seller
    const recipes = await prisma.dish.findMany({
      where: {
        userId: sellerProfile.User.id,
        status: 'PUBLISHED'
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
    });

    // Transform recipes to match expected format
    const transformedRecipes = recipes.map(recipe => ({
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

    return NextResponse.json({ recipes: transformedRecipes });
  } catch (error) {
    console.error("Error fetching seller recipes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
