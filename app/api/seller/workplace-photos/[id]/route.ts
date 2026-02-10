import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user and seller profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { SellerProfile: true }
    });

    if (!user || !user.SellerProfile) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    // Check if the photo belongs to this user
    const workplacePhoto = await prisma.workplacePhoto.findFirst({
      where: {
        id: id,
        sellerProfileId: user.SellerProfile.id
      }
    });

    if (!workplacePhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete the photo
    await prisma.workplacePhoto.delete({
      where: { id: id }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Photo deleted successfully" 
    });

  } catch (error) {
    console.error("Workplace photo delete error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

