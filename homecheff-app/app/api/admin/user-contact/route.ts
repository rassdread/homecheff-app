import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const searchQuery = req.nextUrl.searchParams.get('q');
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 });
    }

    console.log('[Admin User Contact API] Searching for:', searchQuery);

    // Search users by name, username, or email
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { username: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        profileImage: true,
        role: true,
        createdAt: true,
        // Bank info (on User)
        bankName: true,
        iban: true,
        accountHolderName: true,
        // Business info (via SellerProfile)
        SellerProfile: {
          select: {
            companyName: true,
            kvk: true,
            btw: true
          }
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    console.log('[Admin User Contact API] Found users:', users.length);

    return NextResponse.json({ users });

  } catch (error) {
    console.error('[Admin User Contact API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

