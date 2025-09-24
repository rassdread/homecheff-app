import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const userRole = searchParams.get('userRole') || 'all';
    const radius = parseFloat(searchParams.get('radius') || '10');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    // Build search conditions
    const searchConditions: any = {
      OR: []
    };

    if (q) {
      searchConditions.OR.push(
        { name: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } }
      );
    }

    // Add role filtering
    if (userRole !== 'all') {
      if (userRole === 'ADMIN') {
        searchConditions.role = 'ADMIN';
      } else if (userRole === 'DELIVERY') {
        searchConditions.buyerRoles = {
          has: 'DELIVERY'
        };
      } else {
        // For seller roles (CHEFF, GROWN, DESIGNER)
        searchConditions.sellerRoles = {
          has: userRole
        };
      }
    }

    // Get users with their profiles and location data
    const whereClause = searchConditions.OR.length > 0 ? searchConditions : {};
    
    // If we have role filtering but no search term, we need to adjust the where clause
    if (userRole !== 'all' && searchConditions.OR.length === 0) {
      delete whereClause.OR;
    }
    
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        sellerProfile: {
          include: {
            workplacePhotos: true
          }
        },
        deliveryProfile: true
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
    const transformedUsers = filteredUsers.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      role: user.role,
      sellerRoles: user.sellerRoles,
      buyerRoles: user.buyerRoles,
      followerCount: 0, // TODO: implement follower count
      productCount: user.sellerProfile?.products?.length || 0,
      location: {
        place: 'Nederland', // TODO: implement location data
        city: 'Amsterdam',
        lat: 52.3676,
        lng: 4.9041,
        distanceKm: 0 // TODO: calculate distance
      }
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
