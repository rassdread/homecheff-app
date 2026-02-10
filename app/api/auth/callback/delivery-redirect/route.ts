import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // First get the user, then check for delivery profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has delivery profile
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { 
        userId: user.id
      }
    });

    if (deliveryProfile) {
      // User has delivery profile, redirect to delivery dashboard
      return NextResponse.redirect(new URL('/delivery/dashboard', request.url));
    }

    // User doesn't have delivery profile, redirect to inspiratie
    return NextResponse.redirect(new URL('/inspiratie', request.url));

  } catch (error) {
    console.error('Delivery redirect error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
