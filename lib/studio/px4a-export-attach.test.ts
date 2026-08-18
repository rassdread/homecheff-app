import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import {
  clearPx4aExportVideo,
  nextListingVideoAfterExport,
  parseExportAttachPayload,
  readPx4aExportVideo,
  writePx4aExportVideo,
} from "./px4a-export-attach";
import { signExportAttachPayload, verifyExportAttachToken } from "./px4a-export-attach-hmac";

function mockSessionStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  (globalThis as { sessionStorage?: typeof storage }).sessionStorage = storage;
  (globalThis as { window?: { sessionStorage: typeof storage } }).window = {
    sessionStorage: storage,
  };
}

describe("PX.4A.5 HomeCheff export attach", () => {
  it("verifies HMAC pointers and rejects foreign hosts", () => {
    const payload = parseExportAttachPayload({
      v: 1,
      kind: "export-attach",
      u: "user-1",
      videoUrl: "https://abc.blob.vercel-storage.com/homecheff-video.mp4",
      duration: 15,
      thumb: null,
      e: 1_000_000 + 60,
      r: "/sell/new",
    });
    assert.ok(payload);
    const token = signExportAttachPayload(payload!, "secret");
    assert.deepEqual(verifyExportAttachToken(token, ["secret"], 1_000_000), payload);
    assert.equal(
      parseExportAttachPayload({
        ...payload,
        videoUrl: "https://evil.example/x.mp4",
      }),
      null,
    );
  });

  it("keeps the old listing video until a successful generated attach", () => {
    const existing = { url: "https://cdn.example/old.mp4", duration: 18 };
    const generated = { url: "https://cdn.example/new.mp4", duration: 15 };
    assert.deepEqual(
      nextListingVideoAfterExport({ existing, cancelled: true, exportOk: false, generated }),
      existing,
    );
    assert.deepEqual(
      nextListingVideoAfterExport({ existing, cancelled: false, exportOk: false, generated: null }),
      existing,
    );
    assert.deepEqual(
      nextListingVideoAfterExport({ existing, cancelled: false, exportOk: true, generated }),
      generated,
    );
  });

  it("stores only an HTTPS pointer in sessionStorage", () => {
    mockSessionStorage();
    writePx4aExportVideo({
      v: 1,
      url: "https://abc.blob.vercel-storage.com/homecheff-video.mp4",
      duration: 15,
      thumb: null,
    });
    assert.equal(readPx4aExportVideo()?.url?.startsWith("https://"), true);
    clearPx4aExportVideo();
    assert.equal(readPx4aExportVideo(), null);
  });

  it("MarketplaceOfferForm attaches after restore without clearing the listing draft first", () => {
    const form = readFileSync("components/products/marketplace/MarketplaceOfferForm.tsx", "utf8");
    assert.match(form, /setVideo\(snap\.video\)/);
    assert.match(form, /attachPx4aExportVideo/);
    assert.match(form, /clearPx4aExportVideo/);
  });
});
