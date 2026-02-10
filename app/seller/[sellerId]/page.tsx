import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PublicSellerProfile from '@/components/seller/PublicSellerProfileNew';

interface PublicSellerProfilePageProps {
  params: {
    sellerId: string;
  };
}

export default async function PublicSellerProfilePage({ params }: PublicSellerProfilePageProps) {
  const { sellerId } = params;
  
  // Get session if user is logged in (optional for public profiles)
  const session = await auth();

  // Get seller profile with all necessary data
  const sellerProfile = await prisma.sellerProfile.findUnique({
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
          createdAt: true
        }
      },
      workplacePhotos: {
        orderBy: {
          createdAt: 'asc'
        }
      },
      products: {
        where: {
          isActive: true
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
              reviewSubmittedAt: { not: null }, // Only submitted reviews
              rating: { gt: 0 } // Only reviews with rating > 0
            },
            include: {
              buyer: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profileImage: true
                }
              },
              images: {
                take: 3
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      }
    }
  });

  if (!sellerProfile) {
    notFound();
  }

  // Get recipes for this seller
  const recipes = await prisma.dish.findMany({
    where: {
      userId: sellerProfile.User.id,
      status: 'PUBLISHED' // Only show published recipes
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
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  // Flatten reviews from all products
  const allReviews = sellerProfile.products.flatMap(product => 
    product.reviews.map(review => ({
      ...review,
      product: {
        id: product.id,
        title: product.title,
        Image: product.Image.slice(0, 1)
      }
    }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);

  // Combine seller profile with recipes and reviews
  const sellerProfileWithRecipes = {
    ...sellerProfile,
    recipes,
    reviews: allReviews
  };

  // Check if this is the owner's own profile (only if user is logged in)
  const isOwner = session?.user ? (session.user as any).id === sellerProfile.User.id : false;

  return <PublicSellerProfile sellerProfile={sellerProfileWithRecipes} isOwner={isOwner} />;
}