/**
 * Snelle checks voor lib/displayName (geen DB).
 * Run: npx tsx scripts/test-display-name-preference.ts
 */
import assert from "node:assert/strict";
import {
  getDisplayName,
  PUBLIC_DISPLAY_FALLBACK,
} from "../lib/displayName";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

test("username-only preference", () => {
  assert.equal(
    getDisplayName({
      name: "Jan Jansen",
      username: "janmaker",
      displayFullName: true,
      displayNameOption: "username",
    }),
    "janmaker",
  );
});

test("first name preference with fallback to username", () => {
  assert.equal(
    getDisplayName({
      name: "",
      username: "onlyuser",
      displayFullName: true,
      displayNameOption: "first",
    }),
    "onlyuser",
  );
});

test("none maps to fallback label", () => {
  assert.equal(
    getDisplayName({
      name: "Secret Person",
      username: "secret",
      displayFullName: true,
      displayNameOption: "none",
    }),
    PUBLIC_DISPLAY_FALLBACK,
  );
});

test("legacy displayFullName false hides real name", () => {
  assert.equal(
    getDisplayName({
      name: "Hidden Real",
      username: "publicnick",
      displayFullName: false,
      displayNameOption: "full",
    }),
    "publicnick",
  );
});

test("full preference uses normalized name", () => {
  assert.equal(
    getDisplayName({
      name: "  Marie  Curie ",
      username: "mc",
      displayFullName: true,
      displayNameOption: "full",
    }),
    "Marie Curie",
  );
});

if (process.exitCode) {
  process.exit(1);
}
console.log("All display-name checks passed.");
