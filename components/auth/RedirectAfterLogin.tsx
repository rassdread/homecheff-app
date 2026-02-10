'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RedirectAfterLogin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (hasRedirected.current) return; // Already redirected

    if (session?.user) {
      const user = session.user as any;
      
      // Only redirect ADMINS and DELIVERY users - let SELLERS and BUYERS stay on homepage
      // Check if user came from login or has specific callback URL
      const urlParams = new URLSearchParams(window.location.search);
      const hasCallbackUrl = urlParams.has('callbackUrl');
      const hasError = urlParams.has('error');
      
      // Only redirect if explicitly coming from auth flow (not just welcome parameter)
      const isFromAuthFlow = hasCallbackUrl || hasError || document.referrer.includes('/auth/signin');
      
      if (isFromAuthFlow) {
        hasRedirected.current = true;
        
        // Redirect based on role - focus op inspiratie voor iedereen
        // Iedereen gaat naar inspiratie (standaard startpagina)
        router.push('/inspiratie');
      }
    }
  }, [session, status, router]);

  return null; // This component doesn't render anything
}
