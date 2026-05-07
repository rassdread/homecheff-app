import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notifications/notification-service";
import { isValidFcmTokenShape, maskPushTokenForLogs } from "@/lib/pushTokenValidation";

export const dynamic = "force-dynamic";

const ALLOWED_PLATFORMS = new Set(["android", "ios", "web"]);

function parsePlatform(value: unknown): "android" | "ios" | "web" {
  if (typeof value === "string" && ALLOWED_PLATFORMS.has(value)) {
    return value as "android" | "ios" | "web";
  }
  return "android";
}

/**
 * POST: sla FCM-token op voor ingelogde gebruiker (idempotent op token-string).
 * DELETE: zet token op inactief (logout / device).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const tokenRaw = body.token;
    if (!isValidFcmTokenShape(tokenRaw)) {
      return NextResponse.json(
        { error: "Invalid token", hint: "length and type" },
        { status: 400 }
      );
    }
    const token = tokenRaw.trim();

    if (body.type != null && body.type !== "FCM") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const platform = parsePlatform(body.platform);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await NotificationService.registerPushToken(user.id, token, platform, "FCM");

    if (process.env.NODE_ENV === "development") {
      console.info(
        "[push/register] stored FCM token for user",
        user.id,
        maskPushTokenForLogs(token)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/register] POST failed", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const tokenRaw = body.token;
    if (!isValidFcmTokenShape(tokenRaw)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    const token = tokenRaw.trim();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.pushToken.findUnique({
      where: { token },
      select: { userId: true },
    });
    if (existing && existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await NotificationService.unregisterPushToken(token);

    if (process.env.NODE_ENV === "development") {
      console.info("[push/register] unregistered token", maskPushTokenForLogs(token));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/register] DELETE failed", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
