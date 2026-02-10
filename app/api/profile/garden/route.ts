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

    // Get user's garden projects

    const gardenProjects = await prisma.dish.findMany({
      where: {
        userId: user.id,
        category: 'GROWN' // Only garden projects
      },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        },
        videos: true, // Include videos
        growthPhotos: {
          orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Log each project
    gardenProjects.forEach((project, index) => {

    });

    // Transform to match expected format
    const transformedProjects = gardenProjects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      category: project.category, // Include category for debugging
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      // Garden-specific fields
      plantType: project.plantType,
      plantDate: project.plantDate,
      harvestDate: project.harvestDate,
      growthDuration: project.growthDuration,
      sunlight: project.sunlight,
      waterNeeds: project.waterNeeds,
      location: project.location,
      soilType: project.soilType,
      plantDistance: project.plantDistance,
      difficulty: project.difficulty,
      tags: project.tags,
      notes: project.notes,
      photos: project.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        idx: photo.idx,
        isMain: photo.isMain
      })),
      growthPhotos: project.growthPhotos.map(growthPhoto => ({
        id: growthPhoto.id,
        url: growthPhoto.url,
        idx: growthPhoto.idx,
        phaseNumber: growthPhoto.phaseNumber,
        description: growthPhoto.description
      })),
      video: project.videos && project.videos.length > 0 ? {
        url: project.videos[0].url,
        thumbnail: project.videos[0].thumbnail,
        duration: project.videos[0].duration
      } : null
    }));

    return NextResponse.json({ items: transformedProjects });
  } catch (error) {
    console.error("❌ Error fetching garden projects:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
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
      growthPhotos,
      video, // Video object with url, thumbnail, duration
      // Garden-specific fields
      plantType,
      plantDate,
      harvestDate,
      growthDuration,
      sunlight,
      waterNeeds,
      location,
      soilType,
      plantDistance,
      difficulty,
      tags,
      notes
    } = body;

    if (!title) {

      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create a new garden project (using Dish model with category GROWN)
    const gardenProject = await prisma.dish.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        status: status || 'PRIVATE',
        category: 'GROWN',
        subcategory: plantType || null,
        // Garden-specific fields
        plantType: plantType || null,
        plantDate: plantDate || null,
        harvestDate: harvestDate || null,
        growthDuration: growthDuration || null,
        sunlight: sunlight || null,
        waterNeeds: waterNeeds || null,
        location: location || null,
        soilType: soilType || null,
        plantDistance: plantDistance || null,
        difficulty: difficulty || null,
        tags: tags || [],
        notes: notes || null,
        // Set other fields to null for garden projects
        priceCents: null,
        deliveryMode: null,
        place: null,
        lat: null,
        lng: null,
        stock: 0,
        maxStock: null,
        ingredients: [],
        instructions: [],
        prepTime: null,
        servings: null
      },
    });

    // Handle main photos if provided
    if (photos && photos.length > 0) {

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        await prisma.dishPhoto.create({
          data: {
            dishId: gardenProject.id,
            url: photo.url,
            idx: i,
            isMain: photo.isMain || false,
          },
        });
      }

    }

    // Handle growth phase photos if provided
    if (growthPhotos && growthPhotos.length > 0) {

      for (let i = 0; i < growthPhotos.length; i++) {
        const growthPhoto = growthPhotos[i];
        await prisma.gardenGrowthPhoto.create({
          data: {
            dishId: gardenProject.id,
            url: growthPhoto.url,
            phaseNumber: growthPhoto.phaseNumber,
            description: growthPhoto.description || null,
            idx: growthPhoto.idx || 0,
          },
        });
      }

    }

    // Handle video if provided (only one video per garden project)
    if (video && video.url) {
      await prisma.dishVideo.create({
        data: {
          dishId: gardenProject.id,
          url: video.url,
          thumbnail: video.thumbnail || null,
          duration: video.duration ? Math.round(video.duration) : null,
          fileSize: null
        }
      });
    }

    // Fetch the complete garden project with all relations (photos, videos, growthPhotos)
    const completeProject = await prisma.dish.findFirst({
      where: { id: gardenProject.id },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        },
        videos: true,
        growthPhotos: {
          orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
        }
      }
    });

    if (!completeProject) {
      return NextResponse.json({ error: "Garden project not found after creation" }, { status: 404 });
    }

    // Transform to match expected format (same as GET endpoint)
    const transformedProject = {
      id: completeProject.id,
      title: completeProject.title,
      description: completeProject.description,
      status: completeProject.status,
      createdAt: completeProject.createdAt.toISOString(),
      updatedAt: completeProject.updatedAt.toISOString(),
      // Garden-specific fields
      plantType: completeProject.plantType,
      plantDate: completeProject.plantDate,
      harvestDate: completeProject.harvestDate,
      growthDuration: completeProject.growthDuration,
      sunlight: completeProject.sunlight,
      waterNeeds: completeProject.waterNeeds,
      location: completeProject.location,
      soilType: completeProject.soilType,
      plantDistance: completeProject.plantDistance,
      difficulty: completeProject.difficulty,
      tags: completeProject.tags,
      notes: completeProject.notes,
      photos: completeProject.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        idx: photo.idx,
        isMain: photo.isMain
      })),
      growthPhotos: completeProject.growthPhotos.map(growthPhoto => ({
        id: growthPhoto.id,
        url: growthPhoto.url,
        idx: growthPhoto.idx,
        phaseNumber: growthPhoto.phaseNumber,
        description: growthPhoto.description
      })),
      video: completeProject.videos && completeProject.videos.length > 0 ? {
        url: completeProject.videos[0].url,
        thumbnail: completeProject.videos[0].thumbnail,
        duration: completeProject.videos[0].duration
      } : null
    };

    return NextResponse.json({ success: true, item: transformedProject });
  } catch (error) {
    console.error("❌❌❌ Error creating garden project:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

