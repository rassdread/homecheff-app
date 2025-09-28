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
      
      // Only redirect if we have specific URL parameters indicating a fresh login
      const isFromLogin = window.location.search.includes('callbackUrl') || 
                         window.location.search.includes('error') ||
                         window.location.search.includes('welcome') ||
                         document.referrer.includes('/login') ||
                         document.referrer.includes('/auth/signin');
      
      if (isFromLogin) {
        hasRedirected.current = true;
        
        // Redirect based on user role
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else if (user.role === 'SELLER') {
          router.push('/profile');
        } else if (user.role === 'DELIVERY') {
          router.push('/delivery/dashboard');
        }
        // For BUYER or other roles, stay on homepage
      }
    }
  }, [session, status, router]);

  return null; // This component doesn't render anything
}
