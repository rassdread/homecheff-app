import assert from "node:assert/strict";
import test from "node:test";
import {
  MARKETPLACE_PUBLIC_MAX_DURATION_SECONDS,
  authoritativeMaxDuration,
  cleanupTargetsForFailedJob,
  isMarketplaceProcessingBlobUrl,
  marketplaceVideoWorkerEnabled,
} from "./marketplace-video-policy";

test("the public maximum is 90 seconds and ignores the browser", () => {
  assert.equal(MARKETPLACE_PUBLIC_MAX_DURATION_SECONDS, 90);
  assert.equal(authoritativeMaxDuration(30), 90);
  assert.equal(authoritativeMaxDuration(90), 90);
  assert.equal(authoritativeMaxDuration("120"), 90);
  assert.equal(authoritativeMaxDuration(undefined), 90);
});

test("the worker flag is off unless the server explicitly enables it", () => {
  const previous = process.env.MARKETPLACE_VIDEO_WORKER;
  const base = process.env.VIDEO_WORKER_BASE_URL;
  const secret = process.env.VIDEO_WORKER_SECRET;
  delete process.env.MARKETPLACE_VIDEO_WORKER;
  process.env.VIDEO_WORKER_BASE_URL = "https://homecheff-motion.onrender.com";
  process.env.VIDEO_WORKER_SECRET = "test-secret";
  assert.equal(marketplaceVideoWorkerEnabled(), false);
  process.env.MARKETPLACE_VIDEO_WORKER = "1";
  assert.equal(marketplaceVideoWorkerEnabled(), true);
  delete process.env.VIDEO_WORKER_SECRET;
  assert.equal(marketplaceVideoWorkerEnabled(), false);
  if (previous === undefined) delete process.env.MARKETPLACE_VIDEO_WORKER;
  else process.env.MARKETPLACE_VIDEO_WORKER = previous;
  if (base === undefined) delete process.env.VIDEO_WORKER_BASE_URL;
  else process.env.VIDEO_WORKER_BASE_URL = base;
  if (secret === undefined) delete process.env.VIDEO_WORKER_SECRET;
  else process.env.VIDEO_WORKER_SECRET = secret;
});

test("cleanup can target only this job's processing blobs", () => {
  const source = "https://store.public.blob.vercel-storage.com/marketplace-video-sources/11111111-1111-1111-1111-111111111111.mp4";
  const canonical = "https://store.public.blob.vercel-storage.com/marketplace-video/11111111-1111-1111-1111-111111111111/canonical.mp4";
  const poster = "https://store.public.blob.vercel-storage.com/marketplace-video/11111111-1111-1111-1111-111111111111/poster.jpg";
  const original = "https://store.public.blob.vercel-storage.com/videos/dish-original.mp4";
  assert.equal(isMarketplaceProcessingBlobUrl(original), false);
  assert.deepEqual(cleanupTargetsForFailedJob({ status: "READY", sourceUrl: source, canonicalUrl: canonical, posterUrl: poster }), []);
  assert.deepEqual(
    cleanupTargetsForFailedJob({ status: "FAILED", sourceUrl: source, canonicalUrl: original, posterUrl: poster }),
    [source, poster],
  );
});
