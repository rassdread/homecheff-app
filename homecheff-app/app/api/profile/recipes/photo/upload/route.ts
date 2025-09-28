import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });
    }

    console.log("Recipe photo upload - Grootte:", Math.round(file.size / 1024), "KB");

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try Vercel Blob first
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    let publicUrl: string | null = null;

    if (token) {
      try {
        const { put } = await import("@vercel/blob");
        const key = `recipe-photos/${crypto.randomUUID()}-${file.name}`;
        const blob = await put(key, buffer, {
          access: "public",
          token: token,
          addRandomSuffix: true,
        });
        publicUrl = blob.url;
        console.log("Recipe photo upload successful:", blob.url);
      } catch (error) {
        console.error("Recipe photo upload failed:", error);
        // Don't throw error, let it fall back to base64
        if (error instanceof Error && error.message.includes('suspended')) {
          console.log("Vercel Blob suspended, using base64 fallback");
        }
      }
    }

    // Fallback: use base64 data URL for development
    if (!publicUrl) {
      try {
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        publicUrl = `data:${mimeType};base64,${base64}`;
        console.log("Using base64 fallback for recipe photo");
      } catch (e) {
        console.error("Base64 conversion failed:", e);
        return NextResponse.json({ error: "File processing failed" }, { status: 500 });
      }
    }

    if (!publicUrl) {
      return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("Recipe photo upload error:", e);
    return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
  }
}
