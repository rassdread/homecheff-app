import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadSessions } from '../sessions';

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId } = await req.json();

    if (!uploadId) {
      return NextResponse.json({ error: "Upload ID required" }, { status: 400 });
    }

    // Get upload session
    const uploadSession = uploadSessions.get(uploadId);
    if (!uploadSession) {
      return NextResponse.json({ error: "Upload sessie niet gevonden" }, { status: 404 });
    }

    // Check if all chunks are received
    if (uploadSession.chunks.size !== uploadSession.totalChunks) {
      return NextResponse.json({ 
        error: `Niet alle chunks ontvangen (${uploadSession.chunks.size}/${uploadSession.totalChunks})` 
      }, { status: 400 });
    }

    // Reassemble file from chunks
    console.log(`🔧 Reassembling file from ${uploadSession.totalChunks} chunks...`);
    const chunks: Buffer[] = [];
    for (let i = 0; i < uploadSession.totalChunks; i++) {
      const chunk = uploadSession.chunks.get(i);
      if (!chunk) {
        return NextResponse.json({ error: `Chunk ${i} ontbreekt` }, { status: 400 });
      }
      chunks.push(chunk);
    }
    const fullBuffer = Buffer.concat(chunks);

    // Verify file size
    if (fullBuffer.length !== uploadSession.fileSize) {
      console.warn(`⚠️ File size mismatch: expected ${uploadSession.fileSize}, got ${fullBuffer.length}`);
    }

    // Upload to Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Blob storage niet geconfigureerd" }, { status: 500 });
    }

    try {
      const { put } = await import("@vercel/blob");
      const key = `videos/${crypto.randomUUID()}-${uploadSession.fileName}`;
      
      console.log(`📤 Uploading reassembled file to Blob (${(fullBuffer.length / (1024 * 1024)).toFixed(2)}MB)...`);
      
      const blob = await put(key, fullBuffer, {
        access: "public",
        token: token,
        addRandomSuffix: true,
        contentType: uploadSession.fileType,
      });

      // Cleanup session
      uploadSessions.delete(uploadId);

      console.log(`✅ File uploaded successfully: ${blob.url}`);

      return NextResponse.json({ 
        url: blob.url,
        key: blob.pathname
      });
    } catch (error: any) {
      console.error('Blob upload failed:', error);
      // Cleanup session on error
      uploadSessions.delete(uploadId);
      return NextResponse.json({ 
        error: error.message || "Upload naar Blob storage mislukt" 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Finalize upload error:', error);
    return NextResponse.json({ 
      error: error.message || "Serverfout" 
    }, { status: 500 });
    }
}

