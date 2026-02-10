'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

/**
 * Component that redirects social login users to registration if they need onboarding
 * This ensures users always complete the registration process, even if they navigate away
 * ONLY activates for social login users who haven't completed onboarding
 * 
 * PRIORITY: This component has LOWER priority than:
 * - social-login-success page (handles initial redirect after social login)
 * - register page (handles its own onboarding check)
 * 
 * This component ONLY acts as a safety net for users who navigate away from onboarding
 * 
 * Flow:
 * 1. User logs in with social (Google/Facebook)
 * 2. social-login-success page redirects to /register?social=true
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
    // - /social-login-success: Handles initial redirect after social login
    // - /login: User is logging in
    // - /api/*: API routes should not be redirected
    if (
      !pathname ||
      pathname === '/register' ||
      pathname === '/social-login-success' ||
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
    // This ensures social-login-success and register page have priority
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(() => {
      const checkOnboarding = async () => {
        setIsChecking(true);
        
        try {
          // Check database directly via API for reliable onboarding status
          const response = await fetch('/api/auth/check-onboarding');
          if (response.ok) {
            const data = await response.json();
            const hasTempUsername = data.hasTempUsername || false;
            const onboardingCompleted = data.onboardingCompleted || false;
            
            console.log('🔍 [SocialLoginRedirect] Onboarding check:', {
              hasTempUsername,
              onboardingCompleted,
              pathname
            });

            // Only redirect if:
            // 1. User has temp username (new social login user), OR
            // 2. Social onboarding is not completed
            // This ensures we only redirect social login users who need onboarding
            const needsOnboarding = hasTempUsername || !onboardingCompleted;

            // Double check we're not on register page (race condition protection)
            if (needsOnboarding && pathname !== '/register' && !hasRedirected.current) {
              hasRedirected.current = true;
              console.log('🔍 [SocialLoginRedirect] User needs onboarding, redirecting to /register?social=true');
              window.location.href = '/register?social=true';
            }
          } else {
            // Fallback to session data if API fails
            const username = (session.user as any)?.username;
            const hasTempUsername = username?.startsWith('temp_');
            const socialOnboardingCompleted = (session.user as any)?.socialOnboardingCompleted;
            const needsOnboarding = hasTempUsername || !socialOnboardingCompleted;

            if (needsOnboarding && pathname !== '/register' && !hasRedirected.current) {
              hasRedirected.current = true;
              console.log('🔍 [SocialLoginRedirect] User needs onboarding (fallback), redirecting to /register?social=true');
              window.location.href = '/register?social=true';
            }
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

