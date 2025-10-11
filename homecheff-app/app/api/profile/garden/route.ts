import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/profile/garden - Fetching garden projects');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    console.log('📋 Query params - userId:', userId || '(current user)');
    
    let user;
    
    if (userId) {
      // Get user by ID for public profile
      console.log('👤 Fetching user by ID:', userId);
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else {
      // Get current user for private profile
      const session = await auth();
      if (!session?.user?.email) {
        console.log('❌ Unauthorized - no session');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      console.log('👤 Fetching current user:', session.user.email);
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('✅ User found:', user.id);

    // Get user's garden projects
    console.log('🔍 Fetching garden projects for user:', user.id);
    const gardenProjects = await prisma.dish.findMany({
      where: {
        userId: user.id,
        category: 'GROWN' // Only garden projects
      },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        },
        growthPhotos: {
          orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📦 Found ${gardenProjects.length} garden projects`);
    
    // Log each project
    gardenProjects.forEach((project, index) => {
      console.log(`Project ${index}:`, {
        id: project.id,
        title: project.title,
        category: project.category,
        status: project.status,
        mainPhotos: project.photos.length,
        growthPhotos: project.growthPhotos.length
      });
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
      ]
    }));

    console.log('✅ Returning', transformedProjects.length, 'transformed projects');
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
    console.log('🌱 POST /api/profile/garden - Creating new garden project');
    
    const session = await auth();
    if (!session?.user?.email) {
      console.log('❌ Unauthorized - no session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ Session found for user:', session.user.email);

    // Get user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('✅ User found:', user.id);

    const body = await req.json();
    console.log('📥 Request body received:', JSON.stringify(body, null, 2));
    
    const { 
      title, 
      description, 
      status, 
      photos, 
      growthPhotos,
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
      console.log('❌ Validation failed - title is required');
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    console.log('✅ Validation passed');
    console.log('📊 Creating garden project with:', {
      userId: user.id,
      title,
      status: status || 'PRIVATE',
      category: 'GROWN',
      photosCount: photos?.length || 0,
      growthPhotosCount: growthPhotos?.length || 0
    });

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

    console.log('✅ Garden project created:', gardenProject.id);

    // Handle main photos if provided
    if (photos && photos.length > 0) {
      console.log(`📸 Creating ${photos.length} main photos`);
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
      console.log('✅ Main photos created');
    }

    // Handle growth phase photos if provided
    if (growthPhotos && growthPhotos.length > 0) {
      console.log(`🌿 Creating ${growthPhotos.length} growth photos`);
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
      console.log('✅ Growth photos created');
    }

    console.log('✅✅✅ Garden project creation complete:', {
      id: gardenProject.id,
      title: gardenProject.title,
      status: gardenProject.status
    });

    return NextResponse.json({ success: true, project: gardenProject });
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

