import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour cache like big platforms

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geocoding';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
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
    const take = Math.min(parseInt(searchParams.get('take') || '10'), 50); // Reduced default to 10

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
    
    // OPTIMIZED: Use select instead of include to only get necessary data
    const users = await prisma.user.findMany({
      where: searchConditions,
      select: {
        id: true,
        name: true,
        username: true,
        profileImage: true,
        bio: true,
        role: true,
        sellerRoles: true,
        buyerRoles: true,
        displayFullName: true,
        displayNameOption: true,
        place: true,
        city: true,
        lat: true,
        lng: true,
        SellerProfile: {
          select: {
            id: true,
            _count: {
              select: {
                products: true // Just count, don't fetch all products
              }
            }
          }
        }
      },
      take: take,
      orderBy: {
        createdAt: 'desc'
      }
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

    // Get follower counts for all users in parallel
    const userIds = filteredUsers.map(u => u.id);
    const followerCounts = userIds.length > 0 ? await prisma.follow.groupBy({
      by: ['sellerId'],
      where: {
        sellerId: { in: userIds }
      },
      _count: {
        sellerId: true
      }
    }) : [];
    
    const followerCountMap = new Map(followerCounts.map((fc: any) => [fc.sellerId, fc._count.sellerId] as [string, number]));

    // Transform data for frontend
    const transformedUsers = filteredUsers
      .map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.profileImage,
        bio: user.bio,
        role: user.role,
        sellerRoles: user.sellerRoles,
        buyerRoles: user.buyerRoles,
        displayFullName: user.displayFullName,
        displayNameOption: user.displayNameOption,
        followerCount: followerCountMap.get(user.id) || 0,
        productCount: user.SellerProfile?._count?.products || 0,
        location: {
          place: user.place || 'Nederland',
          city: user.city || 'Amsterdam',
          lat: user.lat || 52.3676,
          lng: user.lng || 4.9041,
          distanceKm: (lat !== 0 && lng !== 0 && user.lat && user.lng) 
            ? Math.round(calculateDistance(lat, lng, user.lat, user.lng) * 10) / 10
            : null
        }
      }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
