import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let user;
    
    if (userId) {
      // Get user by ID for public profile
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else {
      // Get current user for private profile
      const session = await auth();
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's dishes
    const dishes = await prisma.dish.findMany({
      where: {
        userId: user.id,
      },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        },
        videos: true, // Include videos
        stepPhotos: {
          orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedDishes = dishes.map(dish => {

      return {
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
      // Recipe-specific fields
      ingredients: dish.ingredients,
      instructions: dish.instructions,
      prepTime: dish.prepTime,
      servings: dish.servings,
      difficulty: dish.difficulty,
      tags: dish.tags,
      // Design-specific fields
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
      ],
      video: dish.videos && dish.videos.length > 0 ? {
        url: dish.videos[0].url,
        thumbnail: dish.videos[0].thumbnail,
        duration: dish.videos[0].duration
      } : null
      };
    });

    return NextResponse.json({ items: transformedDishes });
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
      video, // Video object with url, thumbnail, duration
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

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create a new dish instead of listing
    const dish = await prisma.dish.create({
      data: {
        userId: user.id,
        title,
        description,
        status: status || 'PRIVATE',
        priceCents: priceCents || null,
        deliveryMode: deliveryMode || null,
        place: place || null,
        lat: lat || null,
        lng: lng || null,
        stock: stock || 0,
        maxStock: maxStock || null,
        category: category || null,
        subcategory: subcategory || null,
        // Recipe-specific fields
        ingredients: ingredients || [],
        instructions: instructions || [],
        prepTime: prepTime || null,
        servings: servings || null,
        difficulty: difficulty || null,
        tags: tags || [],
        // Design-specific fields
        materials: materials || [],
        dimensions: dimensions || null,
        notes: notes || null,
      },
    });

    // Handle main photos if provided
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        await prisma.dishPhoto.create({
          data: {
            dishId: dish.id,
            url: photo.url,
            idx: i,
            isMain: photo.isMain || false,
          },
        });
      }
    }

    // Handle step photos if provided
    if (stepPhotos && stepPhotos.length > 0) {
      for (let i = 0; i < stepPhotos.length; i++) {
        const stepPhoto = stepPhotos[i];
        await prisma.recipeStepPhoto.create({
          data: {
            dishId: dish.id,
            url: stepPhoto.url,
            stepNumber: stepPhoto.stepNumber,
            idx: stepPhoto.idx || i,
            description: stepPhoto.description || null,
          },
        });
      }
    }

    // Handle video if provided (only one video per dish)
    if (video && video.url) {
      // Delete existing video if any (in case of update)
      await prisma.dishVideo.deleteMany({
        where: { dishId: dish.id }
      });
      
      // Create new video
      await prisma.dishVideo.create({
        data: {
          dishId: dish.id,
          url: video.url,
          thumbnail: video.thumbnail || null,
          duration: video.duration ? Math.round(video.duration) : null,
          fileSize: null // Can be calculated if needed
        }
      });
    }

    // Fetch the complete dish with all relations (photos, videos, stepPhotos)
    const completeDish = await prisma.dish.findFirst({
      where: { id: dish.id },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        },
        videos: true,
        stepPhotos: {
          orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
        }
      }
    });

    if (!completeDish) {
      return NextResponse.json({ error: "Dish not found after creation" }, { status: 404 });
    }

    // Transform to match expected format (same as GET endpoint)
    const transformedDish = {
      id: completeDish.id,
      title: completeDish.title,
      description: completeDish.description,
      status: completeDish.status,
      createdAt: completeDish.createdAt.toISOString(),
      priceCents: completeDish.priceCents,
      deliveryMode: completeDish.deliveryMode,
      place: completeDish.place,
      stock: completeDish.stock,
      maxStock: completeDish.maxStock,
      category: completeDish.category,
      subcategory: completeDish.subcategory,
      ingredients: completeDish.ingredients,
      instructions: completeDish.instructions,
      prepTime: completeDish.prepTime,
      servings: completeDish.servings,
      difficulty: completeDish.difficulty,
      tags: completeDish.tags,
      materials: completeDish.materials,
      dimensions: completeDish.dimensions,
      notes: completeDish.notes,
      photos: [
        ...completeDish.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          idx: photo.idx,
          isMain: photo.isMain
        })),
        ...completeDish.stepPhotos.map(stepPhoto => ({
          id: stepPhoto.id,
          url: stepPhoto.url,
          idx: stepPhoto.idx,
          stepNumber: stepPhoto.stepNumber,
          description: stepPhoto.description
        }))
      ],
      video: completeDish.videos && completeDish.videos.length > 0 ? {
        url: completeDish.videos[0].url,
        thumbnail: completeDish.videos[0].thumbnail,
        duration: completeDish.videos[0].duration
      } : null
    };

    return NextResponse.json({ item: transformedDish });
  } catch (error) {
    console.error("Error creating dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}