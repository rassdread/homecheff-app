'use client';

import { useEffect, useId, useRef } from 'react';

export default function VerdienCheckInfoDialog(props: {
  open: boolean;
  title: string;
  body: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!props.open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        props.onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previousFocus.current?.focus();
    };
    // Intentionally only re-bind when open toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  if (!props.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
        <h2 id={titleId} className="text-lg font-semibold text-stone-900">
          {props.title}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-stone-600">{props.body}</p>
        <button
          ref={closeRef}
          type="button"
          className="mt-5 min-h-12 w-full rounded-xl bg-emerald-800 px-4 py-3 text-lg font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          onClick={props.onClose}
        >
          {props.closeLabel}
        </button>
      </div>
    </div>
  );
}
