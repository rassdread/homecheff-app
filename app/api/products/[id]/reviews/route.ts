import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Haal reviews op voor een product
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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get reviews with buyer info
    // Only show reviews that have been submitted (reviewSubmittedAt is not null)
    const reviews = await prisma.productReview.findMany({
      where: {
        productId: id,
        reviewSubmittedAt: { not: null }, // Only show submitted reviews
        ...(filterBy !== 'all' ? { rating: parseInt(filterBy) } : { rating: { gt: 0 } }) // Filter by specific rating or > 0
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
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
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Maak een nieuwe review
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { rating, title, comment, images = [], orderId } = await request.json();

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Validate images array
    let validImages: string[] = [];
    if (images) {
      if (!Array.isArray(images)) {
        return NextResponse.json({ error: 'Images must be an array' }, { status: 400 });
      }
      
      // Filter and validate image URLs
      validImages = images
        .filter((url: any) => {
          // Only accept strings
          if (typeof url !== 'string') return false;
          // URL must not be empty
          if (!url.trim()) return false;
          
          // Reject base64 data URLs that are too large (max 2MB for database)
          if (url.startsWith('data:image/')) {
            if (url.length > 2 * 1024 * 1024) {
              console.warn('Base64 image too large, skipping:', url.substring(0, 100));
              return false;
            }
          } else {
            // For other URLs (Vercel Blob, etc.), limit to 500KB to be safe
            if (url.length > 500 * 1024) {
              console.warn('Image URL too long, skipping:', url.substring(0, 100));
              return false;
            }
          }
          
          return true;
        })
        .map((url: string) => url.trim());
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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
        error: 'You must purchase this product before you can review it' 
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
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
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
              profileImage: true
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
              profileImage: true
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
  } catch (error) {
    console.error('Error creating review:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Server error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for common Prisma errors
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'Je hebt dit product al beoordeeld';
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Product of gebruiker niet gevonden';
      } else if (error.message.includes('value too long') || error.message.includes('string too long')) {
        errorMessage = 'Een of meer foto\'s zijn te groot. Probeer kleinere foto\'s of upload ze eerst naar de galerij.';
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    }, { status: 500 });
  }
}

