import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    // Get users who are sellers (have seller profiles)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            SellerProfile: {
              isNot: null
            }
          },
          search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
              { bio: { contains: search, mode: 'insensitive' } }
            ]
          } : {}
        ]
      },
      include: {
        SellerProfile: {
          select: {
            id: true,
            bio: true,
            Subscription: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                products: {
                  where: {
                    isActive: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            followsAsSeller: true,
            followsAsFollower: true
          }
        }
      },
      orderBy: [
        { profileViews: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Transform users for frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      profileImage: user.profileImage,
      bio: user.SellerProfile?.bio,
      isVerified: false, // Remove isVerified field as it doesn't exist in schema
      subscription: user.SellerProfile?.Subscription,
      productCount: user.SellerProfile?._count.products || 0,
      followerCount: user._count.followsAsSeller,
      followingCount: user._count.followsAsFollower,
      profileViews: user.profileViews || 0,
      createdAt: user.createdAt,
      location: {
        place: user.place,
        lat: user.lat,
        lng: user.lng
      }
    }));

    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length,
      hasMore: transformedUsers.length === limit
    });

  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}
