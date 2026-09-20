'use client';

import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

export default function VerdienCheckRestartConfirm(props: {
  copy: VerdienCheckCopy;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!props.open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verdiencheck-restart-title"
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
        <h2 id="verdiencheck-restart-title" className="text-xl font-semibold text-stone-900">
          {props.copy.restartConfirmTitle}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-stone-600">
          {props.copy.restartConfirmBody}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="min-h-12 w-full rounded-xl bg-emerald-800 px-4 py-3 text-lg font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            onClick={props.onConfirm}
          >
            {props.copy.restartConfirmConfirm}
          </button>
          <button
            type="button"
            className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            onClick={props.onCancel}
          >
            {props.copy.restartConfirmCancel}
          </button>
        </div>
      </div>
    </div>
  );
}
