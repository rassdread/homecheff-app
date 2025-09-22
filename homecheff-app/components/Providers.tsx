'use client';
import { SessionProvider } from 'next-auth/react';
import { useSessionIsolation } from '@/hooks/useSessionIsolation';

function SessionIsolationWrapper({ children }: { children: React.ReactNode }) {
  // This hook ensures session isolation
  useSessionIsolation();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionIsolationWrapper>
        {children}
      </SessionIsolationWrapper>
    </SessionProvider>
  );
}
