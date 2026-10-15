/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { isExactPreviewGoogleHost } from "@/lib/auth/preview-google-oauth";
import { isPreviewDeployment } from "@/lib/hc/preview-service-target";

export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

function requestHost(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return forwarded.split(",")[0].trim();
}

function blocksPreviewGoogle(req: Request): boolean {
  return isPreviewDeployment() && !isExactPreviewGoogleHost(requestHost(req));
}

async function handle(req: Request, context: { params?: { nextauth?: string[] } }) {
  const path = new URL(req.url).pathname;
  if (blocksPreviewGoogle(req) && path.includes("/signin/google")) {
    return NextResponse.json(
      { error: "Google sign-in is not available on this host." },
      { status: 403 },
    );
  }

  const response = await handler(req, context);
  if (blocksPreviewGoogle(req) && path.endsWith("/providers")) {
    const data = await response.clone().json().catch(() => null);
    if (data && typeof data === "object") {
      delete data.google;
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      return new NextResponse(JSON.stringify(data), {
        status: response.status,
        headers,
      });
    }
  }
  return response;
}

export { handle as GET, handle as POST };
