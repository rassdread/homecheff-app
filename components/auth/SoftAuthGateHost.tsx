'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import {
  SOFT_AUTH_OPEN_EVENT,
  type SoftAuthCopyKey,
} from '@/lib/onboarding/open-soft-auth-gate';
import { rememberScrollForSoftGate } from '@/lib/onboarding/soft-gate-scroll';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

export default function SoftAuthGateHost() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nativeMounted = useIsNativeAppMounted();
  const [open, setOpen] = useState(false);
  const [copyKey, setCopyKey] = useState<SoftAuthCopyKey>('generic');

  const currentUrl = `${pathname || '/'}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
  const registerHref = `/register?returnUrl=${encodeURIComponent(currentUrl)}`;

  const onOpen = useCallback((e: Event) => {
    const ce = e as CustomEvent<{ copyKey?: SoftAuthCopyKey }>;
    const key = ce.detail?.copyKey;
    setCopyKey(key && typeof key === 'string' ? (key as SoftAuthCopyKey) : 'generic');
    setOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(SOFT_AUTH_OPEN_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(SOFT_AUTH_OPEN_EVENT, onOpen as EventListener);
  }, [onOpen]);

  const title = t(`softGate.${copyKey}.title`);
  const body = t(`softGate.${copyKey}.body`);
  const ctaLogin = t(`softGate.${copyKey}.ctaLogin`);
  const ctaRegister = t(`softGate.${copyKey}.ctaRegister`);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[240] flex flex-col justify-end lg:items-center lg:justify-center lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="soft-auth-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
        aria-label={t('buttons.close')}
        onClick={() => {
          trackOnboardingEvent('SOFT_GATE_DISMISSED', { copyKey });
          setOpen(false);
        }}
      />
      <div
        className={`relative z-[1] w-full max-w-md rounded-t-3xl border border-white/20 bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 lg:rounded-3xl max-lg:pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-6 ${nativeMounted ? 'max-h-[88dvh] overflow-y-auto' : ''}`}
      >
        <div className="sticky top-0 z-[2] flex justify-center pt-2 lg:hidden">
          <span className="h-1.5 w-10 rounded-full bg-slate-200" aria-hidden />
        </div>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pt-3 pb-3">
          <h2 id="soft-auth-title" className="text-lg font-bold text-slate-900 pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => {
              trackOnboardingEvent('SOFT_GATE_DISMISSED', { copyKey });
              setOpen(false);
            }}
            className="shrink-0 rounded-full p-2 text-slate-600 hover:bg-slate-100"
            aria-label={t('buttons.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-5 py-4 text-sm leading-relaxed text-slate-600">{body}</p>
        <div className="flex flex-col gap-2.5 px-5 pb-5">
          <Link
            href={registerHref}
            onClick={() => {
              rememberScrollForSoftGate();
              trackOnboardingEvent('SOFT_GATE_CTA_REGISTER', { copyKey });
              setOpen(false);
            }}
            className="flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-center text-base font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700"
          >
            {ctaRegister}
          </Link>
          <Link
            href={loginHref}
            onClick={() => {
              rememberScrollForSoftGate();
              trackOnboardingEvent('SOFT_GATE_CTA_LOGIN', { copyKey });
              setOpen(false);
            }}
            className="flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-base font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {ctaLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
