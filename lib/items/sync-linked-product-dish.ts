import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

const SALE_CATEGORIES = new Set(['CHEFF', 'GROWN', 'DESIGNER']);

type ProductSnapshot = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  category: string;
  subcategory?: string | null;
  tags?: string[];
  stock?: number | null;
  maxStock?: number | null;
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  delivery?: string | null;
};

function filterStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

function mealSubcategory(body: Record<string, unknown>, product: ProductSnapshot): string | null {
  if (typeof body.subcategory === 'string' && body.subcategory.trim()) return body.subcategory.trim();
  if (typeof body.mealType === 'string' && body.mealType.trim()) return body.mealType.trim();
  return product.subcategory ?? null;
}

async function replaceDishMainPhotos(dishId: string, imageUrls: string[]) {
  await prisma.dishPhoto.deleteMany({ where: { dishId } });
  if (imageUrls.length === 0) return;
  await prisma.dishPhoto.createMany({
    data: imageUrls.map((url, i) => ({
      id: randomUUID(),
      dishId,
      url,
      idx: i,
      isMain: i === 0,
    })),
  });
}

async function replaceDishVideo(
  dishId: string,
  video: { url: string; thumbnail?: string | null; duration?: number | null } | null,
) {
  await prisma.dishVideo.deleteMany({ where: { dishId } });
  if (video?.url) {
    await prisma.dishVideo.create({
      data: {
        id: randomUUID(),
        dishId,
        url: video.url,
        thumbnail: video.thumbnail ?? null,
        duration: video.duration != null ? Math.round(video.duration) : null,
        fileSize: null,
      },
    });
  }
}

async function replaceStepPhotos(
  dishId: string,
  stepPhotos: Array<{ url: string; stepNumber: number; idx?: number; description?: string | null }>,
) {
  await prisma.recipeStepPhoto.deleteMany({ where: { dishId } });
  if (stepPhotos.length === 0) return;
  await prisma.recipeStepPhoto.createMany({
    data: stepPhotos.map((photo, index) => ({
      id: randomUUID(),
      dishId,
      url: photo.url,
      stepNumber: photo.stepNumber ?? index + 1,
      idx: photo.idx ?? index,
      description: photo.description ?? null,
    })),
  });
}

async function replaceGrowthPhotos(
  dishId: string,
  growthPhotos: Array<{
    url: string;
    phaseNumber: number;
    idx?: number;
    description?: string | null;
  }>,
) {
  await prisma.gardenGrowthPhoto.deleteMany({ where: { dishId } });
  if (growthPhotos.length === 0) return;
  await prisma.gardenGrowthPhoto.createMany({
    data: growthPhotos.map((photo, index) => ({
      id: randomUUID(),
      dishId,
      url: photo.url,
      phaseNumber: photo.phaseNumber ?? index + 1,
      idx: photo.idx ?? index,
      description: photo.description ?? null,
    })),
  });
}

/**
 * After Product PATCH: keep linked Dish (shared id) aligned with product + vertical fields.
 * Only overwrites vertical fields when explicitly present in the PATCH body.
 */
export async function syncLinkedDishFromProductPatch(
  product: ProductSnapshot,
  body: Record<string, unknown>,
  userId: string,
): Promise<void> {
  if (!SALE_CATEGORIES.has(product.category)) return;

  const existing = await prisma.dish.findUnique({ where: { id: product.id } });
  const imageUrls = Array.isArray(body.images)
    ? body.images.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    : null;

  const shared: Record<string, unknown> = {
    title: product.title,
    description: product.description,
    priceCents: product.priceCents,
    stock: product.stock ?? 0,
    maxStock: product.maxStock ?? null,
    place: product.pickupAddress ?? null,
    lat: product.pickupLat ?? null,
    lng: product.pickupLng ?? null,
    deliveryMode: product.delivery ?? null,
  };

  if (body.subcategory !== undefined || body.mealType !== undefined) {
    shared.subcategory = mealSubcategory(body, product);
  } else if (product.subcategory !== undefined) {
    shared.subcategory = product.subcategory;
  }

  if (Array.isArray(body.tags)) {
    shared.tags = filterStrings(body.tags);
  } else if (product.tags) {
    shared.tags = product.tags;
  }

  if (product.category === 'CHEFF') {
    if (Array.isArray(body.ingredients)) shared.ingredients = filterStrings(body.ingredients);
    if (Array.isArray(body.instructions)) shared.instructions = filterStrings(body.instructions);
    if (body.prepTime !== undefined) {
      shared.prepTime =
        body.prepTime !== null && body.prepTime !== '' ? Number(body.prepTime) : null;
    }
    if (body.servings !== undefined) {
      shared.servings =
        body.servings !== null && body.servings !== '' ? Number(body.servings) : null;
    }
    if (body.difficulty !== undefined) {
      shared.difficulty = typeof body.difficulty === 'string' ? body.difficulty : null;
    }
  }

  if (product.category === 'GROWN') {
    if (body.plantType !== undefined) {
      shared.plantType = typeof body.plantType === 'string' ? body.plantType : null;
      if (typeof body.plantType === 'string' && body.plantType.trim()) {
        shared.subcategory = body.plantType.trim();
      }
    }
    if (body.sunlight !== undefined) shared.sunlight = typeof body.sunlight === 'string' ? body.sunlight : null;
    if (body.waterNeeds !== undefined) {
      shared.waterNeeds = typeof body.waterNeeds === 'string' ? body.waterNeeds : null;
    }
    if (body.harvestDate !== undefined) {
      shared.harvestDate = typeof body.harvestDate === 'string' ? body.harvestDate : null;
    }
    if (body.location !== undefined) shared.location = typeof body.location === 'string' ? body.location : null;
    if (body.growthDuration !== undefined) {
      shared.growthDuration =
        body.growthDuration !== null && body.growthDuration !== ''
          ? Number(body.growthDuration)
          : null;
    }
    if (body.plantDate !== undefined) shared.plantDate = typeof body.plantDate === 'string' ? body.plantDate : null;
    if (body.soilType !== undefined) shared.soilType = typeof body.soilType === 'string' ? body.soilType : null;
    if (body.plantDistance !== undefined) {
      shared.plantDistance = typeof body.plantDistance === 'string' ? body.plantDistance : null;
    }
    if (body.notes !== undefined) shared.notes = typeof body.notes === 'string' ? body.notes : null;
    if (body.difficulty !== undefined) {
      shared.difficulty = typeof body.difficulty === 'string' ? body.difficulty : null;
    }
  }

  if (product.category === 'DESIGNER') {
    if (Array.isArray(body.materials)) shared.materials = filterStrings(body.materials);
    if (Array.isArray(body.instructions)) shared.instructions = filterStrings(body.instructions);
    if (body.dimensions !== undefined) {
      shared.dimensions = typeof body.dimensions === 'string' ? body.dimensions : null;
    }
    if (body.notes !== undefined) shared.notes = typeof body.notes === 'string' ? body.notes : null;
  }

  if (!existing) {
    const hasVerticalData =
      product.category === 'CHEFF'
        ? Array.isArray(body.ingredients) ||
          Array.isArray(body.instructions) ||
          body.prepTime !== undefined
        : product.category === 'GROWN'
          ? body.plantType !== undefined ||
            Array.isArray(body.growthPhotos) ||
            body.sunlight !== undefined
          : Array.isArray(body.materials) || body.dimensions !== undefined;

    if (!hasVerticalData && !imageUrls?.length) return;

    await prisma.dish.create({
      data: {
        id: product.id,
        userId,
        status: 'PUBLISHED',
        category: product.category,
        title: (shared.title as string) ?? product.title,
        description: (shared.description as string | null) ?? product.description,
        priceCents: (shared.priceCents as number) ?? product.priceCents,
        stock: (shared.stock as number) ?? 0,
        maxStock: (shared.maxStock as number | null) ?? null,
        place: (shared.place as string | null) ?? null,
        lat: (shared.lat as number | null) ?? null,
        lng: (shared.lng as number | null) ?? null,
        deliveryMode: (shared.deliveryMode as 'PICKUP' | 'DELIVERY' | 'BOTH' | null) ?? null,
        subcategory: (shared.subcategory as string | null) ?? product.subcategory ?? null,
        tags: (shared.tags as string[]) ?? [],
        ingredients: (shared.ingredients as string[]) ?? [],
        instructions: (shared.instructions as string[]) ?? [],
        materials: (shared.materials as string[]) ?? [],
        prepTime: (shared.prepTime as number | null) ?? null,
        servings: (shared.servings as number | null) ?? null,
        difficulty: (shared.difficulty as string | null) ?? null,
        plantType: (shared.plantType as string | null) ?? null,
        sunlight: (shared.sunlight as string | null) ?? null,
        waterNeeds: (shared.waterNeeds as string | null) ?? null,
        harvestDate: (shared.harvestDate as string | null) ?? null,
        location: (shared.location as string | null) ?? null,
        growthDuration: (shared.growthDuration as number | null) ?? null,
        plantDate: (shared.plantDate as string | null) ?? null,
        soilType: (shared.soilType as string | null) ?? null,
        plantDistance: (shared.plantDistance as string | null) ?? null,
        notes: (shared.notes as string | null) ?? null,
        dimensions: (shared.dimensions as string | null) ?? null,
      },
    });
  } else {
    await prisma.dish.update({
      where: { id: product.id },
      data: shared,
    });
  }

  if (imageUrls) {
    await replaceDishMainPhotos(product.id, imageUrls);
  }

  if (body.video !== undefined) {
    const video =
      body.video && typeof body.video === 'object' && 'url' in (body.video as object)
        ? (body.video as { url: string; thumbnail?: string | null; duration?: number | null })
        : null;
    await replaceDishVideo(product.id, video?.url ? video : null);
  }

  if (Array.isArray(body.stepPhotos)) {
    await replaceStepPhotos(
      product.id,
      body.stepPhotos.filter(
        (p): p is { url: string; stepNumber: number; idx?: number; description?: string | null } =>
          typeof p === 'object' &&
          p !== null &&
          typeof (p as { url?: unknown }).url === 'string' &&
          typeof (p as { stepNumber?: unknown }).stepNumber === 'number',
      ),
    );
  }

  if (Array.isArray(body.growthPhotos)) {
    await replaceGrowthPhotos(
      product.id,
      body.growthPhotos.filter(
        (p): p is { url: string; phaseNumber: number; idx?: number; description?: string | null } =>
          typeof p === 'object' &&
          p !== null &&
          typeof (p as { url?: unknown }).url === 'string',
      ).map((p, index) => ({
        url: p.url,
        phaseNumber: (p as { phaseNumber?: number }).phaseNumber ?? index + 1,
        idx: (p as { idx?: number }).idx,
        description: (p as { description?: string | null }).description,
      })),
    );
  }
}

export type DishToProductSyncInput = {
  title?: string | null;
  description?: string | null;
  tags?: string[];
  subcategory?: string | null;
  priceCents?: number | null;
  stock?: number | null;
  maxStock?: number | null;
  mainPhotoUrls?: string[];
  video?: { url: string; thumbnail?: string | null; duration?: number | null } | null;
};

/**
 * After Dish/Garden PATCH: sync shared commerce fields back to Product when linked (same id).
 */
export async function syncLinkedProductFromDishPatch(
  dishId: string,
  input: DishToProductSyncInput,
): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: dishId } });
  if (!product) return;

  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined && input.title != null) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.tags !== undefined) updateData.tags = filterStrings(input.tags);
  if (input.subcategory !== undefined) updateData.subcategory = input.subcategory;
  if (input.priceCents !== undefined && input.priceCents != null) {
    updateData.priceCents = input.priceCents;
  }
  if (input.stock !== undefined && input.stock != null) updateData.stock = input.stock;
  if (input.maxStock !== undefined) updateData.maxStock = input.maxStock;

  if (input.mainPhotoUrls) {
    await prisma.image.deleteMany({ where: { productId: dishId } });
    if (input.mainPhotoUrls.length > 0) {
      updateData.Image = {
        create: input.mainPhotoUrls.map((url, i) => ({
          id: randomUUID(),
          fileUrl: url,
          sortOrder: i,
        })),
      };
    }
  }

  if (input.video !== undefined) {
    await prisma.productVideo.deleteMany({ where: { productId: dishId } });
    if (input.video?.url) {
      updateData.Video = {
        create: {
          id: randomUUID(),
          url: input.video.url,
          thumbnail: input.video.thumbnail ?? null,
          duration: input.video.duration != null ? Math.round(input.video.duration) : null,
          fileSize: null,
        },
      };
    }
  }

  if (Object.keys(updateData).length === 0 && !input.mainPhotoUrls && input.video === undefined) {
    return;
  }

  await prisma.product.update({
    where: { id: dishId },
    data: updateData,
  });
}
