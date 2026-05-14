'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

import type { AccountRequirementsSnapshot } from '@/lib/account-requirements';

type ProfileUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  profileImage?: string | null;
  sellerRoles?: string[];
  affiliate?: { parentAffiliateId?: string | null } | null;
  lat?: number | null;
  lng?: number | null;
  place?: string | null;
  postalCode?: string | null;
  address?: string | null;
  emailVerified?: boolean;
  accountRequirements?: AccountRequirementsSnapshot;
};

type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error';

type UserBootstrapContextValue = {
  profile: ProfileUser | null;
  status: BootstrapStatus;
  ensureProfile: () => Promise<ProfileUser | null>;
  refreshProfile: () => Promise<ProfileUser | null>;
};

import AccountFinalizeBanner from '@/components/account/AccountFinalizeBanner';

const UserBootstrapContext = createContext<UserBootstrapContextValue | null>(null);

const PROFILE_TTL_MS = 60_000;

export function UserBootstrapProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [status, setStatus] = useState<BootstrapStatus>('idle');
  const cacheRef = useRef<{ at: number; data: ProfileUser | null } | null>(null);
  const inFlightRef = useRef<Promise<ProfileUser | null> | null>(null);

  const isLoggedIn = !!session?.user?.email;

  const loadProfile = useCallback(
    async (force = false): Promise<ProfileUser | null> => {
      if (!isLoggedIn) return null;

      const now = Date.now();
      const cached = cacheRef.current;
      if (!force && cached && now - cached.at < PROFILE_TTL_MS) {
        return cached.data;
      }

      if (inFlightRef.current) return inFlightRef.current;

      setStatus((prev) => (prev === 'ready' && !force ? prev : 'loading'));
      const p = (async () => {
        try {
          const res = await fetch('/api/profile/me', { cache: 'no-store' });
          if (!res.ok) throw new Error(`profile status ${res.status}`);
          const data = await res.json();
          const user = (data?.user ?? null) as ProfileUser | null;
          cacheRef.current = { at: Date.now(), data: user };
          setProfile(user);
          setStatus('ready');
          return user;
        } catch {
          setStatus('error');
          return null;
        } finally {
          inFlightRef.current = null;
        }
      })();
      inFlightRef.current = p;
      return p;
    },
    [isLoggedIn]
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setProfile(null);
      setStatus(sessionStatus === 'loading' ? 'loading' : 'idle');
      cacheRef.current = null;
      inFlightRef.current = null;
      return;
    }

    // Laad vroeg en gedeeld zodra sessie bekend is.
    let idleId: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const run = () => {
      void loadProfile(false);
    };
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(run, { timeout: 2500 });
    } else {
      timer = setTimeout(run, 400);
    }

    return () => {
      if (idleId !== null && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleId);
      }
      if (timer) clearTimeout(timer);
    };
  }, [isLoggedIn, sessionStatus, loadProfile]);

  const value = useMemo<UserBootstrapContextValue>(
    () => ({
      profile,
      status,
      ensureProfile: () => loadProfile(false),
      refreshProfile: () => loadProfile(true),
    }),
    [profile, status, loadProfile]
  );

  return (
    <UserBootstrapContext.Provider value={value}>
      <AccountFinalizeBanner />
      {children}
    </UserBootstrapContext.Provider>
  );
}

export function useUserBootstrap() {
  const ctx = useContext(UserBootstrapContext);
  if (!ctx) {
    throw new Error('useUserBootstrap must be used within UserBootstrapProvider');
  }
  return ctx;
}

