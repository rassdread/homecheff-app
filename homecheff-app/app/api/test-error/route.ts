export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("Test API error: alles werkt!");
}
