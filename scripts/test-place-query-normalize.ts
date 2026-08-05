/**
 * Phase 5.5 — Dutch postcode normalization for feed place geocoding.
 */
import assert from "node:assert/strict";
import { normalizePlaceQueryForGeocode } from "../lib/global-geocoding";

const cases: Array<[string, string, string]> = [
  ["3131AA", "NL", "3131 AA"],
  ["3131aa", "NL", "3131 AA"],
  [" 3131 aa ", "NL", "3131 AA"],
  ["3131 AA", "NL", "3131 AA"],
  ["1012JS", "NL", "1012 JS"],
  ["Amsterdam", "NL", "Amsterdam"],
  ["Antwerpen", "NL", "Antwerpen"],
  ["2000", "NL", "2000"],
  ["ABC", "NL", "ABC"],
  ["3131AA", "BE", "3131AA"],
];

for (const [input, cc, expected] of cases) {
  assert.equal(
    normalizePlaceQueryForGeocode(input, cc),
    expected,
    `${input} (${cc})`,
  );
}

console.log("[place-query-normalize] PASS", cases.length);
