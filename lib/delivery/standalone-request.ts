import { resolveDutchDeliveryPoint } from '@/lib/delivery/delivery-address-resolve';
import {
  assessCourierCapacity,
  describeShipment,
  validateShipment,
  type ShipmentKind,
  type ShipmentRequest,
  type ShipmentSize,
} from '@/lib/delivery/shipment-capacity';

function flag(value: unknown): boolean {
  return value === true || value === 'true' || value === '1' || value === 'on';
}

export function readShipment(body: Record<string, unknown>) {
  return validateShipment({
    kind: body.shipmentKind as ShipmentKind,
    size: (body.shipmentSize as ShipmentSize) || 'SMALL',
    weightGrams: Number(body.weightGrams),
    packageCount: Number(body.packageCount),
    lengthCm: body.lengthCm == null || body.lengthCm === '' ? null : Number(body.lengthCm),
    widthCm: body.widthCm == null || body.widthCm === '' ? null : Number(body.widthCm),
    heightCm: body.heightCm == null || body.heightCm === '' ? null : Number(body.heightCm),
    description: String(body.itemDescription || ''),
    fragile: flag(body.fragile),
    temperatureSensitive: flag(body.temperatureSensitive),
    liftHelp: flag(body.liftHelp),
  });
}

export async function resolveStandaloneStops(body: Record<string, unknown>) {
  const shipment = readShipment(body);
  if (!shipment.ok) {
    return { ok: false as const, status: 400, code: 'SHIPMENT_INVALID', error: shipment.error };
  }
  const pickup = await resolveDutchDeliveryPoint(String(body.pickupAddress || ''));
  if (!pickup.ok) return pickup;
  const dropoff = await resolveDutchDeliveryPoint(String(body.deliveryAddress || ''));
  if (!dropoff.ok) return dropoff;
  return {
    ok: true as const,
    pickup: pickup.point,
    dropoff: dropoff.point,
    shipment: shipment.shipment,
    itemDescription: describeShipment(shipment.shipment),
  };
}

export function splitCouriersByCapacity<T extends { vehicleType?: string; maxWeightGrams?: number | null }>(
  couriers: T[],
  shipment: ShipmentRequest,
) {
  const matched: Array<T & { capacity: 'FITS'; capacityReason: string }> = [];
  const excluded: Array<T & { capacity: 'UNKNOWN' | 'INSUFFICIENT'; capacityReason: string }> = [];
  for (const courier of couriers) {
    const capacity = assessCourierCapacity({
      maxWeightGrams: courier.maxWeightGrams ?? null,
      shipment,
    });
    if (capacity.status === 'FITS') {
      matched.push({ ...courier, capacity: 'FITS', capacityReason: capacity.reason });
    } else {
      excluded.push({
        ...courier,
        capacity: capacity.status,
        capacityReason: capacity.reason,
      });
    }
  }
  return { matched, excluded };
}
