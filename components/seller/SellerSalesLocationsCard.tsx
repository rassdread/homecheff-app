'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import SalesLocationFormModal, {
  type SalesLocationFormValues,
} from '@/components/seller/SalesLocationFormModal';
import type { PublicPickupLocation } from '@/lib/seller/sales-locations';

type LimitInfo = {
  max: number;
  activeCount: number;
  plan: string;
  canAdd: boolean;
  upgradeHref: string;
};

export default function SellerSalesLocationsCard() {
  const [locations, setLocations] = useState<PublicPickupLocation[]>([]);
  const [limit, setLimit] = useState<LimitInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeHref, setUpgradeHref] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PublicPickupLocation | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/seller/locations', { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || 'Locaties konden niet worden geladen.');
      return;
    }
    setLocations(Array.isArray(data.locations) ? data.locations : []);
    setLimit(data.limit ?? null);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (values: SalesLocationFormValues) => {
    setSaving(true);
    setError(null);
    setUpgradeHref(null);
    const response = await fetch(
      editing ? `/api/seller/locations/${editing.id}` : '/api/seller/locations',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      },
    );
    const data = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(data?.error || 'Opslaan mislukt.');
      setUpgradeHref(data?.code === 'LOCATION_LIMIT' ? data.upgradeHref || '/sell' : null);
      return;
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setError(null);
    const response = await fetch(`/api/seller/locations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || 'Wijzigen mislukt.');
      setUpgradeHref(data?.code === 'LOCATION_LIMIT' ? data.upgradeHref || '/sell' : null);
      return;
    }
    await load();
  };

  return (
    <section className="flex w-full flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <MapPin className="h-5 w-5" />
            Verkooplocaties
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Eén account, één catalogus. Producten kunnen op meerdere actieve locaties
            beschikbaar zijn.
            {limit
              ? ` ${limit.activeCount} van ${limit.max} actief (${limit.plan}).`
              : null}
          </p>
        </div>
        <button
          type="button"
          className="w-full rounded-lg bg-primary-brand px-4 py-2 text-sm font-semibold text-white sm:w-auto"
          onClick={() => {
            setEditing(null);
            setUpgradeHref(null);
            setError(null);
            setModalOpen(true);
          }}
        >
          Locatie toevoegen
        </button>
      </div>

      {error && !modalOpen ? (
        <p className="text-sm text-red-700" role="alert">
          {error}{' '}
          {upgradeHref ? (
            <a className="font-semibold underline" href={upgradeHref}>
              Bekijk een ruimer abonnement
            </a>
          ) : null}
        </p>
      ) : null}

      {locations.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nog geen verkooplocatie. Bestaande producten blijven zichtbaar op hun huidige
          afhaaladres.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {locations.map((location) => (
            <li
              key={location.id}
              className="flex w-full flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {location.name}
                  {location.isPrimary ? ' · Primair' : ''}
                  {!location.isActive ? ' · Inactief' : ''}
                </p>
                <p className="text-sm text-gray-600">{location.addressLabel}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  onClick={() => {
                    setEditing(location);
                    setModalOpen(true);
                  }}
                >
                  Bewerken
                </button>
                {!location.isPrimary && location.isActive ? (
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                    onClick={() => void patch(location.id, { isPrimary: true })}
                  >
                    Maak primair
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  onClick={() => void patch(location.id, { isActive: !location.isActive })}
                >
                  {location.isActive ? 'Deactiveren' : 'Activeren'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SalesLocationFormModal
        open={modalOpen}
        title={editing ? 'Locatie bewerken' : 'Nieuwe locatie'}
        submitLabel={editing ? 'Opslaan' : 'Opslaan'}
        initial={
          editing
            ? {
                name: editing.name,
                street: editing.street,
                houseNumber: editing.houseNumber,
                postalCode: editing.postalCode,
                city: editing.city,
                country: editing.country,
              }
            : null
        }
        error={modalOpen ? error : null}
        upgradeHref={upgradeHref}
        saving={saving}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={(values) => void save(values)}
      />
    </section>
  );
}
