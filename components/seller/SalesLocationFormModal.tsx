'use client';

import { useEffect, useState } from 'react';

export type SalesLocationFormValues = {
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
};

const EMPTY: SalesLocationFormValues = {
  name: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'NL',
};

type Props = {
  open: boolean;
  title: string;
  submitLabel: string;
  initial?: SalesLocationFormValues | null;
  error?: string | null;
  upgradeHref?: string | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: SalesLocationFormValues) => void;
};

export default function SalesLocationFormModal({
  open,
  title,
  submitLabel,
  initial,
  error,
  upgradeHref,
  saving = false,
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<SalesLocationFormValues>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setValues(initial ?? EMPTY);
  }, [open, initial]);

  if (!open) return null;

  const set = (key: keyof SalesLocationFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <form
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSubmit(values);
        }}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Locatienaam
            <input
              required
              value={values.name}
              onChange={(event) => set('name', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Straat
            <input
              required
              value={values.street}
              onChange={(event) => set('street', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Huisnummer
              <input
                required
                value={values.houseNumber}
                onChange={(event) => set('houseNumber', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Postcode
              <input
                required
                value={values.postalCode}
                onChange={(event) => set('postalCode', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Plaats
              <input
                required
                value={values.city}
                onChange={(event) => set('city', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Land
              <input
                required
                value={values.country}
                onChange={(event) => set('country', event.target.value.toUpperCase())}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                maxLength={2}
              />
            </label>
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}{' '}
            {upgradeHref ? (
              <a className="font-semibold underline" href={upgradeHref}>
                Bekijk een ruimer abonnement
              </a>
            ) : null}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium sm:w-auto"
            onClick={onClose}
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-primary-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
          >
            {saving ? 'Opslaan…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
