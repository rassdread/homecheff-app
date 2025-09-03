export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";


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
    const blob = await put(file.name, file, {
      access: "public",
      token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: blob.url, key: blob.pathname, publicUrl: blob.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Blob upload mislukt" }, { status: 500 });
  }
}
