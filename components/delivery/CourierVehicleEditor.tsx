'use client';

import { useState } from 'react';
import { Bike, Car, Navigation } from 'lucide-react';
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
import { referenceDescription, vehicleReferences } from '@/lib/delivery/vehicle-references';
import type { CapacityAxis, CapacityMark } from '@/lib/delivery/transport-job';

const TILE = 'p-4 rounded-xl border-2 transition-all text-left';
const TILE_ON = 'border-primary-brand bg-primary-50 text-primary-brand';
const TILE_OFF = 'border-gray-200 hover:border-gray-300';

function FamilyIcon({ family }: { family: VehicleFamily }) {
  if (family === 'BIKE' || family === 'EBIKE') return <Bike className="w-5 h-5" aria-hidden />;
  if (family === 'CAR') return <Car className="w-5 h-5" aria-hidden />;
  return <Navigation className="w-5 h-5" aria-hidden />;
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

  function beginAdd() {
    setEditIndex(null);
    setDraft(null);
    setAdding(true);
    setStep('family');
  }

  function chooseFamily(family: VehicleFamily) {
    const next = draft && draft.family === family ? draft : emptyVehicle(family);
    setDraft(next);
    setStep(variantChoices(family).length > 0 ? 'variant' : 'details');
  }

  function chooseVariant(variant: string) {
    if (!draft) return;
    setDraft({ ...draft, variant });
    setStep('details');
  }

  function saveDraft() {
    if (!draft) return;
    if (variantChoices(draft.family).length > 0 && !draft.variant && editIndex == null) return;
    const next = vehicles.slice();
    const saved = { ...draft, referenceId: vehicleReferences(draft).find(ref => ref.id === draft.referenceId)?.id ?? null };
    if (editIndex == null) next.push(saved);
    else next[editIndex] = saved;
    onChange(next);
    setDraft(null);
    setEditIndex(null);
    setAdding(false);
    setStep('family');
  }

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function setAxis(axis: CapacityAxis, mark: CapacityMark) {
    if (!draft) return;
    const field = axis === 'length' ? 'maxLengthCm' : axis === 'width' ? 'maxWidthCm' : axis === 'height' ? 'maxHeightCm' : 'maxWeightKg';
    setDraft({
      ...draft,
      capacityStatus: { ...draft.capacityStatus, [axis]: mark },
      [field]: mark === 'set' ? draft[field] : null,
    });
  }

  const references = draft ? vehicleReferences(draft) : [];
  const selectedReference = references.find(ref => ref.id === draft?.referenceId);
  const carrying = draft ? carryingChoices(draft.family) : [];
  const features = draft ? featureChoices(draft.family) : [];

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle, index) => (
        <div key={vehicle.id || `${vehicle.family}-${index}`} className="rounded-xl border border-gray-200 p-4">
          <p className="font-medium text-gray-900">{vehiclePublicLabel(vehicle)}</p>
          {vehicle.referenceId && <p className="text-sm text-gray-600">{vehicleReferences(vehicle).find(ref => ref.id === vehicle.referenceId)?.name}</p>}
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
              className="min-h-11 rounded-lg border px-3 text-sm"
              onClick={() => {
                setEditIndex(index);
                setDraft(vehicle);
                setStep('details');
              }}
            >
              Wijzigen
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border px-3 text-sm"
              onClick={() => onChange(vehicles.filter((_, item) => item !== index))}
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
      ))}

      {legacyCapacity ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Je hebt één oude set maten en meerdere voertuigen. Kies bij welk voertuig die horen. Tot die keuze worden de maten bij geen enkel voertuig gebruikt.
        </p>
      ) : null}

      <button type="button" className="min-h-11 rounded-lg bg-primary-600 px-4 font-semibold text-white" onClick={beginAdd}>
        Voertuig toevoegen
      </button>

      {adding && step === 'family' && draft == null ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {familyChoices().map((choice) => (
            <button key={choice.id} type="button" className={`${TILE} ${TILE_OFF}`} onClick={() => chooseFamily(choice.id)}>
              <span className="flex flex-col items-center gap-2 text-center">
                <FamilyIcon family={choice.id} />
                <span className="text-sm font-medium">{choice.label}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {draft && step === 'variant' ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-800">{draft.family === 'CAR' || draft.family === 'BUS' || draft.family === 'SCOOTER' ? 'Kies de uitvoering' : 'Kies de fiets'}</p>
          <div className="grid grid-cols-2 gap-4">
            {variantChoices(draft.family).map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={`${TILE} ${draft.variant === choice.id ? TILE_ON : TILE_OFF}`}
                onClick={() => chooseVariant(choice.id)}
              >
                <span className="flex flex-col items-center gap-1 text-center">
                  <FamilyIcon family={draft.family} />
                  <span className="text-sm font-medium">{choice.label}</span>
                  {choice.hint ? <span className="text-xs text-gray-600">{choice.hint}</span> : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {draft && step === 'details' ? (
        <div className="space-y-4 rounded-xl border p-4">
          <p className="font-medium text-gray-900">Wat biedt dit voertuig?</p>
          {variantChoices(draft.family).length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {variantChoices(draft.family).map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={`${TILE} ${draft.variant === choice.id ? TILE_ON : TILE_OFF}`}
                  onClick={() => setDraft({ ...draft, variant: choice.id })}
                >
                  <span className="block text-center text-sm font-medium">{choice.label}</span>
                  {choice.hint ? <span className="mt-1 block text-center text-xs text-gray-600">{choice.hint}</span> : null}
                </button>
              ))}
            </div>
          ) : null}
          <div className="grid gap-2">
            {features.map((feature) => (
              <label key={feature.id} className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.features.includes(feature.id)}
                  onChange={() => setDraft({ ...draft, features: toggle(draft.features, feature.id) })}
                />
                {feature.label}
              </label>
            ))}
          </div>
          {carrying.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">Wat neem je mee?</p>
              {carrying.map((item) => (
                <label key={item.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.carrying.includes(item.id)}
                    onChange={() => {
                      const next = toggle(draft.carrying, item.id);
                      setDraft({ ...draft, carrying: next, carryingProvider: next.length === 0 ? null : draft.carryingProvider });
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
                      onClick={() => setDraft({ ...draft, carryingProvider: provider.id as CarryingProvider })}
                    >
                      <span className="block text-center text-sm">{provider.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {references.length > 0 && <label className="block text-sm">
            Model of draagmiddel (optioneel)
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={selectedReference?.id ?? ''} onChange={event => setDraft({ ...draft, referenceId: event.target.value || null })}>
              <option value="">Gebruik richtmaten van deze uitvoering</option>
              {references.map(ref => <option key={ref.id} value={ref.id}>{ref.name}</option>)}
            </select>
            <span className="mt-1 block text-xs text-gray-600">{selectedReference ? referenceDescription(selectedReference, draft) : 'Een richtmaat blijft een schatting en wordt niet opgeslagen als jouw meting.'}</span>
          </label>}
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
                      setDraft({ ...draft, [field]: Number.isInteger(parsed) && parsed > 0 ? parsed : null });
                    }}
                  />
                </label>
              </div>
            ))}
          </details>
          <button
            type="button"
            className="min-h-11 w-full rounded-lg bg-emerald-700 px-4 font-semibold text-white disabled:opacity-60"
            disabled={(draft.carrying.length > 0 && !draft.carryingProvider) || (variantChoices(draft.family).length > 0 && !draft.variant && editIndex == null)}
            onClick={saveDraft}
          >
            Bewaar voertuig
          </button>
        </div>
      ) : null}
    </div>
  );
}
