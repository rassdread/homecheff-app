import type { NextRequest } from "next/server";

/**
 * Shared cron authorization — Bearer CRON_SECRET (never query-string).
 * Production requires CRON_SECRET to be configured (same as notification-outbox).
 */
export function authorizeCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !secret) {
    return false;
  }
  if (!secret) {
    // Local/dev without secret: allow (matches other crons that only gate when set,
    // except production which always requires it above).
    return true;
  }
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
