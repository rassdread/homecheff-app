/**
 * Realtime is optional. A complete Pusher configuration keeps the existing
 * client. All four values absent, or all four set to the sentinel, means
 * realtime is off. A mix is a broken configuration and must not connect.
 * The sentinel is the only non-empty override that cannot fall back to a
 * shared production credential.
 */

export const PUSHER_DISABLED_SENTINEL = 'disabled';

export const PUSHER_ENV_NAMES = [
  'PUSHER_APP_ID',
  'PUSHER_SECRET',
  'NEXT_PUBLIC_PUSHER_KEY',
  'NEXT_PUBLIC_PUSHER_CLUSTER',
] as const;

export type PusherEnvName = (typeof PUSHER_ENV_NAMES)[number];

export type PusherAvailability = 'configured' | 'disabled' | 'invalid';

export type PusherEnvShape = Partial<Record<PusherEnvName, string | undefined>>;

export type PusherClassification = {
  availability: PusherAvailability;
  incomplete: PusherEnvName[];
};

function fieldState(value: string | undefined): 'absent' | 'disabled' | 'set' {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return 'absent';
  if (trimmed.toLowerCase() === PUSHER_DISABLED_SENTINEL) return 'disabled';
  return 'set';
}

function classifyFields(
  states: Array<{ name: PusherEnvName; state: 'absent' | 'disabled' | 'set' }>,
): PusherClassification {
  if (states.every((item) => item.state === 'set')) {
    return { availability: 'configured', incomplete: [] };
  }
  if (states.every((item) => item.state === 'absent') || states.every((item) => item.state === 'disabled')) {
    return { availability: 'disabled', incomplete: [] };
  }
  return {
    availability: 'invalid',
    incomplete: states.filter((item) => item.state !== 'set').map((item) => item.name),
  };
}

export function classifyPusherEnv(env: PusherEnvShape): PusherClassification {
  return classifyFields(PUSHER_ENV_NAMES.map((name) => ({ name, state: fieldState(env[name]) })));
}

const PUBLIC_PUSHER_ENV_NAMES = ['NEXT_PUBLIC_PUSHER_KEY', 'NEXT_PUBLIC_PUSHER_CLUSTER'] as const;

/** The browser can only see the public key and cluster. */
export function classifyPublicPusherEnv(env: PusherEnvShape): PusherClassification {
  return classifyFields(PUBLIC_PUSHER_ENV_NAMES.map((name) => ({ name, state: fieldState(env[name]) })));
}

export type RealtimeChannel = {
  bind: (event: string, callback: (payload: any) => void) => void;
  unbind_all: () => void;
  unsubscribe: () => void;
};

export function subscribeRealtimeChannel<T extends RealtimeChannel>(
  client: { subscribe: (channelName: string) => T } | null | undefined,
  channelName: string,
): T | null {
  if (!client) return null;
  return client.subscribe(channelName);
}

export type PusherServerOptions = {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
  useTLS: true;
};

export class PusherUnavailableError extends Error {
  readonly code: 'PUSHER_DISABLED' | 'PUSHER_INVALID';
  readonly incomplete: readonly string[];

  constructor(code: 'PUSHER_DISABLED' | 'PUSHER_INVALID', incomplete: readonly string[]) {
    super(
      code === 'PUSHER_DISABLED'
        ? 'Realtime is off'
        : `Pusher configuration is incomplete: ${incomplete.join(', ')}`,
    );
    this.name = 'PusherUnavailableError';
    this.code = code;
    this.incomplete = incomplete;
  }
}

export function openPusherServer<T>(
  env: PusherEnvShape,
  factory: (options: PusherServerOptions) => T,
): T {
  const classification = classifyPusherEnv(env);
  if (classification.availability !== 'configured') {
    throw new PusherUnavailableError(
      classification.availability === 'disabled' ? 'PUSHER_DISABLED' : 'PUSHER_INVALID',
      classification.incomplete,
    );
  }
  return factory({
    appId: env.PUSHER_APP_ID!.trim(),
    key: env.NEXT_PUBLIC_PUSHER_KEY!.trim(),
    secret: env.PUSHER_SECRET!.trim(),
    cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER!.trim(),
    useTLS: true,
  });
}
