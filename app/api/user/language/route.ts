import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get user's language preference
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ language: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true }
    });

    return NextResponse.json({ 
      language: user?.preferredLanguage || null 
    });
  } catch (error) {
    console.error('Error fetching user language preference:', error);
    return NextResponse.json({ language: null }, { status: 500 });
  }
}

// Save user's language preference
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { language } = await req.json();

    if (!language || (language !== 'nl' && language !== 'en')) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: language }
    });

    return NextResponse.json({ success: true, language });
  } catch (error) {
    console.error('Error saving user language preference:', error);
    return NextResponse.json({ error: 'Failed to save language preference' }, { status: 500 });
  }
}















