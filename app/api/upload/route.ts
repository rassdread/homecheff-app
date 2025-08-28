import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const blob = await put(`homecheff/${crypto.randomUUID()}-${file.name}`, file, { access: "public" });
  return NextResponse.json({ url: blob.url });
}
