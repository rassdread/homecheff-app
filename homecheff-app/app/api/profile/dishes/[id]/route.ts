// app/api/profile/dishes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getEmail() {
  try {
    const mod: any = await import("@/lib/auth");
    const session = await mod.auth?.();
    if (session?.user?.email) return session.user.email as string;
  } catch {}
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions as any);
    if ((session as any)?.user?.email) return (session as any).user.email as string;
  } catch {}
  return null;
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteCtx) {
  const { id } = await params;

  try {
    const email = await getEmail();
    if (!email) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

    const me = await prisma.user.findUnique({ where: { email } });
    if (!me) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const { status } = body as { status?: string };
    if (!status) return NextResponse.json({ error: "Status ontbreekt" }, { status: 400 });

    // Validate status against DishStatus enum
    const allowed = ["PRIVATE", "PUBLISHED"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }
    const updated = await prisma.listing.update({
      where: { id },
      data: { 
        status: status === 'PUBLISHED' ? 'ACTIVE' : 'DRAFT',
        updatedAt: new Date()
      },
      include: { ListingMedia: true }
    });

    if (updated.ownerId !== me.id) {
      return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, dish: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
