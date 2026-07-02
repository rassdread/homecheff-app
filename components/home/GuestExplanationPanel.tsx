'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { GuestExplanationNamespace } from '@/lib/guest/guest-explanation-panels';

const MAX_BULLETS = 6;

type Props = {
  namespace: GuestExplanationNamespace;
  panel: string | null;
  onClose: () => void;
  registerHref?: string;
  loginHref?: string;
};

export default function GuestExplanationPanel({
  namespace,
  panel,
  onClose,
  registerHref = '/register',
  loginHref = '/login',
}: Props) {
  const { t } = useTranslation();
  if (!panel) return null;

  const base = `${namespace}.${panel}`;
  const title = t(`${base}.title`);
  const body = t(`${base}.body`);

  const bullets = Array.from({ length: MAX_BULLETS }, (_, i) => t(`${base}.bullet${i + 1}`)).filter(
    (line) => line && !line.startsWith(`${base}.bullet`)
  );

  const ctaRegister = t(`${namespace}.ctaRegister`);
  const ctaLogin = t(`${namespace}.ctaLogin`);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-explanation-panel-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <h2 id="guest-explanation-panel-title" className="text-lg font-bold text-gray-900 pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label={t('buttons.close') || 'Sluiten'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
          {bullets.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-700">
              {bullets.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-emerald-600 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link
              href={registerHref}
              onClick={onClose}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {ctaRegister}
            </Link>
            <Link
              href={loginHref}
              onClick={onClose}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              {ctaLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
