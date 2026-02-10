import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generate upload token for direct client-side Vercel Blob upload
 * This completely bypasses serverless function body size limits
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileSize, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "File name and type required" }, { status: 400 });
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxSize) {
      return NextResponse.json({ 
        error: `Bestand is te groot (${(fileSize / (1024 * 1024)).toFixed(1)}MB). Maximum 50MB toegestaan.` 
      }, { status: 400 });
    }

    // Validate video type
    if (!fileType.startsWith('video/')) {
      return NextResponse.json({ error: "Alleen video bestanden zijn toegestaan" }, { status: 400 });
    }

    // Generate a unique key for the upload
    const key = `videos/${crypto.randomUUID()}-${fileName}`;

    // Return the key - the client will use the Vercel Blob client SDK to upload directly
    // We don't expose the token for security, but the client SDK will handle authentication
    return NextResponse.json({ 
      key,
      // Note: The client SDK will need to use a different approach
      // We'll use a server-side proxy that accepts the file and uploads it
    });
  } catch (error: any) {
    console.error('Video token generation error:', error);
    return NextResponse.json({ 
      error: error.message || "Serverfout" 
    }, { status: 500 });
  }
}








