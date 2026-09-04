/**
 * Launch hygiene — no user-facing "Help testen" / Open Testing nav labels.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");
const nl = JSON.parse(readFileSync(join(root, "public/i18n/nl.json"), "utf8"));
const en = JSON.parse(readFileSync(join(root, "public/i18n/en.json"), "utf8"));
const appPage = readFileSync(join(root, "app/app/page.tsx"), "utf8");

assert.equal(nl.navbar.androidBeta, "App");
assert.equal(en.navbar.androidBeta, "App");
assert.equal(nl.navbar.androidBeta.toLowerCase().includes("testen"), false);
assert.equal(en.navbar.androidBeta.toLowerCase().includes("test"), false);
assert.equal(nl.home.androidBeta.title.toLowerCase().includes("testen"), false);
assert.equal(en.home.androidBeta.title.toLowerCase().includes("help test"), false);
assert.match(appPage, /HomeCheff-app/);
assert.equal(appPage.includes("Help HomeCheff testen"), false);

console.log("hygiene-public-copy.test.ts: ok");
