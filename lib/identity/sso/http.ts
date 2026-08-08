/**
 * Phase I.2 — HTTP helpers for SSO routes.
 */

import { NextResponse } from "next/server";
import { SsoError, type SsoErrorCode } from "./constants";
import { isCentralSsoEnabled } from "./flags";

export function ssoDisabledResponse(): NextResponse {
  return NextResponse.json(
    { error: "Not Found", code: "SSO_DISABLED" satisfies SsoErrorCode },
    { status: 404 },
  );
}

export function requireSsoEnabled(): NextResponse | null {
  if (!isCentralSsoEnabled()) return ssoDisabledResponse();
  return null;
}

export function ssoErrorResponse(err: unknown): NextResponse {
  if (err instanceof SsoError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.httpStatus },
    );
  }
  console.error("[sso] internal error", err instanceof Error ? err.message : "unknown");
  return NextResponse.json(
    { error: "Internal error", code: "INTERNAL_ERROR" satisfies SsoErrorCode },
    { status: 500 },
  );
}

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function correlationId(req: Request): string {
  return (
    req.headers.get("x-request-id") ||
    req.headers.get("x-correlation-id") ||
    `sso_${Date.now().toString(36)}`
  );
}
