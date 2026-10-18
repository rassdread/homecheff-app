/**
 * Canonical public origin for links in e-mails and redirects.
 * Prefer NEXT_PUBLIC_APP_URL (available client + server), then APP_URL, then NEXTAUTH_URL.
 * In production, never emit localhost if misconfigured.
 * On preview, never emit a production HomeCheff host.
 */

import { isPreviewDeployment, isProductionOwnedHost } from "@/lib/hc/preview-service-target";

type RuntimeEnv = {
  [key: string]: string | undefined;
};

function originOf(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const withScheme = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(".vercel.app") && hostname !== "vercel.app";
  } catch {
    return false;
  }
}

/**
 * Preview links must stay on the preview host. An empty string means the caller
 * must not send a production URL.
 */
export function resolvePreviewPublicOrigin(env: RuntimeEnv = process.env): string | null {
  const candidates = [
    env.PREVIEW_AUTH_URL,
    env.AUTH_URL,
    env.NEXTAUTH_URL,
    env.NEXT_PUBLIC_APP_URL,
    env.APP_URL,
    env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined,
  ];
  for (const candidate of candidates) {
    const origin = originOf(candidate);
    if (!origin) continue;
    if (isProductionOwnedHost(new URL(origin).hostname)) continue;
    if (isVercelPreviewOrigin(origin)) return origin;
  }
  return null;
}

export function getPublicAppUrl(env: RuntimeEnv = process.env): string {
  if (isPreviewDeployment(env)) {
    return resolvePreviewPublicOrigin(env) ?? "";
  }

  const raw =
    env.NEXT_PUBLIC_APP_URL ||
    env.APP_URL ||
    env.NEXTAUTH_URL ||
    "https://homecheff.eu";

  let base = String(raw).trim().replace(/\/$/, "");
  if (!base) base = "https://homecheff.eu";

  if (env.NODE_ENV === "production") {
    if (/localhost|127\.0\.0\.1/i.test(base)) {
      return "https://homecheff.eu";
    }
  }

  return base;
}
