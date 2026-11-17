import catalog from './vehicle-reference-data.json';
import type { CargoSize, CourierVehicle } from './courier-vehicles';

export type VehicleReference = {
  id: string;
  group: string;
  name: string;
  source: string;
  sourcePage?: string;
  configuration: string;
  role: 'interior' | 'envelope';
  lengthCm?: number;
  foldedLengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  openingWidthCm?: number;
  openingHeightCm?: number;
  weightKg?: number;
  /** ceiling = bevestigde bovengrens. guide = schatting, geen afwijzing. */
  weightBound?: 'ceiling' | 'guide';
  envelopeLengthCm?: number;
  envelopeWidthCm?: number;
  envelopeHeightCm?: number;
};

const references = catalog as VehicleReference[];

function cm(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
}

export function referenceHeadline(ref: VehicleReference): string {
  const parts = [
    ref.lengthCm != null ? `${cm(ref.lengthCm)} cm laadlengte` : null,
    ref.foldedLengthCm != null ? `${cm(ref.foldedLengthCm)} cm met neergeklapte bank` : null,
    ref.widthCm != null ? `${cm(ref.widthCm)} cm bruikbare breedte` : null,
    ref.heightCm != null ? `${cm(ref.heightCm)} cm binnenhoogte` : null,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(' · ');
  if (ref.envelopeLengthCm != null && ref.envelopeWidthCm != null && ref.envelopeHeightCm != null) {
    return `Buitenmaten ${cm(ref.envelopeLengthCm)} × ${cm(ref.envelopeWidthCm)} × ${cm(ref.envelopeHeightCm)} cm. Dat zegt niet dat een doos erin past.`;
  }
  return 'Een of meer maten zijn nog niet bekend.';
}

export function referenceSummary(ref: VehicleReference): string {
  const betweenArches = ref.group === 'SMALL' || ref.group === 'MEDIUM' || ref.group === 'LARGE';
  const parts = [
    ref.lengthCm != null ? `${cm(ref.lengthCm)} cm laadlengte` : null,
    ref.widthCm != null ? `${cm(ref.widthCm)} cm ${betweenArches ? 'tussen de wielkasten' : 'smalste breedte'}` : null,
    ref.heightCm != null ? `${cm(ref.heightCm)} cm binnenhoogte` : null,
    ref.openingWidthCm != null && ref.openingHeightCm != null
      ? `deuropening ${cm(ref.openingWidthCm)} × ${cm(ref.openingHeightCm)} cm`
      : null,
    ref.weightKg != null
      ? `${cm(ref.weightKg)} kg ${ref.weightBound === 'ceiling' ? 'maximale nuttige last' : 'geschat laadvermogen'}`
      : null,
  ];
  return parts.filter(Boolean).join(', ');
}

export function catalogReferences(vehicle: Pick<CourierVehicle, 'variant' | 'carrying' | 'carryingProvider'>): VehicleReference[] {
  const groups = new Set<string>();
  if (vehicle.carryingProvider === 'COURIER') vehicle.carrying.forEach((item) => groups.add(item));
  if (groups.size === 0 && vehicle.variant) groups.add(vehicle.variant);
  return references.filter((entry) => groups.has(entry.group));
}

export type FitJudgement = 'expected' | 'measured' | 'confirm' | 'too_small' | 'too_heavy' | 'unspecified';

function cargoProvided(cargo: CargoSize | null | undefined): cargo is CargoSize {
  if (!cargo) return false;
  return cargo.lengthCm > 0 || cargo.widthCm > 0 || cargo.heightCm > 0 || cargo.weightKg > 0;
}

export function vehicleReferences(vehicle: CourierVehicle): VehicleReference[] {
  if (vehicle.family === 'BUS' && vehicle.features.includes('ACTIVE_COOLING')) return [];
  const rows = catalogReferences(vehicle);
  return vehicle.referenceId ? rows.filter((entry) => entry.id === vehicle.referenceId) : rows;
}

export function referenceDescription(ref: VehicleReference, vehicle: CourierVehicle): string {
  const length = vehicle.features.includes('FOLD_REAR_SEAT') ? ref.foldedLengthCm ?? ref.lengthCm : ref.lengthCm;
  const parts = [
    length ? `${length} cm laadvloer` : null,
    ref.widthCm ? `${ref.widthCm} cm smalste breedte` : null,
    ref.heightCm ? `${ref.heightCm} cm binnenhoogte` : null,
    ref.openingWidthCm && ref.openingHeightCm ? `opening ${ref.openingWidthCm} × ${ref.openingHeightCm} cm` : null,
    ref.weightKg ? `${ref.weightKg} kg per vak` : null,
    ref.envelopeLengthCm ? `buitenschaal ${ref.envelopeLengthCm} × ${ref.envelopeWidthCm} × ${ref.envelopeHeightCm} cm` : null,
  ];
  return `${parts.filter(Boolean).join(' · ')}. Richtmaat, geen eigen meting.`;
}

function permutations(values: number[]): number[][] {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) => permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((rest) => [value, ...rest]));
}

function within(size: number, limit: number): 'fit' | 'tight' | 'over' {
  if (size > limit) return 'over';
  if (size >= limit * 0.9) return 'tight';
  return 'fit';
}

function ownAxis(limit: number | null, mark: string, needed: number): 'fit' | 'over' | 'skip' {
  if (needed <= 0 || mark !== 'set' || limit == null) return 'skip';
  return needed > limit ? 'over' : 'fit';
}

function interiorSpace(ref: VehicleReference, folded: boolean) {
  return {
    length: folded ? ref.foldedLengthCm ?? null : ref.lengthCm ?? null,
    width: ref.widthCm ?? null,
    height: ref.heightCm ?? ref.openingHeightCm ?? null,
    openingWidth: ref.openingWidthCm ?? null,
    openingHeight: ref.openingHeightCm ?? null,
    weight: ref.weightKg ?? null,
    weightBound: ref.weightBound ?? null,
  };
}

function boundRows(vehicle: CourierVehicle): VehicleReference[] {
  const rows = catalogReferences(vehicle);
  return vehicle.referenceId ? rows.filter((entry) => entry.id === vehicle.referenceId) : rows;
}

/** Highest confirmed maximum. Missing on a mixed or unmarked group, so an estimate cannot reject the whole group. */
function confirmedCeilingKg(rows: VehicleReference[]): number | null {
  const interiors = rows.filter((row) => row.role === 'interior');
  const pool = interiors.length > 0 ? interiors : rows.filter((row) => row.role === 'envelope');
  if (pool.length === 0 || !pool.every((row) => row.weightBound === 'ceiling' && row.weightKg != null)) return null;
  return Math.max(...pool.map((row) => row.weightKg!));
}

function judgeInterior(cargo: CargoSize, space: ReturnType<typeof interiorSpace>): FitJudgement {
  const dims = [cargo.lengthCm, cargo.widthCm, cargo.heightCm].filter((value) => value > 0);
  let tight = false;
  let unknown = false;
  if (dims.length > 0 && space.length && space.width && space.height) {
    const fits = permutations(dims).some(([length, width, height]) => {
      const marks = [within(length!, space.length!), within(width!, space.width!), within(height!, space.height!)];
      if (marks.includes('over')) return false;
      if (marks.includes('tight')) tight = true;
      return true;
    });
    if (!fits) return 'too_small';
  } else if (dims.length > 0) unknown = true;
  if (cargo.lengthCm > 0 && cargo.widthCm > 0 && cargo.heightCm > 0 && space.openingWidth && space.openingHeight) {
    const faces = [
      [cargo.widthCm, cargo.heightCm],
      [cargo.lengthCm, cargo.heightCm],
      [cargo.lengthCm, cargo.widthCm],
    ];
    const open = faces.some(([width, height]) => within(width!, space.openingWidth!) !== 'over' && within(height!, space.openingHeight!) !== 'over');
    if (!open) return 'too_small';
    if (faces.every(([width, height]) => within(width!, space.openingWidth!) === 'tight' || within(height!, space.openingHeight!) === 'tight')) tight = true;
  } else if (dims.length > 0 && (space.openingWidth == null || space.openingHeight == null)) unknown = true;
  if (cargo.weightKg > 0) {
    if (space.weight == null) unknown = true;
    else {
      const mark = within(cargo.weightKg, space.weight);
      if (mark === 'over') return space.weightBound === 'ceiling' ? 'too_heavy' : 'too_small';
      if (mark === 'tight') tight = true;
    }
  }
  if (unknown || tight) return 'confirm';
  return 'expected';
}

function judgeEnvelope(cargo: CargoSize, ref: VehicleReference): FitJudgement {
  const shell = [ref.envelopeLengthCm, ref.envelopeWidthCm, ref.envelopeHeightCm].filter((value): value is number => value != null).sort((a, b) => b - a);
  const dims = [cargo.lengthCm, cargo.widthCm, cargo.heightCm].filter((value) => value > 0).sort((a, b) => b - a);
  if (dims.length > 0 && shell.length === 3 && dims.some((size, index) => size > shell[index]!)) return 'too_small';
  if (cargo.weightKg > 0 && ref.weightKg != null && cargo.weightKg > ref.weightKg) {
    return ref.weightBound === 'ceiling' ? 'too_heavy' : 'too_small';
  }
  return 'confirm';
}

function categoryJudgement(vehicle: CourierVehicle, cargo: CargoSize, rows: VehicleReference[]): FitJudgement {
  const interiors = rows.filter((row) => row.role === 'interior');
  const envelopes = rows.filter((row) => row.role === 'envelope');
  if (envelopes.length > 0 && interiors.length === 0) {
    const judged = envelopes.map((row) => judgeEnvelope(cargo, row));
    if (judged.every((item) => item === 'too_heavy')) return 'too_heavy';
    if (judged.every((item) => item === 'too_small' || item === 'too_heavy')) return 'too_small';
    return 'confirm';
  }
  if (interiors.length === 0) return 'confirm';
  const folded = vehicle.features.includes('FOLD_REAR_SEAT');
  const perSample = interiors.map((row) => judgeInterior(cargo, interiorSpace(row, folded)));
  if (perSample.every((item) => item === 'too_heavy')) return 'too_heavy';
  if (interiors.length === 1) return perSample[0] === 'too_small' ? 'confirm' : perSample[0]!;
  const shortest = interiors.reduce((best, row) => {
    const space = interiorSpace(row, folded);
    const length = space.length ?? Number.POSITIVE_INFINITY;
    return length < best.length ? { length, row } : best;
  }, { length: Number.POSITIVE_INFINITY, row: interiors[0]! }).row;
  const conservative = judgeInterior(cargo, interiorSpace(shortest, folded));
  if (conservative === 'expected') return 'expected';
  return 'confirm';
}

export function assessCargoFit(vehicle: CourierVehicle, cargo: CargoSize | null | undefined): FitJudgement {
  if (!cargoProvided(cargo)) return 'unspecified';
  const own = [
    ownAxis(vehicle.maxLengthCm, vehicle.capacityStatus.length, cargo.lengthCm),
    ownAxis(vehicle.maxWidthCm, vehicle.capacityStatus.width, cargo.widthCm),
    ownAxis(vehicle.maxHeightCm, vehicle.capacityStatus.height, cargo.heightCm),
    ownAxis(vehicle.maxWeightKg, vehicle.capacityStatus.weight, cargo.weightKg),
  ];
  if (own.slice(0, 3).includes('over')) return 'too_small';
  if (own[3] === 'over') return 'too_heavy';
  const positive = [cargo.lengthCm, cargo.widthCm, cargo.heightCm, cargo.weightKg].filter((value) => value > 0).length;
  const measured = own.filter((item) => item === 'fit').length;
  if (measured === positive) {
    const ceiling = confirmedCeilingKg(boundRows(vehicle));
    if (cargo.weightKg > 0 && ceiling != null && cargo.weightKg > ceiling) return 'too_heavy';
    return 'measured';
  }
  if (vehicle.carryingProvider === 'CUSTOMER' || vehicle.carryingProvider === 'DISCUSS') return 'confirm';
  if (vehicle.family === 'BUS' && vehicle.features.includes('ACTIVE_COOLING')) return 'confirm';
  const rows = vehicleReferences(vehicle);
  if (rows.length === 0) return 'confirm';
  return categoryJudgement(vehicle, cargo, rows);
}
