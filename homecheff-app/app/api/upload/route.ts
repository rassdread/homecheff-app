import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let file: File | undefined;
    try {
      const formData = await req.formData();
      file = formData.get("file") as File;
    } catch {
      return NextResponse.json({ error: "Body moet FormData zijn met een 'file' veld." }, { status: 400 });
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Geen geldig bestand ontvangen in FormData." }, { status: 400 });
    }
    
    console.log("Uploaden bestand:", file.name);
    
    // Try Vercel Blob first if token is available
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || process.env.BLOB_RW_TOKEN;
    let publicUrl: string | null = null;
    
    if (token) {
      try {
        const { put } = await import("@vercel/blob");
        const key = `dishes/${crypto.randomUUID()}-${file.name}`;
        const blob = await put(key, file, {
          access: "public",
          token: token,
          addRandomSuffix: true,
        });
        publicUrl = blob.url;
        console.log("Blob url:", blob.url);
      } catch (error) {
        console.error("Blob upload failed:", error);
        // Fall through to base64 fallback
      }
    }
    
    // Fallback: use base64 data URL
    if (!publicUrl) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        publicUrl = `data:${mimeType};base64,${base64}`;
        console.log("Using base64 fallback for:", file.name);
      } catch (error) {
        console.error("Base64 conversion failed:", error);
        return NextResponse.json({ error: "File processing failed" }, { status: 500 });
      }
    }
    
    return Response.json({ url: publicUrl });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
  }
}
