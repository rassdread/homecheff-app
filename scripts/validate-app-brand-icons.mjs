#!/usr/bin/env node
/**
 * SP.2C.2 — lightweight HomeCheff app/PWA icon validation (no sharp).
 * Checks existence, PNG/ICO signatures, IHDR dimensions, manifest paths,
 * and certified icon-192 SHA-256.
 */
import {
  existsSync,
  openSync,
  readSync,
  closeSync,
  readFileSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ICO_SIG = Buffer.from([0x00, 0x00, 0x01, 0x00]);
const CERTIFIED_ICON_192_SHA256 =
  "7f84f4c479fd7bc50d62e997cd47d0356970d8748d3de13a89ab2f23eead37de";

const expected = [
  { path: "public/favicon-16.png", w: 16, h: 16, kind: "png" },
  { path: "public/favicon-32.png", w: 32, h: 32, kind: "png" },
  { path: "public/favicon-48.png", w: 48, h: 48, kind: "png" },
  { path: "public/favicon.ico", kind: "ico", minBytes: 200 },
  { path: "public/apple-touch-icon.png", w: 180, h: 180, kind: "png" },
  { path: "public/icon-192.png", w: 192, h: 192, kind: "png", sha256: CERTIFIED_ICON_192_SHA256 },
  { path: "public/icon-512.png", w: 512, h: 512, kind: "png" },
  { path: "public/icon-maskable-512.png", w: 512, h: 512, kind: "png" },
  { path: "public/icon-96x96.png", w: 96, h: 96, kind: "png" },
  { path: "public/homecheff-globeman.png", w: 886, h: 886, kind: "png" },
  { path: "public/brand/homecheff-logo-primary.png", w: 886, h: 886, kind: "png" },
];

let failed = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed += 1;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function readHead(abs, n) {
  const fd = openSync(abs, "r");
  const buf = Buffer.alloc(n);
  try {
    readSync(fd, buf, 0, n, 0);
  } finally {
    closeSync(fd);
  }
  return buf;
}

function pngDims(abs) {
  const buf = readHead(abs, 24);
  if (!buf.subarray(0, 8).equals(PNG_SIG)) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function stripQuery(p) {
  return p.split("?")[0];
}

for (const item of expected) {
  const abs = join(root, item.path);
  if (!existsSync(abs)) {
    fail(`missing ${item.path}`);
    continue;
  }
  const st = statSync(abs);
  if (!st.isFile() || st.size < 32) {
    fail(`${item.path} empty/invalid (${st.size} bytes)`);
    continue;
  }
  if (item.kind === "png") {
    const dims = pngDims(abs);
    if (!dims) {
      fail(`${item.path} not a valid PNG`);
      continue;
    }
    if (dims.w !== item.w || dims.h !== item.h) {
      fail(`${item.path} dims ${dims.w}x${dims.h}, expected ${item.w}x${item.h}`);
      continue;
    }
  }
  if (item.kind === "ico") {
    const head = readHead(abs, 4);
    if (!head.equals(ICO_SIG)) {
      fail(`${item.path} not a valid ICO`);
      continue;
    }
    if (st.size < (item.minBytes || 100)) {
      fail(`${item.path} too small (${st.size})`);
      continue;
    }
  }
  if (item.sha256) {
    const hash = createHash("sha256").update(readFileSync(abs)).digest("hex");
    if (hash !== item.sha256) {
      fail(`${item.path} SHA-256 mismatch (got ${hash})`);
      continue;
    }
  }
  ok(item.path);
}

const manifestPath = join(root, "public/manifest.json");
if (!existsSync(manifestPath)) {
  fail("missing public/manifest.json");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.name !== "HomeCheff" || manifest.short_name !== "HomeCheff") {
    fail(`manifest name/short_name must be HomeCheff (got ${manifest.name}/${manifest.short_name})`);
  } else {
    ok("manifest name/short_name HomeCheff");
  }
  const icons = manifest.icons || [];
  const purposes = new Set(icons.map((i) => i.purpose));
  if (!purposes.has("any")) fail('manifest missing purpose "any"');
  else ok('manifest purpose any');
  if (!purposes.has("maskable")) fail('manifest missing purpose "maskable"');
  else ok('manifest purpose maskable');

  const maskable = icons.find((i) => i.purpose === "maskable");
  const any512 = icons.find((i) => i.purpose === "any" && String(i.sizes).includes("512"));
  if (maskable && any512 && stripQuery(maskable.src) === stripQuery(any512.src)) {
    fail("maskable icon must not reuse the same file as any 512");
  } else if (maskable) {
    ok(`maskable distinct: ${maskable.src}`);
  }

  for (const icon of icons) {
    const publicAbs = join(root, "public", stripQuery(icon.src).replace(/^\//, ""));
    if (!existsSync(publicAbs)) fail(`manifest icon missing on disk: ${icon.src}`);
    else ok(`manifest icon exists: ${icon.src}`);
  }

  if (manifest.theme_color !== "#10b981") {
    fail(`theme_color expected #10b981 got ${manifest.theme_color}`);
  } else ok("theme_color");
  if (manifest.background_color !== "#ffffff") {
    fail(`background_color expected #ffffff got ${manifest.background_color}`);
  } else ok("background_color");
}

const capPath = join(root, "capacitor.config.ts");
if (existsSync(capPath)) {
  const cap = readFileSync(capPath, "utf8");
  const m = cap.match(/launchShowDuration:\s*(\d+)/);
  if (!m) fail("capacitor SplashScreen.launchShowDuration not found");
  else if (Number(m[1]) > 500) {
    fail(`artificial splash delay launchShowDuration=${m[1]} (must be ≤500 / prefer 0)`);
  } else ok(`capacitor launchShowDuration=${m[1]}`);
}

if (failed) {
  console.error(`\nvalidate-app-brand-icons: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\nvalidate-app-brand-icons: PASS");
