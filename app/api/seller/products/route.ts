import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let user;
    
    if (userId) {
      // Get user by ID for public profile
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true }
      });
    } else {
      // Get current user for private profile
      // NextAuth v5
      try {
        const mod: any = await import("@/lib/auth");
        const session = await mod.auth?.();
        const email: string | undefined = session?.user?.email || undefined;
        if (email) {
          user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, username: true }
          });
        }
      } catch {}
      
      // NextAuth v4 fallback
      if (!user) {
        try {
          const { getServerSession } = await import("next-auth");
          const { authOptions } = await import("@/lib/auth");
          const session = await getServerSession(authOptions as any);
          const email: string | undefined = (session as any)?.user?.email;
          if (email) {
            user = await prisma.user.findUnique({
              where: { email },
              select: { id: true, name: true, username: true }
            });
          }
        } catch {}
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get seller profile
    let sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    // If no sellerProfile exists, create one automatically
    // This ensures admin users (or other users) who have products can see them
    if (!sellerProfile) {
      const crypto = require('crypto');
      try {
        sellerProfile = await prisma.sellerProfile.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            displayName: user.name || user.username || 'Mijn Bedrijf',
            bio: 'Verkoop via HomeCheff',
            deliveryMode: 'FIXED',
            deliveryRadius: 5
          },
          select: { id: true }
        });
      } catch (error) {
        // If creation fails (e.g., already exists or constraint violation), try to find it again
        sellerProfile = await prisma.sellerProfile.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });
        
        // If still no sellerProfile after error, return empty array
        if (!sellerProfile) {
          return NextResponse.json({ products: [] });
        }
      }
    }

    // Get products - include both active and inactive products
    // Inactive products with orders should still be visible on seller's profile
    const products = await prisma.product.findMany({
      where: { 
        sellerId: sellerProfile.id,
        // Show all products (active and inactive) on seller's own profile
      },
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
      Image: product.Image, // Include full Image array for MyDishesManager
      createdAt: product.createdAt,
      category: product.category,
      subcategory: product.subcategory,
      delivery: product.delivery,
      stock: product.stock,
      maxStock: product.maxStock,
      isActive: product.isActive
    }));

    return NextResponse.json({ products: transformedProducts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}