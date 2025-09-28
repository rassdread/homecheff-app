import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and seller profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { SellerProfile: true }
    });

    if (!user || !user.SellerProfile) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

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
      photos: photosByRole 
    });

  } catch (error) {
    console.error("Workplace photos fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


