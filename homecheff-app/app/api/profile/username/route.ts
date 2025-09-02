import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let username: string | null = null;
    if (contentType.includes("application/json")) {
      const body = await req.json();
      username = (body?.username || "").trim();
    } else {
      const form = await req.formData();
      username = String(form.get("username") || "").trim();
    }
    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Ongeldige gebruikersnaam" }, { status: 400 });
    }
    // v5
    let email: string | null = null;
    try {
      const mod: any = await import("@/lib/auth");
      const session = await mod.auth?.();
      email = session?.user?.email ?? null;
    } catch {}
    // v4
    if (!email) {
      try {
        const { getServerSession } = await import("next-auth");
        const { authOptions } = await import("@/lib/auth");
        const session = await getServerSession(authOptions as any);
        email = (session as any)?.user?.email ?? null;
      } catch {}
    }
    if (!email) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

    await prisma.user.update({ where: { email }, data: { username } });
    return NextResponse.redirect(new URL("/profile", req.url));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
