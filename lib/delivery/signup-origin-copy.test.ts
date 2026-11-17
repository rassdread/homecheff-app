/**
 * The private signup area step must name the pickup origin.
 * Production showed the old area labels because this dictionary still said so.
 * Run: npx tsx --test lib/delivery/signup-origin-copy.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const signup = readFileSync('app/delivery/signup/page.tsx', 'utf8');
const step = signup.slice(
  signup.indexOf('{currentStep === 7 && ('),
  signup.indexOf('{currentStep === 8 && ('),
);

test('the Dutch signup area step asks where pickup jobs start', () => {
  const copy = JSON.parse(readFileSync('public/i18n/nl.json', 'utf8')).deliverySignup;
  assert.equal(copy.deliveryMode, 'Vanaf welke plek wil je opdrachten ophalen?');
  assert.equal(copy.fixedArea, 'Vanaf mijn vaste adres');
  assert.equal(copy.aroundHouse, 'De ophaalradius geldt rond het ingestelde adres.');
  assert.equal(copy.flexible, 'Vanaf mijn huidige locatie (GPS)');
  assert.equal(
    copy.multipleAreas,
    'Gebruik de locatie van je telefoon om ophaalopdrachten bij jou in de buurt te vinden.',
  );
  assert.equal(copy.fixedArea.includes('Vast Gebied'), false);
  assert.equal(copy.multipleAreas.includes('Meerdere gebieden'), false);
});

test('the same signup step keeps the English origin labels', () => {
  const copy = JSON.parse(readFileSync('public/i18n/en.json', 'utf8')).deliverySignup;
  assert.equal(copy.deliveryMode, 'Where do you want to pick up jobs?');
  assert.equal(copy.fixedArea, 'From my saved address');
  assert.equal(copy.aroundHouse, 'The pickup radius applies around the address you set.');
  assert.equal(copy.flexible, 'From my current location (GPS)');
  assert.equal(copy.multipleAreas, "Use your phone's location to find pickup jobs near you.");
});

test('the area step renders those labels and still stores the existing modes', () => {
  assert.ok(step.includes("t('deliverySignup.deliveryMode')"));
  assert.ok(step.includes("t('deliverySignup.fixedArea')"));
  assert.ok(step.includes("t('deliverySignup.aroundHouse')"));
  assert.ok(step.includes("t('deliverySignup.flexible')"));
  assert.ok(step.includes("t('deliverySignup.multipleAreas')"));
  assert.ok(step.includes('LocateFixed'));
  assert.ok(step.includes("deliveryMode: 'FIXED'"));
  assert.ok(step.includes("deliveryMode: 'DYNAMIC'"));
  assert.equal(step.includes('Vast Gebied'), false);
  assert.equal(step.includes('Meerdere gebieden'), false);
});
