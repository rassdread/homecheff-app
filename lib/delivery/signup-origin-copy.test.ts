/**
 * Signup and settings share one pickup-origin choice.
 * Run: npx tsx --test lib/delivery/signup-origin-copy.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const signup = readFileSync('app/delivery/signup/page.tsx', 'utf8');
const settings = readFileSync('components/delivery/DeliverySettings.tsx', 'utf8');
const choice = readFileSync('components/delivery/DeliveryOriginChoice.tsx', 'utf8');
const dashboard = readFileSync('components/delivery/DeliveryDashboard.tsx', 'utf8');
const dashboardRoute = readFileSync('app/api/delivery/dashboard/route.ts', 'utf8');
const step = signup.slice(
  signup.indexOf('{currentStep === 7 && ('),
  signup.indexOf('{currentStep === 8 && ('),
);

const dutch = {
  deliveryMode: 'Vanaf welke plek wil je opdrachten ophalen?',
  fixedArea: 'Vanaf mijn vaste adres',
  aroundHouse: 'Je ophaalradius geldt rond je ingestelde adres.',
  flexible: 'Vanaf mijn huidige locatie (GPS)',
  multipleAreas:
    'Tik op je dashboard op Gebruik mijn huidige locatie. Zolang je online bent en je locatie actueel is, kun je ophaalopdrachten in die buurt krijgen.',
  currentLocationAction: 'Gebruik mijn huidige locatie',
};

test('the shared Dutch choice names the pickup origin', () => {
  const copy = JSON.parse(readFileSync('public/i18n/nl.json', 'utf8')).deliverySignup;
  for (const [key, value] of Object.entries(dutch)) {
    assert.equal(copy[key], value);
  }
  assert.equal(copy.fixedArea.includes('Vast Gebied'), false);
  assert.equal(copy.multipleAreas.includes('Meerdere gebieden'), false);
  assert.equal(copy.multipleAreas.includes(copy.currentLocationAction), true);
});

test('the shared English choice uses the same keys', () => {
  const copy = JSON.parse(readFileSync('public/i18n/en.json', 'utf8')).deliverySignup;
  assert.equal(copy.deliveryMode, 'Where do you want to pick up jobs?');
  assert.equal(copy.fixedArea, 'From my saved address');
  assert.equal(copy.aroundHouse, 'Your pickup radius applies around the address you set.');
  assert.equal(copy.flexible, 'From my current location (GPS)');
  assert.equal(
    copy.multipleAreas,
    'On your dashboard, tap Use my current location. While you are online and your location is current, you can get pickup jobs in that area.',
  );
  assert.equal(copy.currentLocationAction, 'Use my current location');
  assert.equal(copy.multipleAreas.includes(copy.currentLocationAction), true);
});

test('signup and settings render the same origin choice', () => {
  assert.ok(step.includes('<DeliveryOriginChoice'));
  assert.ok(settings.includes('<DeliveryOriginChoice'));
  assert.equal(step.includes('Vast Gebied'), false);
  assert.equal(settings.includes('Vast Gebied'), false);
  assert.equal(settings.includes('Dynamisch GPS'), false);
  assert.equal(settings.includes('delivery.deliveryModeLabel'), false);
  for (const key of [
    'deliverySignup.deliveryMode',
    'deliverySignup.fixedArea',
    'deliverySignup.aroundHouse',
    'deliverySignup.flexible',
    'deliverySignup.multipleAreas',
    'deliverySignup.currentLocationAction',
  ]) {
    assert.equal(choice.includes(`t('${key}')`), true, key);
  }
  assert.ok(choice.includes('LocateFixed'));
  assert.ok(choice.includes("mode: 'FIXED'"));
  assert.ok(choice.includes("mode: 'DYNAMIC'"));
});

test('the dashboard keeps the saved preference apart from the active origin', () => {
  assert.ok(dashboard.includes('describeActiveOrigin'));
  assert.ok(dashboard.includes('origin.preference'));
  assert.ok(dashboardRoute.includes("preference: deliveryProfile?.deliveryMode === 'DYNAMIC' ? 'DYNAMIC' : 'FIXED'"));
  assert.equal(dashboard.includes('Je zoekt nu rond'), false);
});
