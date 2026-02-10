import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { productId } = await req.json();

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

    // Check if user has already given props to this product
    const existingProps = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        productId: productId,
      }
    });

    let propsGiven = false;

    if (existingProps) {
      // Remove props
      await prisma.favorite.delete({
        where: {
          id: existingProps.id
        }
      });
      propsGiven = false;
    } else {
      // Give props
      await prisma.favorite.create({
        data: {
          userId: user.id,
          productId: productId,
        }
      });
      propsGiven = true;
    }

    return NextResponse.json({ 
      propsGiven,
      productId 
    });

  } catch (error) {
    console.error('Error toggling props:', error);
    return NextResponse.json({ error: 'Failed to toggle props' }, { status: 500 });
  }
}
