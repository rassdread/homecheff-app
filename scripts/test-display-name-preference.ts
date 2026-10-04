/**
 * Snelle checks voor lib/displayName (geen DB).
 * Run: npx tsx scripts/test-display-name-preference.ts
 */
import assert from "node:assert/strict";
import {
  getDisplayName,
  PUBLIC_DISPLAY_FALLBACK,
  PUBLIC_DISPLAY_FALLBACK_EN,
  normalizeStoredDisplayNameOption,
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

test("legacy none with username shows username, never the real name", () => {
  const shown = getDisplayName({
    name: "Secret Person",
    username: "secret",
    displayFullName: true,
    displayNameOption: "none",
  });
  assert.equal(shown, "secret");
  assert.notEqual(shown, "Secret Person");
});

test("legacy none without username does not expose the real name", () => {
  const shown = getDisplayName({
    name: "Secret Person",
    username: "temp_123_ab",
    displayFullName: true,
    displayNameOption: "none",
  });
  assert.equal(shown, PUBLIC_DISPLAY_FALLBACK);
  assert.notEqual(shown, "Secret Person");
});

test("english fallback", () => {
  assert.equal(
    getDisplayName({ name: "Secret Person", username: null, displayNameOption: "none" }, "en"),
    PUBLIC_DISPLAY_FALLBACK_EN,
  );
});

test("first name does not fall through to the full name", () => {
  assert.equal(
    getDisplayName({
      name: "Jan Jansen",
      username: "janmaker",
      displayNameOption: "first",
    }),
    "Jan",
  );
});

test("new preference normalizes none to username", () => {
  assert.equal(normalizeStoredDisplayNameOption("none"), "username");
  assert.equal(normalizeStoredDisplayNameOption(undefined), "username");
  assert.equal(normalizeStoredDisplayNameOption("full"), "full");
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
