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
    
    // Localhost-specific configuration
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    const socketInstance = io(socketUrl, {
      path: '/api/socket',
      transports: isLocalhost ? ['polling'] : ['websocket', 'polling'], // Force polling on localhost
      upgrade: !isLocalhost, // Disable upgrade on localhost
      rememberUpgrade: !isLocalhost,
      timeout: isLocalhost ? 10000 : 20000, // Shorter timeout for localhost
      forceNew: true,
      reconnection: true,
      reconnectionDelay: isLocalhost ? 500 : 1000, // Faster reconnection on localhost
      reconnectionAttempts: isLocalhost ? 10 : 5, // More attempts on localhost
      autoConnect: true
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



