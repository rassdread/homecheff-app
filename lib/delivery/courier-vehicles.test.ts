import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyLegacyCapacity,
  fitQuestionEffect,
  legacyFleet,
  parseCourierVehicle,
  parseCourierVehicles,
  selectVehicleForJob,
  transportationModesForVehicles,
  vehiclePublicLabel,
  type CourierVehicle,
} from './courier-vehicles';
import { catalogReferences, referenceHeadline } from './vehicle-references';

function vehicle(partial: Partial<CourierVehicle> & Pick<CourierVehicle, 'family'>): CourierVehicle {
  return {
    variant: null,
    carrying: [],
    carryingProvider: null,
    features: [],
    maxLengthCm: null,
    maxWidthCm: null,
    maxHeightCm: null,
    maxWeightKg: null,
    capacityStatus: { length: 'unset', width: 'unset', height: 'unset', weight: 'unset' },
    ...partial,
  };
}

test('an existing Auto stays Auto until a body style is chosen', () => {
  const fleet = legacyFleet({ transportation: ['CAR'] });
  assert.equal(fleet.legacyUnassigned, false);
  assert.equal(fleet.vehicles[0]?.variant, null);
  assert.equal(vehiclePublicLabel(fleet.vehicles[0]!), 'Auto');
});

test('one stored measurement set stays on the only vehicle', () => {
  const fleet = legacyFleet({
    transportation: ['CAR'],
    capacity: {
      maxLengthCm: 120,
      maxWidthCm: null,
      maxHeightCm: null,
      maxWeightKg: null,
      status: { length: 'set', width: 'unset', height: 'unset', weight: 'unset' },
    },
  });
  assert.equal(fleet.vehicles[0]?.maxLengthCm, 120);
  assert.equal(fleet.legacyUnassigned, false);
});

test('several vehicles do not inherit one old measurement set', () => {
  const fleet = legacyFleet({
    transportation: ['BIKE', 'VAN'],
    capacity: {
      maxLengthCm: 300,
      status: { length: 'set', width: 'unset', height: 'unset', weight: 'unset' },
    },
  });
  assert.equal(fleet.legacyUnassigned, true);
  assert.equal(fleet.vehicles[0]?.maxLengthCm, null);
  assert.equal(fleet.vehicles[1]?.maxLengthCm, null);
  assert.equal(vehiclePublicLabel(fleet.vehicles[1]!), 'Bestelbus');
  const assigned = fleet.vehicles.map((item, index) =>
    index === 1 ? applyLegacyCapacity(item, { maxLengthCm: 300, status: { length: 'set' } }) : item,
  );
  assert.equal(assigned[1]?.maxLengthCm, 300);
  assert.equal(assigned[0]?.maxLengthCm, null);
});

test('a hatchback with a folding seat does not invent cargo space', () => {
  const hatch = vehicle({
    family: 'CAR',
    variant: 'HATCHBACK',
    features: ['FOLD_REAR_SEAT'],
  });
  assert.equal(hatch.maxLengthCm, null);
  assert.equal(vehiclePublicLabel(hatch), 'Hatchback · achterbank neerklapbaar');
  const missing = selectVehicleForJob([hatch], {
    cargo: { lengthCm: 180, widthCm: 80, heightCm: 70, weightKg: 40 },
  });
  assert.equal(missing.ok && missing.needsFitQuestion, true);
  const tooSmall = selectVehicleForJob(
    [{ ...hatch, maxLengthCm: 100, capacityStatus: { ...hatch.capacityStatus, length: 'set' } }],
    { cargo: { lengthCm: 180, widthCm: 40, heightCm: 40, weightKg: 10 } },
  );
  assert.equal(tooSmall.ok, false);
  if (!tooSmall.ok) assert.equal(tooSmall.code, 'TOO_SMALL');
});

test('an e-bike with panniers keeps its own gear after a round trip', () => {
  const saved = parseCourierVehicles([
    {
      family: 'EBIKE',
      variant: 'ORDINARY',
      carrying: ['PANNIERS'],
      carryingProvider: 'COURIER',
      features: ['INSULATED'],
      capacityStatus: { length: 'unset', width: 'unset', height: 'unset', weight: 'unset' },
    },
  ]);
  assert.ok(saved);
  assert.equal(vehiclePublicLabel(saved[0]!), 'Gewone fiets · geïsoleerde tas of box · fietstassen');
  assert.deepEqual(transportationModesForVehicles(saved), ['EBIKE']);
  const again = parseCourierVehicles(saved);
  assert.equal(again?.[0]?.carrying[0], 'PANNIERS');
  assert.equal(again?.[0]?.features.includes('ACTIVE_COOLING'), false);
});

test('a cooling job uses only the cooled van when the courier also has a bike', () => {
  const bike = vehicle({ id: 'bike', family: 'BIKE', variant: 'ORDINARY' });
  const van = vehicle({
    id: 'van',
    family: 'BUS',
    variant: 'MEDIUM',
    features: ['ACTIVE_COOLING', 'TAIL_LIFT'],
  });
  const chosen = selectVehicleForJob([bike, van], { requiredFeatures: ['ACTIVE_COOLING'] });
  assert.equal(chosen.ok, true);
  if (chosen.ok) {
    assert.equal(chosen.vehicle.id, 'van');
    assert.equal(chosen.label, 'Middelgrote bestelbus · actieve koeling · laadklep');
    assert.equal(chosen.needsFitQuestion, false);
  }
  const packageJob = selectVehicleForJob([bike, van], {});
  assert.equal(packageJob.ok && packageJob.vehicle.id, 'bike');
});

test('two vehicles of the same kind stay separate', () => {
  const parsed = parseCourierVehicles([
    { family: 'CAR', variant: 'HATCHBACK', features: ['FOLD_REAR_SEAT'], capacityStatus: { length: 'unset', width: 'unset', height: 'unset', weight: 'unset' } },
    { family: 'CAR', variant: 'SEDAN', capacityStatus: { length: 'set', width: 'unset', height: 'unset', weight: 'unset' }, maxLengthCm: 160 },
  ]);
  assert.equal(parsed?.length, 2);
  assert.equal(parsed?.[0]?.maxLengthCm, null);
  assert.equal(parsed?.[1]?.maxLengthCm, 160);
  assert.deepEqual(transportationModesForVehicles(parsed || []), ['CAR']);
});

test('a pannier outer size does not prove a box fits and a cabinet does not', () => {
  const bike = vehicle({
    id: 'bike',
    family: 'BIKE',
    variant: 'ORDINARY',
    carrying: ['PANNIERS'],
    carryingProvider: 'COURIER',
  });
  const van = vehicle({
    id: 'van',
    family: 'BUS',
    variant: 'MEDIUM',
    features: ['ACTIVE_COOLING', 'TAIL_LIFT'],
  });
  const small = selectVehicleForJob([bike, van], {
    cargo: { lengthCm: 20, widthCm: 12, heightCm: 8, weightKg: 3 },
  });
  assert.equal(small.ok, true);
  if (small.ok) {
    assert.equal(small.vehicle.id, 'bike');
    assert.equal(small.fitLabel, 'Even afstemmen');
    assert.equal(small.needsFitQuestion, true);
  }
  const cabinet = selectVehicleForJob([bike], {
    cargo: { lengthCm: 180, widthCm: 80, heightCm: 70, weightKg: 40 },
  });
  assert.equal(cabinet.ok, false);
  if (!cabinet.ok) assert.equal(cabinet.code, 'TOO_SMALL');
  const cooled = selectVehicleForJob([bike, van], {
    cargo: { lengthCm: 180, widthCm: 80, heightCm: 70, weightKg: 40 },
    requiredFeatures: ['ACTIVE_COOLING'],
  });
  assert.equal(cooled.ok, true);
  if (cooled.ok) {
    assert.equal(cooled.vehicle.id, 'van');
    assert.equal(cooled.label, 'Middelgrote bestelbus · actieve koeling · laadklep');
    assert.equal(cooled.fitLabel, 'Even afstemmen');
  }
  const nineGeneric = selectVehicleForJob([bike], {
    cargo: { lengthCm: 20, widthCm: 12, heightCm: 8, weightKg: 9 },
  });
  assert.equal(nineGeneric.ok && nineGeneric.fitLabel, 'Even afstemmen');
  const heavyBags = selectVehicleForJob([bike], {
    cargo: { lengthCm: 20, widthCm: 12, heightCm: 8, weightKg: 10 },
  });
  assert.equal(heavyBags.ok, false);
  if (!heavyBags.ok) assert.equal(heavyBags.code, 'TOO_HEAVY');
  const knownBag = selectVehicleForJob([{ ...bike, referenceId: 'ortlieb-backroller' }], {
    cargo: { lengthCm: 20, widthCm: 12, heightCm: 8, weightKg: 10 },
  });
  assert.equal(knownBag.ok, false);
  if (!knownBag.ok) assert.equal(knownBag.code, 'TOO_HEAVY');
  const secondBag = selectVehicleForJob(
    [
      { ...bike, id: 'left', referenceId: 'ortlieb-backroller' },
      { ...bike, id: 'right', referenceId: 'ortlieb-backroller' },
    ],
    { cargo: { lengthCm: 20, widthCm: 12, heightCm: 8, weightKg: 10 } },
  );
  assert.equal(secondBag.ok, false);
  const hatch = vehicle({ family: 'CAR', variant: 'HATCHBACK' });
  const genericCar = selectVehicleForJob([hatch], {
    cargo: { lengthCm: 180, widthCm: 80, heightCm: 70, weightKg: 40 },
  });
  assert.equal(genericCar.ok && genericCar.fitLabel, 'Even afstemmen');
  const knownCar = selectVehicleForJob([{ ...hatch, referenceId: 'corsa-2019' }], {
    cargo: { lengthCm: 180, widthCm: 80, heightCm: 70, weightKg: 40 },
  });
  assert.equal(knownCar.ok && knownCar.fitLabel, 'Even afstemmen');
  const switched = selectVehicleForJob([bike, van], {
    cargo: { lengthCm: 180, widthCm: 80, heightCm: 70, weightKg: 40 },
  });
  assert.equal(switched.ok, true);
  if (switched.ok) {
    assert.equal(switched.vehicle.id, 'van');
    assert.equal(switched.label, 'Middelgrote bestelbus · actieve koeling · laadklep');
    assert.equal(switched.fitLabel, 'Even afstemmen');
    assert.equal(switched.needsFitQuestion, true);
  }
  const pair = selectVehicleForJob([bike], {
    cargo: { lengthCm: 20, widthCm: 12, heightCm: 8, weightKg: 3 },
    itemCount: 2,
  });
  assert.equal(pair.ok && pair.fitLabel, 'Even afstemmen');
});

test('a named van shows its model and uses payload only for that exact execution', () => {
  const named = parseCourierVehicle({
    family: 'BUS',
    variant: 'MEDIUM',
    referenceId: 'trafic-l1',
    features: [],
    carrying: [],
    capacityStatus: { length: 'unset', width: 'unset', height: 'unset', weight: 'unset' },
  });
  assert.equal(named && vehiclePublicLabel(named), 'Middelgrote bestelbus · Renault Trafic L1H1');
  const pie = { lengthCm: 28, widthCm: 28, heightCm: 8, weightKg: 1.2 };
  const heavy = { lengthCm: 28, widthCm: 28, heightCm: 8, weightKg: 1000 };
  const label = (referenceId: string, cargo: typeof pie) => {
    const parsed = parseCourierVehicle({
      family: 'BUS',
      variant: referenceId.startsWith('trafic') ? 'MEDIUM' : 'LARGE',
      referenceId,
      features: [],
      carrying: [],
      capacityStatus: { length: 'unset', width: 'unset', height: 'unset', weight: 'unset' },
    });
    const result = selectVehicleForJob([parsed!], { cargo });
    return result.ok ? result.fitLabel : 'rejected';
  };
  assert.equal(label('trafic-l1', pie), 'Even afstemmen');
  assert.equal(label('trafic-l2', pie), 'Even afstemmen');
  assert.equal(label('jumper-l2h2', pie), 'Even afstemmen');
  assert.equal(label('jumper-l2h2-30t-120', pie), 'Past naar verwachting');
  assert.equal(label('jumper-l2h2-30t-120', heavy), 'rejected');
  assert.equal(label('jumper-l2h2-30t-120', { ...pie, weightKg: 925 }), 'Even afstemmen');
  assert.equal(label('jumper-l2h2-30t-120', { ...pie, weightKg: 925.1 }), 'rejected');
  assert.equal(label('trafic-l2', heavy), 'Even afstemmen');
  const raised = parseCourierVehicle({
    family: 'BUS',
    variant: 'LARGE',
    referenceId: 'jumper-l2h2-30t-120',
    features: [],
    carrying: [],
    maxWeightKg: 2000,
    capacityStatus: { length: 'set', width: 'set', height: 'set', weight: 'set' },
    maxLengthCm: 400,
    maxWidthCm: 160,
    maxHeightCm: 200,
  });
  const raisedChoice = selectVehicleForJob([raised!], { cargo: heavy });
  assert.equal(raisedChoice.ok, false);
  if (!raisedChoice.ok) assert.equal(raisedChoice.code, 'TOO_HEAVY');
  const measuredVan = parseCourierVehicle({
    id: 'measured-van',
    family: 'BUS',
    variant: 'LARGE',
    features: [],
    carrying: [],
    maxLengthCm: 400,
    maxWidthCm: 160,
    maxHeightCm: 200,
    maxWeightKg: 1200,
    capacityStatus: { length: 'set', width: 'set', height: 'set', weight: 'set' },
  });
  const jumper = parseCourierVehicle({
    id: 'jumper',
    family: 'BUS',
    variant: 'LARGE',
    referenceId: 'jumper-l2h2-30t-120',
    features: [],
    carrying: [],
    capacityStatus: { length: 'unset', width: 'unset', height: 'unset', weight: 'unset' },
  });
  const second = selectVehicleForJob([jumper!, measuredVan!], { cargo: heavy });
  assert.equal(second.ok, true);
  if (second.ok) {
    assert.equal(second.vehicle.id, 'measured-van');
    assert.equal(second.fitLabel, 'Past volgens de opgegeven maten');
  }
  const exact = catalogReferences({ variant: 'LARGE', carrying: [], carryingProvider: null }).find((item) => item.id === 'jumper-l2h2-30t-120');
  assert.equal(exact?.weightBound, 'ceiling');
  assert.equal(exact?.weightKg, 925);
  const own = parseCourierVehicle({
    family: 'BUS',
    variant: 'MEDIUM',
    referenceId: 'trafic-l2',
    features: [],
    carrying: [],
    maxWeightKg: 1,
    capacityStatus: { length: 'unset', width: 'unset', height: 'unset', weight: 'set' },
  });
  const ownChoice = selectVehicleForJob([own!], { cargo: pie });
  assert.equal(ownChoice.ok, false);
  if (!ownChoice.ok) assert.equal(ownChoice.code, 'TOO_HEAVY');
  const corolla = catalogReferences({ variant: 'STATION', carrying: [], carryingProvider: null }).find((item) => item.id === 'corolla-touring-2023');
  assert.equal(corolla?.heightCm ?? null, null);
  assert.match(referenceHeadline(corolla!), /102 cm laadlengte/);
});

test('asking whether the load fits does not start a booking', () => {
  const effect = fitQuestionEffect('van');
  assert.equal(effect.action, 'QUESTION');
  assert.equal(effect.bookingRequestId, null);
  assert.equal(effect.createsBooking, false);
  assert.equal(effect.sendsCourierMail, false);
  assert.equal(effect.matchedVehicleId, 'van');
});
