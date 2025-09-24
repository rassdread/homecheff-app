import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import SellerProfile from '@/components/seller/SellerProfile';

interface PublicSellerProfilePageProps {
  params: {
    sellerId: string;
  };
}

export default async function PublicSellerProfilePage({ params }: PublicSellerProfilePageProps) {
  const { sellerId } = params;
  
  // Check if user is logged in
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Get seller profile with all necessary data
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          sellerRoles: true,
          bio: true
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
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 12
      }
    }
  });

  if (!sellerProfile) {
    notFound();
  }

  // Check if this is the owner's own profile
  const isOwner = (session.user as any).id === sellerProfile.User.id;

  return <SellerProfile sellerProfile={sellerProfile} isOwner={isOwner} />;
}