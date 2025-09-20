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
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    let publicUrl: string | null = null;
    
    if (token) {
      try {
        const { put } = await import("@vercel/blob");
        const key = `products/${crypto.randomUUID()}-${file.name}`;
        const blob = await put(key, file, {
          access: "public",
          token: token,
          addRandomSuffix: true,
        });
        publicUrl = blob.url;
        console.log("Blob upload successful:", blob.url);
      } catch (error) {
        console.error("Blob upload failed:", error);
        return NextResponse.json({ error: "Upload naar Vercel Blob mislukt" }, { status: 500 });
      }
    } else {
      console.error("No Vercel Blob token found");
      return NextResponse.json({ error: "Upload service niet geconfigureerd" }, { status: 500 });
    }
    
    if (!publicUrl) {
      return NextResponse.json({ error: "Upload mislukt - geen URL gegenereerd" }, { status: 500 });
    }
    
    return Response.json({ url: publicUrl });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
  }
}
