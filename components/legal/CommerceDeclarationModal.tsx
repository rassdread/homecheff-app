'use client';

/**
 * LEGAL-1 — light self-declaration modal (Dutch first).
 * Does not claim HomeCheff made a legal ruling.
 */

import { useState } from 'react';

export type CommerceDeclarationChoice =
  | 'PRIVATE_OCCASIONAL'
  | 'SELF_DECLARED_PROFESSIONAL';

type Props = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (declaration: CommerceDeclarationChoice) => void;
};

export default function CommerceDeclarationModal({
  open,
  busy,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const [choice, setChoice] = useState<CommerceDeclarationChoice | null>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="commerce-declaration-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 p-5 sm:p-6 space-y-4">
        <div>
          <h2
            id="commerce-declaration-title"
            className="text-lg font-semibold text-gray-900"
          >
            Hoe bied je aan op HomeCheff?
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Kies wat het beste past. Dit is jouw keuze — geen juridische
            vaststelling door HomeCheff.
          </p>
        </div>

        <fieldset className="space-y-3" disabled={busy}>
          <legend className="sr-only">Verkoopstatus</legend>
          <label
            className={`block rounded-xl border p-3 cursor-pointer transition ${
              choice === 'PRIVATE_OCCASIONAL'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex gap-3">
              <input
                type="radio"
                name="commerceDeclaration"
                className="mt-1"
                checked={choice === 'PRIVATE_OCCASIONAL'}
                onChange={() => setChoice('PRIVATE_OCCASIONAL')}
              />
              <span>
                <span className="block font-medium text-gray-900">
                  Particulier / af en toe
                </span>
                <span className="block text-sm text-gray-600 mt-0.5">
                  Ik bied af en toe iets zelfgemaakts of een persoonlijke dienst
                  aan en doe dit niet als onderdeel van mijn bedrijf of beroep.
                </span>
              </span>
            </div>
          </label>

          <label
            className={`block rounded-xl border p-3 cursor-pointer transition ${
              choice === 'SELF_DECLARED_PROFESSIONAL'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex gap-3">
              <input
                type="radio"
                name="commerceDeclaration"
                className="mt-1"
                checked={choice === 'SELF_DECLARED_PROFESSIONAL'}
                onChange={() => setChoice('SELF_DECLARED_PROFESSIONAL')}
              />
              <span>
                <span className="block font-medium text-gray-900">
                  Zakelijk / professioneel
                </span>
                <span className="block text-sm text-gray-600 mt-0.5">
                  Ik bied producten of diensten aan als onderdeel van mijn
                  bedrijf, beroep of professionele activiteit.
                </span>
              </span>
            </div>
          </label>
        </fieldset>

        <p className="text-xs text-gray-500">
          Je kunt dit later aanpassen. HomeCheff kan je vragen je keuze opnieuw
          te controleren wanneer je activiteit verandert.
        </p>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={busy}
          >
            Annuleren
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
            disabled={busy || !choice}
            onClick={() => choice && onConfirm(choice)}
          >
            {busy ? 'Bezig…' : 'Bevestigen'}
          </button>
        </div>
      </div>
    </div>
  );
}
