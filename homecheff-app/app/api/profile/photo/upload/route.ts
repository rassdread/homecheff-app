
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // we may use Node APIs in dev fallback

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "File missing" }, { status: 400 });
  }

  // Prefer Vercel Blob if token configured
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || process.env.BLOB_RW_TOKEN;
  let publicUrl: string | null = null;

  if (token) {
    const blobForm = new FormData();
    blobForm.set("file", file, (form.get("filename") as string) || "avatar.jpg");
    blobForm.set("access", "public");
    const res = await fetch("https://blob.vercel.app/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: blobForm as any,
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "Blob upload failed", details: errText }, { status: 500 });
    }
    const data = await res.json() as { url: string };
    publicUrl = data.url;
  } else {
    // Dev fallback: store to /public/uploads (node fs)
    // WARNING: on Vercel this won't persist; this is only for local dev.
    try {
      // @ts-ignore
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const crypto = await import("crypto");
      const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
      const ext = ((form.get("filename") as string) || "avatar.jpg").split(".").pop() || "jpg";
      const filename = `avatar_${hash}.${ext}`;
      const fs = await import("fs");
      const path = (await import("path")).default;
      const outDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, filename);
      fs.writeFileSync(outPath, buffer);
      publicUrl = `/uploads/${filename}`;
    } catch (e:any) {
      return NextResponse.json({ error: "Local save failed", details: String(e) }, { status: 500 });
    }
  }

  // Save URL to user
  await prisma.user.update({
    where: { email: session.user.email! },
    data: { profileImage: publicUrl! },
  });

  return NextResponse.json({ ok: true, url: publicUrl });
}
