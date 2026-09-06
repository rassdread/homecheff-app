import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Local-only Safari cookie debug helper.
 * Production and Preview always return 404 — never leak session/config metadata.
 */
function isDeployedEnvironment(): boolean {
  const vercelEnv = (process.env.VERCEL_ENV || '').trim().toLowerCase();
  if (vercelEnv === 'production' || vercelEnv === 'preview') return true;
  return process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';
}

export async function GET(_req: NextRequest) {
  if (isDeployedEnvironment() || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Local development only — minimal, no secrets
  return NextResponse.json({
    ok: true,
    environment: 'local-dev',
    hint: 'debug-session is disabled on Production/Preview',
  });
}
