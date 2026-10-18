/**
 * Delivery registration V5: address preservation, Places fallback,
 * Dutch coordinates, and the activation checklist.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { marketplaceUserPatchForDeliveryProfile } from '@/lib/auth/delivery-guest-auth';
import { buildDeliveryActivationChecklist } from '@/lib/delivery/delivery-activation-checklist';
import { applyDutchHomeCoordinates } from '@/lib/delivery/delivery-home-coordinates';
import {
  isPlacesWidgetFailureText,
  placeDetailsToAddress,
  placesPredictionStatusUnavailable,
  placesSearchShouldRecover,
} from '@/lib/delivery/places-autocomplete-fallback';
import { parseAndValidateDeliverySignupFields } from '@/lib/delivery/delivery-signup-validation';

const manualNl = {
  age: 30,
  transportation: ['CAR'],
  acceptDeliveryAgreement: true,
  addressCountry: 'NL',
  street: 'Coolsingel',
  houseNumber: '40',
  postalCode: '3011 AD',
  city: 'Rotterdam',
};

describe('marketplace address preservation', () => {
  it('does not copy the delivery address onto the Marketplace user', () => {
    const patch = marketplaceUserPatchForDeliveryProfile('BUYER', null);
    assert.deepEqual(patch, { role: 'BUYER' });
    assert.equal('address' in patch, false);
    assert.equal('postalCode' in patch, false);
    assert.equal('city' in patch, false);
    assert.equal('place' in patch, false);
    assert.equal('lat' in patch, false);
    assert.equal('lng' in patch, false);
  });

  it('keeps a supplied contact phone and the existing role', () => {
    const patch = marketplaceUserPatchForDeliveryProfile('SELLER', '0612345678');
    assert.deepEqual(patch, { role: 'SELLER', phoneNumber: '0612345678' });
  });
});

describe('manual address coordinates', () => {
  it('stores PDOK coordinates and leaves a failed lookup empty', async () => {
    const parsed = parseAndValidateDeliverySignupFields(manualNl, {
      requireAccountFields: false,
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.homeLat, null);
    assert.equal(parsed.data.postalCode, '3011 AD');

    const found = await applyDutchHomeCoordinates(parsed.data, async () => ({
      postcode: '3011 AD',
      huisnummer: '40',
      straatnaam: 'Coolsingel',
      plaats: 'Rotterdam',
      provincie: 'Zuid-Holland',
      lat: 51.9225,
      lng: 4.4792,
      formatted_address: 'Coolsingel 40, 3011 AD Rotterdam',
    }));
    assert.equal(found.homeLat, 51.9225);
    assert.equal(found.homeLng, 4.4792);
    assert.equal(found.homeAddress, 'Coolsingel 40, 3011AD Rotterdam');

    const missed = await applyDutchHomeCoordinates(parsed.data, async () => ({
      error: true,
      message: 'Adres niet gevonden',
    }));
    assert.equal(missed.homeLat, null);
    assert.equal(missed.homeLng, null);
  });

  it('keeps coordinates that already came from a selected place', async () => {
    const parsed = parseAndValidateDeliverySignupFields(
      { ...manualNl, homeLat: 51.91, homeLng: 4.47 },
      { requireAccountFields: false },
    );
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    let called = false;
    const kept = await applyDutchHomeCoordinates(parsed.data, async () => {
      called = true;
      return { error: true, message: 'should not run' };
    });
    assert.equal(called, false);
    assert.equal(kept.homeLat, 51.91);
    assert.equal(kept.homeLng, 4.47);
  });
});

describe('places autocomplete fallback', () => {
  it('recovers a search box that Google disabled after an API error', () => {
    assert.equal(isPlacesWidgetFailureText('Oeps! Er is iets misgegaan.'), true);
    assert.equal(isPlacesWidgetFailureText('Oops! Something went wrong.'), true);
    assert.equal(isPlacesWidgetFailureText('Coolsingel 40'), false);
    assert.equal(
      placesSearchShouldRecover({
        disabled: true,
        placeholder: 'Oeps! Er is iets misgegaan.',
        value: 'Coolsingel 40, Rotterdam',
      }),
      true,
    );
    assert.equal(
      placesSearchShouldRecover({
        disabled: false,
        placeholder: 'Start typing to search for an address...',
        value: 'Coolsingel',
      }),
      false,
    );
    assert.equal(placesPredictionStatusUnavailable('REQUEST_DENIED'), true);
    assert.equal(placesPredictionStatusUnavailable('OK'), false);
    assert.equal(placesPredictionStatusUnavailable('ZERO_RESULTS'), false);
  });

  it('maps a legacy place result and rejects a result without coordinates', () => {
    const mapped = placeDetailsToAddress(
      {
        formatted_address: 'Coolsingel 40, 3011 AD Rotterdam, Nederland',
        geometry: { location: { lat: () => 51.9227, lng: () => 4.4792 } },
        address_components: [
          { long_name: '40', short_name: '40', types: ['street_number'] },
          { long_name: 'Coolsingel', short_name: 'Coolsingel', types: ['route'] },
          { long_name: '3011 AD', short_name: '3011 AD', types: ['postal_code'] },
          { long_name: 'Rotterdam', short_name: 'Rotterdam', types: ['locality'] },
          { long_name: 'Nederland', short_name: 'NL', types: ['country'] },
        ],
      },
      'NL',
    );
    assert.equal(mapped?.address, 'Coolsingel 40');
    assert.equal(mapped?.houseNumber, '40');
    assert.equal(mapped?.postalCode, '3011 AD');
    assert.equal(mapped?.city, 'Rotterdam');
    assert.equal(mapped?.country, 'NL');
    assert.equal(mapped?.lat, 51.9227);
    assert.equal(mapped?.lng, 4.4792);
    assert.equal(placeDetailsToAddress({ formatted_address: 'Coolsingel' }, 'NL'), null);
  });
});

describe('delivery activation checklist', () => {
  it('lists only the missing steps and keeps Stripe out', () => {
    const items = buildDeliveryActivationChecklist({
      missing: ['dateOfBirth', 'pricing'],
      eligible: false,
      isOnline: false,
    });
    assert.deepEqual(
      items.map((item) => item.id),
      ['dateOfBirth', 'pricing'],
    );
    assert.equal(items.some((item) => item.id === 'goOnline'), false);
    assert.equal(items[0].labelEn, 'Confirm your date of birth');
    assert.equal(items[1].labelNl, 'Stel je bezorgtarief in');
  });

  it('asks to go online only after the profile is eligible', () => {
    const waiting = buildDeliveryActivationChecklist({
      missing: ['serviceArea'],
      eligible: false,
      isOnline: false,
    });
    assert.deepEqual(
      waiting.map((item) => item.id),
      ['serviceArea'],
    );

    const ready = buildDeliveryActivationChecklist({
      missing: [],
      eligible: true,
      isOnline: false,
    });
    assert.deepEqual(
      ready.map((item) => item.id),
      ['goOnline'],
    );

    const online = buildDeliveryActivationChecklist({
      missing: [],
      eligible: true,
      isOnline: true,
    });
    assert.deepEqual(online, []);
  });
});
