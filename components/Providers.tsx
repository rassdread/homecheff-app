'use client';
import { Suspense } from 'react';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import AppShellHtmlClasses from '@/components/layout/AppShellHtmlClasses';
import NativeAppUxFoundation from '@/components/native/NativeAppUxFoundation';
import NativeLifecycleDiagnostics from '@/components/native/NativeLifecycleDiagnostics';
import NativePushTokenSync from '@/components/native/NativePushTokenSync';
import NativePushPermissionOnboarding from '@/components/native/NativePushPermissionOnboarding';
import NativePushUpdatePrompt from '@/components/native/NativePushUpdatePrompt';
import { useSessionIsolation } from '@/hooks/useSessionIsolation';
import SessionGuard from '@/components/SessionGuard';
import AuthCompletionGate from '@/components/auth/AuthCompletionGate';
import dynamic from 'next/dynamic';
import AccountRequirementsGateHost from '@/components/account/AccountRequirementsGateHost';
import EmailVerificationPromptHost from '@/components/auth/EmailVerificationPromptHost';
import ScrollRestoreFromSoftGate from '@/components/auth/ScrollRestoreFromSoftGate';
import RouteTransitionHost from '@/components/layout/RouteTransitionHost';
import { CreateFlowProvider } from '@/components/create/CreateFlowContext';
import AndroidCreateFlowBackBridge from '@/components/native/AndroidCreateFlowBackBridge';
import { UserBootstrapProvider } from '@/components/user/UserBootstrapProvider';
import AppResumeCoordinator from '@/components/app/AppResumeCoordinator';
import AppUpdateGate from '@/components/app/AppUpdateGate';
import PlayStoreMigrationGate from '@/components/app/PlayStoreMigrationGate';
import { AppUpdateStatusProvider } from '@/components/app/AppUpdateStatusProvider';
import { HcpRewardProvider } from '@/components/gamification/HcpRewardProvider';
import { CommsUnreadProvider } from '@/components/communication/CommsUnreadProvider';
import NavigationHistorySync from '@/components/navigation/NavigationHistorySync';
import FeedPerfBaselineMount from '@/components/performance/FeedPerfBaselineMount';
import { WorkspaceChromeProvider } from '@/components/adaptive-workspace/WorkspaceChromeProvider';

const SoftAuthGateHost = dynamic(
  () => import('@/components/auth/SoftAuthGateHost'),
  { ssr: false },
);

const CommsRealtimeListener = dynamic(
  () => import('@/components/communication/CommsRealtimeListener'),
  { ssr: false },
);

const WebPushRegistration = dynamic(
  () => import('@/components/notifications/WebPushRegistration'),
  { ssr: false },
);

function SessionIsolationWrapper({ children }: { children: React.ReactNode }) {
  useSessionIsolation();
  return <>{children}</>;
}

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  /** Seed from RSC so post-OAuth / hard navigations skip a false logged-out flash. */
  session?: Session | null;
}) {
  return (
    <SessionProvider
      session={session ?? undefined}
      refetchInterval={5 * 60}
      refetchOnWindowFocus={false}
    >
      <FeedPerfBaselineMount />
      <AppShellHtmlClasses />
      <Suspense fallback={null}>
        <NavigationHistorySync />
      </Suspense>
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
        <Suspense fallback={null}>
          <PlayStoreMigrationGate />
        </Suspense>
        <NativeLifecycleDiagnostics />
        <NativePushTokenSync />
        <Suspense fallback={null}>
          <NativePushPermissionOnboarding />
        </Suspense>
        <Suspense fallback={null}>
          <NativePushUpdatePrompt />
        </Suspense>
        <SessionGuard />
        <Suspense fallback={null}>
          <AuthCompletionGate />
        </Suspense>
        <Suspense fallback={null}>
          <SoftAuthGateHost />
        </Suspense>
        <Suspense fallback={null}>
          <AccountRequirementsGateHost />
        </Suspense>
        <Suspense fallback={null}>
          <EmailVerificationPromptHost />
        </Suspense>
        <Suspense fallback={null}>
          <ScrollRestoreFromSoftGate />
        </Suspense>
        <Suspense fallback={null}>
          <RouteTransitionHost />
        </Suspense>
        <SessionIsolationWrapper>
          <UserBootstrapProvider>
            <CommsUnreadProvider>
              <CommsRealtimeListener />
              <WebPushRegistration />
              <HcpRewardProvider>
                <CreateFlowProvider>
                  <WorkspaceChromeProvider>{children}</WorkspaceChromeProvider>
                </CreateFlowProvider>
              </HcpRewardProvider>
            </CommsUnreadProvider>
          </UserBootstrapProvider>
        </SessionIsolationWrapper>
      </AppUpdateStatusProvider>
    </SessionProvider>
  );
}
