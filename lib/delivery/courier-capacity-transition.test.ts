import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  marketplaceKeepsCourier,
  parseCourierCapacityWrite,
  readExplicitMarketplaceShipment,
  vehicleCapacityExample,
} from '@/lib/delivery/courier-capacity';
import { assessCourierCapacity, type ShipmentRequest } from '@/lib/delivery/shipment-capacity';

const parcel: ShipmentRequest = {
  kind: 'PARCEL',
  size: 'CUSTOM',
  weightGrams: 4000,
  packageCount: 1,
  lengthCm: 40,
  widthCm: 30,
  heightCm: 20,
  description: 'Doos',
  fragile: false,
  temperatureSensitive: false,
  liftHelp: false,
};

test('saving capacity does not invent a limit and requires complete dimensions', () => {
  const absent = parseCourierCapacityWrite({ bio: 'hallo' });
  assert.equal(absent.present, false);
  const cleared = parseCourierCapacityWrite({ maxWeightKg: '', maxLengthCm: '', maxWidthCm: '', maxHeightCm: '' });
  assert.equal(cleared.present, true);
  if (cleared.present && 'value' in cleared) {
    assert.equal(cleared.value.maxWeightGrams, null);
    assert.equal(cleared.value.maxLengthCm, null);
  }
  const partial = parseCourierCapacityWrite({ maxWeightKg: '8', maxLengthCm: '40' });
  assert.equal(partial.present, true);
  if (partial.present && 'error' in partial) {
    assert.match(partial.error, /alle drie/);
  }
  const saved = parseCourierCapacityWrite({
    maxWeightKg: '12,5',
    maxLengthCm: '80',
    maxWidthCm: '50',
    maxHeightCm: '40',
    maxPackageCount: '2',
    carriesFragile: false,
  });
  assert.equal(saved.present, true);
  if (saved.present && 'value' in saved) {
    assert.equal(saved.value.maxWeightGrams, 12500);
    assert.equal(saved.value.maxPackageCount, 2);
    assert.equal(saved.value.carriesFragile, null);
  }
});

test('a box fits only when every side fits the registered cargo space', () => {
  const fits = assessCourierCapacity({
    maxWeightGrams: 20000,
    maxLengthCm: 80,
    maxWidthCm: 40,
    maxHeightCm: 30,
    shipment: parcel,
  });
  assert.equal(fits.status, 'FITS');
  const turned = assessCourierCapacity({
    maxWeightGrams: 20000,
    maxLengthCm: 40,
    maxWidthCm: 30,
    maxHeightCm: 20,
    shipment: parcel,
  });
  assert.equal(turned.status, 'FITS');
  const tooNarrow = assessCourierCapacity({
    maxWeightGrams: 20000,
    maxLengthCm: 50,
    maxWidthCm: 20,
    maxHeightCm: 20,
    shipment: parcel,
  });
  assert.equal(tooNarrow.status, 'INSUFFICIENT');
  const missingBox = assessCourierCapacity({
    maxWeightGrams: 20000,
    shipment: parcel,
  });
  assert.equal(missingBox.status, 'UNKNOWN');
});

test('marketplace keeps couriers without a registered capacity', () => {
  assert.equal(readExplicitMarketplaceShipment({}), null);
  assert.equal(marketplaceKeepsCourier({ capacity: { maxWeightGrams: null }, shipment: null }), true);
  assert.equal(
    marketplaceKeepsCourier({ capacity: { maxWeightGrams: null }, shipment: parcel }),
    true,
  );
  assert.equal(
    marketplaceKeepsCourier({ capacity: { maxWeightGrams: 1000 }, shipment: parcel }),
    false,
  );
  assert.equal(
    marketplaceKeepsCourier({
      capacity: { maxWeightGrams: 20000, maxLengthCm: 80, maxWidthCm: 40, maxHeightCm: 30 },
      shipment: parcel,
    }),
    true,
  );
  const invalid = readExplicitMarketplaceShipment({ weightGrams: '0' });
  assert.equal(invalid, null);
});

test('the capacity migration adds empty columns and does not rewrite couriers', () => {
  const sql = fs.readFileSync(
    path.join(process.cwd(), 'prisma/migrations/20261104120000_courier_cargo_capacity/migration.sql'),
    'utf8',
  );
  const statements = sql.replace(/--.*$/gm, '');
  assert.match(statements, /ADD COLUMN "maxWeightGrams" INTEGER/);
  assert.doesNotMatch(statements, /UPDATE|DEFAULT|NOT NULL/i);
});

test('vehicle examples do not contain a saved number', () => {
  for (const mode of ['BIKE', 'EBIKE', 'SCOOTER', 'CAR']) {
    const text = vehicleCapacityExample([mode]);
    assert.equal(/\d/.test(text), false);
    assert.match(text, /zelf/i);
  }
});
