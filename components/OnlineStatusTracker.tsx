'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function OnlineStatusTracker() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    let isOnline = true;
    let heartbeatInterval: NodeJS.Timeout;

    // Update online status when page becomes visible/hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized browser
        updateOnlineStatus(false);
        isOnline = false;
      } else {
        // User returned to tab
        updateOnlineStatus(true);
        isOnline = true;
      }
    };

    // Update online status when window gains/loses focus
    const handleFocus = () => {
      updateOnlineStatus(true);
      isOnline = true;
    };

    const handleBlur = () => {
      updateOnlineStatus(false);
      isOnline = false;
    };

    // Update online status when page is about to unload
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    // Heartbeat to keep status fresh
    const startHeartbeat = () => {
      heartbeatInterval = setInterval(() => {
        if (isOnline) {
          updateOnlineStatus(true);
        }
      }, 30000); // Every 30 seconds
    };

    // Update online status function
    const updateOnlineStatus = async (online: boolean) => {
      try {
        await fetch('/api/users/online-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: online })
        });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Start heartbeat
    startHeartbeat();

    // Set initial online status
    updateOnlineStatus(true);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      // Set offline when component unmounts
      updateOnlineStatus(false);
    };
  }, [session, status]);

  return null; // This component doesn't render anything
}
