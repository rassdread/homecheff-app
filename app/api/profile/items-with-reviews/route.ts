import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const submittedProductReviewWhere = {
  reviewSubmittedAt: { not: null },
  rating: { gt: 0 },
} as const;

// GET - Haal items met reviews op voor profiel tab (owner)
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const dishesWithReviews = await prisma.dish.findMany({
      where: {
        userId: user.id,
        status: 'PUBLISHED',
        reviews: { some: {} },
      },
      include: {
        photos: { where: { isMain: true }, take: 1, orderBy: { idx: 'asc' } },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                image: true,
              },
            },
            images: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, url: true, sortOrder: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: { select: { reviews: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const productsWithReviews = await prisma.product.findMany({
      where: {
        seller: { userId: user.id },
        isActive: true,
        reviews: { some: submittedProductReviewWhere },
      },
      include: {
        Image: { where: { sortOrder: 0 }, take: 1 },
        reviews: {
          where: submittedProductReviewWhere,
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                image: true,
              },
            },
            images: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, url: true, sortOrder: true },
            },
          },
          orderBy: { reviewSubmittedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { reviews: { where: submittedProductReviewWhere } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = [
      ...dishesWithReviews.map((dish) => ({
        id: dish.id,
        type: 'dish' as const,
        title: dish.title,
        description: dish.description,
        category: dish.category,
        image: dish.photos[0]?.url || null,
        reviewCount: dish._count.reviews,
        averageRating:
          dish.reviews.length > 0
            ? Math.round(
                (dish.reviews.reduce((sum, r) => sum + r.rating, 0) /
                  dish.reviews.length) *
                  10,
              ) / 10
            : 0,
        recentReviews: dish.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || '',
          images: r.images ?? [],
          reviewer: {
            id: r.reviewer.id,
            name: r.reviewer.name,
            username: r.reviewer.username,
            image: r.reviewer.profileImage || r.reviewer.image,
          },
          createdAt: r.createdAt.toISOString(),
        })),
        createdAt: dish.createdAt.toISOString(),
        updatedAt: dish.updatedAt.toISOString(),
      })),
      ...productsWithReviews.map((product) => ({
        id: product.id,
        type: 'product' as const,
        title: product.title,
        description: product.description,
        category: product.category,
        image: product.Image[0]?.fileUrl || null,
        reviewCount: product._count.reviews,
        averageRating:
          product.reviews.length > 0
            ? Math.round(
                (product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                  product.reviews.length) *
                  10,
              ) / 10
            : 0,
        recentReviews: product.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || '',
          images: r.images ?? [],
          reviewer: {
            id: r.buyer.id,
            name: r.buyer.name,
            username: r.buyer.username,
            image: r.buyer.profileImage || r.buyer.image,
          },
          createdAt: (r.reviewSubmittedAt ?? r.createdAt).toISOString(),
        })),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.createdAt.toISOString(),
      })),
    ].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items with reviews:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
