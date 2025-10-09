'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('[useSocket] Initializing socket connection...');
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    console.log('[useSocket] Connecting to:', socketUrl);
    
    // Environment-specific configuration
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isVercelPro = !isLocalhost && window.location.hostname.includes('vercel.app');
    
    const socketInstance = io(socketUrl, {
      path: '/api/socket',
      // Use websockets on Vercel PRO, polling on localhost
      transports: isVercelPro ? ['websocket', 'polling'] : ['polling'],
      upgrade: isVercelPro, // Enable upgrade on Vercel PRO
      rememberUpgrade: isVercelPro,
      timeout: isVercelPro ? 30000 : 10000, // Longer timeout for Vercel PRO
      forceNew: true,
      reconnection: true,
      reconnectionDelay: isVercelPro ? 1000 : 500, // Standard delay for Vercel PRO
      reconnectionAttempts: isVercelPro ? 10 : 5, // More attempts on Vercel PRO
      autoConnect: true,
      // Vercel PRO specific optimizations
      ...(isVercelPro && {
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 10000,
      })
    });

    socketInstance.on('connect', () => {
      console.log('[useSocket] ✅ Connected to socket server with ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[useSocket] ❌ Disconnected from socket server. Reason:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[useSocket] ❌ Connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('[useSocket] 🔄 Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('[useSocket] ❌ Reconnection error:', error);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('[useSocket] ❌ Failed to reconnect after maximum attempts');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log('[useSocket] Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
};



