'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';

type Seed = {
  referralCode: string | null;
  referralLink: string | null;
};

const EMPTY_SEED: Seed = {
  referralCode: null,
  referralLink: null,
};

const AffiliatePersonalShareContext = createContext<Seed>(EMPTY_SEED);

/**
 * Existing personal code loaded with the dashboard.
 * A later render can add a code, but it cannot wipe one that was already set.
 */
export function AffiliatePersonalShareProvider({
  referralCode,
  referralLink,
  children,
}: Seed & { children: ReactNode }) {
  const latched = useRef<Seed>(EMPTY_SEED);
  if (referralCode) latched.current = { ...latched.current, referralCode };
  if (referralLink) latched.current = { ...latched.current, referralLink };
  const value: Seed = {
    referralCode: referralCode || latched.current.referralCode,
    referralLink: referralLink || latched.current.referralLink,
  };
  return (
    <AffiliatePersonalShareContext.Provider value={value}>
      {children}
    </AffiliatePersonalShareContext.Provider>
  );
}

export function useAffiliatePersonalShareSeed(): Seed {
  return useContext(AffiliatePersonalShareContext);
}
