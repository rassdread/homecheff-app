import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import PublicSellerProfile from '@/components/seller/PublicSellerProfileNew';
import { loadPublicContactChannelsForUser } from '@/lib/profile/load-public-contact-channels';
import { getPublicProfileHref, profileFallbackHref } from '@/lib/user/public-profile';

interface PublicSellerProfilePageProps {
  params: Promise<{ sellerId: string }> | { sellerId: string };
}

/**
 * Legacy `/seller/[sellerId]` surface.
 * Prefer canonical `/user/[username|uuid]`. When a userId is passed (common bug),
 * redirect to the public profile instead of rendering "Seller Not Found".
 */
export default async function PublicSellerProfilePage({
  params,
}: PublicSellerProfilePageProps) {
  const resolved = await Promise.resolve(params);
  const sellerId =
    typeof resolved?.sellerId === 'string' ? resolved.sellerId.trim() : '';
  if (!sellerId || sellerId === 'undefined' || sellerId === 'null') {
    notFound();
  }

  const session = await auth();

  let sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          profileImage: true,
          sellerRoles: true,
          buyerRoles: true,
          bio: true,
          quote: true,
          place: true,
          interests: true,
          displayFullName: true,
          displayNameOption: true,
          createdAt: true,
        },
      },
      workplacePhotos: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      products: {
        where: {
          isActive: true,
          integrityStatus: { in: ['ACTIVE', 'REVIEW_REQUIRED'] },
        },
        select: {
          id: true,
          title: true,
          priceCents: true,
          Image: true,
          isActive: true,
          createdAt: true,
          description: true,
          category: true,
          reviews: {
            where: {
              reviewSubmittedAt: { not: null },
              rating: { gt: 0 },
            },
            include: {
              buyer: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profileImage: true,
                },
              },
              images: {
                take: 3,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      },
    },
  });

  // Common legacy mistake: /seller/{userId} instead of sellerProfile.id
  if (!sellerProfile) {
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        username: true,
        SellerProfile: { select: { id: true } },
      },
    });
    if (user) {
      const canonical =
        getPublicProfileHref(user.id, user.username) ??
        profileFallbackHref(user.id);
      redirect(canonical);
    }
    notFound();
  }

  const recipes = await prisma.dish.findMany({
    where: {
      userId: sellerProfile.User.id,
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      title: true,
      description: true,
      photos: true,
      prepTime: true,
      servings: true,
      difficulty: true,
      category: true,
      tags: true,
      ingredients: true,
      instructions: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  const allReviews = sellerProfile.products
    .flatMap((product) =>
      product.reviews.map((review) => ({
        ...review,
        product: {
          id: product.id,
          title: product.title,
          Image: product.Image.slice(0, 1),
        },
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 50);

  const sellerProfileWithRecipes = {
    ...sellerProfile,
    recipes,
    reviews: allReviews,
  };

  const isOwner = session?.user
    ? (session.user as { id?: string }).id === sellerProfile.User.id
    : false;

  const publicContactChannels = await loadPublicContactChannelsForUser(
    sellerProfile.User.id,
  );

  return (
    <PublicSellerProfile
      sellerProfile={sellerProfileWithRecipes}
      isOwner={isOwner}
      publicContactChannels={publicContactChannels}
    />
  );
}
