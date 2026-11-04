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

export type RegisteredCapacity = {
  maxWeightGrams: number | null;
  maxLengthCm?: number | null;
  maxWidthCm?: number | null;
  maxHeightCm?: number | null;
  maxPackageCount?: number | null;
  carriesFragile?: boolean | null;
  temperatureControlled?: boolean | null;
  liftAssistance?: boolean | null;
};

function positiveLimit(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/**
 * A courier is registered only when a maximum weight was saved.
 * Missing dimensions stay unknown for a shipment that has dimensions.
 * An explicit false on a special capability is a refusal. Null is not.
 */
export function assessCourierCapacity(input: RegisteredCapacity & {
  shipment: ShipmentRequest;
}): { status: CapacityDecision; reason: string } {
  if (input.shipment.packageCount < 1 || input.shipment.weightGrams <= 0) {
    return { status: 'UNKNOWN', reason: 'De zending is nog niet volledig beschreven.' };
  }
  const maxWeight = positiveLimit(input.maxWeightGrams);
  if (maxWeight == null) {
    return {
      status: 'UNKNOWN',
      reason: 'De laadcapaciteit van deze bezorger is niet geregistreerd.',
    };
  }
  const total = input.shipment.weightGrams * input.shipment.packageCount;
  if (total > maxWeight) {
    return {
      status: 'INSUFFICIENT',
      reason: 'Het gewicht past niet in de geregistreerde laadcapaciteit.',
    };
  }
  const packageLimit = positiveLimit(input.maxPackageCount);
  if (packageLimit != null && input.shipment.packageCount > packageLimit) {
    return {
      status: 'INSUFFICIENT',
      reason: 'Het aantal pakketten past niet in de geregistreerde capaciteit.',
    };
  }
  const sides = [input.shipment.lengthCm, input.shipment.widthCm, input.shipment.heightCm];
  const stated = sides.filter((side): side is number => side != null && side > 0);
  if (stated.length > 0 && stated.length < 3) {
    return { status: 'UNKNOWN', reason: 'De afmetingen van de zending zijn onvolledig.' };
  }
  if (stated.length === 3) {
    const limits = [input.maxLengthCm, input.maxWidthCm, input.maxHeightCm].map(positiveLimit);
    if (limits.some((limit) => limit == null)) {
      return {
        status: 'UNKNOWN',
        reason: 'De maximale afmetingen van deze bezorger zijn niet geregistreerd.',
      };
    }
    const cargo = (limits as number[]).slice().sort((a, b) => b - a);
    const parcel = stated.slice().sort((a, b) => b - a);
    if (parcel.some((side, index) => side > cargo[index])) {
      return {
        status: 'INSUFFICIENT',
        reason: 'De afmetingen passen niet in de geregistreerde laadruimte.',
      };
    }
  }
  if (input.shipment.fragile && input.carriesFragile === false) {
    return { status: 'INSUFFICIENT', reason: 'Deze bezorger vervoert geen breekbare zendingen.' };
  }
  if (input.shipment.temperatureSensitive && input.temperatureControlled === false) {
    return { status: 'INSUFFICIENT', reason: 'Deze bezorger vervoert geen temperatuurgevoelige zendingen.' };
  }
  if (input.shipment.liftHelp && input.liftAssistance === false) {
    return { status: 'INSUFFICIENT', reason: 'Deze bezorger biedt geen hulp bij tillen.' };
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
