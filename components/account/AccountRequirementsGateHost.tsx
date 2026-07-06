'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import {
  ACCOUNT_REQUIREMENTS_OPEN_EVENT,
  type OpenAccountRequirementsGateDetail,
} from '@/lib/onboarding/open-account-requirements-gate';
import {
  HC_EMAIL_VERIFICATION_REQUIRED_EVENT,
} from '@/lib/onboarding/email-verification-prompt-events';

export default function AccountRequirementsGateHost() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const nativeMounted = useIsNativeAppMounted();
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState<OpenAccountRequirementsGateDetail['missing']>([]);
  const [hintKey, setHintKey] = useState<string | null>(null);

  const onOpen = useCallback((e: Event) => {
    const ce = e as CustomEvent<OpenAccountRequirementsGateDetail>;
    const next = ce.detail?.missing;
    setMissing(Array.isArray(next) ? next : []);
    setHintKey(typeof ce.detail?.hintKey === 'string' ? ce.detail.hintKey : null);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(ACCOUNT_REQUIREMENTS_OPEN_EVENT, onOpen as EventListener);
    return () =>
      window.removeEventListener(ACCOUNT_REQUIREMENTS_OPEN_EVENT, onOpen as EventListener);
  }, [onOpen]);

  if (!open) return null;

  const showUsernameHint = missing.some((m) => m.key === 'username');

  return (
    <div
      className="fixed inset-0 z-[245] flex flex-col justify-end lg:items-center lg:justify-center lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-req-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
        aria-label={t('accountRequirementsGate.close')}
        onClick={() => setOpen(false)}
      />
      <div
        className={`relative z-[1] w-full max-w-md rounded-t-3xl border border-white/20 bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 lg:rounded-3xl max-lg:pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-6 ${nativeMounted ? 'max-h-[88dvh] overflow-y-auto' : ''}`}
      >
        <div className="sticky top-0 z-[2] flex justify-center pt-2 lg:hidden">
          <span className="h-1.5 w-10 rounded-full bg-slate-200" aria-hidden />
        </div>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pt-3 pb-3">
          <h2 id="account-req-title" className="text-lg font-bold text-slate-900 pr-2">
            {t('accountRequirementsGate.title')}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-full p-2 text-slate-600 hover:bg-slate-100"
            aria-label={t('accountRequirementsGate.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-5 pt-4 text-sm leading-relaxed text-slate-600">
          {t('accountRequirementsGate.body')}
        </p>
        {hintKey ? (
          <p className="px-5 pt-3 text-sm leading-relaxed text-slate-700 border-b border-slate-100 pb-3">
            {t(`accountRequirementsHints.${hintKey}` as never)}
          </p>
        ) : null}
        {showUsernameHint ? (
          <p className="px-5 pt-2 text-sm font-medium text-amber-800 bg-amber-50 border-y border-amber-100">
            {t('accountRequirementsGate.subtitleUsername')}
          </p>
        ) : null}
        <ul className="px-5 py-4 space-y-3">
          {missing.map((item) => (
            <li
              key={item.key}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3"
            >
              <span className="text-sm font-semibold text-slate-900">{item.label}</span>
              {item.key === 'emailVerified' && session?.user?.email ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(
                      new CustomEvent(HC_EMAIL_VERIFICATION_REQUIRED_EVENT, {
                        detail: {
                          email: String(session.user.email),
                          reason: 'generic',
                        },
                      }),
                    );
                  }}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
                >
                  {t('emailVerification.verifyNow')}
                </button>
              ) : (
                <Link
                  href={item.actionHref}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
                >
                  {t('accountRequirementsGate.cta')}
                </Link>
              )}
              {item.key === 'emailVerified' ? (
                <Link
                  href="/verify-email"
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-slate-500 underline hover:text-slate-700"
                >
                  {t('emailVerification.openVerifyPage')}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full min-h-[48px] rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-base font-semibold text-slate-800 hover:bg-slate-50"
          >
            {t('accountRequirementsGate.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
