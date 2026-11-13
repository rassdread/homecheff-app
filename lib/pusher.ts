import Pusher from 'pusher';
import PusherClient from 'pusher-js';
import {
  classifyPublicPusherEnv,
  openPusherServer,
  type PusherEnvShape,
} from '@/lib/pusher-config';

export {
  classifyPusherEnv,
  classifyPublicPusherEnv,
  PusherUnavailableError,
  subscribeRealtimeChannel,
} from '@/lib/pusher-config';

let feedPerfMarkPusherInit: (() => void) | null = null;
if (typeof window !== 'undefined') {
  void import('@/lib/feed/feed-performance-baseline').then((mod) => {
    feedPerfMarkPusherInit = mod.feedPerfMarkPusherInit;
  });
}

let invalidPublicConfigLogged = false;
let pusherServerInstance: Pusher | null = null;

function runtimePusherEnv(env: NodeJS.ProcessEnv = process.env): PusherEnvShape {
  return {
    PUSHER_APP_ID: env.PUSHER_APP_ID,
    PUSHER_SECRET: env.PUSHER_SECRET,
    NEXT_PUBLIC_PUSHER_KEY: env.NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: env.NEXT_PUBLIC_PUSHER_CLUSTER,
  };
}

function requirePusherServer(): Pusher {
  if (!pusherServerInstance) {
    pusherServerInstance = openPusherServer(runtimePusherEnv(), (options) => new Pusher(options));
  }
  return pusherServerInstance;
}

// Lazy server client. Importing this module does not connect and does not
// throw when realtime is off or the configuration is incomplete.
export const pusherServer = {
  trigger(channel: string, event: string, data: unknown) {
    return requirePusherServer().trigger(channel, event, data);
  },
  authorizeChannel(socketId: string, channelName: string) {
    return requirePusherServer().authorizeChannel(socketId, channelName);
  },
};

// Client-side Pusher instance (singleton) - SINGLE SOURCE OF TRUTH
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (typeof window === 'undefined') {
    return null as any;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  const classification = classifyPublicPusherEnv({
    NEXT_PUBLIC_PUSHER_KEY: key,
    NEXT_PUBLIC_PUSHER_CLUSTER: cluster,
  });
  if (classification.availability !== 'configured') {
    if (classification.availability === 'invalid' && !invalidPublicConfigLogged) {
      invalidPublicConfigLogged = true;
      console.error('[realtime] Pusher-configuratie is onvolledig:', classification.incomplete.join(', '));
    }
    return null as any;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(key!.trim(), {
      cluster: cluster!.trim(),
      authEndpoint: '/api/pusher/auth',
      // Performance optimizations
      enabledTransports: ['ws', 'wss'],
      disabledTransports: ['xhr_polling', 'xhr_streaming'],
      // Connection settings
      activityTimeout: 30000,
      pongTimeout: 6000,
      // Enable compression
      enableStats: false,
      // Faster connection
      forceTLS: true,
    });
    feedPerfMarkPusherInit?.();
  }
  return pusherClientInstance;
};

// Export singleton for direct use - delegates to getPusherClient()
export const pusherClient = typeof window !== 'undefined' ? getPusherClient() : null as any;

