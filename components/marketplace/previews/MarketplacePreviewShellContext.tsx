'use client';

import { createContext, useContext } from 'react';

export type MarketplacePreviewShellContextValue = {
  open: boolean;
  togglePreview: () => void;
  listingId: string;
};

const MarketplacePreviewShellContext =
  createContext<MarketplacePreviewShellContextValue | null>(null);

export function MarketplacePreviewShellProvider({
  value,
  children,
}: {
  value: MarketplacePreviewShellContextValue;
  children: React.ReactNode;
}) {
  return (
    <MarketplacePreviewShellContext.Provider value={value}>
      {children}
    </MarketplacePreviewShellContext.Provider>
  );
}

export function useMarketplacePreviewShell(): MarketplacePreviewShellContextValue | null {
  return useContext(MarketplacePreviewShellContext);
}
