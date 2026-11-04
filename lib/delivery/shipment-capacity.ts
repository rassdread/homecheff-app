/**
 * Capacity is only a match when the courier profile records a limit.
 * Missing capacity is UNKNOWN and is not treated as suitable.
 */

export type ShipmentSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM';

export type ShipmentRequest = {
  size: ShipmentSize;
  weightGrams: number;
  packageCount: number;
};

export type CapacityDecision = 'FITS' | 'INSUFFICIENT' | 'UNKNOWN';

export function assessCourierCapacity(input: {
  maxWeightGrams: number | null;
  shipment: ShipmentRequest;
}): { status: CapacityDecision; reason: string } {
  const packages = Number.isFinite(input.shipment.packageCount)
    ? input.shipment.packageCount
    : 0;
  const weight = Number.isFinite(input.shipment.weightGrams)
    ? input.shipment.weightGrams
    : 0;
  if (packages < 1 || weight <= 0) {
    return { status: 'UNKNOWN', reason: 'De zending is nog niet volledig beschreven.' };
  }
  if (input.maxWeightGrams == null) {
    return {
      status: 'UNKNOWN',
      reason: 'De laadcapaciteit van deze bezorger is niet geregistreerd.',
    };
  }
  const total = weight * packages;
  if (total > input.maxWeightGrams) {
    return {
      status: 'INSUFFICIENT',
      reason: 'Het gewicht past niet in de geregistreerde laadcapaciteit.',
    };
  }
  return { status: 'FITS', reason: 'Het gewicht past in de geregistreerde laadcapaciteit.' };
}
