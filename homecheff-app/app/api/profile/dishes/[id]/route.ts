import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, priceCents, stock, maxStock, isActive } = body;

    // Check if dish belongs to this user
    const dish = await prisma.dish.findFirst({
      where: { 
        id: id,
        userId: user.id
      }
    });

    if (!dish) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }

    // Update dish
    const updatedDish = await prisma.dish.update({
      where: { id: id },
      data: {
        status: status || dish.status,
        priceCents: priceCents !== undefined ? priceCents : dish.priceCents,
        stock: stock !== undefined ? stock : dish.stock,
        maxStock: maxStock !== undefined ? maxStock : dish.maxStock,
      }
    });

    return NextResponse.json({ item: updatedDish });
  } catch (error) {
    console.error("Error updating dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if dish belongs to this user
    const dish = await prisma.dish.findFirst({
      where: { 
        id: id,
        userId: user.id
      }
    });

    if (!dish) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }

    // Delete dish (photos will be deleted automatically due to cascade)
    await prisma.dish.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}