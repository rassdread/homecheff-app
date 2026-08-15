/**
 * Maps API/RSC listing detail payload → ListingDetailPage product shape.
 */

export type MappedListingDetail = {
  product: any;
  dishInfo: {
    isDish: boolean;
    category: string | null;
    ingredients: unknown[];
    instructions: unknown[];
    stepPhotos: unknown[];
    growthPhotos: unknown[];
    materials: unknown[];
    plantType: string | null;
    sunlight: string | null;
    waterNeeds: string | null;
    harvestDate: string | null;
    location: string | null;
    soilType: string | null;
    growthDuration: number | null;
    dimensions: string | null;
    notes: string | null;
    difficulty: string | null;
    prepTime: number | null;
    servings: number | null;
    tags: unknown[];
  };
  linkedInspiration: { href: string; category: string } | null;
  sellerBadges: unknown[];
  isBusiness: boolean;
  companyName: string | null;
  publicContactChannels: unknown[];
  checkoutAvailable: boolean;
  paymentStatus: unknown;
  discoveryTrust: unknown;
  stats: unknown;
  consumerCommerce?: unknown;
};

export function mapListingDetailPayload(data: {
  product: any;
  dish?: any;
  isDish?: boolean;
  dishCategory?: string | null;
  linkedInspiration?: { href?: string; category?: string } | null;
  sellerBadges?: unknown;
  isBusiness?: boolean;
  companyName?: string | null;
  publicContactChannels?: unknown;
  checkoutAvailable?: boolean;
  paymentStatus?: unknown;
  discoveryTrust?: unknown;
  stats?: unknown;
  consumerCommerce?: unknown;
}): MappedListingDetail {
  const dishData = {
    isDish: data.isDish || false,
    category: data.dishCategory || null,
    ingredients: data.dish?.ingredients || [],
    instructions: data.dish?.instructions || [],
    stepPhotos: (data.dish?.stepPhotos || []).map(
      (p: {
        id: string;
        url: string;
        stepNumber: number;
        description?: string | null;
      }) => ({
        id: p.id,
        url: p.url,
        stepNumber: p.stepNumber,
        description: p.description,
      }),
    ),
    growthPhotos: (data.dish?.growthPhotos || []).map(
      (p: {
        id: string;
        url: string;
        phaseNumber: number;
        description?: string | null;
      }) => ({
        id: p.id,
        url: p.url,
        phaseNumber: p.phaseNumber,
        description: p.description,
      }),
    ),
    materials: data.dish?.materials || [],
    plantType: data.dish?.plantType || null,
    sunlight: data.dish?.sunlight || null,
    waterNeeds: data.dish?.waterNeeds || null,
    harvestDate: data.dish?.harvestDate || null,
    location: data.dish?.location || null,
    soilType: data.dish?.soilType || null,
    growthDuration: data.dish?.growthDuration ?? null,
    dimensions: data.dish?.dimensions || null,
    notes: data.dish?.notes || null,
    difficulty: data.dish?.difficulty || null,
    prepTime: data.dish?.prepTime ?? null,
    servings: data.dish?.servings ?? null,
    tags: data.dish?.tags || [],
  };

  const photos =
    data.product.photos ||
    data.product.ListingMedia?.map((media: any) => ({
      id: media.id,
      url: media.url,
      idx: media.order || media.idx,
    })) ||
    [];

  // Prefer Image[] when photos empty (Product model)
  const imageList =
    photos.length > 0
      ? photos
      : (data.product.Image || []).map((img: any, i: number) => ({
          id: img.id,
          url: img.fileUrl,
          idx: img.sortOrder ?? i,
        }));

  const transformedProduct = {
    id: data.product.id,
    title: data.product.title,
    description: data.product.description,
    priceCents: data.product.priceCents,
    orderMethod: data.product.orderMethod ?? 'HOMECHEFF_PAYMENT',
    acceptHomeCheffPayment: data.product.acceptHomeCheffPayment ?? null,
    acceptDirectContact: data.product.acceptDirectContact ?? null,
    image:
      data.product.photos?.[0]?.url ||
      data.product.ListingMedia?.[0]?.url ||
      data.product.Image?.[0]?.fileUrl ||
      null,
    photos: imageList,
    stock: data.product.stock,
    maxStock: data.product.maxStock,
    deliveryMode: data.product.deliveryMode,
    delivery: data.product.delivery || 'PICKUP',
    createdAt: data.product.createdAt,
    category: data.product.category,
    subcategory: data.product.subcategory,
    marketplaceCategory: data.product.marketplaceCategory ?? null,
    specializations: Array.isArray(data.product.specializations)
      ? data.product.specializations
      : [],
    acceptedSpecializations: Array.isArray(data.product.acceptedSpecializations)
      ? data.product.acceptedSpecializations
      : [],
    barterOpenness: data.product.barterOpenness ?? null,
    listingIntent: data.product.listingIntent ?? 'OFFER',
    priceModel: data.product.priceModel ?? 'FIXED',
    tags: Array.isArray(data.product.tags) ? data.product.tags : [],
    pickupAddress: data.product.pickupAddress ?? null,
    pickupLat: data.product.pickupLat ?? null,
    pickupLng: data.product.pickupLng ?? null,
    sellerCanDeliver: Boolean(data.product.sellerCanDeliver),
    deliveryRadiusKm: data.product.deliveryRadiusKm ?? null,
    allergens: Array.isArray(data.product.allergens)
      ? data.product.allergens
      : [],
    allergensConfirmedAt: data.product.allergensConfirmedAt ?? null,
    sellerContributionTypes: Array.isArray(data.product.sellerContributionTypes)
      ? data.product.sellerContributionTypes
      : [],
    sellerContributionNote: data.product.sellerContributionNote ?? null,
    madeToConsumerSpecifications: Boolean(
      data.product.madeToConsumerSpecifications,
    ),
    rapidlyPerishable: Boolean(data.product.rapidlyPerishable),
    integrityStatus: data.product.integrityStatus ?? 'ACTIVE',
    seller: {
      lat: data.product.seller?.lat ?? null,
      lng: data.product.seller?.lng ?? null,
      kvk: data.product.seller?.kvk ?? null,
      companyName: data.product.seller?.companyName ?? null,
      commerceDeclaration: data.product.seller?.commerceDeclaration ?? null,
      User: {
        id: data.product.seller?.User?.id || data.product.User?.id || '',
        name: data.product.seller?.User?.name || data.product.User?.name,
        username:
          data.product.seller?.User?.username || data.product.User?.username,
        avatar:
          data.product.seller?.User?.image ||
          data.product.seller?.User?.profileImage ||
          data.product.User?.image ||
          data.product.User?.profileImage,
        image: data.product.seller?.User?.image || data.product.User?.image,
        profileImage:
          data.product.seller?.User?.profileImage ||
          data.product.User?.profileImage,
        displayFullName:
          data.product.seller?.User?.displayFullName ||
          data.product.User?.displayFullName,
        displayNameOption:
          data.product.seller?.User?.displayNameOption ||
          data.product.User?.displayNameOption,
        place: data.product.seller?.User?.place || data.product.User?.place,
        city: data.product.seller?.User?.city || data.product.User?.city,
        lat: data.product.seller?.User?.lat ?? data.product.User?.lat ?? null,
        lng: data.product.seller?.User?.lng ?? data.product.User?.lng ?? null,
        sellerRoles:
          data.product.seller?.User?.sellerRoles || data.product.User?.sellerRoles,
        Business: data.product.seller?.User?.Business ?? null,
      },
    },
  };

  return {
    product: transformedProduct,
    dishInfo: dishData,
    linkedInspiration:
      data.linkedInspiration?.href && data.linkedInspiration?.category
        ? {
            href: data.linkedInspiration.href,
            category: data.linkedInspiration.category,
          }
        : null,
    sellerBadges: Array.isArray(data.sellerBadges) ? data.sellerBadges : [],
    isBusiness: Boolean(data.isBusiness),
    companyName: data.companyName ?? data.product.seller?.companyName ?? null,
    publicContactChannels: Array.isArray(data.publicContactChannels)
      ? data.publicContactChannels
      : [],
    checkoutAvailable: data.checkoutAvailable !== false,
    paymentStatus: data.paymentStatus ?? null,
    discoveryTrust: data.discoveryTrust ?? null,
    stats: data.stats ?? null,
    consumerCommerce: data.consumerCommerce ?? null,
  };
}
