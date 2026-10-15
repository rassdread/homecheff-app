import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCTION_GROWTH_ORIGIN,
  growthPreviewProtectionHeaders,
  resolveGrowthMutationTarget,
  resolveGrowthServiceTarget,
} from "./preview-service-target";

const PREVIEW_ORIGIN = "https://growth-preview.example.test";

test("preview without a Growth URL fails closed", () => {
  const target = resolveGrowthServiceTarget({ VERCEL_ENV: "preview" });
  assert.deepEqual(target, { ok: false, code: "CONFIGURATION_ERROR" });
});

test("preview pointed at production Growth fails closed", () => {
  const target = resolveGrowthMutationTarget({
    VERCEL_ENV: "preview",
    GROWTH_HC_QUOTE_BASE_URL: PRODUCTION_GROWTH_ORIGIN,
    HC_ECOSYSTEM_INTERNAL_SECRET: "preview-secret",
  });
  assert.deepEqual(target, { ok: false, code: "CONFIGURATION_ERROR" });
});

test("preview with a non-production Growth URL is allowed", () => {
  const target = resolveGrowthMutationTarget({
    VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: "hc-campaign-cert-v3",
    GROWTH_HC_QUOTE_BASE_URL: PREVIEW_ORIGIN,
    HC_ECOSYSTEM_INTERNAL_SECRET: "preview-secret",
  });
  assert.deepEqual(target, { ok: true, base: PREVIEW_ORIGIN });
});

test("preview without an internal secret fails closed", () => {
  const target = resolveGrowthMutationTarget({
    VERCEL_ENV: "preview",
    GROWTH_HC_QUOTE_BASE_URL: PREVIEW_ORIGIN,
  });
  assert.deepEqual(target, { ok: false, code: "CONFIGURATION_ERROR" });
});

test("preview sends the automation bypass only to a vercel.app Growth host", () => {
  const headers = growthPreviewProtectionHeaders("https://growth-preview.vercel.app", {
    VERCEL_ENV: "preview",
    GROWTH_PREVIEW_PROTECTION_BYPASS: "bypass-secret",
  });
  assert.deepEqual(headers, { "x-vercel-protection-bypass": "bypass-secret" });
});

test("production does not send a preview protection bypass", () => {
  const headers = growthPreviewProtectionHeaders("https://growth-preview.vercel.app", {
    VERCEL_ENV: "production",
    GROWTH_PREVIEW_PROTECTION_BYPASS: "bypass-secret",
  });
  assert.deepEqual(headers, {});
});

test("preview does not send a protection bypass to production Growth", () => {
  const headers = growthPreviewProtectionHeaders(PRODUCTION_GROWTH_ORIGIN, {
    VERCEL_ENV: "preview",
    GROWTH_PREVIEW_PROTECTION_BYPASS: "bypass-secret",
  });
  assert.deepEqual(headers, {});
});

test("preview without a bypass secret adds no protection header", () => {
  const headers = growthPreviewProtectionHeaders("https://growth-preview.vercel.app", {
    VERCEL_ENV: "preview",
  });
  assert.deepEqual(headers, {});
});

test("production keeps the existing Growth origin when no override is set", () => {
  const target = resolveGrowthServiceTarget({
    VERCEL_ENV: "production",
    HC_ECOSYSTEM_INTERNAL_SECRET: "production-secret",
  });
  assert.deepEqual(target, { ok: true, base: PRODUCTION_GROWTH_ORIGIN });
});
