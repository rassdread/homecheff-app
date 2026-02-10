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

    const formData = await req.formData();
    const chunk = formData.get('chunk') as File;
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);

    if (!chunk || !uploadId || chunkIndex === undefined || totalChunks === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get upload session
    const uploadSession = uploadSessions.get(uploadId);
    if (!uploadSession) {
      return NextResponse.json({ error: "Upload sessie niet gevonden" }, { status: 404 });
    }

    // Convert chunk to buffer
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store chunk
    uploadSession.chunks.set(chunkIndex, buffer);

    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} received (${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`);

    return NextResponse.json({ 
      success: true,
      received: uploadSession.chunks.size,
      total: totalChunks
    });
  } catch (error: any) {
    console.error('Chunk upload error:', error);
    return NextResponse.json({ 
      error: error.message || "Serverfout" 
    }, { status: 500 });
  }
}

