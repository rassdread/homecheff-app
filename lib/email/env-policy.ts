/**
 * Production / Preview / test email isolation.
 * Never logs secret values.
 */

export type EmailSendEnvironment =
  | "production"
  | "preview"
  | "development"
  | "test"
  | "unknown";

export function resolveEmailSendEnvironment(): EmailSendEnvironment {
  if (process.env.NODE_ENV === "test" || process.env.EMAIL_FORCE_TEST_MODE === "1") {
    return "test";
  }
  const vercelEnv = (process.env.VERCEL_ENV || "").trim().toLowerCase();
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (vercelEnv === "development") return "development";
  if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1") {
    // Vercel production build without VERCEL_ENV (rare) — treat as production
    return "production";
  }
  if (process.env.NODE_ENV === "development") return "development";
  return "unknown";
}

export type EmailSendPolicy =
  | { allow: true; reason: "production_ok" | "explicit_preview_key" | "dev_allow_real" }
  | {
      allow: false;
      reason:
        | "test_suppress"
        | "preview_blocks_production_key"
        | "preview_no_dedicated_key"
        | "dev_suppress"
        | "missing_api_key";
    };

/**
 * Preview must not silently use the Production transactional key.
 * Set RESEND_ALLOW_PREVIEW_SEND=1 AND RESEND_PREVIEW_API_KEY (dedicated) to send from Preview.
 * Development: set RESEND_ALLOW_DEV_SEND=1 to send real mail (operator-owned only).
 */
export function resolveEmailSendPolicy(): EmailSendPolicy {
  const env = resolveEmailSendEnvironment();
  const prodKey = process.env.RESEND_API_KEY?.trim() || "";
  const previewKey = process.env.RESEND_PREVIEW_API_KEY?.trim() || "";

  if (env === "test") {
    return { allow: false, reason: "test_suppress" };
  }

  if (env === "preview") {
    if (!process.env.RESEND_ALLOW_PREVIEW_SEND?.trim()) {
      return { allow: false, reason: "preview_no_dedicated_key" };
    }
    if (!previewKey) {
      return { allow: false, reason: "preview_no_dedicated_key" };
    }
    if (prodKey && previewKey === prodKey) {
      return { allow: false, reason: "preview_blocks_production_key" };
    }
    return { allow: true, reason: "explicit_preview_key" };
  }

  if (env === "development" || env === "unknown") {
    if (process.env.RESEND_ALLOW_DEV_SEND?.trim() === "1" && prodKey) {
      return { allow: true, reason: "dev_allow_real" };
    }
    // Default: suppress accidental real sends from local/unknown
    if (!prodKey) return { allow: false, reason: "missing_api_key" };
    return { allow: false, reason: "dev_suppress" };
  }

  // production
  if (!prodKey) return { allow: false, reason: "missing_api_key" };
  return { allow: true, reason: "production_ok" };
}

/** API key to use for the current environment (never log the value). */
export function resolveResendApiKeyForSend(): string | null {
  const policy = resolveEmailSendPolicy();
  if (!policy.allow) return null;
  const env = resolveEmailSendEnvironment();
  if (env === "preview") {
    return process.env.RESEND_PREVIEW_API_KEY?.trim() || null;
  }
  return process.env.RESEND_API_KEY?.trim() || null;
}

export function isEmailApiKeyConfigured(): boolean {
  return Boolean(resolveResendApiKeyForSend() || process.env.RESEND_API_KEY?.trim());
}
