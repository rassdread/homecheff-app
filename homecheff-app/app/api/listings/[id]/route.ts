import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: {
        id,
      },
      include: {
        User: { 
          select: { 
            id: true, 
            name: true, 
            username: true, 
            image: true,
            profileImage: true 
          } 
        },
        ListingMedia: { 
          select: { 
            url: true, 
            order: true,
            alt: true 
          },
          orderBy: { order: 'asc' }
        }
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
