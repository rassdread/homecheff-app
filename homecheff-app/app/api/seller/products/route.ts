import { NextResponse } from "next/server";
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

        // Get seller profile
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });

        if (!sellerProfile) {
          return NextResponse.json({ products: [] });
        }

        // Get products
        const products = await prisma.product.findMany({
          where: { sellerId: sellerProfile.id },
          include: {
            Image: {
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Transform products to match expected format
        const transformedProducts = products.map(product => ({
          id: product.id,
          title: product.title,
          description: product.description,
          priceCents: product.priceCents,
          image: product.Image?.[0]?.fileUrl || null,
          createdAt: product.createdAt,
          category: product.category,
          stock: product.stock,
          maxStock: product.maxStock,
          isActive: product.isActive
        }));

        return NextResponse.json({ products: transformedProducts });
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

        // Get seller profile
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });

        if (!sellerProfile) {
          return NextResponse.json({ products: [] });
        }

        // Get products
        const products = await prisma.product.findMany({
          where: { sellerId: sellerProfile.id },
          include: {
            Image: {
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Transform products to match expected format
        const transformedProducts = products.map(product => ({
          id: product.id,
          title: product.title,
          description: product.description,
          priceCents: product.priceCents,
          image: product.Image?.[0]?.fileUrl || null,
          createdAt: product.createdAt,
          category: product.category,
          stock: product.stock,
          maxStock: product.maxStock,
          isActive: product.isActive
        }));

        return NextResponse.json({ products: transformedProducts });
      }
    } catch {}

    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}