import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "general";
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Geen geldig bestand ontvangen" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    
    // Enhanced file validation for images
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      // Check file format
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        return NextResponse.json({ 
          error: "Alleen JPG, PNG, WebP en GIF bestanden zijn toegestaan." 
        }, { status: 400 });
      }
      
      // Check file size
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      if (buffer.length > maxSize) {
        return NextResponse.json({ 
          error: "Afbeelding is te groot. Maximum grootte is 5MB." 
        }, { status: 400 });
      }

    }
    
    // Try Vercel Blob first
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    let publicUrl: string | null = null;

    if (token) {
      try {
        const { put } = await import("@vercel/blob");
        const key = `uploads/${crypto.randomUUID()}-${file.name}`;

        const blob = await put(key, buffer, {
          access: "public",
          token: token,
          addRandomSuffix: true,
        });
        publicUrl = blob.url;

      } catch (error) {
        console.error("Blob upload failed:", error);
      }
    } else {

    }
    
    // Fallback: use base64 data URL for development
    if (!publicUrl) {
      try {
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        publicUrl = `data:${mimeType};base64,${base64}`;

      } catch (e: any) {
        console.error("Base64 conversion failed:", e);
        return NextResponse.json({ error: "File processing failed" }, { status: 500 });
      }
    }
    
    if (!publicUrl) {
      return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
    }
    
    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
  }
}