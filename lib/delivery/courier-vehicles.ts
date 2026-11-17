/**
 * Per-vehicle courier fleet. Example model names are labels only.
 * They never become a length, width, height or weight.
 */
import { assessCargoFit, catalogReferences, type FitJudgement } from './vehicle-references';
import { emptyCapacityStatus, type CapacityAxis, type CapacityMark } from '@/lib/delivery/transport-job';

export const VEHICLE_FAMILIES = ['BIKE', 'EBIKE', 'SCOOTER', 'CAR', 'BUS', 'TRAILER'] as const;
export type VehicleFamily = (typeof VEHICLE_FAMILIES)[number];

export const CARRYING_PROVIDERS = ['COURIER', 'CUSTOMER', 'DISCUSS'] as const;
export type CarryingProvider = (typeof CARRYING_PROVIDERS)[number];

export type CourierVehicle = {
  id?: string;
  referenceId?: string | null;
  family: VehicleFamily;
  variant: string | null;
  carrying: string[];
  carryingProvider: CarryingProvider | null;
  features: string[];
  maxLengthCm: number | null;
  maxWidthCm: number | null;
  maxHeightCm: number | null;
  maxWeightKg: number | null;
  capacityStatus: Record<CapacityAxis, CapacityMark>;
};

export type CargoSize = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
};

export type JobVehicleNeed = {
  requiredFeatures?: string[];
  cargo?: CargoSize | null;
  pieces?: CargoSize[];
  itemCount?: number;
};

export type StoredCapacity = {
  maxLengthCm?: number | null;
  maxWidthCm?: number | null;
  maxHeightCm?: number | null;
  maxWeightKg?: number | null;
  status?: unknown;
};

const FAMILY_LABEL: Record<VehicleFamily, string> = {
  BIKE: 'Fiets',
  EBIKE: 'E-bike',
  SCOOTER: 'Brommer of scooter',
  CAR: 'Auto',
  BUS: 'Bus of verhuiswagen',
  TRAILER: 'Aanhanger',
};

const LEGACY_FAMILY_LABEL: Partial<Record<VehicleFamily, string>> = {
  BUS: 'Bestelbus',
};

const VARIANTS: Record<VehicleFamily, Array<{ id: string; label: string; hint?: string }>> = {
  BIKE: [
    { id: 'ORDINARY', label: 'Gewone fiets' },
    { id: 'CARGO', label: 'Bakfiets' },
    { id: 'WITH_TRAILER', label: 'Fiets met aanhanger' },
  ],
  EBIKE: [
    { id: 'ORDINARY', label: 'Gewone fiets' },
    { id: 'CARGO', label: 'Bakfiets' },
    { id: 'WITH_TRAILER', label: 'Fiets met aanhanger' },
  ],
  SCOOTER: [
    { id: 'MOPED', label: 'Brommer' },
    { id: 'SCOOTER', label: 'Scooter' },
    { id: 'DELIVERY', label: 'Bezorger-scooter' },
  ],
  CAR: [
    { id: 'HATCHBACK', label: 'Hatchback' },
    { id: 'SEDAN', label: 'Sedan' },
    { id: 'STATION', label: 'Stationwagen' },
  ],
  BUS: [
    { id: 'SMALL', label: 'Kleine bestelbus' },
    { id: 'MEDIUM', label: 'Middelgrote bestelbus' },
    { id: 'LARGE', label: 'Grote bestelbus' },
    { id: 'MOVING', label: 'Verhuiswagen met laadbak' },
  ],
  TRAILER: [],
};

const FEATURES: Record<string, { label: string; families: VehicleFamily[] }> = {
  FOLD_REAR_SEAT: { label: 'achterbank neerklapbaar', families: ['CAR'] },
  FLAT_FLOOR: { label: 'vlakke laadvloer', families: ['CAR'] },
  TOW_BAR: { label: 'trekhaak', families: ['CAR'] },
  ACTIVE_COOLING: { label: 'actieve koeling', families: ['BUS'] },
  TAIL_LIFT: { label: 'laadklep', families: ['BUS'] },
  RAMP: { label: 'oprijplaat', families: ['BUS'] },
  LASHING: { label: 'sjorogen', families: ['BUS'] },
  INSULATED: { label: 'geïsoleerde tas of box', families: ['BIKE', 'EBIKE', 'SCOOTER', 'CAR', 'BUS', 'TRAILER'] },
};

const CARRYING: Record<VehicleFamily, Array<{ id: string; label: string }>> = {
  BIKE: [
    { id: 'BACKPACK', label: 'rugtas' },
    { id: 'PANNIERS', label: 'fietstassen' },
    { id: 'CRATE', label: 'krat' },
    { id: 'DELIVERY_BOX', label: 'bezorgbox' },
  ],
  EBIKE: [
    { id: 'BACKPACK', label: 'rugtas' },
    { id: 'PANNIERS', label: 'fietstassen' },
    { id: 'CRATE', label: 'krat' },
    { id: 'DELIVERY_BOX', label: 'bezorgbox' },
  ],
  SCOOTER: [
    { id: 'BACKPACK', label: 'rugtas' },
    { id: 'TOP_CASE', label: 'achterkoffer' },
    { id: 'DELIVERY_BOX', label: 'bezorgbox' },
    { id: 'TRANSPORT_BOX', label: 'transportbak' },
    { id: 'TRAILER', label: 'aanhanger' },
  ],
  CAR: [],
  BUS: [],
  TRAILER: [],
};

const PROVIDER_LABEL: Record<CarryingProvider, string> = {
  COURIER: 'Ik neem het mee',
  CUSTOMER: 'Klant zorgt ervoor',
  DISCUSS: 'Eerst overleggen',
};

const MODE_TO_VEHICLE: Record<string, { family: VehicleFamily; variant: string | null }> = {
  BIKE: { family: 'BIKE', variant: null },
  EBIKE: { family: 'EBIKE', variant: null },
  SCOOTER: { family: 'SCOOTER', variant: null },
  CAR: { family: 'CAR', variant: null },
  ESTATE: { family: 'CAR', variant: 'STATION' },
  VAN: { family: 'BUS', variant: null },
  BOX_TRUCK: { family: 'BUS', variant: 'MOVING' },
  TRAILER: { family: 'TRAILER', variant: null },
};

export function familyLabel(family: VehicleFamily): string {
  return FAMILY_LABEL[family];
}

export function familyChoices() {
  return (['BIKE', 'EBIKE', 'SCOOTER', 'CAR', 'BUS'] as const).map((id) => ({
    id,
    label: FAMILY_LABEL[id],
  }));
}

export function variantChoices(family: VehicleFamily) {
  return VARIANTS[family];
}

export function featureChoices(family: VehicleFamily) {
  return Object.entries(FEATURES)
    .filter(([, feature]) => feature.families.includes(family))
    .map(([id, feature]) => ({ id, label: feature.label }));
}

export function carryingChoices(family: VehicleFamily) {
  return CARRYING[family];
}

export function providerChoices() {
  return CARRYING_PROVIDERS.map((id) => ({ id, label: PROVIDER_LABEL[id] }));
}

export function emptyVehicle(family: VehicleFamily): CourierVehicle {
  return {
    family,
    variant: null,
    carrying: [],
    carryingProvider: null,
    features: [],
    maxLengthCm: null,
    maxWidthCm: null,
    maxHeightCm: null,
    maxWeightKg: null,
    capacityStatus: emptyCapacityStatus(),
  };
}

function readMark(value: unknown): CapacityMark {
  if (value === 'set' || value === 'unknown' || value === 'not_applicable' || value === 'unset') return value;
  return 'unset';
}

export function readCapacityStatus(value: unknown): Record<CapacityAxis, CapacityMark> {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    length: readMark(raw.length),
    width: readMark(raw.width),
    height: readMark(raw.height),
    weight: readMark(raw.weight),
  };
}

function measurement(value: unknown, mark: CapacityMark): number | null {
  if (mark !== 'set') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function vehiclePublicLabel(vehicle: CourierVehicle): string {
  const variant = vehicle.variant
    ? VARIANTS[vehicle.family].find((item) => item.id === vehicle.variant)?.label
    : null;
  const model = vehicle.referenceId
    ? catalogReferences(vehicle).find((item) => item.id === vehicle.referenceId)?.name ?? null
    : null;
  const head = [variant || LEGACY_FAMILY_LABEL[vehicle.family] || FAMILY_LABEL[vehicle.family], model]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  const extras = [
    ...vehicle.features.map((id) => FEATURES[id]?.label).filter((label): label is string => Boolean(label)),
    ...vehicle.carrying.map((id) => CARRYING[vehicle.family].find((item) => item.id === id)?.label).filter((label): label is string => Boolean(label)),
  ];
  return [head, ...extras].join(' · ');
}

export function transportationModesForVehicle(vehicle: CourierVehicle): string[] {
  if (vehicle.family === 'BIKE') return ['BIKE'];
  if (vehicle.family === 'EBIKE') return ['EBIKE'];
  if (vehicle.family === 'SCOOTER') return ['SCOOTER'];
  if (vehicle.family === 'TRAILER') return ['TRAILER'];
  if (vehicle.family === 'CAR') return vehicle.variant === 'STATION' ? ['CAR', 'ESTATE'] : ['CAR'];
  if (vehicle.variant === 'MOVING') return ['VAN', 'BOX_TRUCK'];
  return ['VAN'];
}

export function transportationModesForVehicles(vehicles: CourierVehicle[]): string[] {
  const modes: string[] = [];
  for (const vehicle of vehicles) {
    for (const mode of transportationModesForVehicle(vehicle)) {
      if (!modes.includes(mode)) modes.push(mode);
    }
  }
  return modes;
}

export function routeVehicleCode(vehicle: CourierVehicle): string {
  return transportationModesForVehicle(vehicle)[0] || 'BIKE';
}

function blankVehicle(family: VehicleFamily, variant: string | null): CourierVehicle {
  return { ...emptyVehicle(family), variant };
}

export function hasStoredCapacity(capacity: StoredCapacity | null | undefined): boolean {
  if (!capacity) return false;
  const status = readCapacityStatus(capacity.status);
  return (
    capacity.maxLengthCm != null ||
    capacity.maxWidthCm != null ||
    capacity.maxHeightCm != null ||
    capacity.maxWeightKg != null ||
    Object.values(status).some((mark) => mark === 'set')
  );
}

export function legacyFleet(input: {
  transportation?: string[] | null;
  capacity?: StoredCapacity | null;
}): { vehicles: CourierVehicle[]; legacyUnassigned: boolean } {
  const modes = (input.transportation || []).filter((mode) => MODE_TO_VEHICLE[mode]);
  const vehicles = modes.map((mode) => {
    const mapped = MODE_TO_VEHICLE[mode]!;
    return blankVehicle(mapped.family, mapped.variant);
  });
  const stored = hasStoredCapacity(input.capacity);
  if (vehicles.length === 1 && stored && input.capacity) {
    const status = readCapacityStatus(input.capacity.status);
    vehicles[0] = {
      ...vehicles[0]!,
      maxLengthCm: measurement(input.capacity.maxLengthCm, status.length),
      maxWidthCm: measurement(input.capacity.maxWidthCm, status.width),
      maxHeightCm: measurement(input.capacity.maxHeightCm, status.height),
      maxWeightKg: measurement(input.capacity.maxWeightKg, status.weight),
      capacityStatus: status,
    };
  }
  return { vehicles, legacyUnassigned: vehicles.length > 1 && stored };
}

export function applyLegacyCapacity(vehicle: CourierVehicle, capacity: StoredCapacity): CourierVehicle {
  const status = readCapacityStatus(capacity.status);
  return {
    ...vehicle,
    maxLengthCm: measurement(capacity.maxLengthCm, status.length),
    maxWidthCm: measurement(capacity.maxWidthCm, status.width),
    maxHeightCm: measurement(capacity.maxHeightCm, status.height),
    maxWeightKg: measurement(capacity.maxWeightKg, status.weight),
    capacityStatus: status,
  };
}

function cargoProvided(cargo: CargoSize | null | undefined): cargo is CargoSize {
  if (!cargo) return false;
  return cargo.lengthCm > 0 || cargo.widthCm > 0 || cargo.heightCm > 0 || cargo.weightKg > 0;
}

function axisTooSmall(limit: number | null, mark: CapacityMark, needed: number): 'fit' | 'too_small' | 'unknown' {
  if (needed <= 0) return 'fit';
  if (mark === 'not_applicable') return 'fit';
  if (mark !== 'set' || limit == null) return 'unknown';
  return needed > limit ? 'too_small' : 'fit';
}

export function vehicleSizeDecision(vehicle: CourierVehicle, cargo: CargoSize | null | undefined): 'fit' | 'too_small' | 'unknown' | 'unspecified' {
  if (!cargoProvided(cargo)) return 'unspecified';
  const checks = [
    axisTooSmall(vehicle.maxLengthCm, vehicle.capacityStatus.length, cargo.lengthCm),
    axisTooSmall(vehicle.maxWidthCm, vehicle.capacityStatus.width, cargo.widthCm),
    axisTooSmall(vehicle.maxHeightCm, vehicle.capacityStatus.height, cargo.heightCm),
    axisTooSmall(vehicle.maxWeightKg, vehicle.capacityStatus.weight, cargo.weightKg),
  ];
  if (checks.includes('too_small')) return 'too_small';
  if (checks.includes('unknown')) return 'unknown';
  return 'fit';
}

export function vehicleNeedForCargo(cargo?: { items: CargoSize[]; itemCount: number; totalWeightKg: number; requiredFeatures?: string[] } | null): JobVehicleNeed {
  if (!cargo) return {};
  const items = cargo.items.length ? cargo.items : [];
  if (items.length <= 1) {
    const item = items[0] ?? { lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0 };
    const weightKg = Math.max(item.weightKg, cargo.totalWeightKg || 0);
    const piece = { ...item, weightKg };
    return { cargo: piece, pieces: [piece], itemCount: cargo.itemCount || 1, requiredFeatures: cargo.requiredFeatures };
  }
  return {
    pieces: items,
    itemCount: cargo.itemCount || items.length,
    requiredFeatures: cargo.requiredFeatures,
  };
}

export function vehicleNeedForProduct(product: { lengthCm: number | null; widthCm: number | null; heightCm: number | null; weightKg: number | null }, quantity = 1): JobVehicleNeed {
  const cargo = {lengthCm: product.lengthCm ?? 0, widthCm: product.widthCm ?? 0, heightCm: product.heightCm ?? 0, weightKg: (product.weightKg ?? 0) * quantity};
  return cargoProvided(cargo) ? { cargo, itemCount: quantity } : {};
}

function fitPhrase(judgement: FitJudgement): string | null {
  if (judgement === 'expected') return 'Past naar verwachting';
  if (judgement === 'measured') return 'Past volgens de opgegeven maten';
  if (judgement === 'confirm') return 'Even afstemmen';
  return null;
}

export const CARGO_TOO_HEAVY_NL = 'Lading te zwaar voor dit voertuig';

export function selectVehicleForJob(
  vehicles: CourierVehicle[],
  need: JobVehicleNeed = {},
): { ok: true; vehicle: CourierVehicle; label: string; needsFitQuestion: boolean; fitLabel: string | null } | { ok: false; code: 'NO_VEHICLE' | 'TOO_SMALL' | 'TOO_HEAVY' | 'MISSING_FEATURE' } {
  const required = need.requiredFeatures || [];
  let sawTooSmall = false;
  let sawTooHeavy = false;
  let sawFeatureMiss = false;
  const pieces = need.pieces?.length ? need.pieces : need.cargo ? [need.cargo] : [];
  const several = (need.itemCount ?? pieces.length) > 1;
  const matches: Array<{ vehicle: CourierVehicle; needsFitQuestion: boolean; rank: number; fitLabel: string | null }> = [];
  for (const vehicle of vehicles) {
    if (required.some((feature) => !vehicle.features.includes(feature))) {
      sawFeatureMiss = true;
      continue;
    }
    const judgements = pieces.length ? pieces.map((piece) => assessCargoFit(vehicle, piece)) : ['unspecified' as const];
    if (judgements.includes('too_heavy')) {
      sawTooHeavy = true;
      continue;
    }
    if (judgements.includes('too_small')) {
      sawTooSmall = true;
      continue;
    }
    const judgement = several ? 'confirm' as const : judgements[0]!;
    matches.push({
      vehicle,
      needsFitQuestion: judgement === 'confirm',
      rank: judgement === 'measured' ? 2 : judgement === 'expected' ? 1 : 0,
      fitLabel: fitPhrase(judgement),
    });
  }
  if (matches.length === 0) {
    if (vehicles.length === 0) return { ok: false, code: 'NO_VEHICLE' };
    if (sawTooHeavy && !sawTooSmall && !sawFeatureMiss) return { ok: false, code: 'TOO_HEAVY' };
    if (sawTooSmall && !sawFeatureMiss) return { ok: false, code: 'TOO_SMALL' };
    if (sawFeatureMiss && !sawTooSmall && !sawTooHeavy) return { ok: false, code: 'MISSING_FEATURE' };
    return { ok: false, code: sawTooHeavy ? 'TOO_HEAVY' : sawTooSmall ? 'TOO_SMALL' : 'MISSING_FEATURE' };
  }
  const chosen = matches.sort((a, b) => b.rank - a.rank)[0]!;
  return {
    ok: true,
    vehicle: chosen.vehicle,
    label: vehiclePublicLabel(chosen.vehicle),
    needsFitQuestion: chosen.needsFitQuestion,
    fitLabel: chosen.fitLabel,
  };
}

function asStringList(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  const seen: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.has(item) || seen.includes(item)) continue;
    seen.push(item);
  }
  return seen;
}

export function parseCourierVehicle(value: unknown): CourierVehicle | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.family !== 'string' || !(VEHICLE_FAMILIES as readonly string[]).includes(raw.family)) return null;
  const family = raw.family as VehicleFamily;
  const variants = new Set(VARIANTS[family].map((item) => item.id));
  const variant = typeof raw.variant === 'string' && variants.has(raw.variant) ? raw.variant : null;
  const features = asStringList(raw.features, new Set(featureChoices(family).map((item) => item.id)));
  const carrying = asStringList(raw.carrying, new Set(carryingChoices(family).map((item) => item.id)));
  const provider = CARRYING_PROVIDERS.includes(raw.carryingProvider as CarryingProvider)
    ? (raw.carryingProvider as CarryingProvider)
    : null;
  const status = readCapacityStatus(raw.capacityStatus);
  const vehicle: CourierVehicle = {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined,
    family,
    variant,
    carrying,
    carryingProvider: carrying.length > 0 ? provider : null,
    features,
    maxLengthCm: measurement(raw.maxLengthCm, status.length),
    maxWidthCm: measurement(raw.maxWidthCm, status.width),
    maxHeightCm: measurement(raw.maxHeightCm, status.height),
    maxWeightKg: measurement(raw.maxWeightKg, status.weight),
    capacityStatus: status,
  };
  if (raw.referenceId != null) {
    if (!catalogReferences(vehicle).some(ref => ref.id === raw.referenceId)) return null;
    vehicle.referenceId = String(raw.referenceId);
  }
  if (carrying.length > 0 && !vehicle.carryingProvider) return null;
  if (status.length === 'set' && vehicle.maxLengthCm == null) return null;
  if (status.width === 'set' && vehicle.maxWidthCm == null) return null;
  if (status.height === 'set' && vehicle.maxHeightCm == null) return null;
  if (status.weight === 'set' && vehicle.maxWeightKg == null) return null;
  return vehicle;
}

export function parseCourierVehicles(value: unknown): CourierVehicle[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 8) return null;
  const vehicles: CourierVehicle[] = [];
  for (const item of value) {
    const vehicle = parseCourierVehicle(item);
    if (!vehicle) return null;
    vehicles.push(vehicle);
  }
  return vehicles;
}

export function vehiclesFromProfile(profile: {
  transportation?: string[] | null;
  vehicles?: unknown;
  legacyCapacityUnassigned?: boolean | null;
  vehicleMaxLengthCm?: number | null;
  vehicleMaxWidthCm?: number | null;
  vehicleMaxHeightCm?: number | null;
  vehicleMaxWeightKg?: number | null;
  maxLengthCm?: number | null;
  maxWidthCm?: number | null;
  maxHeightCm?: number | null;
  maxWeightGrams?: number | null;
  vehicleCapacityStatus?: unknown;
}): { vehicles: CourierVehicle[]; legacyUnassigned: boolean } {
  const stored = Array.isArray(profile.vehicles)
    ? profile.vehicles.map(parseCourierVehicle).filter((vehicle): vehicle is CourierVehicle => vehicle != null)
    : [];
  if (stored.length > 0) {
    return { vehicles: stored, legacyUnassigned: profile.legacyCapacityUnassigned === true };
  }
  const kilograms = profile.maxWeightGrams != null && profile.maxWeightGrams > 0
    ? Math.round(profile.maxWeightGrams / 1000)
    : profile.vehicleMaxWeightKg ?? null;
  return legacyFleet({
    transportation: profile.transportation,
    capacity: {
      maxLengthCm: profile.maxLengthCm ?? profile.vehicleMaxLengthCm,
      maxWidthCm: profile.maxWidthCm ?? profile.vehicleMaxWidthCm,
      maxHeightCm: profile.maxHeightCm ?? profile.vehicleMaxHeightCm,
      maxWeightKg: kilograms,
      status: profile.vehicleCapacityStatus,
    },
  });
}

export function legacyCapacityOffer(profile: {
  legacyCapacityUnassigned?: boolean | null;
  maxLengthCm?: number | null;
  maxWidthCm?: number | null;
  maxHeightCm?: number | null;
  maxWeightGrams?: number | null;
  vehicleCapacityStatus?: unknown;
}): StoredCapacity | null {
  if (profile.legacyCapacityUnassigned !== true) return null;
  const status = readCapacityStatus(profile.vehicleCapacityStatus);
  const length = profile.maxLengthCm ?? null;
  const width = profile.maxWidthCm ?? null;
  const height = profile.maxHeightCm ?? null;
  const weight = profile.maxWeightGrams != null && profile.maxWeightGrams > 0
    ? Math.round(profile.maxWeightGrams / 1000)
    : null;
  if (status.length !== 'set' && length) status.length = 'set';
  if (status.width !== 'set' && width) status.width = 'set';
  if (status.height !== 'set' && height) status.height = 'set';
  if (status.weight !== 'set' && weight) status.weight = 'set';
  const offer = { maxLengthCm: length, maxWidthCm: width, maxHeightCm: height, maxWeightKg: weight, status };
  return hasStoredCapacity(offer) ? offer : null;
}

export function cargoFitFingerprint(input: {
  vehicle: CourierVehicle;
  items: CargoSize[];
  itemCount: number;
  requiredFeatures?: string[];
}): string {
  const vehicle = input.vehicle;
  const vehiclePart = [
    vehicle.id || '',
    vehicle.family,
    vehicle.variant || '',
    [...vehicle.features].sort().join(','),
    vehicle.referenceId || '',
    vehicle.maxLengthCm ?? '',
    vehicle.maxWidthCm ?? '',
    vehicle.maxHeightCm ?? '',
    vehicle.maxWeightKg ?? '',
  ].join(':');
  const pieces = input.items.map((item) => [item.lengthCm, item.widthCm, item.heightCm, item.weightKg].join('x')).join(';');
  const features = [...(input.requiredFeatures || [])].sort().join(',');
  return `${vehiclePart}|${input.itemCount}|${pieces}|${features}`;
}

/** A fit question records the vehicle. It does not open a booking or send courier mail. */
export function fitQuestionEffect(vehicleId: string | null) {
  return {
    action: 'QUESTION' as const,
    matchedVehicleId: vehicleId,
    bookingRequestId: null,
    createsBooking: false as const,
    sendsCourierMail: false as const,
  };
}
