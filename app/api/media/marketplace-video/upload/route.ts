import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MARKETPLACE_SOURCE_MAX_BYTES,
  marketplaceVideoWorkerEnabled,
} from "@/lib/media/marketplace-video-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PATH_RE = /^marketplace-video-sources\/[0-9a-f-]{36}\.(mp4|mov)$/i;

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !marketplaceVideoWorkerEnabled()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!PATH_RE.test(pathname)) throw new Error("invalid_storage_key");
        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/x-m4v"],
          maximumSizeInBytes: MARKETPLACE_SOURCE_MAX_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
    });
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "De video-upload is ongeldig." }, { status: 400 });
  }
}
