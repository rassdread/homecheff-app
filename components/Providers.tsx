'use client';
import { SessionProvider } from 'next-auth/react';
import { useSessionIsolation } from '@/hooks/useSessionIsolation';
import SessionGuard from '@/components/SessionGuard';

function SessionIsolationWrapper({ children }: { children: React.ReactNode }) {
  // This hook ensures session isolation
  useSessionIsolation();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      // Refresh session every 5 minutes to keep it fresh (especially important for iOS Safari)
      refetchInterval={5 * 60}
      // Also refetch when window gets focus (user comes back to tab)
      refetchOnWindowFocus={true}
    >
      <SessionGuard />
      <SessionIsolationWrapper>
        {children}
      </SessionIsolationWrapper>
    </SessionProvider>
  );
}
