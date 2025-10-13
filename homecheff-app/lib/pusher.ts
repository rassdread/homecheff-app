import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance (singleton) - SINGLE SOURCE OF TRUTH
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (typeof window === 'undefined') {
    return null as any;
  }
  
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });
  }
  return pusherClientInstance;
};

// Export singleton for direct use - delegates to getPusherClient()
export const pusherClient = typeof window !== 'undefined' ? getPusherClient() : null as any;

