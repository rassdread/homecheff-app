import { isPreviewDeployment } from "@/lib/hc/preview-service-target";

type RuntimeEnv = {
  [key: string]: string | undefined;
};

function sanitizeEnv(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Preview and development must not open a live Stripe client.
 * Production keeps the configured key, including sk_live_.
 * A missing or live key on preview returns null so callers fail closed.
 */
export function financialStripeSecret(
  raw: string | null | undefined = process.env.STRIPE_SECRET_KEY,
  env: RuntimeEnv = process.env,
): string | null {
  const key = sanitizeEnv(raw);
  if (!key) return null;
  if (isPreviewDeployment(env) && !key.startsWith("sk_test_")) return null;
  return key;
}

/** Browser publishable key. Preview hosts must not load pk_live_. */
export function financialStripePublishableKey(
  raw: string | null | undefined,
  options?: { previewHost?: boolean; env?: RuntimeEnv },
): string | null {
  const key = sanitizeEnv(raw);
  if (!key || key === "test") return null;
  const preview = options?.previewHost === true || isPreviewDeployment(options?.env ?? process.env);
  if (preview && !key.startsWith("pk_test_")) return null;
  return key;
}
