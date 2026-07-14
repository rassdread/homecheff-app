/**
 * Phase 3F.5 — Anonymous session fast-path helpers.
 *
 * Homepage SSR may confirm absence of a session via getServerSession.
 * When confirmed anonymous, GeoFeed may start the public feed fetch without
 * waiting for client-side SessionProvider resolution.
 */

export type SsrAuthHint = 'authenticated' | 'anonymous' | undefined;

export type SessionFastPathObservability = {
  anonFastPathUsed: boolean;
  sessionGateBypassed: boolean;
  sessionResolvedBeforeFetch: boolean;
  feedFetchReason: 'initial' | 'refresh' | 'filter' | 'session-upgrade' | null;
};

let lastObservability: SessionFastPathObservability = {
  anonFastPathUsed: false,
  sessionGateBypassed: false,
  sessionResolvedBeforeFetch: false,
  feedFetchReason: null,
};

/** True when client session is still loading but SSR confirmed no session. */
export function shouldBypassSessionLoadingGate(
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated',
  ssrAuthHint: SsrAuthHint,
): boolean {
  return sessionStatus === 'loading' && ssrAuthHint === 'anonymous';
}

export function isAwaitingSessionResolution(
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated',
  ssrAuthHint: SsrAuthHint,
): boolean {
  return sessionStatus === 'loading' && ssrAuthHint !== 'anonymous';
}

export function recordSessionFastPathObservability(
  patch: Partial<SessionFastPathObservability>,
): void {
  lastObservability = { ...lastObservability, ...patch };
}

export function getSessionFastPathObservability(): SessionFastPathObservability {
  return { ...lastObservability };
}
