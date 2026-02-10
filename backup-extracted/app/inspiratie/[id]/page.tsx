import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import InspirationDetailClient from '@/components/inspiratie/InspirationDetailClient';

export default async function InspirationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Fetch inspiration item with all necessary data - EXPLICITLY SELECT ALL FIELDS
  const inspiration = await prisma.dish.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      subcategory: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      // Recipe fields
      ingredients: true,
      instructions: true,
      prepTime: true,
      servings: true,
      difficulty: true,
      tags: true,
      // Garden fields
      plantType: true,
      plantDate: true,
      harvestDate: true,
      growthDuration: true,
      sunlight: true,
      waterNeeds: true,
      location: true,
      soilType: true,
      notes: true,
      // Designer fields
      materials: true,
      dimensions: true,
      // Relations
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
          displayFullName: true,
          displayNameOption: true,
        }
      },
      photos: {
        select: {
          id: true,
          url: true,
          isMain: true,
          idx: true
        },
        orderBy: { idx: 'asc' }
      },
      stepPhotos: {
        select: {
          id: true,
          url: true,
          stepNumber: true,
          description: true,
          idx: true
        },
        orderBy: [
          { stepNumber: 'asc' },
          { idx: 'asc' }
        ]
      },
      growthPhotos: {
        select: {
          id: true,
          url: true,
          phaseNumber: true,
          description: true,
          idx: true
        },
        orderBy: [
          { phaseNumber: 'asc' },
          { idx: 'asc' }
        ]
      },
    }
  });

  if (!inspiration) {
    notFound();
  }

  // Try to find associated product (products might have same ID or matching title/userId)
  let productId: string | null = null;
  try {
    // Method 1: Try to find product with same ID
    const productById = await prisma.product.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (productById) {
      productId = productById.id;
    } else if (inspiration.title && inspiration.userId) {
      // Method 2: Try to find product by title and seller
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: inspiration.userId },
        select: { id: true }
      });
      
      if (sellerProfile) {
        const productByTitle = await prisma.product.findFirst({
          where: {
            sellerId: sellerProfile.id,
            title: inspiration.title,
            category: (inspiration.category as any) || undefined,
            isActive: true
          },
          select: { id: true },
          orderBy: { createdAt: 'desc' }
        });
        
        if (productByTitle) {
          productId = productByTitle.id;
        }
      }
    }
  } catch (error) {
    console.error('Error finding product for inspiration:', error);
    // Continue without product link
  }

  // Debug: Log what we're fetching
  console.log('🔍 Inspiration Data Fetched:', {
    id: inspiration.id,
    title: inspiration.title,
    category: inspiration.category,
    hasIngredients: !!inspiration.ingredients?.length,
    ingredientsCount: inspiration.ingredients?.length || 0,
    hasInstructions: !!inspiration.instructions?.length,
    instructionsCount: inspiration.instructions?.length || 0,
    hasTags: !!inspiration.tags?.length,
    tagsCount: inspiration.tags?.length || 0,
    hasMaterials: !!inspiration.materials?.length,
    materialsCount: inspiration.materials?.length || 0,
    hasStepPhotos: !!inspiration.stepPhotos?.length,
    stepPhotosCount: inspiration.stepPhotos?.length || 0,
    hasGrowthPhotos: !!inspiration.growthPhotos?.length,
    growthPhotosCount: inspiration.growthPhotos?.length || 0,
    plantType: inspiration.plantType,
    prepTime: inspiration.prepTime,
    servings: inspiration.servings,
    difficulty: inspiration.difficulty,
    rawData: {
      ingredients: inspiration.ingredients,
      instructions: inspiration.instructions,
      tags: inspiration.tags,
      materials: inspiration.materials
    }
  });

  // Transform for client component
  const transformedInspiration = {
    ...inspiration,
    photos: inspiration.photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      isMain: photo.isMain,
      idx: photo.idx
    })),
    stepPhotos: inspiration.stepPhotos?.map(photo => ({
      id: photo.id,
      url: photo.url,
      stepNumber: photo.stepNumber,
      description: photo.description,
      idx: photo.idx
    })) || [],
    growthPhotos: inspiration.growthPhotos?.map(photo => ({
      id: photo.id,
      url: photo.url,
      phaseNumber: photo.phaseNumber,
      description: photo.description,
      idx: photo.idx
    })) || [],
    reviews: [], // Reviews will be loaded client-side
    createdAt: inspiration.createdAt.toISOString(),
    updatedAt: inspiration.updatedAt.toISOString()
  };

  return <InspirationDetailClient inspiration={transformedInspiration} productId={productId} />;
}