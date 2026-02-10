import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max duration

// GET - Haal reviews op voor een product (dorpsplein)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'newest';
    const filterBy = searchParams.get('filterBy') || 'all';

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product niet gevonden' }, { status: 404 });
    }

    // Get reviews with buyer info (using ProductReview model)
    // Only show reviews that have been submitted (reviewSubmittedAt is not null)
    const reviews = await prisma.productReview.findMany({
      where: {
        productId: id,
        reviewSubmittedAt: { not: null }, // Only show submitted reviews
        rating: filterBy !== 'all' ? parseInt(filterBy) : { gt: 0 } // Filter by specific rating or > 0
      },
      include: {
        buyer: {
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
        },
        responses: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: {
        createdAt: sortBy === 'oldest' ? 'asc' : 'desc'
      }
    });

    // Sort by rating if needed, or by reviewSubmittedAt/createdAt for newest/oldest
    if (sortBy === 'highest' || sortBy === 'lowest') {
      reviews.sort((a, b) => {
        return sortBy === 'highest' ? b.rating - a.rating : a.rating - b.rating;
      });
    } else if (sortBy === 'newest' || sortBy === 'oldest') {
      // Use reviewSubmittedAt if available, otherwise createdAt
      reviews.sort((a, b) => {
        const dateA = a.reviewSubmittedAt || a.createdAt;
        const dateB = b.reviewSubmittedAt || b.createdAt;
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
      });
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Maak een nieuwe review voor product (alleen voor kopers)
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
    
    const { rating, title, comment, images = [], orderId } = body;

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

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product niet gevonden' }, { status: 404 });
    }

    // IMPORTANT: Check if user has purchased this product
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: user.id,
        stripeSessionId: { not: null }, // Alleen betaalde orders
        items: {
          some: {
            productId: id
          }
        }
      }
    });

    if (!hasPurchased) {
      return NextResponse.json({ 
        error: 'Je moet dit product eerst kopen voordat je een review kunt plaatsen' 
      }, { status: 403 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.productReview.findUnique({
      where: {
        productId_buyerId: {
          productId: id,
          buyerId: user.id
        }
      },
      include: {
        images: true
      }
    });

    // If review already submitted, return error
    if (existingReview && existingReview.reviewSubmittedAt) {
      return NextResponse.json({ error: 'Je hebt dit product al beoordeeld' }, { status: 400 });
    }

    // Verify purchase if orderId is provided
    let isVerified = false;
    let orderIdToUse = orderId || null;
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: user.id,
          items: {
            some: {
              productId: id
            }
          }
        }
      });
      isVerified = !!order;
      orderIdToUse = orderId;
    } else if (hasPurchased) {
      // If no orderId but user has purchased, mark as verified
      isVerified = true;
      orderIdToUse = hasPurchased.id || null;
    }

    // Validate and filter images
    let validImages: string[] = [];
    if (images && Array.isArray(images)) {
      validImages = images
        .filter((url: any) => {
          if (typeof url !== 'string') return false;
          if (!url.trim()) return false;
          
          // Reject base64 data URLs that are too large (max 2MB for database)
          if (url.startsWith('data:image/')) {
            if (url.length > 2 * 1024 * 1024) {
              console.warn('Base64 image too large, skipping:', url.substring(0, 100));
              return false;
            }
          }
          
          // Accept Vercel Blob URLs or other valid URLs
          return true;
        })
        .map((url: string) => url.trim());
    }

    // If existing review exists but not submitted (placeholder from webhook), update it
    // Otherwise create new review
    let review;
    if (existingReview && !existingReview.reviewSubmittedAt) {
      // Update existing placeholder review
      // Delete existing images first
      if (existingReview.images && existingReview.images.length > 0) {
        await prisma.reviewImage.deleteMany({
          where: { reviewId: existingReview.id }
        });
      }

      review = await prisma.productReview.update({
        where: { id: existingReview.id },
        data: {
          rating,
          title: title?.trim() || null,
          comment: comment.trim(),
          reviewSubmittedAt: new Date(),
          isVerified: true, // Verified because user purchased the product
          reviewToken: null, // Invalidate token after submission
          images: validImages.length > 0 ? {
            create: validImages.map((url: string, index: number) => ({
              url,
              sortOrder: index
            }))
          } : undefined
        },
        include: {
          buyer: {
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
          product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });
    } else {
      // Create new review
      review = await prisma.productReview.create({
        data: {
          productId: id,
          buyerId: user.id,
          orderId: orderIdToUse,
          rating,
          title: title?.trim() || null,
          comment: comment.trim(),
          reviewSubmittedAt: new Date(),
          isVerified,
          images: validImages.length > 0 ? {
            create: validImages.map((url: string, index: number) => ({
              url,
              sortOrder: index
            }))
          } : undefined
        },
        include: {
          buyer: {
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
          product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });
    }

    // Create notification for seller about new review
    if (review.product?.seller?.User?.id) {
      try {
        await prisma.notification.create({
          data: {
            id: `review_${review.id}_${Date.now()}`,
            userId: review.product.seller.User.id,
            type: 'REVIEW_RECEIVED',
            payload: {
              title: '⭐ Nieuwe review ontvangen!',
              message: `${review.buyer.name || 'Een klant'} heeft een ${rating}-sterren review achtergelaten voor ${review.product.title}`,
              reviewId: review.id,
              productId: review.productId,
              rating: rating,
              link: `/verkoper/products/${review.productId}`
            }
          }
        });
      } catch (notificationError) {
        console.error('Error creating review notification:', notificationError);
        // Don't fail the review creation if notification fails
      }
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product review:', error);
    
    // Provide more detailed error information
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Je hebt dit product al beoordeeld' }, { status: 400 });
    }
    
    // Check for database constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Product of gebruiker niet gevonden' }, { status: 404 });
    }
    
    // Check for value too long error (likely from base64 images)
    if (error.message?.includes('value too long') || error.message?.includes('string too long')) {
      return NextResponse.json({ 
        error: 'Een of meer foto\'s zijn te groot. Probeer kleinere foto\'s of upload ze eerst naar de galerij.',
        details: process.env.NODE_ENV === 'development' 
          ? 'Tip: Gebruik BLOB_READ_WRITE_TOKEN om Vercel Blob storage te gebruiken in plaats van base64.' 
          : undefined
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' 
        ? (error.message || String(error)) 
        : undefined
    }, { status: 500 });
  }
}


