'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Periodieke check of de ingelogde gebruiker nog bestaat in de database.
 *
 * Gedrag (bewust voorzichtig — voorkomt onbedoelde "terug naar homepage" sprong
 * tijdens flows zoals quick-add → /sell/new):
 * - Wacht ~3 sec na mount voordat er voor het eerst gevalideerd wordt; zo krijgt
 *   de NextAuth-sessie de tijd om uit te lijnen na een `window.location.href`
 *   navigatie (bv. vanuit BottomNavigation.handleCategorySelect).
 * - Tolereer een enkele 404; pas na N opeenvolgende 404's signen we de gebruiker
 *   uit. Dit voorkomt dat een transient cache/race ons mid-flow onderbreekt.
 * - Bij signOut sturen we naar `/login?callbackUrl=<huidige URL>`, niet naar `/`,
 *   zodat de gebruiker na re-login terugkomt op de pagina waar hij was (bv. de
 *   product-aanmaakpagina), in plaats van stilletjes op de homepage te belanden.
 */
const FIRST_CHECK_DELAY_MS = 3000;
const POLL_INTERVAL_MS = 30_000;
const CONSECUTIVE_404_THRESHOLD = 3;

export function useUserValidation() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const consecutive404Ref = useRef(0);
  const signedOutRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      // Reset counters wanneer er geen geldige sessie is.
      consecutive404Ref.current = 0;
      return;
    }

    let cancelled = false;

    const validateUser = async () => {
      if (cancelled || signedOutRef.current) return;
      try {
        const response = await fetch('/api/profile/me', { cache: 'no-store' });

        if (response.status === 404) {
          consecutive404Ref.current += 1;
          if (consecutive404Ref.current < CONSECUTIVE_404_THRESHOLD) {
            // Tolereer transient 404 (race tussen sessie-cookie en DB lookup,
            // dev DB die niet exact overeenkomt met productie, etc.).
            return;
          }
          if (signedOutRef.current) return;
          signedOutRef.current = true;
          // Bewaar waar de gebruiker was zodat re-login niet op de homepage uitkomt.
          let callback = '/';
          if (typeof window !== 'undefined') {
            const here = window.location.pathname + window.location.search;
            // Vermijd loops: als we al op /login zitten, niet als callback hergebruiken.
            if (here && !here.startsWith('/login')) callback = here;
          }
          await signOut({
            callbackUrl: `/login?callbackUrl=${encodeURIComponent(callback)}`,
            redirect: true,
          });
          return;
        }

        if (response.ok) {
          consecutive404Ref.current = 0;
          return;
        }

        // 401/5xx etc.: geen signOut, laat lopen — gewone retry op interval.
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[useUserValidation] non-OK status', response.status);
        }
      } catch {
        // Network errors zijn meestal transient; nooit signen op netwerkfout.
      }
    };

    const initialTimer = setTimeout(validateUser, FIRST_CHECK_DELAY_MS);
    const interval = setInterval(validateUser, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [session?.user?.email, status, router]);
}
