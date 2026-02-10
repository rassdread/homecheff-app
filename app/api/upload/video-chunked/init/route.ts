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

    const { fileName, fileType, fileSize, totalChunks } = await req.json();

    if (!fileName || !fileType || !fileSize || !totalChunks) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // Generate upload ID
    const uploadId = crypto.randomUUID();

    // Initialize session
    uploadSessions.set(uploadId, {
      fileName,
      fileType,
      fileSize,
      totalChunks,
      chunks: new Map(),
      createdAt: Date.now()
    });

    return NextResponse.json({ uploadId });
  } catch (error: any) {
    console.error('Chunked upload init error:', error);
    return NextResponse.json({ 
      error: error.message || "Serverfout" 
    }, { status: 500 });
  }
}

