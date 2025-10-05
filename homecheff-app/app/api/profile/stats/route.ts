import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // NextAuth v5
    try {
      const mod: any = await import("@/lib/auth");
      const session = await mod.auth?.();
      const email: string | undefined = session?.user?.email || undefined;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true }
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get statistics
        const [dishesCount, productsCount, followersCount, followingCount, favoritesCount, ordersCount] = await Promise.all([
          // Dishes count
          prisma.dish.count({
            where: { userId: user.id }
          }),
          // Products count
          prisma.product.count({
            where: { 
              seller: {
                userId: user.id
              }
            }
          }),
          // Followers count (users who follow this user as seller)
          prisma.follow.count({
            where: { sellerId: user.id }
          }),
          // Following count (users this user follows as seller)
          prisma.follow.count({
            where: { followerId: user.id }
          }),
          // Favorites count
          prisma.favorite.count({
            where: { userId: user.id }
          }),
          // Orders count
          prisma.order.count({
            where: { userId: user.id }
          })
        ]);

        const totalItems = dishesCount + productsCount;

        return NextResponse.json({
          items: totalItems,
          dishes: dishesCount,
          products: productsCount,
          followers: followersCount,
          following: followingCount,
          favorites: favoritesCount,
          orders: ordersCount
        });
      }
    } catch {}

    // NextAuth v4
    try {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions as any);
      const email: string | undefined = (session as any)?.user?.email;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true }
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get statistics
        const [dishesCount, productsCount, followersCount, followingCount, favoritesCount, ordersCount] = await Promise.all([
          // Dishes count
          prisma.dish.count({
            where: { userId: user.id }
          }),
          // Products count
          prisma.product.count({
            where: { 
              seller: {
                userId: user.id
              }
            }
          }),
          // Followers count (users who follow this user as seller)
          prisma.follow.count({
            where: { sellerId: user.id }
          }),
          // Following count (users this user follows as seller)
          prisma.follow.count({
            where: { followerId: user.id }
          }),
          // Favorites count
          prisma.favorite.count({
            where: { userId: user.id }
          }),
          // Orders count
          prisma.order.count({
            where: { userId: user.id }
          })
        ]);

        const totalItems = dishesCount + productsCount;

        return NextResponse.json({
          items: totalItems,
          dishes: dishesCount,
          products: productsCount,
          followers: followersCount,
          following: followingCount,
          favorites: favoritesCount,
          orders: ordersCount
        });
      }
    } catch {}

    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}






