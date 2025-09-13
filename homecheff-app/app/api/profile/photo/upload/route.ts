
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

  // Use Vercel Blob for production, fallback for development
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || process.env.BLOB_RW_TOKEN;
  let publicUrl: string | null = null;

  if (token) {
    try {
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
        console.error("Blob upload failed:", errText);
        // Fall through to local storage
      } else {
        const data = await res.json() as { url: string };
        publicUrl = data.url;
      }
    } catch (error) {
      console.error("Blob upload error:", error);
      // Fall through to local storage
    }
  }

  // Fallback: use a simple base64 data URL for now
  if (!publicUrl) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'image/jpeg';
      publicUrl = `data:${mimeType};base64,${base64}`;
    } catch (e: any) {
      console.error("Base64 conversion failed:", e);
      return NextResponse.json({ error: "File processing failed", details: String(e) }, { status: 500 });
    }
  }

  // Save URL to user
  await prisma.user.update({
    where: { email: session.user.email! },
    data: { profileImage: publicUrl! },
  });

  return NextResponse.json({ ok: true, url: publicUrl });
}
