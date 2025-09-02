import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { imageUrl, key } = await req.json();
    const region = process.env.S3_REGION;
    const bucket = process.env.S3_BUCKET;
    const finalUrl = imageUrl ?? (key && bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com/${key}` : null);
    if (!finalUrl) return NextResponse.json({ error: "imageUrl of key verplicht" }, { status: 400 });

    // Try NextAuth v5
    let email: string | null = null;
    try {
      const mod: any = await import("@/lib/auth");
      const session = await mod.auth?.();
      email = session?.user?.email ?? null;
    } catch {}
    // Fallback v4
    if (!email) {
      try {
        const { getServerSession } = await import("next-auth");
        const { authOptions } = await import("@/lib/auth");
        const session = await getServerSession(authOptions as any);
        email = (session as any)?.user?.email ?? null;
      } catch {}
    }
    // Dev fallback
    if (!email) email = "test@homecheff.local";

    await prisma.user.update({ where: { email }, data: { image: finalUrl } });
    return NextResponse.json({ ok: true, image: finalUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
