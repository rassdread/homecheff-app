import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { isOnline } = body;

    // Update delivery profile online status
    const updatedProfile = await prisma.deliveryProfile.update({
      where: { userId: user.id },
      data: {
        isOnline: isOnline,
        lastOnlineAt: isOnline ? new Date() : undefined,
        lastOfflineAt: !isOnline ? new Date() : undefined
      }
    });

    console.log(`✅ Deliverer ${user.id} is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

    return NextResponse.json({
      success: true,
      isOnline: updatedProfile.isOnline,
      message: isOnline 
        ? 'Je bent nu online en ontvangt bestellingen' 
        : 'Je bent nu offline en ontvangt geen bestellingen'
    });

  } catch (error) {
    console.error('Error toggling delivery status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle delivery status' },
      { status: 500 }
    );
  }
}

