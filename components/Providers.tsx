'use client';
import { Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import NativeAppRootClass from '@/components/native/NativeAppRootClass';
import NativeAppUxFoundation from '@/components/native/NativeAppUxFoundation';
import NativeLifecycleDiagnostics from '@/components/native/NativeLifecycleDiagnostics';
import NativePushTokenSync from '@/components/native/NativePushTokenSync';
import NativePushPermissionOnboarding from '@/components/native/NativePushPermissionOnboarding';
import { useSessionIsolation } from '@/hooks/useSessionIsolation';
import SessionGuard from '@/components/SessionGuard';
import { CreateFlowProvider } from '@/components/create/CreateFlowContext';
import { UserBootstrapProvider } from '@/components/user/UserBootstrapProvider';

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
      <NativeAppRootClass />
      <Suspense fallback={null}>
        <NativeAppUxFoundation />
      </Suspense>
      <NativeLifecycleDiagnostics />
      <NativePushTokenSync />
      <Suspense fallback={null}>
        <NativePushPermissionOnboarding />
      </Suspense>
      <SessionGuard />
      <SessionIsolationWrapper>
        <UserBootstrapProvider>
          <CreateFlowProvider>{children}</CreateFlowProvider>
        </UserBootstrapProvider>
      </SessionIsolationWrapper>
    </SessionProvider>
  );
}
