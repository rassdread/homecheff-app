'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  fetchOnboardingFlags,
  onboardingFlagsFromSessionUser,
  needsProfileOnboardingFromFlags,
} from '@/lib/auth/post-auth-redirect';

/**
 * Component that redirects social login users to registration if they need onboarding
 * This ensures users always complete the registration process, even if they navigate away
 * ONLY activates for social login users who haven't completed onboarding
 * 
 * PRIORITY: This component has LOWER priority than:
 * - /auth/social-success (OAuth terugkeer + sessie)
 * - register page (handles its own onboarding check)
 * 
 * This component ONLY acts as a safety net for users who navigate away from onboarding
 * 
 * Flow:
 * 1. User logs in with social (e.g. Google)
 * 2. /auth/social-success redirect naar /register?social=true indien nodig
 * 3. register page handles onboarding
 * 4. If user navigates away, this component redirects back to /register?social=true
 * 5. Only after onboarding is complete, user gets full access
 */
export default function SocialLoginRedirect() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const [isChecking, setIsChecking] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastCheckTime = useRef<number>(0);
  const MIN_CHECK_INTERVAL = 5000; // Minimum 5 seconds between checks to prevent rate limiting

  useEffect(() => {
    // Only check if session is loaded and user is authenticated
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    // CRITICAL: Don't redirect if already on these pages (they handle their own logic)
    // - /register: Handles onboarding form and its own redirects
    // - /auth/social-success: OAuth callback landing
    // - /login: User is logging in
    // - /api/*: API routes should not be redirected
    if (
      !pathname ||
      pathname === '/register' ||
      pathname === '/social-login-success' ||
      pathname === '/auth/social-success' ||
      pathname === '/login' ||
      pathname.startsWith('/api/')
    ) {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current || isChecking) {
      return;
    }

    // Rate limiting: Don't check too frequently
    const now = Date.now();
    if (now - lastCheckTime.current < MIN_CHECK_INTERVAL) {
      return;
    }
    lastCheckTime.current = now;

    // Add a small delay to prevent race conditions with other components
    // This ensures /auth/social-success and register page have priority
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(() => {
      const checkOnboarding = async () => {
        setIsChecking(true);
        
        try {
          let flags = await fetchOnboardingFlags();
          if (!flags) {
            await new Promise((r) => setTimeout(r, 400));
            flags = await fetchOnboardingFlags();
          }
          const resolved =
            flags ?? onboardingFlagsFromSessionUser(session.user as any);
          const needsOnboarding = needsProfileOnboardingFromFlags(resolved);

          console.log('🔍 [SocialLoginRedirect] Onboarding check:', {
            ...resolved,
            pathname,
          });

          if (needsOnboarding && pathname !== '/register' && !hasRedirected.current) {
            hasRedirected.current = true;
            console.log(
              '🔍 [SocialLoginRedirect] User needs onboarding, redirecting to /register?social=true',
            );
            window.location.href = '/register?social=true';
          }
        } catch (error) {
          console.error('❌ [SocialLoginRedirect] Error checking onboarding:', error);
          // Don't redirect on error - let other components handle it
        } finally {
          setIsChecking(false);
        }
      };

      checkOnboarding();
    }, 1000); // 1 second delay to let other components handle redirects first

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [session, status, pathname, isChecking]);

  return null; // This component doesn't render anything
}

