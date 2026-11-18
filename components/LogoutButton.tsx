"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from '@/hooks/useTranslation';
import { performLogout } from '@/lib/session-cleanup';

export default function LogoutButton() {
  const { data: session } = useSession();
  const { t, tOr } = useTranslation();
  const [phase, setPhase] = useState<'idle' | 'working' | 'error'>('idle');
  if (!session) return null;
  const start = () => {
    if (phase === 'working') return;
    setPhase('working');
    void performLogout('/').then((result) => {
      if (result !== 'done') setPhase('error');
    });
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={phase === 'working'}
        aria-busy={phase === 'working'}
        className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition disabled:opacity-70"
        onClick={start}
        title={t('navigation.logout')}
      >
        {phase === 'working'
          ? tOr('navbar.loggingOut', 'Logging out…', 'Uitloggen…')
          : t('navigation.logout')}
      </button>
      {phase === 'error' ? (
        <span role="alert" className="text-xs text-red-700">
          {tOr(
            'navbar.logoutFailed',
            'Logging out did not finish. Try again.',
            'Uitloggen is niet gelukt. Probeer het opnieuw.',
          )}
        </span>
      ) : null}
    </span>
  );
}
