import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max duration

// GET - Haal reviews op voor een inspiratie item (dish)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'newest';
    const filterBy = searchParams.get('filterBy') || 'all';

    // Check if dish exists
    const dish = await prisma.dish.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!dish) {
      return NextResponse.json({ error: 'Inspiratie item niet gevonden' }, { status: 404 });
    }

    // Get reviews with reviewer info - gracefully handle if table doesn't exist
    const reviews = await prisma.dishReview.findMany({
      where: {
        dishId: id,
        ...(filterBy !== 'all' ? { rating: parseInt(filterBy) } : {})
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            image: true,
            displayFullName: true,
            displayNameOption: true
          }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: {
        createdAt: sortBy === 'oldest' ? 'asc' : 'desc'
      }
    }).catch(() => [] as any[]); // Return empty array if table doesn't exist

    // Sort by rating if needed
    if (sortBy === 'highest' || sortBy === 'lowest') {
      reviews.sort((a: any, b: any) => {
        return sortBy === 'highest' ? b.rating - a.rating : a.rating - b.rating;
      });
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching dish reviews:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Maak een nieuwe review voor inspiratie item (iedereen kan posten)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { id } = await params;
    
    // Parse JSON with increased body size limit handling
    let body;
    try {
      body = await request.json();
    } catch (error: any) {
      if (error.message?.includes('body') || error.message?.includes('size') || error.message?.includes('413')) {
        return NextResponse.json({ 
          error: 'Request body te groot. Maximum 10MB toegestaan. Probeer kleinere foto\'s of gebruik BLOB_READ_WRITE_TOKEN.',
          details: process.env.NODE_ENV === 'development' 
            ? 'Tip: Voeg BLOB_READ_WRITE_TOKEN toe aan .env.local om Vercel Blob storage te gebruiken.' 
            : undefined
        }, { status: 413 });
      }
      throw error;
    }
    
    const { rating, title, comment, images = [] } = body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Ongeldige rating (moet tussen 1 en 5 zijn)' }, { status: 400 });
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Commentaar is verplicht' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Check if dish exists
    const dish = await prisma.dish.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!dish) {
      return NextResponse.json({ error: 'Inspiratie item niet gevonden' }, { status: 404 });
    }

    // Check if user already reviewed this dish - gracefully handle if table doesn't exist
    const existingReview = await prisma.dishReview.findUnique({
      where: {
        dishId_reviewerId: {
          dishId: id,
          reviewerId: user.id
        }
      }
    }).catch(() => null);

    if (existingReview) {
      return NextResponse.json({ error: 'Je hebt dit item al beoordeeld' }, { status: 400 });
    }

    // Create review (iedereen kan posten, geen purchase check nodig)
    // Check if table exists first
    try {
      // Filter out empty or invalid image URLs
      const validImages = (images || []).filter((url: string) => {
        if (!url || url.trim().length === 0) return false;
        // Check if URL is too long (base64 data URLs can be very long)
        // PostgreSQL TEXT can handle up to ~1GB, but we'll limit to 10MB for safety
        const maxUrlLength = 10 * 1024 * 1024; // 10MB
        if (url.length > maxUrlLength) {
          console.warn(`⚠️ Image URL too long (${url.length} bytes), skipping`);
          return false;
        }
        return true;
      });
      
      console.log(`📝 Creating review with ${validImages.length} images`);
      if (validImages.length > 0) {
        console.log(`📸 First image URL length: ${validImages[0].length} bytes`);
        console.log(`📸 First image URL type: ${validImages[0].startsWith('data:') ? 'base64' : 'blob'}`);
      }
      
      // Create review - updatedAt will be set by database default (CURRENT_TIMESTAMP)
      const review = await prisma.dishReview.create({
        data: {
          dishId: id,
          reviewerId: user.id,
          rating,
          title: title?.trim() || null,
          comment: comment.trim(),
          isVerified: false, // Inspiratie reviews zijn niet verified
          // updatedAt is set by database default - do not include in create data
          ...(validImages.length > 0 && {
            images: {
              create: validImages.map((url: string, index: number) => ({
                url: url.trim(),
                sortOrder: index
              }))
            }
          })
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
              image: true,
              displayFullName: true,
              displayNameOption: true
            }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });

      return NextResponse.json({ review }, { status: 201 });
    } catch (createError: any) {
      // Check if it's a table doesn't exist error
      if (createError.code === 'P2021' || createError.message?.includes('does not exist')) {
        console.error('❌ DishReview table does not exist yet:', createError);
        return NextResponse.json({ 
          error: 'Review functionaliteit is nog niet beschikbaar. De database tabel moet nog worden aangemaakt.' 
        }, { status: 503 });
      }
      throw createError;
    }
  } catch (error: any) {
    console.error('❌ Error creating dish review:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a request body size error
    if (error.message?.includes('request entity too large') || 
        error.message?.includes('PayloadTooLargeError') ||
        error.message?.includes('413')) {
      return NextResponse.json({ 
        error: 'De foto\'s zijn te groot om te uploaden. Probeer kleinere foto\'s of stel BLOB_READ_WRITE_TOKEN in voor lokale ontwikkeling.',
        details: process.env.NODE_ENV === 'development' 
          ? 'Tip: Voeg BLOB_READ_WRITE_TOKEN toe aan .env.local om Vercel Blob storage te gebruiken in plaats van base64 encoding.' 
          : undefined
      }, { status: 413 });
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Je hebt dit item al beoordeeld' }, { status: 400 });
    }
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Review functionaliteit is nog niet beschikbaar. De database tabel moet nog worden aangemaakt.' 
      }, { status: 503 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Database constraint error. Controleer of alle relaties correct zijn.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 400 });
    }
    return NextResponse.json({ 
      error: 'Server error', 
      details: process.env.NODE_ENV === 'development' ? `${error.message || 'Unknown error'} (Code: ${error.code || 'N/A'})` : undefined 
    }, { status: 500 });
  }
}


