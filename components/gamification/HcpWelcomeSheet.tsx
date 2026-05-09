'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onDismiss: () => void;
};

export default function HcpWelcomeSheet({ open, onDismiss }: Props) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const finish = async () => {
    setBusy(true);
    try {
      await fetch('/api/gamification/onboarding/dismiss', { method: 'POST', credentials: 'include' });
      onDismiss();
    } catch {
      onDismiss();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="hcp-welcome-title">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Sluiten" onClick={() => void finish()} />
      <div
        className={cn(
          'relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-gray-100',
          'max-h-[min(88vh,560px)] overflow-y-auto p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]'
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          onClick={() => void finish()}
          aria-label="Sluiten"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 id="hcp-welcome-title" className="text-xl font-bold text-gray-900 pr-10">
          Welkom bij HomeCheff Points
        </h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          HomeCheff Points (HCP) belonen je voor actieve bijdrage aan de community — zonder gedoe met echte geld.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-gray-800 list-disc pl-5">
          <li>Verdien HCP door actief te zijn (inloggen, profiel, posts, reviews).</li>
          <li>Plaats producten of inspiratie om sneller te groeien.</li>
          <li>Bouw login-streaks op voor extra bonussen.</li>
          <li>Speel badges vrij en toon ze op je profiel.</li>
          <li>Stijg in de ranglijsten — puur voor zichtbaarheid en plezier.</li>
        </ul>
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            className="w-full sm:w-auto rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => void finish()}
            disabled={busy}
          >
            Overslaan
          </button>
          <button
            type="button"
            className="w-full sm:w-auto rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            onClick={() => void finish()}
            disabled={busy}
          >
            Start met verdienen
          </button>
        </div>
      </div>
    </div>
  );
}
