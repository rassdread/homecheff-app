import type { PrismaClient } from '@prisma/client';
import {
  CARGO_TOO_HEAVY_NL,
  selectVehicleForJob,
  vehicleNeedForCargo,
  vehicleNeedForProduct,
  vehiclesFromProfile,
  type CourierVehicle,
  type JobVehicleNeed,
} from '@/lib/delivery/courier-vehicles';
import type { TransportCargo } from '@/lib/delivery/transport-job';

export { CARGO_TOO_HEAVY_NL };

export type CargoWeightBlock = {
  ok: false;
  status: 422;
  code: 'VEHICLE_TOO_HEAVY';
  error: string;
};

export type CargoWeightPass = {
  ok: true;
  vehicleId: string | null;
  label: string | null;
  needsFitQuestion: boolean;
};

function block(): CargoWeightBlock {
  return { ok: false, status: 422, code: 'VEHICLE_TOO_HEAVY', error: CARGO_TOO_HEAVY_NL };
}

export function decideCargoWeight(vehicles: CourierVehicle[], need: JobVehicleNeed): CargoWeightBlock | CargoWeightPass {
  const pieces = need.pieces?.length ? need.pieces : need.cargo ? [need.cargo] : [];
  const hasCargo = pieces.some((piece) => piece.lengthCm > 0 || piece.widthCm > 0 || piece.heightCm > 0 || piece.weightKg > 0);
  if (!hasCargo || vehicles.length === 0) {
    return { ok: true, vehicleId: null, label: null, needsFitQuestion: false };
  }
  const choice = selectVehicleForJob(vehicles, need);
  if (!choice.ok) {
    return choice.code === 'TOO_HEAVY' ? block() : { ok: true, vehicleId: null, label: null, needsFitQuestion: false };
  }
  return {
    ok: true,
    vehicleId: choice.vehicle.id ?? null,
    label: choice.label,
    needsFitQuestion: choice.needsFitQuestion,
  };
}

export function cargoFromStored(value: unknown): TransportCargo | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<TransportCargo>;
  const items = Array.isArray(raw.items)
    ? raw.items.map((item) => ({
        lengthCm: Number(item.lengthCm) || 0,
        widthCm: Number(item.widthCm) || 0,
        heightCm: Number(item.heightCm) || 0,
        weightKg: Number(item.weightKg) || 0,
      }))
    : [];
  if (items.length === 0 && !(Number(raw.totalWeightKg) > 0)) return null;
  return {
    itemCount: Number(raw.itemCount) || items.length || 1,
    items,
    totalWeightKg: Number(raw.totalWeightKg) || 0,
    floors: Number(raw.floors) || 0,
    lift: raw.lift === true,
    helpNeeded: raw.helpNeeded === true,
    fragile: raw.fragile === true,
    note: typeof raw.note === 'string' ? raw.note : '',
    preferredVehicle: null,
    photoIds: [],
  };
}

async function fleetOf(prisma: PrismaClient, deliveryProfileId: string): Promise<CourierVehicle[] | null> {
  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: deliveryProfileId },
    include: { vehicles: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!profile) return null;
  return vehiclesFromProfile(profile).vehicles;
}

export async function decideStoredCargo(
  prisma: PrismaClient,
  deliveryProfileId: string,
  cargo: unknown,
): Promise<CargoWeightBlock | CargoWeightPass> {
  const stored = cargoFromStored(cargo);
  const vehicles = await fleetOf(prisma, deliveryProfileId);
  if (!stored || !vehicles) return { ok: true, vehicleId: null, label: null, needsFitQuestion: false };
  const required = cargo && typeof cargo === 'object' && Array.isArray((cargo as { requiredFeatures?: unknown }).requiredFeatures)
    ? (cargo as { requiredFeatures: unknown[] }).requiredFeatures.filter((item): item is string => typeof item === 'string')
    : [];
  return decideCargoWeight(vehicles, vehicleNeedForCargo({ ...stored, requiredFeatures: required }));
}

export async function decideProductCargo(
  prisma: PrismaClient,
  input: { deliveryProfileId: string; productId: string; quantity?: number | null },
): Promise<CargoWeightBlock | CargoWeightPass> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { lengthCm: true, widthCm: true, heightCm: true, weightKg: true, weightGrams: true },
  });
  const vehicles = await fleetOf(prisma, input.deliveryProfileId);
  if (!product || !vehicles) return { ok: true, vehicleId: null, label: null, needsFitQuestion: false };
  const weightKg = product.weightKg ?? (product.weightGrams != null ? product.weightGrams / 1000 : null);
  return decideCargoWeight(
    vehicles,
    vehicleNeedForProduct(
      { lengthCm: product.lengthCm, widthCm: product.widthCm, heightCm: product.heightCm, weightKg },
      input.quantity && input.quantity > 0 ? input.quantity : 1,
    ),
  );
}
