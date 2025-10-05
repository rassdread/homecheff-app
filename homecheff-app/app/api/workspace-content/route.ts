import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch workspace content for a seller
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');
    const type = searchParams.get('type');

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is verplicht' }, { status: 400 });
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
            sellerRoles: true
          }
        }
      }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller niet gevonden' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      sellerProfileId: sellerId,
      isPublic: true
    };

    if (type) {
      where.type = type;
    }

    // Get workspace content
    const content = await prisma.workspaceContent.findMany({
      where,
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' }
        },
        props: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        comments: {
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
        },
        recipe: true,
        growingProcess: true,
        designItem: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ content, sellerProfile });

  } catch (error) {
    console.error('Workspace content fetch error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van content' 
    }, { status: 500 });
  }
}

// POST - Create new workspace content
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      sellerProfileId, 
      type, 
      title, 
      description, 
      isPublic = true,
      recipeData,
      growingProcessData,
      designItemData
    } = body;

    if (!sellerProfileId || !type || !title) {
      return NextResponse.json({ 
        error: 'Seller ID, type en titel zijn verplicht' 
      }, { status: 400 });
    }

    // Verify user owns this seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      select: { userId: true }
    });

    if (!sellerProfile || sellerProfile.userId !== (session.user as any).id) {
      return NextResponse.json({ 
        error: 'Geen toegang tot dit seller profiel' 
      }, { status: 403 });
    }

    // Create workspace content
    const workspaceContent = await prisma.workspaceContent.create({
      data: {
        sellerProfileId,
        type,
        title,
        description,
        isPublic,
        ...(type === 'RECIPE' && recipeData && {
          recipe: {
            create: recipeData
          }
        }),
        ...(type === 'GROWING_PROCESS' && growingProcessData && {
          growingProcess: {
            create: growingProcessData
          }
        }),
        ...(type === 'DESIGN_ITEM' && designItemData && {
          designItem: {
            create: designItemData
          }
        })
      },
      include: {
        photos: true,
        props: true,
        comments: true,
        recipe: true,
        growingProcess: true,
        designItem: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      content: workspaceContent,
      message: 'Content succesvol aangemaakt'
    });

  } catch (error) {
    console.error('Workspace content creation error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het aanmaken van content' 
    }, { status: 500 });
  }
}
