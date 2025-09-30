import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user and seller profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        SellerProfile: true
      }
    });

    if (!user || !user.SellerProfile) {
      return NextResponse.json({ error: "User or seller profile not found" }, { status: 404 });
    }

    // Get user roles from the user object
    const userRoles = user.sellerRoles || [];

    // Get workplace photos
    const workplacePhotos = await prisma.workplacePhoto.findMany({
      where: {
        sellerProfileId: user.SellerProfile.id
      },
      orderBy: [
        { role: 'asc' },
        { sortOrder: 'asc' }
      ]
    });

    // Group photos by role
    const photosByRole = workplacePhotos.reduce((acc, photo) => {
      if (!acc[photo.role]) {
        acc[photo.role] = [];
      }
      acc[photo.role].push({
        id: photo.id,
        url: photo.fileUrl,
        sortOrder: photo.sortOrder
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({ 
      success: true, 
      photos: photosByRole,
      userRoles: userRoles
    });

  } catch (error) {
    console.error("Public workspace photos fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
