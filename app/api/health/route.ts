import { NextResponse } from "next/server";

/**
 * Lichtgewicht bereikbaarheidscheck voor de Android startup-shell (geen auth, geen DB).
 * CORS: * zodat file:// / capacitor https://localhost de response mag lezen.
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "homecheff" },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
