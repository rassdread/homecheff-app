import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        profileImage: true,
        role: true,
        bio: true,
        quote: true,
        place: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        lat: true,
        lng: true,
        phoneNumber: true,
        sellerRoles: true,
        buyerRoles: true,
        displayFullName: true,
        displayNameOption: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    return NextResponse.json(user, { headers: cors });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500, headers: cors }
    );
  }
}

