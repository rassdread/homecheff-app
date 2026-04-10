'use client';
import { SessionProvider } from 'next-auth/react';
import { useSessionIsolation } from '@/hooks/useSessionIsolation';
import SessionGuard from '@/components/SessionGuard';
import { CreateFlowProvider } from '@/components/create/CreateFlowContext';

function SessionIsolationWrapper({ children }: { children: React.ReactNode }) {
  // This hook ensures session isolation
  useSessionIsolation();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refresh session every 5 minutes while tab is active
      refetchInterval={5 * 60}
      // Uit: refetch bij tab-focus kan op Safari falen (CORS/cookie) en dan status 'unauthenticated' geven – blijf ingelogd.
      refetchOnWindowFocus={false}
    >
      <SessionGuard />
      <SessionIsolationWrapper>
        <CreateFlowProvider>{children}</CreateFlowProvider>
      </SessionIsolationWrapper>
    </SessionProvider>
  );
}
