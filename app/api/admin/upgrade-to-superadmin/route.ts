import { NextRequest, NextResponse } from 'next/server';
import { requireMappedAdminCapability } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** Self-promotion is disabled. Superadmin rights are not granted from this route. */
export async function POST(req: NextRequest) {
  const mappedGuard = await requireMappedAdminCapability(req);
  if (!mappedGuard.ok) return mappedGuard.response;
  return NextResponse.json({ error: 'SUPERADMIN_SELF_ASSIGN_DISABLED' }, { status: 403 });
}
