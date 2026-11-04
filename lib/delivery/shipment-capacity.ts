/**
 * Capacity is only a match when the courier profile records a limit.
 * Missing capacity is UNKNOWN and is not treated as suitable.
 */

export type ShipmentSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM';
export type ShipmentKind = 'PARCEL' | 'DOCUMENT' | 'FOOD' | 'OTHER';

export type ShipmentRequest = {
  kind: ShipmentKind;
  size: ShipmentSize;
  weightGrams: number;
  packageCount: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  description: string;
  fragile: boolean;
  temperatureSensitive: boolean;
  liftHelp: boolean;
};

export type CapacityDecision = 'FITS' | 'INSUFFICIENT' | 'UNKNOWN';

const KINDS = new Set<ShipmentKind>(['PARCEL', 'DOCUMENT', 'FOOD', 'OTHER']);
const SIZES = new Set<ShipmentSize>(['SMALL', 'MEDIUM', 'LARGE', 'CUSTOM']);

function positive(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

export function validateShipment(
  raw: Partial<ShipmentRequest> | null | undefined,
): { ok: true; shipment: ShipmentRequest } | { ok: false; error: string } {
  const kind = KINDS.has(raw?.kind as ShipmentKind) ? (raw?.kind as ShipmentKind) : null;
  const size = SIZES.has(raw?.size as ShipmentSize) ? (raw?.size as ShipmentSize) : null;
  const description = String(raw?.description ?? '').trim();
  const weightGrams = positive(raw?.weightGrams);
  const packageCount = positive(raw?.packageCount);
  if (!kind) return { ok: false, error: 'Kies wat voor zending het is.' };
  if (!size) return { ok: false, error: 'Kies een groottecategorie.' };
  if (!packageCount || packageCount > 20) return { ok: false, error: 'Vul het aantal pakketten in, maximaal 20.' };
  if (!weightGrams) return { ok: false, error: 'Vul het geschatte gewicht in.' };
  if (description.length < 3) return { ok: false, error: 'Beschrijf wat er bezorgd moet worden.' };
  const needsDimensions = size === 'LARGE' || size === 'CUSTOM';
  const lengthCm = positive(raw?.lengthCm);
  const widthCm = positive(raw?.widthCm);
  const heightCm = positive(raw?.heightCm);
  if (needsDimensions && (!lengthCm || !widthCm || !heightCm)) {
    return { ok: false, error: 'Vul de lengte, breedte en hoogte in centimeters in.' };
  }
  return {
    ok: true,
    shipment: {
      kind,
      size,
      weightGrams: Math.round(weightGrams),
      packageCount: Math.round(packageCount),
      lengthCm,
      widthCm,
      heightCm,
      description: description.slice(0, 180),
      fragile: raw?.fragile === true,
      temperatureSensitive: raw?.temperatureSensitive === true,
      liftHelp: raw?.liftHelp === true,
    },
  };
}

export function assessCourierCapacity(input: {
  maxWeightGrams: number | null;
  maxLengthCm?: number | null;
  shipment: ShipmentRequest;
}): { status: CapacityDecision; reason: string } {
  if (input.shipment.packageCount < 1 || input.shipment.weightGrams <= 0) {
    return { status: 'UNKNOWN', reason: 'De zending is nog niet volledig beschreven.' };
  }
  if (input.maxWeightGrams == null) {
    return {
      status: 'UNKNOWN',
      reason: 'De laadcapaciteit van deze bezorger is niet geregistreerd.',
    };
  }
  const total = input.shipment.weightGrams * input.shipment.packageCount;
  if (total > input.maxWeightGrams) {
    return {
      status: 'INSUFFICIENT',
      reason: 'Het gewicht past niet in de geregistreerde laadcapaciteit.',
    };
  }
  const maxLength = input.maxLengthCm;
  const longest = Math.max(input.shipment.lengthCm ?? 0, input.shipment.widthCm ?? 0, input.shipment.heightCm ?? 0);
  if (maxLength == null && longest > 0) {
    return {
      status: 'UNKNOWN',
      reason: 'De maximale afmetingen van deze bezorger zijn niet geregistreerd.',
    };
  }
  if (maxLength != null && longest > maxLength) {
    return {
      status: 'INSUFFICIENT',
      reason: 'De afmetingen passen niet in de geregistreerde laadruimte.',
    };
  }
  return { status: 'FITS', reason: 'De geregistreerde capaciteit is voldoende.' };
}

export function describeShipment(shipment: ShipmentRequest): string {
  const kind = { PARCEL: 'pakket', DOCUMENT: 'document', FOOD: 'etenswaar', OTHER: 'overig' }[shipment.kind];
  const size = { SMALL: 'klein', MEDIUM: 'middel', LARGE: 'groot', CUSTOM: 'eigen formaat' }[shipment.size];
  const kilos = (shipment.weightGrams / 1000).toLocaleString('nl-NL');
  const dimensions = shipment.lengthCm && shipment.widthCm && shipment.heightCm
    ? `, ${shipment.lengthCm}×${shipment.widthCm}×${shipment.heightCm} cm`
    : '';
  const notes = [
    shipment.fragile ? 'breekbaar' : '',
    shipment.temperatureSensitive ? 'temperatuurgevoelig' : '',
    shipment.liftHelp ? 'hulp bij tillen' : '',
  ].filter(Boolean).join(', ');
  return `${shipment.description} · ${shipment.packageCount}× ${kind}, ${size}, ${kilos} kg${dimensions}${notes ? ` · ${notes}` : ''}`.slice(0, 240);
}
