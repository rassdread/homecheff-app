/**
 * Preview deployments must not call production Growth.
 * Production keeps the existing origin when no override is set.
 */

export const PRODUCTION_GROWTH_ORIGIN = "https://growth.homecheff.eu";

export type GrowthServiceTarget =
  | { ok: true; base: string }
  | { ok: false; code: "CONFIGURATION_ERROR" };

type RuntimeEnv = {
  [key: string]: string | undefined;
};

export function isPreviewDeployment(env: RuntimeEnv = process.env): boolean {
  return (
    env.VERCEL_ENV === "preview" ||
    env.VERCEL_ENV === "development" ||
    env.VERCEL_TARGET_ENV === "preview" ||
    env.VERCEL_TARGET_ENV === "development"
  );
}

function configuredGrowthOrigin(env: RuntimeEnv): string {
  return (env.GROWTH_HC_QUOTE_BASE_URL ?? env.GROWTH_API_BASE_URL ?? "").trim().replace(/\/$/, "");
}

export function isProductionOwnedHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return host === "homecheff.eu" || host.endsWith(".homecheff.eu");
}

export function isProductionGrowthOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && isProductionOwnedHost(url.hostname);
  } catch {
    return false;
  }
}

/** Resolves the Growth origin. Preview never falls back to production. */
export function resolveGrowthServiceTarget(env: RuntimeEnv = process.env): GrowthServiceTarget {
  const raw = configuredGrowthOrigin(env);
  if (isPreviewDeployment(env)) {
    if (!raw || isProductionGrowthOrigin(raw)) {
      return { ok: false, code: "CONFIGURATION_ERROR" };
    }
    return { ok: true, base: raw };
  }
  if (!raw) return { ok: true, base: PRODUCTION_GROWTH_ORIGIN };
  return { ok: true, base: raw };
}

export function growthServiceBase(env: RuntimeEnv = process.env): string | null {
  const target = resolveGrowthServiceTarget(env);
  return target.ok ? target.base : null;
}

function configuredEcosystemSecret(env: RuntimeEnv): string {
  return (
    env.HC_ECOSYSTEM_INTERNAL_SECRET ??
    env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ??
    env.HC_MARKETPLACE_MUTATION_INTERNAL_SECRET ??
    ""
  ).trim();
}

/**
 * Mutating calls need both a safe origin and an internal secret.
 * A missing preview secret is a configuration error, not a production fallback.
 */
export function resolveGrowthMutationTarget(env: RuntimeEnv = process.env): GrowthServiceTarget {
  const target = resolveGrowthServiceTarget(env);
  if (!target.ok) return target;
  if (!configuredEcosystemSecret(env)) {
    return { ok: false, code: "CONFIGURATION_ERROR" };
  }
  return target;
}

/**
 * Preview server calls to a protected *.vercel.app Growth deployment.
 * The secret stays in the preview environment. Production never sends it,
 * and a production-owned host never receives it.
 */
export function growthPreviewProtectionHeaders(
  targetBase: string,
  env: RuntimeEnv = process.env,
): Record<string, string> {
  if (!isPreviewDeployment(env)) return {};
  let hostname = "";
  try {
    hostname = new URL(targetBase).hostname.toLowerCase();
  } catch {
    return {};
  }
  if (!hostname.endsWith(".vercel.app") || isProductionOwnedHost(hostname)) return {};
  const secret = (env.GROWTH_PREVIEW_PROTECTION_BYPASS ?? "").trim();
  if (!secret) return {};
  return { "x-vercel-protection-bypass": secret };
}
