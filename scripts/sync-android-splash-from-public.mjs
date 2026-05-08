#!/usr/bin/env node
/**
 * Valideert public/homecheff-native-splash.png (WebView NativeStartupSplash + web).
 * Geen kopie naar Android res meer: native splash is minimaal wit; branding zit in de app.
 * Run vóór `npx cap sync` (zie npm script cap:sync).
 */
import { existsSync, openSync, readSync, closeSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const src = join(root, "public/homecheff-native-splash.png");

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** IHDR offset na 8-byte signature + 4-byte length + 4-byte "IHDR" */
const IHDR_DATA_OFFSET = 16;

function readPngDimensions(path) {
  const fd = openSync(path, "r");
  const buf = Buffer.alloc(IHDR_DATA_OFFSET + 8);
  try {
    readSync(fd, buf, 0, buf.length, 0);
  } finally {
    closeSync(fd);
  }
  if (!buf.subarray(0, 8).equals(PNG_SIG)) {
    return null;
  }
  const width = buf.readUInt32BE(IHDR_DATA_OFFSET);
  const height = buf.readUInt32BE(IHDR_DATA_OFFSET + 4);
  return { width, height };
}

function validateSplashSource(path) {
  const label = "public/homecheff-native-splash.png";
  if (!existsSync(path)) {
    console.error(`sync-android-splash: missing ${label}`);
    process.exit(1);
  }
  const st = statSync(path);
  if (!st.isFile() || st.size < 256) {
    console.error(
      `sync-android-splash: ${label} invalid or empty (${st.size} bytes)`
    );
    process.exit(1);
  }
  const head = Buffer.alloc(8);
  const fd = openSync(path, "r");
  try {
    readSync(fd, head, 0, 8, 0);
  } finally {
    closeSync(fd);
  }
  if (!head.equals(PNG_SIG)) {
    console.error(
      `sync-android-splash: ${label} is not a valid PNG (wrong signature)`
    );
    process.exit(1);
  }
  const dims = readPngDimensions(path);
  if (!dims) {
    console.error(`sync-android-splash: ${label} IHDR could not be read`);
    process.exit(1);
  }
  const { width, height } = dims;
  const okW = width >= 720 && width <= 1440;
  const okH = height >= 1800 && height <= 3200;
  if (!okW || !okH) {
    console.error(
      `sync-android-splash: ${label} unexpected size ${width}x${height} (expected ~1080x2400 portrait)`
    );
    process.exit(1);
  }
}

validateSplashSource(src);
console.log(
  `sync-android-splash: OK ${src} (native Android splash is white-only; branding in WebView)`
);
