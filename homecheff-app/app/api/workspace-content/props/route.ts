import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Toggle prop (like/unlike)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceContentId } = body;

    if (!workspaceContentId) {
      return NextResponse.json({ 
        error: 'Workspace content ID is verplicht' 
      }, { status: 400 });
    }

    // Check if prop already exists
    const existingProp = await prisma.workspaceContentProp.findUnique({
      where: {
        workspaceContentId_userId: {
          workspaceContentId,
          userId: (session.user as any).id as string
        }
      }
    });

    if (existingProp) {
      // Unlike - remove prop
      await prisma.workspaceContentProp.delete({
        where: { id: existingProp.id }
      });

      return NextResponse.json({ 
        success: true, 
        action: 'unliked',
        message: 'Prop verwijderd'
      });
    } else {
      // Like - add prop
      await prisma.workspaceContentProp.create({
        data: {
          workspaceContentId,
          userId: (session.user as any).id as string
        }
      });

      return NextResponse.json({ 
        success: true, 
        action: 'liked',
        message: 'Prop toegevoegd'
      });
    }

  } catch (error) {
    console.error('Props toggle error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het toevoegen/verwijderen van prop' 
    }, { status: 500 });
  }
}

// GET - Get props for workspace content
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceContentId = searchParams.get('workspaceContentId');

    if (!workspaceContentId) {
      return NextResponse.json({ 
        error: 'Workspace content ID is verplicht' 
      }, { status: 400 });
    }

    const props = await prisma.workspaceContentProp.findMany({
      where: { workspaceContentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ props });

  } catch (error) {
    console.error('Props fetch error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van props' 
    }, { status: 500 });
  }
}
