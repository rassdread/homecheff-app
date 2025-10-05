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
    
    console.log("Uploaden bestand:", file.name, "Grootte:", Math.round(file.size / 1024), "KB");
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    
    // Simple file size check for images (no compression)
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      if (buffer.length > maxSize) {
        return NextResponse.json({ 
          error: "Afbeelding is te groot. Maximum grootte is 5MB." 
        }, { status: 400 });
      }
      console.log(`Image upload: ${file.name}, ${Math.round(buffer.length / 1024)}KB`);
    }
    
    // Try Vercel Blob first
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    let publicUrl: string | null = null;
    
    console.log("Token available:", !!token);
    
    if (token) {
      try {
        const { put } = await import("@vercel/blob");
        const key = `uploads/${crypto.randomUUID()}-${file.name}`;
        console.log("Uploading to Vercel Blob with key:", key);
        const blob = await put(key, buffer, {
          access: "public",
          token: token,
          addRandomSuffix: true,
        });
        publicUrl = blob.url;
        console.log("Blob upload successful:", blob.url);
      } catch (error) {
        console.error("Blob upload failed:", error);
      }
    } else {
      console.log("No Vercel Blob token found, using fallback");
    }
    
    // Fallback: use base64 data URL for development
    if (!publicUrl) {
      try {
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        publicUrl = `data:${mimeType};base64,${base64}`;
        console.log("Using base64 fallback for:", file.name);
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