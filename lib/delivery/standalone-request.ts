import { resolveDutchDeliveryPoint } from '@/lib/delivery/delivery-address-resolve';
import { assessCourierCapacity, type ShipmentRequest, type ShipmentSize } from '@/lib/delivery/shipment-capacity';

const SIZES = new Set<ShipmentSize>(['SMALL', 'MEDIUM', 'LARGE', 'CUSTOM']);

export function readShipment(body: Record<string, unknown>): ShipmentRequest {
  const size = SIZES.has(body.shipmentSize as ShipmentSize)
    ? (body.shipmentSize as ShipmentSize)
    : 'SMALL';
  const weight = Number(body.weightGrams);
  const count = Number(body.packageCount);
  return {
    size,
    weightGrams: Number.isFinite(weight) && weight > 0 ? weight : 0,
    packageCount: Number.isFinite(count) && count > 0 ? Math.min(20, Math.round(count)) : 1,
  };
}

export function describeShipment(description: string, shipment: ShipmentRequest): string {
  const kilos = shipment.weightGrams > 0 ? `${(shipment.weightGrams / 1000).toLocaleString('nl-NL')} kg` : 'gewicht onbekend';
  const sizeLabel = { SMALL: 'klein', MEDIUM: 'middel', LARGE: 'groot', CUSTOM: 'eigen formaat' }[shipment.size];
  return `${description.trim()} · ${shipment.packageCount} pakket(ten), ${sizeLabel}, ${kilos}`.slice(0, 240);
}

export async function resolveStandaloneStops(body: Record<string, unknown>) {
  const pickup = await resolveDutchDeliveryPoint(String(body.pickupAddress || ''));
  if (!pickup.ok) return pickup;
  const dropoff = await resolveDutchDeliveryPoint(String(body.deliveryAddress || ''));
  if (!dropoff.ok) return dropoff;
  const shipment = readShipment(body);
  return {
    ok: true as const,
    pickup: pickup.point,
    dropoff: dropoff.point,
    shipment,
    itemDescription: describeShipment(String(body.itemDescription || ''), shipment),
  };
}

export function visibleCouriers<T extends { vehicleType: string }>(
  couriers: T[],
  shipment: ShipmentRequest,
) {
  return couriers.flatMap((courier) => {
    const capacity = assessCourierCapacity({
      maxWeightGrams: null,
      shipment,
    });
    if (capacity.status === 'INSUFFICIENT') return [];
    return [{ ...courier, capacity: capacity.status, capacityReason: capacity.reason }];
  });
}
