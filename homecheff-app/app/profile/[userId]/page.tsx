import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import PublicProfileClient from './PublicProfileClient';

interface PublicProfilePageProps {
  params: Promise<{ userId: string }>;
}

async function getPublicProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        quote: true,
        place: true,
        gender: true,
        interests: true,
        profileImage: true,
        role: true,
        sellerRoles: true,
        buyerRoles: true,
        displayFullName: true,
        displayNameOption: true,
        createdAt: true,
        // Include seller profile if exists
        SellerProfile: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            companyName: true
          }
        },
        // Include delivery profile if exists
        DeliveryProfile: {
          select: {
            id: true,
            age: true,
            transportation: true,
            maxDistance: true,
            totalDeliveries: true,
            averageRating: true,
            isActive: true
          }
        }
      }
    });
    
    if (!user) {
      return null;
    }

    return { user };
  } catch (error) {
    console.error('getPublicProfile - Error:', error);
    return null;
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  try {
    const { userId } = await params;
    
    // Simple test first
    if (!userId) {
      return (
        <div className="p-8">
          <h1>Error: No userId provided</h1>
        </div>
      );
    }

    const profileData = await getPublicProfile(userId);

    if (!profileData) {
      return (
        <div className="p-8">
          <h1>User not found</h1>
          <p>UserId: {userId}</p>
        </div>
      );
    }

    const { user } = profileData;
    const session = await auth();
    const isOwnProfile = session?.user && (session.user as any).id === user.id;

    return (
      <div className="min-h-screen bg-gray-50">
        <PublicProfileClient 
          user={user as any} 
          openNewProducts={false}
          isOwnProfile={isOwnProfile}
        />
      </div>
    );
  } catch (error) {
    console.error('Profile page error:', error);
    return (
      <div className="p-8">
        <h1>Error loading profile</h1>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}
