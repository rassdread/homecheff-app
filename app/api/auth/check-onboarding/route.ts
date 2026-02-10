import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check database directly to ensure we have the latest onboarding status
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        username: true,
        socialOnboardingCompleted: true,
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasTempUsername = dbUser.username?.startsWith('temp_');
    const onboardingCompleted = dbUser.socialOnboardingCompleted === true;

    return NextResponse.json({
      hasTempUsername,
      onboardingCompleted,
      username: dbUser.username
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}















