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
