import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if user has given props to this product
    const props = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        productId: productId,
        // We'll use the existing Favorite model but with a special type for props
        // You might want to create a separate Props model later
      }
    });

    return NextResponse.json({ 
      propsGiven: !!props,
      productId 
    });

  } catch (error) {
    console.error('Error checking props status:', error);
    return NextResponse.json({ error: 'Failed to check props status' }, { status: 500 });
  }
}
