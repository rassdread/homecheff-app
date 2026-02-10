'use client';

import { useEffect, useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { isIOS, isSafariIOS } from '@/lib/browser-utils';

export default function SocialLoginSuccessPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      // Prevent multiple redirects
      if (hasRedirected) {
        return;
      }

      // Wait for session to be loaded - give it more time
      if (status === 'loading') {
        return;
      }

      // iOS Safari needs significantly more time for cookies to be set
      // Wait longer on iOS Safari before checking session
      const isIOSDevice = isIOS();
      const isSafariOnIOS = isSafariIOS();
      const initialDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 800;
      
      console.log('🔍 [SOCIAL-LOGIN-SUCCESS] Device detection:', {
        isIOS: isIOSDevice,
        isSafariOnIOS: isSafariOnIOS,
        initialDelay
      });

      // Initial wait for cookies to be set (especially important for iOS Safari)
      await new Promise(resolve => setTimeout(resolve, initialDelay));

      // Force session update FIRST to ensure we have the latest data
      // This is critical for social login as the session might not be fully loaded yet
      try {
        await updateSession();
        // Wait longer for session to update (iOS Safari needs more time)
        const updateDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000;
        await new Promise(resolve => setTimeout(resolve, updateDelay));
        
        // Re-fetch session after update
        const refreshedSession = await getSession();
        console.log('🔍 [SOCIAL-LOGIN-SUCCESS] Session after update:', {
          hasSession: !!refreshedSession,
          hasEmail: !!refreshedSession?.user?.email,
          email: refreshedSession?.user?.email
        });
      } catch (error) {
        console.error('❌ [SOCIAL-LOGIN-SUCCESS] Error updating session:', error);
      }

      // Re-check session status after update
      let currentSession = await getSession();
      
      // iOS Safari: Retry multiple times with longer delays
      const maxRetries = isSafariOnIOS ? 3 : isIOSDevice ? 2 : 1;
      const retryDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000;
      
      for (let attempt = 0; attempt < maxRetries && !currentSession?.user?.email; attempt++) {
        console.log(`🔍 [SOCIAL-LOGIN-SUCCESS] No session after update, retry attempt ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        currentSession = await getSession();
        
        if (currentSession?.user?.email) {
          console.log('✅ [SOCIAL-LOGIN-SUCCESS] Session found after retry!');
          break;
        }
      }
      
      // If still no session after all retries, try one more time with API call
      if (!currentSession?.user?.email) {
        console.log('🔍 [SOCIAL-LOGIN-SUCCESS] Trying API session check as last resort...');
        try {
          const apiResponse = await fetch('/api/auth/session');
          if (apiResponse.ok) {
            const apiSession = await apiResponse.json();
            if (apiSession?.user?.email) {
              console.log('✅ [SOCIAL-LOGIN-SUCCESS] Session found via API!');
              currentSession = apiSession;
            }
          }
        } catch (apiError) {
          console.error('❌ [SOCIAL-LOGIN-SUCCESS] API session check failed:', apiError);
        }
      }
      
      // Final check - if still no session, redirect to login
      if (!currentSession?.user?.email) {
        console.log('❌ [SOCIAL-LOGIN-SUCCESS] No session found after all retries, redirecting to login');
        setHasRedirected(true);
        setIsChecking(false);
        // Use window.location for iOS Safari compatibility
        window.location.href = '/login?error=session_failed';
        return;
      }

      // Use the refreshed session
      const finalSession = currentSession || await getSession();
      
      // Final check if we have a session with email
      if (!finalSession?.user?.email) {
        console.log('🔍 [SOCIAL-LOGIN-SUCCESS] No session email found, redirecting to login');
        setHasRedirected(true);
        setIsChecking(false);
        // Use window.location for iOS Safari compatibility
        window.location.href = '/login?error=session_failed';
        return;
      }

      // Check database directly via API to get the latest onboarding status
      // This is more reliable than relying on session data which might be stale
      let hasTempUsername = false;
      let onboardingCompleted = false;
      let username = '';

      try {
        const response = await fetch('/api/auth/check-onboarding');
        if (response.ok) {
          const data = await response.json();
          hasTempUsername = data.hasTempUsername || false;
          onboardingCompleted = data.onboardingCompleted || false;
          username = data.username || '';
          
          console.log('🔍 [SOCIAL-LOGIN-SUCCESS] Database check result:', {
            username,
            hasTempUsername,
            onboardingCompleted
          });
        } else {
          console.error('❌ [SOCIAL-LOGIN-SUCCESS] Failed to check onboarding status from API');
          // Fallback to session data - use finalSession
          username = (finalSession?.user as any)?.username || '';
          hasTempUsername = username?.startsWith('temp_') || false;
          onboardingCompleted = (finalSession?.user as any)?.socialOnboardingCompleted || false;
        }
      } catch (error) {
        console.error('❌ [SOCIAL-LOGIN-SUCCESS] Error checking onboarding from API:', error);
        // Fallback to session data - use finalSession
        username = (finalSession?.user as any)?.username || '';
        hasTempUsername = username?.startsWith('temp_') || false;
        onboardingCompleted = (finalSession?.user as any)?.socialOnboardingCompleted || false;
      }

      console.log('🔍 [SOCIAL-LOGIN-SUCCESS] Final onboarding check:', {
        username,
        hasTempUsername,
        onboardingCompleted,
        email: finalSession?.user?.email || session?.user?.email
      });

      // Only redirect to home if:
      // 1. User has a real username (not temp)
      // 2. Onboarding is completed
      if (!hasTempUsername && onboardingCompleted === true) {
        console.log('🔍 [SOCIAL-LOGIN-SUCCESS] Onboarding completed, redirecting to inspiratie');
        setHasRedirected(true);
        setIsChecking(false);
        
        // iOS Safari: Wait a bit more before redirect to ensure cookies are fully set
        const redirectDelay = isSafariOnIOS ? 500 : isIOSDevice ? 400 : 200;
        await new Promise(resolve => setTimeout(resolve, redirectDelay));
        
        // Use window.location.href for iOS Safari compatibility (better than replace for session persistence)
        window.location.href = '/inspiratie';
        return;
      }

      // Always redirect to register for social login users who haven't completed onboarding
      console.log('🔍 [SOCIAL-LOGIN-SUCCESS] Redirecting to register for onboarding (hasTempUsername:', hasTempUsername, ', onboardingCompleted:', onboardingCompleted, ')');
      setHasRedirected(true);
      setIsChecking(false);
      
      // iOS Safari: Wait a bit more before redirect to ensure cookies are fully set
      const redirectDelay = isSafariOnIOS ? 500 : isIOSDevice ? 400 : 200;
      await new Promise(resolve => setTimeout(resolve, redirectDelay));
      
      // Use window.location.href for iOS Safari compatibility (better than replace for session persistence)
      // This ensures cookies are properly set before navigation
      window.location.href = '/register?social=true';
    };

    checkAndRedirect();
  }, [session, status, router, updateSession, hasRedirected]);

  // Show loading state while checking
  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Bezig met inloggen...</p>
        </div>
      </div>
    );
  }

  return null;
}
