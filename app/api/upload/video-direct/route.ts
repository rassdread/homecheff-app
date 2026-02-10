import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Direct video upload to Vercel Blob
 * This bypasses the 4.5MB serverless function body size limit by streaming the file
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileName = req.headers.get('X-File-Name') || 'video.mp4';
    const fileType = req.headers.get('X-File-Type') || 'video/mp4';
    const fileKey = req.headers.get('X-File-Key') || `videos/${crypto.randomUUID()}-${fileName}`;

    // Get file from request body (streaming)
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (buffer.length > maxSize) {
      return NextResponse.json({ 
        error: `Bestand is te groot (${(buffer.length / (1024 * 1024)).toFixed(1)}MB). Maximum 50MB toegestaan.` 
      }, { status: 400 });
    }

    // Validate video type
    if (!fileType.startsWith('video/')) {
      return NextResponse.json({ error: "Alleen video bestanden zijn toegestaan" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Blob storage niet geconfigureerd" }, { status: 500 });
    }

    try {
      const { put } = await import("@vercel/blob");
      
      const blob = await put(fileKey, buffer, {
        access: "public",
        token: token,
        addRandomSuffix: true,
        contentType: fileType,
      });

      return NextResponse.json({ 
        url: blob.url,
        key: blob.pathname
      });
    } catch (error: any) {
      console.error('Blob upload failed:', error);
      return NextResponse.json({ 
        error: error.message || "Upload naar Blob storage mislukt" 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Direct video upload error:', error);
    return NextResponse.json({ 
      error: error.message || "Serverfout" 
    }, { status: 500 });
  }
}








