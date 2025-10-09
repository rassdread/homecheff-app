import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow public access to user search for better discoverability
    // Users can search for sellers/chefs even without being logged in

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const userRole = searchParams.get('userRole') || 'all';
    const radius = parseFloat(searchParams.get('radius') || '10');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    // Build search conditions
    const searchConditions: any = {
      // Always exclude ADMIN users from search results
      role: {
        not: 'ADMIN'
      }
    };

    // Add text search conditions
    if (q && q.trim()) {
      const searchTerm = q.trim();
      
      // Search in multiple fields: name, username, bio, place, city
      // The name search will match first names and last names since it uses 'contains'
      searchConditions.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { username: { contains: searchTerm, mode: 'insensitive' } },
        { bio: { contains: searchTerm, mode: 'insensitive' } },
        { place: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Add role filtering
    if (userRole !== 'all') {
      if (userRole === 'DELIVERY') {
        searchConditions.buyerRoles = {
          has: 'DELIVERY'
        };
      } else {
        // For seller roles (chef, garden, designer)
        searchConditions.sellerRoles = {
          has: userRole
        };
      }
    }
    
    const users = await prisma.user.findMany({
      where: searchConditions,
      include: {
        SellerProfile: {
          include: {
            workplacePhotos: true,
            products: {
              select: {
                id: true
              }
            }
          }
        },
        DeliveryProfile: true
      },
      take: 50
    });

    // Filter by location if coordinates are provided
    let filteredUsers = users;
    if (lat !== 0 && lng !== 0) {
      filteredUsers = users.filter(user => {
        // For now, we'll include all users since we don't have location data in User model
        // In a real implementation, you'd check against user location data
        return true;
      });
    }

    // Transform data for frontend
    const transformedUsers = filteredUsers
      .map(user => ({
        id: user.id,
        name: user.name,
        username: user.username, // Keep original username (can be null)
        image: user.image,
        bio: user.bio,
        role: user.role,
        sellerRoles: user.sellerRoles,
        buyerRoles: user.buyerRoles,
        displayFullName: user.displayFullName,
        displayNameOption: user.displayNameOption,
        followerCount: 0, // TODO: implement follower count
        productCount: user.SellerProfile?.products?.length || 0,
        location: {
          place: user.place || 'Nederland',
          city: user.city || 'Amsterdam',
          lat: user.lat || 52.3676,
          lng: user.lng || 4.9041,
          distanceKm: 0 // TODO: calculate distance
        }
      }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
