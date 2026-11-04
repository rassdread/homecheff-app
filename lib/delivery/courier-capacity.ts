/**
 * Transition rules for courier cargo capacity.
 *
 * Existing marketplace orders do not describe a shipment. A courier without
 * a saved weight stays matchable for those orders. No fictional limit is
 * written onto old profiles.
 *
 * A new standalone shipment requires a registered weight. UNKNOWN is not a
 * fit. A registered limit that is too small is INSUFFICIENT in both flows.
 * Marketplace only removes a courier when the limit is registered and the
 * explicit shipment does not fit. An unregistered marketplace courier stays.
 */

import {
  assessCourierCapacity,
  validateShipment,
  type RegisteredCapacity,
  type ShipmentKind,
  type ShipmentRequest,
  type ShipmentSize,
} from '@/lib/delivery/shipment-capacity';

export type CapacityWrite = {
  maxWeightGrams: number | null;
  maxLengthCm: number | null;
  maxWidthCm: number | null;
  maxHeightCm: number | null;
  maxPackageCount: number | null;
  carriesFragile: boolean | null;
  temperatureControlled: boolean | null;
  liftAssistance: boolean | null;
};

const CAPACITY_KEYS = [
  'maxWeightKg',
  'maxWeightGrams',
  'maxLengthCm',
  'maxWidthCm',
  'maxHeightCm',
  'maxPackageCount',
  'carriesFragile',
  'temperatureControlled',
  'liftAssistance',
] as const;

function blank(value: unknown): boolean {
  return value == null || String(value).trim() === '';
}

function optionalNumber(value: unknown, max: number, label: string): number | null | string {
  if (blank(value)) return null;
  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0 || number > max) {
    return `${label} is ongeldig.`;
  }
  return number;
}

function declared(value: unknown): boolean | null {
  return value === true || value === 'true' || value === '1' || value === 'on' ? true : null;
}

export function parseCourierCapacityWrite(
  body: Record<string, unknown>,
): { present: false } | { present: true; error: string } | { present: true; value: CapacityWrite } {
  if (!CAPACITY_KEYS.some((key) => Object.prototype.hasOwnProperty.call(body, key))) {
    return { present: false };
  }
  const kilos = body.maxWeightKg !== undefined ? body.maxWeightKg : null;
  const gramsDirect = body.maxWeightGrams;
  let maxWeightGrams: number | null = null;
  if (!blank(kilos)) {
    const parsed = optionalNumber(kilos, 1000, 'Het maximale gewicht');
    if (typeof parsed === 'string') return { present: true, error: parsed };
    maxWeightGrams = parsed == null ? null : Math.round(parsed * 1000);
  } else if (!blank(gramsDirect)) {
    const parsed = optionalNumber(gramsDirect, 1_000_000, 'Het maximale gewicht');
    if (typeof parsed === 'string') return { present: true, error: parsed };
    maxWeightGrams = parsed == null ? null : Math.round(parsed);
  }
  const length = optionalNumber(body.maxLengthCm, 500, 'De maximale lengte');
  const width = optionalNumber(body.maxWidthCm, 500, 'De maximale breedte');
  const height = optionalNumber(body.maxHeightCm, 500, 'De maximale hoogte');
  if (typeof length === 'string') return { present: true, error: length };
  if (typeof width === 'string') return { present: true, error: width };
  if (typeof height === 'string') return { present: true, error: height };
  const dimensions = [length, width, height];
  if (dimensions.some((value) => value != null) && dimensions.some((value) => value == null)) {
    return { present: true, error: 'Vul lengte, breedte en hoogte alle drie in, of laat ze alle drie leeg.' };
  }
  const packages = optionalNumber(body.maxPackageCount, 50, 'Het maximale aantal pakketten');
  if (typeof packages === 'string') return { present: true, error: packages };
  return {
    present: true,
    value: {
      maxWeightGrams,
      maxLengthCm: length == null ? null : Math.round(length),
      maxWidthCm: width == null ? null : Math.round(width),
      maxHeightCm: height == null ? null : Math.round(height),
      maxPackageCount: packages == null ? null : Math.round(packages),
      carriesFragile: declared(body.carriesFragile),
      temperatureControlled: declared(body.temperatureControlled),
      liftAssistance: declared(body.liftAssistance),
    },
  };
}

export function capacityIsRegistered(capacity: RegisteredCapacity | null | undefined): boolean {
  return capacity?.maxWeightGrams != null && capacity.maxWeightGrams > 0;
}

/**
 * Marketplace product matching has no shipment unless the caller sends one.
 * Without that shipment, every commercially eligible courier stays listed.
 * With a shipment, only a registered limit that does not fit is removed.
 */
export function marketplaceKeepsCourier(input: {
  capacity: RegisteredCapacity | null | undefined;
  shipment: ShipmentRequest | null;
}): boolean {
  const capacity = input.capacity;
  if (!input.shipment || !capacity || !capacityIsRegistered(capacity)) return true;
  return assessCourierCapacity({
    maxWeightGrams: capacity.maxWeightGrams,
    maxLengthCm: capacity.maxLengthCm ?? null,
    maxWidthCm: capacity.maxWidthCm ?? null,
    maxHeightCm: capacity.maxHeightCm ?? null,
    maxPackageCount: capacity.maxPackageCount ?? null,
    carriesFragile: capacity.carriesFragile ?? null,
    temperatureControlled: capacity.temperatureControlled ?? null,
    liftAssistance: capacity.liftAssistance ?? null,
    shipment: input.shipment,
  }).status !== 'INSUFFICIENT';
}

export function readExplicitMarketplaceShipment(params: {
  weightGrams?: string | null;
  packageCount?: string | null;
  lengthCm?: string | null;
  widthCm?: string | null;
  heightCm?: string | null;
  shipmentKind?: string | null;
  shipmentSize?: string | null;
  description?: string | null;
}): ShipmentRequest | null {
  if (params.weightGrams == null || params.weightGrams.trim() === '') return null;
  const parsed = validateShipment({
    kind: (params.shipmentKind || 'PARCEL') as ShipmentKind,
    size: (params.shipmentSize || (params.lengthCm ? 'CUSTOM' : 'SMALL')) as ShipmentSize,
    weightGrams: Number(params.weightGrams),
    packageCount: Number(params.packageCount || 1),
    lengthCm: params.lengthCm ? Number(params.lengthCm) : null,
    widthCm: params.widthCm ? Number(params.widthCm) : null,
    heightCm: params.heightCm ? Number(params.heightCm) : null,
    description: params.description?.trim() || 'Marketplace-zending',
    fragile: false,
    temperatureSensitive: false,
    liftHelp: false,
  });
  return parsed.ok ? parsed.shipment : null;
}

export function vehicleCapacityExample(modes: string[]): string {
  if (modes.includes('CAR')) {
    return 'Een auto heeft meer ruimte. Vul zelf het gewicht en de afmetingen in die jij aankunt.';
  }
  if (modes.includes('SCOOTER')) {
    return 'Een scooter neemt vaak een krat of een middelgrote doos mee. Vul zelf je limiet in.';
  }
  if (modes.includes('EBIKE')) {
    return 'Een e-bike heeft meestal iets meer ruimte dan een fiets. Vul zelf je limiet in.';
  }
  if (modes.includes('BIKE')) {
    return 'Een fiets vervoert vaak een kleine doos. Vul zelf het gewicht in dat jij aankunt.';
  }
  return 'Kies eerst een vervoermiddel. Vul daarna zelf in wat je kunt meenemen.';
}
