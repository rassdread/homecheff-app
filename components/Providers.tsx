'use client';
import { Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import AppShellHtmlClasses from '@/components/layout/AppShellHtmlClasses';
import NativeAppUxFoundation from '@/components/native/NativeAppUxFoundation';
import NativeLifecycleDiagnostics from '@/components/native/NativeLifecycleDiagnostics';
import NativePushTokenSync from '@/components/native/NativePushTokenSync';
import NativePushPermissionOnboarding from '@/components/native/NativePushPermissionOnboarding';
import { useSessionIsolation } from '@/hooks/useSessionIsolation';
import SessionGuard from '@/components/SessionGuard';
import { CreateFlowProvider } from '@/components/create/CreateFlowContext';
import AndroidCreateFlowBackBridge from '@/components/native/AndroidCreateFlowBackBridge';
import { UserBootstrapProvider } from '@/components/user/UserBootstrapProvider';
import AppResumeCoordinator from '@/components/app/AppResumeCoordinator';
import AppUpdateGate from '@/components/app/AppUpdateGate';
import { AppUpdateStatusProvider } from '@/components/app/AppUpdateStatusProvider';
import { HcpRewardProvider } from '@/components/gamification/HcpRewardProvider';

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
      <AppShellHtmlClasses />
      <Suspense fallback={null}>
        <NativeAppUxFoundation />
      </Suspense>
      <AndroidCreateFlowBackBridge />
      <Suspense fallback={null}>
        <AppResumeCoordinator />
      </Suspense>
      <AppUpdateStatusProvider>
        <Suspense fallback={null}>
          <AppUpdateGate />
        </Suspense>
        <NativeLifecycleDiagnostics />
        <NativePushTokenSync />
        <Suspense fallback={null}>
          <NativePushPermissionOnboarding />
        </Suspense>
        <SessionGuard />
        <SessionIsolationWrapper>
          <UserBootstrapProvider>
            <HcpRewardProvider>
              <CreateFlowProvider>{children}</CreateFlowProvider>
            </HcpRewardProvider>
          </UserBootstrapProvider>
        </SessionIsolationWrapper>
      </AppUpdateStatusProvider>
    </SessionProvider>
  );
}
