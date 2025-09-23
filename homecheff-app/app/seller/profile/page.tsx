import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SellerProfile from '@/components/seller/SellerProfile';

export default async function SellerProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has seller profile
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          sellerRoles: true
        }
      },
      workplacePhotos: {
        orderBy: [
          { role: 'asc' },
          { sortOrder: 'asc' }
        ]
      },
      products: {
        select: {
          id: true,
          title: true,
          priceCents: true,
          images: true,
          status: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 6
      }
    }
  });

  if (!sellerProfile) {
    redirect('/seller/signup');
  }

  // Check if user has required photos for their roles
  const userRoles = sellerProfile.user.sellerRoles || [];
  const rolePhotoCounts: { [key: string]: number } = {};
  
  for (const photo of sellerProfile.workplacePhotos) {
    rolePhotoCounts[photo.role] = (rolePhotoCounts[photo.role] || 0) + 1;
  }

  const missingPhotos = userRoles.filter(role => 
    (rolePhotoCounts[role] || 0) < 2
  );

  return (
    <SellerProfile 
      sellerProfile={sellerProfile} 
      missingPhotos={missingPhotos}
      rolePhotoCounts={rolePhotoCounts}
    />
  );
}
