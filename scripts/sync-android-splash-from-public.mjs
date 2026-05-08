#!/usr/bin/env node
/**
 * Copieert android/native-splash.png naar alle Android res/splash.png-resources.
 * Run vóór `npx cap sync` (zie npm script cap:sync).
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  closeSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";

const root = join(import.meta.dirname, "..");
const src = join(root, "android/native-splash.png");

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function validateSplashSource(path) {
  if (!existsSync(path)) {
    console.error("sync-android-splash: missing android/native-splash.png");
    process.exit(1);
  }
  const st = statSync(path);
  if (!st.isFile() || st.size < 256) {
    console.error(
      `sync-android-splash: android/native-splash.png invalid or empty (${st.size} bytes)`
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
      "sync-android-splash: android/native-splash.png is not a valid PNG (wrong signature)"
    );
    process.exit(1);
  }
}

const targets = [
  "android/app/src/main/res/drawable/splash.png",
  "android/app/src/main/res/drawable-land-hdpi/splash.png",
  "android/app/src/main/res/drawable-land-mdpi/splash.png",
  "android/app/src/main/res/drawable-land-xhdpi/splash.png",
  "android/app/src/main/res/drawable-land-xxhdpi/splash.png",
  "android/app/src/main/res/drawable-land-xxxhdpi/splash.png",
  "android/app/src/main/res/drawable-port-hdpi/splash.png",
  "android/app/src/main/res/drawable-port-mdpi/splash.png",
  "android/app/src/main/res/drawable-port-xhdpi/splash.png",
  "android/app/src/main/res/drawable-port-xxhdpi/splash.png",
  "android/app/src/main/res/drawable-port-xxxhdpi/splash.png",
];

validateSplashSource(src);

for (const rel of targets) {
  const dest = join(root, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

console.log(`sync-android-splash: copied to ${targets.length} paths`);
