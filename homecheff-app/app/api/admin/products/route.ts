import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    // Get all products (both new Product model and old Listing model)
    const [newProducts, oldListings] = await Promise.all([
      prisma.product.findMany({
        where: {
          // Only get active products, not soft-deleted ones
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                  profileImage: true
                }
              }
            }
          },
          Image: {
            select: { fileUrl: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      }),
      prisma.listing.findMany({
        where: {
          // Only get active listings, not soft-deleted ones
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              profileImage: true
            }
          },
          ListingMedia: {
            select: { url: true, order: true },
            orderBy: { order: 'asc' }
          }
        }
      })
    ]);

    // Transform old listings to match new product format
    const transformedListings = oldListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      description: listing.description || '',
      priceCents: listing.priceCents,
      category: (listing as any).vertical || 'CHEFF',
      isActive: listing.status === 'ACTIVE',
      createdAt: listing.createdAt,
      seller: {
        User: listing.User
      },
      Image: listing.ListingMedia.map(media => ({
        fileUrl: media.url,
        sortOrder: media.order
      }))
    }));

    // Combine and sort all products
    const allProducts = [...newProducts, ...transformedListings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ products: allProducts });
  } catch (err: any) {
    console.error('Admin products fetch failed:', err);
    return NextResponse.json({ error: err?.message || 'Serverfout' }, { status: 500 });
  }
}
