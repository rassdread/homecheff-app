/**
 * Unit tests: package presets + carrier-shipping detection + parcel form UI.
 */
import assert from 'node:assert/strict';
import {
  PACKAGE_PRESETS,
  isCarrierShippingSelected,
  resolvePresetDimensions,
} from './package-presets';
import { validateParcelFormUi, buildParcelApiPayload } from './parcel-form';
import { validateParcel } from './parcel';

{
  assert.equal(
    isCarrierShippingSelected({ fulfillmentShipping: true, deliveryMode: 'PICKUP' }),
    true,
  );
  assert.equal(
    isCarrierShippingSelected({ fulfillmentShipping: false, deliveryMode: 'SHIPPING' }),
    true,
  );
  assert.equal(
    isCarrierShippingSelected({
      fulfillmentShipping: false,
      deliveryMode: 'PICKUP,SHIPPING',
    }),
    true,
  );
  assert.equal(
    isCarrierShippingSelected({ fulfillmentShipping: false, deliveryMode: 'BOTH' }),
    false,
    'BOTH = pickup+local delivery, not EctaroShip',
  );
  assert.equal(
    isCarrierShippingSelected({ fulfillmentShipping: false, deliveryMode: 'PICKUP' }),
    false,
  );
  console.log('ok isCarrierShippingSelected');
}

{
  const bb = PACKAGE_PRESETS.find((p) => p.id === 'BRIEVENBUS')!;
  assert.ok((bb.heightCm ?? 99) <= 3.5);
  assert.equal(bb.maxWeightKg, 2);
  const dims = resolvePresetDimensions('BRIEVENBUS', {});
  assert.ok(dims);
  const parcel = validateParcel({
    weightGrams: 250,
    parcelPreset: 'BRIEVENBUS',
  });
  assert.equal(parcel.ok, true);
  if (parcel.ok) {
    assert.equal(parcel.parcel.heightCm, bb.heightCm);
  }
  console.log('ok BRIEVENBUS preset → parcel');
}

{
  assert.ok(
    validateParcelFormUi({
      parcelPreset: '',
      weightGrams: '',
      lengthCm: '',
      widthCm: '',
      heightCm: '',
      domesticShippingEnabled: true,
    }),
  );
  assert.equal(
    validateParcelFormUi({
      parcelPreset: 'KLEIN',
      weightGrams: '850',
      lengthCm: '30',
      widthCm: '20',
      heightCm: '10',
      domesticShippingEnabled: true,
    }),
    null,
  );
  const payload = buildParcelApiPayload({
    parcelPreset: 'KLEIN',
    weightGrams: '850',
    lengthCm: '30',
    widthCm: '20',
    heightCm: '10',
    domesticShippingEnabled: true,
  });
  assert.equal(payload.parcelPreset, 'KLEIN');
  assert.equal(payload.weightGrams, 850);
  console.log('ok parcel-form UI helpers');
}
