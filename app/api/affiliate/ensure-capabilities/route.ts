import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCapabilitiesForMarketplaceUser } from "@/lib/affiliates/ensure-growth-seat";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

/** Idempotent ecosystem capability ensure. Marketplace signup stays the user-facing activation. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, code: "USER_NOT_FOUND" }, { status: 404, headers: NO_STORE });
  }
  const result = await ensureCapabilitiesForMarketplaceUser(user.id);
  return NextResponse.json(result, { status: 200, headers: NO_STORE });
}
