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

    // Get garden project with photos and growth photos
    const project = await prisma.dish.findFirst({
      where: { 
        id: id,
        userId: user.id,
        category: 'GROWN'
      },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        },
        videos: true, // Include videos
        growthPhotos: {
          orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Garden project not found" }, { status: 404 });
    }

    // Transform to match expected format
    const transformedProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
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
      photos: [
        ...project.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          idx: photo.idx,
          isMain: photo.isMain
        })),
        ...project.growthPhotos.map(growthPhoto => ({
          id: growthPhoto.id,
          url: growthPhoto.url,
          idx: growthPhoto.idx,
          phaseNumber: growthPhoto.phaseNumber,
          description: growthPhoto.description
        }))
      ],
      video: project.videos && project.videos.length > 0 ? {
        url: project.videos[0].url,
        thumbnail: project.videos[0].thumbnail,
        duration: project.videos[0].duration
      } : null
    };

    return NextResponse.json({ item: transformedProject });
  } catch (error) {
    console.error("Error fetching garden project:", error);
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

    // Check if project belongs to this user
    const project = await prisma.dish.findFirst({
      where: { 
        id: id,
        userId: user.id,
        category: 'GROWN'
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Garden project not found" }, { status: 404 });
    }

    // Update project with all provided fields
    const updateData: any = {};
    
    // Basic fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    
    // Garden-specific fields
    if (plantType !== undefined) {
      updateData.plantType = plantType;
      updateData.subcategory = plantType; // Also update subcategory
    }
    if (plantDate !== undefined) updateData.plantDate = plantDate;
    if (harvestDate !== undefined) updateData.harvestDate = harvestDate;
    if (growthDuration !== undefined) updateData.growthDuration = growthDuration;
    if (sunlight !== undefined) updateData.sunlight = sunlight;
    if (waterNeeds !== undefined) updateData.waterNeeds = waterNeeds;
    if (location !== undefined) updateData.location = location;
    if (soilType !== undefined) updateData.soilType = soilType;
    if (plantDistance !== undefined) updateData.plantDistance = plantDistance;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;

    const updatedProject = await prisma.dish.update({
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

    // Handle growth photos update if provided
    if (growthPhotos !== undefined && Array.isArray(growthPhotos)) {
      // Delete existing growth photos
      await prisma.gardenGrowthPhoto.deleteMany({
        where: { dishId: id }
      });
      
      // Create new growth photos
      for (let i = 0; i < growthPhotos.length; i++) {
        const growthPhoto = growthPhotos[i];
        await prisma.gardenGrowthPhoto.create({
          data: {
            dishId: id,
            url: growthPhoto.url,
            phaseNumber: growthPhoto.phaseNumber,
            idx: growthPhoto.idx || i,
            description: growthPhoto.description || null,
          },
        });
      }
    }

    // Handle video update if provided
    if (video !== undefined) {
      // Delete existing video if any
      await prisma.dishVideo.deleteMany({
        where: { dishId: id }
      });
      
      // If video is provided (not null), create new video
      if (video && video.url) {
        await prisma.dishVideo.create({
          data: {
            dishId: id,
            url: video.url,
            thumbnail: video.thumbnail || null,
            duration: video.duration ? Math.round(video.duration) : null,
            fileSize: null
          }
        });
      }
      // If video is null, it's already deleted above, so we're done
    }

    return NextResponse.json({ item: updatedProject });
  } catch (error) {
    console.error("Error updating garden project:", error);
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

    // Check if project belongs to this user
    const project = await prisma.dish.findFirst({
      where: { 
        id: id,
        userId: user.id,
        category: 'GROWN'
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Garden project not found" }, { status: 404 });
    }

    // Delete project (photos will be deleted automatically due to cascade)
    await prisma.dish.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting garden project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

