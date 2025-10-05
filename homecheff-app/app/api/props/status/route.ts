import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has given props to this product
    const props = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        productId: productId,
      }
    });

    return NextResponse.json({ 
      propsGiven: !!props,
      productId 
    });

  } catch (error) {
    console.error('Error checking props status:', error);
    return NextResponse.json({ error: 'Failed to check props status' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
