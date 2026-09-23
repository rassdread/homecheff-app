'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { careersPath } from '@/lib/navigation/public-careers-nav';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Same create path as the hero primary CTA (guest auth gate or create flow). */
  onStartOffering: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function HomeValueExplainerDialog({
  open,
  onClose,
  onStartOffering,
  returnFocusRef,
}: Props) {
  const { t, language } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !mounted) return;
    const returnTarget = returnFocusRef?.current ?? null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      returnTarget?.focus();
    };
  }, [open, mounted, onClose, returnFocusRef]);

  if (!open || !mounted) return null;

  const offerHref = careersPath('hub', language === 'en' ? 'en' : 'nl');

  return createPortal(
    <div
      data-hc-value-explainer=""
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hc-value-explainer-title"
        aria-describedby="hc-value-explainer-body"
        className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-gray-200/80 bg-[#faf8f4] px-5 pb-6 pt-6 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:px-7 sm:pb-7 sm:pt-7"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-brand"
          aria-label={t('buttons.close') || 'Sluiten'}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <h2
          id="hc-value-explainer-title"
          className="pr-10 text-xl font-bold leading-tight tracking-tight text-gray-900 sm:text-2xl"
        >
          {t('homeValueExplainer.title')}
        </h2>

        <div
          id="hc-value-explainer-body"
          className="mt-4 space-y-3 text-[15px] leading-relaxed text-gray-700"
        >
          <p>{t('homeValueExplainer.paragraph1')}</p>
          <p>{t('homeValueExplainer.paragraph2')}</p>
          <p>{t('homeValueExplainer.paragraph3')}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            data-hc-value-explainer-start=""
            onClick={() => {
              onClose();
              onStartOffering();
            }}
            className="hc-btn-primary min-h-[48px] w-full rounded-2xl text-base"
          >
            {t('homeValueExplainer.ctaStart')}
          </button>
          <Link
            href={offerHref}
            prefetch={false}
            data-hc-value-explainer-explore=""
            onClick={onClose}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border text-center border-gray-300 bg-white px-4 text-base font-semibold text-gray-800 transition-colors hover:border-primary-brand hover:text-primary-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-brand"
          >
            {t('homeValueExplainer.ctaExplore')}
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
