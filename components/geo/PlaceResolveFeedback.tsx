'use client';

import type { PlaceAutoResolveState } from '@/hooks/usePlaceAutoResolve';
import type { ResolvedPlaceCandidate } from '@/lib/geo/resolve-place-input';

type Props = {
  state: PlaceAutoResolveState;
  onSelect: (c: ResolvedPlaceCandidate) => void;
};

/** Controlled feedback for place auto-resolution (create/edit). */
export function PlaceResolveFeedback({ state, onSelect }: Props) {
  if (state.status === 'idle') return null;

  if (state.status === 'resolving') {
    return (
      <p className="text-xs text-gray-500" role="status">
        Locatie opzoeken…
      </p>
    );
  }

  if (state.status === 'resolved') {
    return (
      <p className="text-xs text-emerald-700" role="status">
        Locatie gevonden
        {state.result.city || state.result.label
          ? `: ${state.result.city || state.result.label}`
          : ''}
      </p>
    );
  }

  if (state.status === 'ambiguous') {
    return (
      <div className="space-y-2" role="group" aria-label="Locatiekeuze">
        <p className="text-xs font-medium text-amber-800">{state.message}</p>
        <ul className="space-y-1">
          {state.candidates.map((c) => (
            <li key={`${c.lat},${c.lng},${c.label}`}>
              <button
                type="button"
                className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-gray-900 hover:bg-amber-100"
                onClick={() => onSelect(c)}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (state.status === 'none' || state.status === 'error') {
    return (
      <p className="text-xs text-red-600" role="alert">
        {state.message}
      </p>
    );
  }

  return null;
}
