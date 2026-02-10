import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get dish with photos and step photos
    const dish = await prisma.dish.findFirst({
      where: { 
        id: id,
        userId: user.id
      },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        },
        stepPhotos: {
          orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
        }
      }
    });

    if (!dish) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }

    // Transform to match expected format
    const transformedDish = {
      id: dish.id,
      title: dish.title,
      description: dish.description,
      status: dish.status,
      createdAt: dish.createdAt.toISOString(),
      priceCents: dish.priceCents,
      deliveryMode: dish.deliveryMode,
      place: dish.place,
      stock: dish.stock,
      maxStock: dish.maxStock,
      category: dish.category,
      subcategory: dish.subcategory,
      ingredients: dish.ingredients,
      instructions: dish.instructions,
      prepTime: dish.prepTime,
      servings: dish.servings,
      difficulty: dish.difficulty,
      tags: dish.tags,
      materials: dish.materials,
      dimensions: dish.dimensions,
      notes: dish.notes,
      photos: [
        ...dish.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          idx: photo.idx,
          isMain: photo.isMain
        })),
        ...dish.stepPhotos.map(stepPhoto => ({
          id: stepPhoto.id,
          url: stepPhoto.url,
          idx: stepPhoto.idx,
          stepNumber: stepPhoto.stepNumber,
          description: stepPhoto.description
        }))
      ]
    };

    return NextResponse.json({ item: transformedDish });
  } catch (error) {
    console.error("Error fetching dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      status, 
      photos, 
      stepPhotos,
      category, 
      subcategory, 
      priceCents, 
      deliveryMode, 
      place, 
      lat, 
      lng,
      stock,
      maxStock,
      // Recipe-specific fields
      ingredients,
      instructions,
      prepTime,
      servings,
      difficulty,
      tags,
      // Design-specific fields
      materials,
      dimensions,
      notes
    } = body;

    // Check if dish belongs to this user
    const dish = await prisma.dish.findFirst({
      where: { 
        id: id,
        userId: user.id
      }
    });

    if (!dish) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }

    // Update dish with all provided fields
    const updateData: any = {};
    
    // Basic fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (priceCents !== undefined) updateData.priceCents = priceCents;
    if (deliveryMode !== undefined) updateData.deliveryMode = deliveryMode;
    if (place !== undefined) updateData.place = place;
    if (lat !== undefined) updateData.lat = lat;
    if (lng !== undefined) updateData.lng = lng;
    if (stock !== undefined) updateData.stock = stock;
    if (maxStock !== undefined) updateData.maxStock = maxStock;
    
    // Recipe-specific fields
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (prepTime !== undefined) updateData.prepTime = prepTime;
    if (servings !== undefined) updateData.servings = servings;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (tags !== undefined) updateData.tags = tags;
    
    // Design-specific fields
    if (materials !== undefined) updateData.materials = materials;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (notes !== undefined) updateData.notes = notes;

    const updatedDish = await prisma.dish.update({
      where: { id: id },
      data: updateData
    });

    // Handle main photos update if provided
    if (photos !== undefined && Array.isArray(photos)) {
      // Delete existing main photos
      await prisma.dishPhoto.deleteMany({
        where: { dishId: id }
      });
      
      // Create new main photos
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        await prisma.dishPhoto.create({
          data: {
            dishId: id,
            url: photo.url,
            idx: i,
            isMain: photo.isMain || false,
          },
        });
      }
    }

    // Handle step photos update if provided
    if (stepPhotos !== undefined && Array.isArray(stepPhotos)) {
      // Delete existing step photos
      await prisma.recipeStepPhoto.deleteMany({
        where: { dishId: id }
      });
      
      // Create new step photos
      for (let i = 0; i < stepPhotos.length; i++) {
        const stepPhoto = stepPhotos[i];
        await prisma.recipeStepPhoto.create({
          data: {
            dishId: id,
            url: stepPhoto.url,
            stepNumber: stepPhoto.stepNumber,
            idx: stepPhoto.idx || i,
            description: stepPhoto.description || null,
          },
        });
      }
    }

    return NextResponse.json({ item: updatedDish });
  } catch (error) {
    console.error("Error updating dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if dish belongs to this user
    const dish = await prisma.dish.findFirst({
      where: { 
        id: id,
        userId: user.id
      }
    });

    if (!dish) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }

    // Delete dish (photos will be deleted automatically due to cascade)
    await prisma.dish.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}