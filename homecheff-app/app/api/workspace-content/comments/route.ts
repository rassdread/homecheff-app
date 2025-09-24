import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Add comment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceContentId, content, parentId } = body;

    if (!workspaceContentId || !content) {
      return NextResponse.json({ 
        error: 'Workspace content ID en content zijn verplicht' 
      }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ 
        error: 'Commentaar mag maximaal 1000 karakters zijn' 
      }, { status: 400 });
    }

    // Verify workspace content exists and is public
    const workspaceContent = await prisma.workspaceContent.findUnique({
      where: { id: workspaceContentId },
      select: { isPublic: true }
    });

    if (!workspaceContent || !workspaceContent.isPublic) {
      return NextResponse.json({ 
        error: 'Content niet gevonden of niet publiek' 
      }, { status: 404 });
    }

    // If parentId is provided, verify it exists and belongs to same content
    if (parentId) {
      const parentComment = await prisma.workspaceContentComment.findFirst({
        where: {
          id: parentId,
          workspaceContentId
        }
      });

      if (!parentComment) {
        return NextResponse.json({ 
          error: 'Ouder commentaar niet gevonden' 
        }, { status: 404 });
      }
    }

    // Create comment
    const comment = await prisma.workspaceContentComment.create({
      data: {
        workspaceContentId,
        userId: (session.user as any).id as string,
        content: content.trim(),
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      comment,
      message: 'Commentaar toegevoegd'
    });

  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het toevoegen van commentaar' 
    }, { status: 500 });
  }
}

// GET - Get comments for workspace content
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceContentId = searchParams.get('workspaceContentId');

    if (!workspaceContentId) {
      return NextResponse.json({ 
        error: 'Workspace content ID is verplicht' 
      }, { status: 400 });
    }

    const comments = await prisma.workspaceContentComment.findMany({
      where: { 
        workspaceContentId,
        parentId: null // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ comments });

  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van commentaren' 
    }, { status: 500 });
  }
}

// DELETE - Delete comment (only by owner)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ 
        error: 'Comment ID is verplicht' 
      }, { status: 400 });
    }

    // Verify user owns this comment
    const comment = await prisma.workspaceContentComment.findUnique({
      where: { id: commentId },
      select: { userId: true }
    });

    if (!comment || comment.userId !== (session.user as any).id) {
      return NextResponse.json({ 
        error: 'Geen toegang tot dit commentaar' 
      }, { status: 403 });
    }

    // Delete comment (cascade will handle replies)
    await prisma.workspaceContentComment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Commentaar verwijderd'
    });

  } catch (error) {
    console.error('Comment deletion error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het verwijderen van commentaar' 
    }, { status: 500 });
  }
}
