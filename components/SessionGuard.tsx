'use client';

/**
 * Detects Marketplace session identity changes across tabs (shared NextAuth cookie).
 * On logout or userId change: clear identity-bound client state, banner, hard reload.
 */

import { useEffect, useRef, useState } from 'react';
import { getSession, useSession } from 'next-auth/react';
import {
  clearSensitiveUserDataOnLogout,
} from '@/lib/session-cleanup';
import { clearPx4aItemFormDraft } from '@/lib/studio/px4a-item-form-draft';
import {
  BROWSER_LOGOUT_STORAGE_KEY,
  MARKETPLACE_AUTH_CHANNEL,
  consumeSameTabCredentialNavigation,
  readBrowserLogoutAt,
  rememberMarketplaceAuthUserId,
  type MarketplaceAuthChannelMessage,
} from '@/lib/auth/session-identity-channel';

/**
 * null: the session endpoint answered and there is no user.
 * undefined: the request failed or disagreed with getSession. Do not wipe.
 */
async function readConfirmedSessionUserId(pageOpenedAt: number): Promise<string | null | undefined> {
  if (readBrowserLogoutAt() >= pageOpenedAt) return null;
  const startedAt = Date.now();
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (readBrowserLogoutAt() >= startedAt) return null;
    if (!response.ok) return undefined;
    const body = await response.json();
    const bodyId =
      typeof body?.user?.id === 'string' && body.user.id.trim() ? body.user.id.trim() : null;
    const live = await getSession();
    if (readBrowserLogoutAt() >= startedAt) return null;
    const liveId =
      typeof live?.user?.id === 'string' && live.user.id.trim() ? live.user.id.trim() : null;
    if (bodyId !== liveId) return undefined;
    return bodyId;
  } catch {
    if (readBrowserLogoutAt() >= pageOpenedAt) return null;
    return undefined;
  }
}

function clearIdentityBoundClientResidue(): void {
  try {
    clearSensitiveUserDataOnLogout();
  } catch {
    /* ignore */
  }
  try {
    clearPx4aItemFormDraft();
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem('hc_swr_cache_v1');
    localStorage.removeItem('hc:user');
  } catch {
    /* ignore */
  }
}

export default function SessionGuard() {
  const { data: session, status } = useSession();
  const knownUserIdRef = useRef<string | null>(null);
  const baselineSetRef = useRef(false);
  const pageOpenedAtRef = useRef(
    typeof performance !== 'undefined' && performance.timeOrigin
      ? performance.timeOrigin
      : Date.now(),
  );
  const reloadingRef = useRef(false);
  const [banner, setBanner] = useState<string | null>(null);

  const leaveStaleDocument = () => {
    if (readBrowserLogoutAt() < pageOpenedAtRef.current) return;
    if (reloadingRef.current) return;
    reloadingRef.current = true;
    clearIdentityBoundClientResidue();
    const path = window.location.pathname;
    const protectedPath =
      path.startsWith('/profile') ||
      path.startsWith('/settings') ||
      path.startsWith('/mijn-homecheff') ||
      path.startsWith('/admin');
    if (protectedPath && !path.startsWith('/login')) {
      const next = `/login?callbackUrl=${encodeURIComponent(path + window.location.search)}`;
      window.location.assign(next);
      return;
    }
    window.location.reload();
  };

  const applyIdentityChange = (nextUserId: string | null, reason: string) => {
    if (reloadingRef.current) return;
    const forcedLogout =
      nextUserId == null &&
      (reason === 'broadcast_logout' || reason === 'storage_logout');
    if (!baselineSetRef.current && !forcedLogout) {
      knownUserIdRef.current = nextUserId;
      baselineSetRef.current = true;
      rememberMarketplaceAuthUserId(nextUserId);
      return;
    }
    const prev = knownUserIdRef.current;
    if (prev === nextUserId && !(forcedLogout && !baselineSetRef.current)) return;

    // Guest → user on a page that will navigate itself (delivery registration).
    // A reload here aborts window.location.assign and returns the courier to the wizard.
    if (prev == null && nextUserId && consumeSameTabCredentialNavigation()) {
      knownUserIdRef.current = nextUserId;
      rememberMarketplaceAuthUserId(nextUserId);
      return;
    }

    reloadingRef.current = true;
    knownUserIdRef.current = nextUserId;
    rememberMarketplaceAuthUserId(nextUserId);
    clearIdentityBoundClientResidue();
    setBanner(
      nextUserId == null
        ? 'Je bent uitgelogd. Je gegevens worden gewist…'
        : 'Sessie gewijzigd. Je gegevens worden opnieuw geladen…',
    );
    console.info('[homecheff-marketplace-auth] identity_changed', {
      reason,
      prev,
      next: nextUserId,
    });
    window.setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  useEffect(() => {
    leaveStaleDocument();
  }, []);

  // useSession path (same tab + NextAuth client cache updates)
  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    if (status === 'unauthenticated') {
        void readConfirmedSessionUserId(pageOpenedAtRef.current).then((userId) => {
        if (cancelled || userId === undefined) return;
        applyIdentityChange(userId, 'useSession_confirmed');
      });
      return () => {
        cancelled = true;
      };
    }
    const id = typeof session?.user?.id === 'string' ? session.user.id : null;
    if (id) applyIdentityChange(id, 'useSession');
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  // Cross-tab + BFCache: independently re-fetch server session
  useEffect(() => {
    const sync = async (reason: string) => {
      const userId = await readConfirmedSessionUserId(pageOpenedAtRef.current);
      if (userId === undefined) return;
      applyIdentityChange(userId, reason);
    };

    const onVis = () => {
      if (document.visibilityState === 'visible') void sync('visibility');
    };
    const onFocus = () => void sync('focus');
    const onPageShow = (ev: PageTransitionEvent) => {
      if (ev.persisted) void sync('bfcache');
    };
    const onOnline = () => {
      reloadingRef.current = false;
      leaveStaleDocument();
    };
    const watchLogout = window.setInterval(() => {
      if (readBrowserLogoutAt() < pageOpenedAtRef.current) return;
      reloadingRef.current = false;
      leaveStaleDocument();
    }, 1000);

    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== BROWSER_LOGOUT_STORAGE_KEY || !ev.newValue) return;
      leaveStaleDocument();
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('storage', onStorage);
    window.addEventListener('online', onOnline);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(MARKETPLACE_AUTH_CHANNEL);
      bc.onmessage = (ev: MessageEvent<MarketplaceAuthChannelMessage>) => {
        const msg = ev.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'logout') {
          leaveStaleDocument();
          return;
        }
        if (msg.type === 'login' || msg.type === 'identity') {
          void sync(`broadcast_${msg.type}`);
        }
      };
    } catch {
      bc = null;
    }

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('online', onOnline);
      window.clearInterval(watchLogout);
      bc?.close();
    };
  }, []);

  if (!banner) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-950"
    >
      {banner}
    </div>
  );
}
