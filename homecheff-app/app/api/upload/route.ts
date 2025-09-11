import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

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
    const key = `avatars/${crypto.randomUUID()}-${file.name}`;
    const blob = await put(key, file, {
      access: "public",
      token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
    });
    console.log("Blob url:", blob.url);
    return Response.json({ url: blob.url });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Blob upload mislukt" }, { status: 500 });
  }
}
