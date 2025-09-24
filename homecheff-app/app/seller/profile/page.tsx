import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SellerProfile from '@/components/seller/SellerProfile';

export default async function SellerProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  
  // First check if user has seller roles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      image: true, 
      sellerRoles: true 
    }
  });

  if (!user) {
    redirect('/login');
  }

  // Check if user has seller roles
  if (!user.sellerRoles || user.sellerRoles.length === 0) {
    redirect('/register');
  }

  // Check if user has seller profile
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: userId },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          sellerRoles: true
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
    // User has seller roles but no profile - redirect to register to complete setup
    redirect('/register');
  }

  return <SellerProfile sellerProfile={sellerProfile} isOwner={true} />;
}
