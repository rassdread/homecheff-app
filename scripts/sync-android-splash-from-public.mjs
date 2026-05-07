#!/usr/bin/env node
/**
 * Copieert public/native-splash.png naar alle Android splash.png-resources.
 * Run vóór `npx cap sync` (zie npm script cap:sync).
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(import.meta.dirname, "..");
const src = join(root, "public/native-splash.png");

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

if (!existsSync(src)) {
  console.error("sync-android-splash-from-public: missing public/native-splash.png");
  process.exit(1);
}

for (const rel of targets) {
  const dest = join(root, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

console.log(`sync-android-splash-from-public: copied to ${targets.length} paths`);
