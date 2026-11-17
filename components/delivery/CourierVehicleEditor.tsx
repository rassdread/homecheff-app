'use client';

import { useRef, useState } from 'react';
import {
  applyLegacyCapacity,
  carryingChoices,
  emptyVehicle,
  familyChoices,
  featureChoices,
  providerChoices,
  variantChoices,
  vehiclePublicLabel,
  type CarryingProvider,
  type CourierVehicle,
  type StoredCapacity,
  type VehicleFamily,
} from '@/lib/delivery/courier-vehicles';
import { catalogReferences, referenceHeadline, type VehicleReference } from '@/lib/delivery/vehicle-references';
import type { CapacityAxis, CapacityMark } from '@/lib/delivery/transport-job';
import { VehicleSilhouette } from '@/components/delivery/VehicleSilhouette';

const TILE = 'min-w-0 rounded-xl border-2 p-3 transition-all text-left sm:p-4';
const TILE_ON = 'border-primary-brand bg-primary-50 text-primary-brand';
const TILE_OFF = 'border-gray-200 hover:border-gray-300';

function variantLabel(vehicle: CourierVehicle): string {
  return variantChoices(vehicle.family).find((item) => item.id === vehicle.variant)?.label
    ?? vehiclePublicLabel(vehicle);
}

function readyToKeep(vehicle: CourierVehicle): boolean {
  if (variantChoices(vehicle.family).length > 0 && !vehicle.variant) return false;
  if (vehicle.carrying.length > 0 && !vehicle.carryingProvider) return false;
  return true;
}

export function CourierVehicleEditor({
  vehicles,
  onChange,
  legacyCapacity,
  onLegacyAssigned,
}: {
  vehicles: CourierVehicle[];
  onChange: (vehicles: CourierVehicle[]) => void;
  legacyCapacity?: StoredCapacity | null;
  onLegacyAssigned?: () => void;
}) {
  const [draft, setDraft] = useState<CourierVehicle | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [step, setStep] = useState<'family' | 'variant' | 'details'>('family');
  const baseline = useRef<CourierVehicle[] | null>(null);
  const draftKey = useRef<string | null>(null);

  function publish(nextDraft: CourierVehicle | null) {
    const base = baseline.current;
    if (!base) return;
    if (!nextDraft || !readyToKeep(nextDraft)) {
      onChange(base);
      return;
    }
    const key = nextDraft.id ?? draftKey.current ?? `voertuig-${base.length + 1}`;
    const saved: CourierVehicle = {
      ...nextDraft,
      id: key,
      referenceId: catalogReferences(nextDraft).find((ref) => ref.id === nextDraft.referenceId)?.id ?? null,
    };
    if (editIndex == null) onChange([...base, saved]);
    else {
      const next = base.slice();
      next[editIndex] = saved;
      onChange(next);
    }
  }

  function updateDraft(nextDraft: CourierVehicle) {
    setDraft(nextDraft);
    publish(nextDraft);
  }

  function beginAdd() {
    baseline.current = vehicles;
    draftKey.current = `nieuw-${crypto.randomUUID()}`;
    setEditIndex(null);
    setDraft(null);
    setAdding(true);
    setStep('family');
  }

  function cancel() {
    if (baseline.current) onChange(baseline.current);
    baseline.current = null;
    draftKey.current = null;
    setDraft(null);
    setEditIndex(null);
    setAdding(false);
    setStep('family');
  }

  function closeKept() {
    baseline.current = null;
    draftKey.current = null;
    setDraft(null);
    setEditIndex(null);
    setAdding(false);
    setStep('family');
  }

  function chooseFamily(family: VehicleFamily) {
    const next = draft && draft.family === family ? draft : { ...emptyVehicle(family), id: draftKey.current ?? undefined };
    setDraft(next);
    if (variantChoices(family).length > 0) {
      setStep('variant');
      publish(next.variant ? next : null);
      return;
    }
    setStep('details');
    updateDraft(next);
  }

  function chooseVariant(variant: string) {
    if (!draft) return;
    const next = { ...draft, variant, referenceId: draft.variant === variant ? draft.referenceId : null };
    setStep('details');
    updateDraft(next);
  }

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function setAxis(axis: CapacityAxis, mark: CapacityMark) {
    if (!draft) return;
    const field = axis === 'length' ? 'maxLengthCm' : axis === 'width' ? 'maxWidthCm' : axis === 'height' ? 'maxHeightCm' : 'maxWeightKg';
    updateDraft({
      ...draft,
      capacityStatus: { ...draft.capacityStatus, [axis]: mark },
      [field]: mark === 'set' ? draft[field] : null,
    });
  }

  const bodyModels: VehicleReference[] = draft?.variant
    ? catalogReferences({ variant: draft.variant, carrying: [], carryingProvider: null })
    : [];
  const gearModels: VehicleReference[] = draft?.carryingProvider === 'COURIER'
    ? catalogReferences({ variant: null, carrying: draft.carrying, carryingProvider: 'COURIER' })
    : [];
  const models = bodyModels.length > 0 ? bodyModels : gearModels;
  const selectedReference = models.find((ref) => ref.id === draft?.referenceId);
  const carrying = draft ? carryingChoices(draft.family) : [];
  const features = draft ? featureChoices(draft.family) : [];

  return (
    <div className="min-w-0 space-y-4">
      {vehicles.map((vehicle, index) => {
        const openId = adding ? draft?.id ?? draftKey.current : null;
        if (openId && vehicle.id === openId) return null;
        return (
        <div key={vehicle.id || `${vehicle.family}-${index}`} className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <VehicleSilhouette family={vehicle.family} variant={vehicle.variant} className="mt-0.5 h-8 w-16 shrink-0 text-gray-800" />
            <div>
              <p className="font-medium text-gray-900">{vehiclePublicLabel(vehicle)}</p>
              {vehicle.referenceId ? (
                <p className="text-sm text-gray-600">{catalogReferences(vehicle).find((ref) => ref.id === vehicle.referenceId)?.name}</p>
              ) : null}
            </div>
          </div>
          {vehicle.variant == null && variantChoices(vehicle.family).length > 0 ? (
            <p className="mt-1 text-sm text-gray-600">
              {vehicle.family === 'CAR'
                ? 'Auto blijft staan tot je Hatchback, Sedan of Stationwagen kiest.'
                : vehicle.family === 'BUS'
                  ? 'Bestelbus blijft staan tot je een formaat kiest.'
                  : 'Kies een uitvoering wanneer je die wilt vastleggen.'}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded-lg border px-3 text-sm disabled:opacity-60"
              disabled={adding}
              onClick={() => {
                baseline.current = vehicles;
                draftKey.current = vehicle.id ?? `bewerkt-${index}`;
                setEditIndex(index);
                setDraft({ ...vehicle, id: vehicle.id ?? draftKey.current });
                setAdding(true);
                setStep('details');
              }}
            >
              Wijzigen
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border px-3 text-sm"
              onClick={() => {
                const next = vehicles.filter((_, item) => item !== index);
                onChange(next);
                if (adding) {
                  const openId = draft?.id ?? draftKey.current;
                  baseline.current = next.filter((item) => item.id !== openId);
                }
              }}
            >
              Verwijderen
            </button>
            {legacyCapacity ? (
              <button
                type="button"
                className="min-h-11 rounded-lg border border-primary-brand px-3 text-sm text-primary-brand"
                onClick={() => {
                  const next = vehicles.slice();
                  next[index] = applyLegacyCapacity(vehicle, legacyCapacity);
                  onChange(next);
                  onLegacyAssigned?.();
                }}
              >
                Deze maten horen bij dit voertuig
              </button>
            ) : null}
          </div>
        </div>
        );
      })}

      {legacyCapacity ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Je hebt één oude set maten en meerdere voertuigen. Kies bij welk voertuig die horen. Tot die keuze worden de maten bij geen enkel voertuig gebruikt.
        </p>
      ) : null}

      <button type="button" className="min-h-11 rounded-lg bg-primary-600 px-4 font-semibold text-white disabled:opacity-60" onClick={beginAdd} disabled={adding}>
        Voertuig toevoegen
      </button>

      {adding && step === 'family' && draft == null ? (
        <div className="space-y-3">
          <div className="grid min-w-0 grid-cols-2 gap-2 md:grid-cols-3">
            {familyChoices().map((choice) => (
              <button key={choice.id} type="button" className={`${TILE} ${TILE_OFF}`} onClick={() => chooseFamily(choice.id)}>
                <span className="flex flex-col items-center gap-2 text-center">
                  <VehicleSilhouette family={choice.id} className="h-8 w-16 text-gray-800" />
                  <span className="break-words text-sm font-medium">{choice.label}</span>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="min-h-11 rounded-lg border px-3 text-sm" onClick={cancel}>Annuleren</button>
        </div>
      ) : null}

      {draft && step === 'variant' ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-800">Kies de uitvoering</p>
          <div className="grid min-w-0 grid-cols-2 gap-2">
            {variantChoices(draft.family).map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={`${TILE} ${draft.variant === choice.id ? TILE_ON : TILE_OFF}`}
                onClick={() => chooseVariant(choice.id)}
              >
                <span className="flex flex-col items-center gap-2 text-center">
                  <VehicleSilhouette family={draft.family} variant={choice.id} className="h-8 w-16" />
                  <span className="break-words text-sm font-medium">{choice.label}</span>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="min-h-11 rounded-lg border px-3 text-sm" onClick={cancel}>Annuleren</button>
        </div>
      ) : null}

      {draft && step === 'details' ? (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <VehicleSilhouette family={draft.family} variant={draft.variant} className="h-10 w-20 shrink-0 text-gray-900" />
            <div>
              <p className="text-sm text-gray-600">Welk model heb je? (optioneel)</p>
              <p className="font-medium text-gray-900">{variantLabel(draft)}</p>
            </div>
          </div>
          {variantChoices(draft.family).length > 0 ? (
            <button type="button" className="text-sm font-medium text-primary-brand underline" onClick={() => setStep('variant')}>
              Andere uitvoering
            </button>
          ) : null}
          {bodyModels.length > 0 ? (
            <ModelChoices
              models={bodyModels}
              selectedId={selectedReference?.id ?? null}
              onSelect={(referenceId) => updateDraft({ ...draft, referenceId })}
            />
          ) : draft.family === 'BIKE' || draft.family === 'EBIKE' || draft.family === 'SCOOTER' ? (
            <p className="text-sm text-gray-600">
              Het merk van de fiets of scooter bepaalt de laadruimte niet. Kies hieronder de tas, krat of box, of vul zelf de bruikbare maten in.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Voor deze uitvoering staan geen vaste bakmaten in de catalogus. Vul de bruikbare maten in, of ga verder zonder model. Dan volgt even afstemmen.
            </p>
          )}
          {!selectedReference && bodyModels.length > 0 ? (
            <p className="text-sm text-gray-600">
              Zonder exact model legt HomeCheff geen vaste binnenmaten vast. Past een lading niet eenduidig, dan volgt even afstemmen.
            </p>
          ) : null}
          <div>
            <p className="font-medium text-gray-900">Wat biedt dit voertuig?</p>
            <div className="mt-2 grid gap-2">
              {features.map((feature) => (
                <label key={feature.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.features.includes(feature.id)}
                    onChange={() => updateDraft({ ...draft, features: toggle(draft.features, feature.id) })}
                  />
                  {feature.label}
                </label>
              ))}
            </div>
          </div>
          {carrying.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">Wat neem je mee?</p>
              <p className="text-sm text-gray-600">De tas, het krat of de box draagt de lading. Zeg ook wie dat meeneemt. De buitenmaten van een tas zeggen niet dat een doos erin past.</p>
              {carrying.map((item) => (
                <label key={item.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.carrying.includes(item.id)}
                    onChange={() => {
                      const next = toggle(draft.carrying, item.id);
                      const provider = next.length === 0 ? null : draft.carryingProvider;
                      updateDraft({
                        ...draft,
                        carrying: next,
                        carryingProvider: provider,
                        referenceId: keptReference(draft.referenceId, bodyModels, next, provider),
                      });
                    }}
                  />
                  {item.label}
                </label>
              ))}
              {draft.carrying.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {providerChoices().map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      className={`${TILE} ${draft.carryingProvider === provider.id ? TILE_ON : TILE_OFF}`}
                      onClick={() => {
                        const carryingProvider = provider.id as CarryingProvider;
                        updateDraft({
                          ...draft,
                          carryingProvider,
                          referenceId: keptReference(draft.referenceId, bodyModels, draft.carrying, carryingProvider),
                        });
                      }}
                    >
                      <span className="block text-center text-sm">{provider.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {gearModels.length > 0 && bodyModels.length === 0 ? (
            <>
              <ModelChoices
                models={gearModels}
                selectedId={selectedReference?.id ?? null}
                onSelect={(referenceId) => updateDraft({ ...draft, referenceId })}
              />
              {!selectedReference ? (
                <p className="text-sm text-gray-600">Zonder tas of box blijven de maten onbekend. Vul ze zelf in, of er volgt even afstemmen.</p>
              ) : null}
            </>
          ) : null}
          <details className="space-y-2">
            <summary className="text-sm font-medium text-gray-800">Mijn voertuig wijkt af</summary>
            {([
              ['length', 'Lengte (cm)', 'maxLengthCm'],
              ['width', 'Breedte (cm)', 'maxWidthCm'],
              ['height', 'Hoogte (cm)', 'maxHeightCm'],
              ['weight', 'Gewicht (kg)', 'maxWeightKg'],
            ] as const).map(([axis, label, field]) => (
              <div key={axis} className="grid grid-cols-2 gap-2">
                <label className="text-sm text-gray-700">
                  {label}
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={draft.capacityStatus[axis]}
                    onChange={(event) => setAxis(axis, event.target.value as CapacityMark)}
                  >
                    <option value="unset">Niet ingevuld</option>
                    <option value="unknown">Onbekend</option>
                    <option value="not_applicable">Niet van toepassing</option>
                    <option value="set">Gemeten</option>
                  </select>
                </label>
                <label className="text-sm text-gray-700">
                  Getal
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
                    inputMode="numeric"
                    disabled={draft.capacityStatus[axis] !== 'set'}
                    value={draft[field] ?? ''}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      updateDraft({ ...draft, [field]: Number.isInteger(parsed) && parsed > 0 ? parsed : null });
                    }}
                  />
                </label>
              </div>
            ))}
          </details>
          <button
            type="button"
            className="min-h-11 w-full rounded-lg bg-emerald-700 px-4 font-semibold text-white disabled:opacity-60"
            disabled={!readyToKeep(draft)}
            onClick={closeKept}
          >
            Bewaar voertuig
          </button>
          <button type="button" className="min-h-11 w-full rounded-lg border px-4 text-sm" onClick={cancel}>
            Annuleren
          </button>
        </div>
      ) : null}
    </div>
  );
}

function keptReference(
  referenceId: string | null,
  bodyModels: VehicleReference[],
  carrying: CourierVehicle['carrying'],
  provider: CarryingProvider | null,
): string | null {
  if (!referenceId) return null;
  if (bodyModels.some((ref) => ref.id === referenceId)) return referenceId;
  if (provider !== 'COURIER') return null;
  return catalogReferences({ variant: null, carrying, carryingProvider: provider }).some((ref) => ref.id === referenceId)
    ? referenceId
    : null;
}

function ModelChoices({
  models,
  selectedId,
  onSelect,
}: {
  models: VehicleReference[];
  selectedId: string | null;
  onSelect: (referenceId: string | null) => void;
}) {
  return (
    <div className="grid min-w-0 gap-2" role="radiogroup" aria-label="Model">
      <button
        type="button"
        role="radio"
        aria-checked={selectedId === null}
        className={`${TILE} ${selectedId === null ? TILE_ON : TILE_OFF}`}
        onClick={() => onSelect(null)}
      >
        <span className="block text-sm font-medium">Mijn model staat er niet bij</span>
      </button>
      {models.map((ref) => {
        const selected = selectedId === ref.id;
        return (
          <div key={ref.id} className={`${TILE} ${selected ? TILE_ON : TILE_OFF}`}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              className="w-full min-w-0 text-left"
              onClick={() => onSelect(ref.id)}
            >
              <span className="block break-words text-sm font-medium">{ref.name}</span>
              {selected ? <span className="mt-1 block break-words text-sm font-normal text-gray-800">{referenceHeadline(ref)}</span> : null}
            </button>
            {selected ? <ReferenceDetails reference={ref} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function ReferenceDetails({ reference }: { reference: VehicleReference }) {
  const missing = [
    reference.lengthCm == null && reference.envelopeLengthCm == null ? 'laadlengte' : null,
    reference.widthCm == null && reference.envelopeWidthCm == null ? 'bruikbare breedte' : null,
    reference.heightCm == null && reference.envelopeHeightCm == null ? 'binnenhoogte' : null,
  ].filter(Boolean);
  const door = reference.openingWidthCm != null && reference.openingHeightCm != null
    ? `Deuropening ${reference.openingWidthCm} × ${reference.openingHeightCm} cm.`
    : 'Deuropening is niet bekend.';
  return (
    <details className="mt-2 border-t border-current/10 pt-2">
      <summary className="cursor-pointer text-sm font-medium">Bekijk alle maten en bron</summary>
      <div className="mt-2 space-y-1 break-words text-sm font-normal text-gray-700">
        <p>{door}</p>
        <p>{reference.configuration}</p>
        {reference.sourcePage ? <p>Documentpagina {reference.sourcePage}.</p> : null}
        {missing.length > 0 ? <p>Nog open: {missing.join(', ')}.</p> : null}
        <a className="break-all font-medium text-primary-brand underline" href={reference.source} target="_blank" rel="noreferrer">
          Bron
        </a>
      </div>
    </details>
  );
}
