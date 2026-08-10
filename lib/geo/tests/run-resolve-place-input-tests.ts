/**
 * Unit tests for place resolution helpers (no network).
 * Run: npx tsx lib/geo/tests/run-resolve-place-input-tests.ts
 */
import {
  distinctPlaceCandidates,
  isMetropolitanNetherlands,
  placeTextMateriallyChanged,
  type ResolvedPlaceCandidate,
} from '@/lib/geo/resolve-place-input';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const nearA: ResolvedPlaceCandidate = {
  label: 'Vlaardingen, Nederland',
  lat: 51.9125,
  lng: 4.3417,
  source: 'test',
};
const nearB: ResolvedPlaceCandidate = {
  label: 'Vlaardingen centrum',
  lat: 51.913,
  lng: 4.342,
  source: 'test',
};
const far: ResolvedPlaceCandidate = {
  label: 'Other Vlaardingen-like',
  lat: 52.5,
  lng: 5.5,
  source: 'test',
};

const distinct = distinctPlaceCandidates([nearA, nearB, far]);
assert(distinct.length === 2, `expected 2 distinct, got ${distinct.length}`);

assert(
  placeTextMateriallyChanged('Vlaardingen', 'Amsterdam'),
  'Amsterdam change should be material',
);
assert(
  !placeTextMateriallyChanged('Vlaardingen', '  vlaardingen  '),
  'whitespace/case should not be material',
);
assert(
  placeTextMateriallyChanged('Vlaardingen', ''),
  'clearing place is material',
);

assert(isMetropolitanNetherlands(51.92, 4.34), 'Vlaardingen is metro NL');
assert(
  !isMetropolitanNetherlands(18.04, -63.05),
  'Caribbean Sint Maarten is not metro NL',
);

console.log('resolve-place-input tests: PASS');
