'use client';

import { useEffect, useRef, useState } from 'react';
import SalesLocationFormModal, {
  type SalesLocationFormValues,
} from '@/components/seller/SalesLocationFormModal';
import { selectNewlyCreatedLocation } from '@/lib/seller/sales-locations';
import type { PublicPickupLocation } from '@/lib/seller/sales-locations';

type Props = {
  productId?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function SalesLocationField({ productId, selectedIds, onChange }: Props) {
  const [locations, setLocations] = useState<PublicPickupLocation[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeHref, setUpgradeHref] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const query = productId ? `?productId=${encodeURIComponent(productId)}` : '';
    void fetch(`/api/seller/locations${query}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (cancelled || !response.ok) return;
        setLocations(Array.isArray(data.locations) ? data.locations : []);
        if (!hydrated.current && Array.isArray(data.selectedIds)) {
          hydrated.current = true;
          onChange(data.selectedIds.map(String));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [productId, onChange]);

  const active = locations.filter((location) => location.isActive);

  const saveAndSelect = async (values: SalesLocationFormValues) => {
    setSaving(true);
    setError(null);
    setUpgradeHref(null);
    const response = await fetch('/api/seller/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok || !data?.location?.id) {
      setError(data?.error || 'Locatie opslaan mislukt.');
      setUpgradeHref(data?.code === 'LOCATION_LIMIT' ? data.upgradeHref || '/sell' : null);
      return;
    }
    const created = data.location as PublicPickupLocation;
    setLocations((prev) => [...prev, created]);
    const next = selectNewlyCreatedLocation({}, selectedIds, created.id);
    onChange(next.selectedIds);
    setModalOpen(false);
  };

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-gray-200 p-3">
      <p className="text-sm font-semibold text-gray-900">Beschikbaar op locatie</p>
      {active.length === 0 ? (
        <p className="text-xs text-gray-500">
          Nog geen actieve verkooplocatie. Het product blijft je huidige afhaaladres gebruiken.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((location) => {
            const checked = selectedIds.includes(location.id);
            return (
              <li key={location.id}>
                <label className="flex w-full items-start gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={() => {
                      onChange(
                        checked
                          ? selectedIds.filter((id) => id !== location.id)
                          : [...selectedIds, location.id],
                      );
                    }}
                  />
                  <span>
                    <span className="font-medium">{location.name}</span>
                    <span className="block text-xs text-gray-500">{location.addressLabel}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm font-medium text-primary-brand sm:w-auto"
        onClick={() => {
          setError(null);
          setModalOpen(true);
        }}
      >
        + Nieuwe locatie toevoegen
      </button>
      <SalesLocationFormModal
        open={modalOpen}
        title="Nieuwe locatie"
        submitLabel="Opslaan en selecteren"
        error={error}
        upgradeHref={upgradeHref}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={(values) => void saveAndSelect(values)}
      />
    </div>
  );
}
