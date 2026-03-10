import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

// Get user's language preference
export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ language: null }, { headers: cors });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true }
    });

    return NextResponse.json(
      { language: user?.preferredLanguage || null },
      { headers: cors }
    );
  } catch {
    return NextResponse.json({ language: null }, { status: 500, headers: cors });
  }
}

// Save user's language preference
export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: cors });
    }

    const { language } = await req.json();

    if (!language || (language !== 'nl' && language !== 'en')) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400, headers: cors });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: language }
    });

    return NextResponse.json({ success: true, language }, { headers: cors });
  } catch (error) {
    console.error('Error saving user language preference:', error);
    return NextResponse.json({ error: 'Failed to save language preference' }, { status: 500, headers: cors });
  }
}















