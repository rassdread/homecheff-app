'use client';

import type { PublicPickupLocation } from '@/lib/seller/sales-locations';

type Props = {
  locations: PublicPickupLocation[];
  selectedId: string | null;
  onChange: (id: string) => void;
};

export default function PickupLocationChooser({ locations, selectedId, onChange }: Props) {
  const active = locations.filter((location) => location.isActive !== false);
  if (active.length === 0) return null;
  const selected = active.find((location) => location.id === selectedId) ?? active[0];

  return (
    <fieldset className="flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <legend className="px-1 text-sm font-semibold text-gray-900">Afhaallocatie</legend>
      {active.length === 1 ? (
        <p className="text-sm text-gray-700">
          <span className="font-medium">{selected?.name}</span>
          <span className="mt-0.5 block text-xs text-gray-600">{selected?.addressLabel}</span>
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((location) => (
            <li key={location.id}>
              <label className="flex w-full items-start gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name="pickup-location"
                  className="mt-1"
                  checked={location.id === selected?.id}
                  onChange={() => onChange(location.id)}
                />
                <span>
                  <span className="font-medium">{location.name}</span>
                  <span className="block text-xs text-gray-600">{location.addressLabel}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
