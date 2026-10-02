'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

type Seed = {
  referralCode: string | null;
  referralLink: string | null;
};

const AffiliatePersonalShareContext = createContext<Seed>({
  referralCode: null,
  referralLink: null,
});

/**
 * Existing personal code loaded with the dashboard.
 * The card and the sidebar sheet read this before any client fetch.
 */
export function AffiliatePersonalShareProvider({
  referralCode,
  referralLink,
  children,
}: Seed & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      referralCode: referralCode || null,
      referralLink: referralLink || null,
    }),
    [referralCode, referralLink],
  );
  return (
    <AffiliatePersonalShareContext.Provider value={value}>
      {children}
    </AffiliatePersonalShareContext.Provider>
  );
}

export function useAffiliatePersonalShareSeed(): Seed {
  return useContext(AffiliatePersonalShareContext);
}
