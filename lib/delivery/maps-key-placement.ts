/**
 * Distance Matrix runs on the server. The browser key is not a pricing key.
 * A residential IP allowlist cannot cover Vercel, whose outbound addresses change.
 * Production needs its own server key, restricted to the Distance Matrix API,
 * stored only in GOOGLE_MAPS_API_KEY. This module does not call Google.
 */

export type MapsKeyPlacement = {
  source: 'server' | 'missing';
  browserKeyUsedForDistance: false;
  ipAllowlistFitsVercel: false;
  serverKeyConfigured: boolean;
};

export type MapsRuntime = 'production' | 'non_production';

export type MapsProductionReason =
  | 'OK'
  | 'NON_PRODUCTION'
  | 'SERVER_KEY_MISSING'
  | 'PRODUCTION_KEY_MISSING'
  | 'PRODUCTION_ROLE_REQUIRED'
  | 'SERVER_KEY_EXPOSED_AS_BROWSER_KEY';

export type MapsProductionConfig = {
  runtime: MapsRuntime;
  serverKeyConfigured: boolean;
  browserKeyConfigured: boolean;
  serverKeyCopiedToBrowser: boolean;
  role: string;
  payable: boolean;
  reason: MapsProductionReason;
};

export function serverDistanceMatrixKey(env: NodeJS.ProcessEnv = process.env): string {
  return (env.GOOGLE_MAPS_API_KEY || '').trim();
}

export function describeMapsKeyPlacement(env: NodeJS.ProcessEnv = process.env): MapsKeyPlacement {
  const serverKey = serverDistanceMatrixKey(env);
  return {
    source: serverKey ? 'server' : 'missing',
    browserKeyUsedForDistance: false,
    ipAllowlistFitsVercel: false,
    serverKeyConfigured: Boolean(serverKey),
  };
}

export function mapsRuntime(env: NodeJS.ProcessEnv = process.env): MapsRuntime {
  return env.VERCEL_ENV === 'production' ? 'production' : 'non_production';
}

/**
 * Production calls Google only when GOOGLE_MAPS_API_KEY is set,
 * GOOGLE_MAPS_KEY_ROLE is exactly "production", and that key is not also
 * published to the browser. A preview key copied into production without
 * the production role is not used.
 */
export function assessMapsProductionConfig(env: NodeJS.ProcessEnv = process.env): MapsProductionConfig {
  const serverKey = serverDistanceMatrixKey(env);
  const browserKey = (env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
  const role = (env.GOOGLE_MAPS_KEY_ROLE || '').trim();
  const serverKeyCopiedToBrowser = Boolean(serverKey && browserKey && serverKey === browserKey);
  const runtime = mapsRuntime(env);
  const common = {
    runtime,
    serverKeyConfigured: Boolean(serverKey),
    browserKeyConfigured: Boolean(browserKey),
    serverKeyCopiedToBrowser,
    role,
  };
  if (serverKeyCopiedToBrowser) {
    return { ...common, payable: false, reason: 'SERVER_KEY_EXPOSED_AS_BROWSER_KEY' };
  }
  if (runtime !== 'production') {
    return { ...common, payable: Boolean(serverKey), reason: serverKey ? 'NON_PRODUCTION' : 'SERVER_KEY_MISSING' };
  }
  if (!serverKey) return { ...common, payable: false, reason: 'PRODUCTION_KEY_MISSING' };
  if (role !== 'production') return { ...common, payable: false, reason: 'PRODUCTION_ROLE_REQUIRED' };
  return { ...common, payable: true, reason: 'OK' };
}
