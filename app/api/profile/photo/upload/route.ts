import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_PROFILE_PHOTO_BYTES = 50 * 1024 * 1024;

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

    const mime = (file.type || '').toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(mime)) {
      return NextResponse.json({
        error: "Alleen JPG, PNG, WebP en GIF bestanden zijn toegestaan.",
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Leeg bestand is niet toegestaan." }, { status: 400 });
    }

    if (buffer.length > MAX_PROFILE_PHOTO_BYTES) {
      return NextResponse.json({ error: "Foto is te groot. Probeer een kleinere foto." }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    let publicUrl: string | null = null;

    if (token) {
      try {
        const { put } = await import("@vercel/blob");
        const key = `profile-photos/${crypto.randomUUID()}-${file.name}`;
        const blob = await put(key, buffer, {
          access: "public",
          token: token,
          addRandomSuffix: true,
        });
        publicUrl = blob.url;
      } catch (error) {
        console.error("Profile photo upload failed:", error);
      }
    }

    if (!publicUrl) {
      try {
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        publicUrl = `data:${mimeType};base64,${base64}`;
      } catch (e: unknown) {
        console.error("Base64 conversion failed:", e);
        return NextResponse.json({ error: "File processing failed" }, { status: 500 });
      }
    }

    if (!publicUrl) {
      return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("Profile photo upload error:", e);
    return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
  }
}
