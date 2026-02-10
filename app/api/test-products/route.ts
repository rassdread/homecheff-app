import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        Image: {
          some: {}
        }
      },
      take: 3,
      select: {
        id: true,
        title: true,
        priceCents: true,
        seller: {
          select: {
            lat: true,
            lng: true,
            User: {
              select: { 
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      products: products,
      count: products.length
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
