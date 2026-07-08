import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import type { MarketplaceCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/listing-taxonomy';
import {
  buildPendingAcceptedValueAuditReport,
  listActivePendingAcceptedValues,
  upsertPendingAcceptedValueProposal,
} from '@/lib/marketplace/pending-accepted-values/service';

async function resolveSessionUserId(): Promise<string | null> {
  try {
    const mod: { auth?: () => Promise<{ user?: { id?: string } } | null> } =
      await import('@/lib/auth');
    const session = await mod.auth?.();
    const id = session?.user?.id;
    if (typeof id === 'string' && id.trim()) return id.trim();
  } catch {
    // fall through
  }
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions as never);
    const id = (session as { user?: { id?: string } } | null)?.user?.id;
    if (typeof id === 'string' && id.trim()) return id.trim();
  } catch {
    // ignore
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('audit') === '1') {
      const report = await buildPendingAcceptedValueAuditReport(prisma);
      return NextResponse.json(report);
    }
    const items = await listActivePendingAcceptedValues(prisma);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[pending-accepted-values GET]', error);
    return NextResponse.json({ error: 'Failed to load pending values' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      label?: string;
      category?: string;
      language?: string;
    };
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    const category = body.category as MarketplaceCategory | undefined;
    const language =
      typeof body.language === 'string' && body.language.trim()
        ? body.language.trim().toLowerCase()
        : 'nl';

    if (!label || label.length < 2 || label.length > 120) {
      return NextResponse.json({ error: 'Invalid label' }, { status: 400 });
    }
    if (!category || !MARKETPLACE_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const userId = await resolveSessionUserId();
    const record = await upsertPendingAcceptedValueProposal(prisma, {
      label,
      category,
      language,
      userId,
    });

    return NextResponse.json({ item: record });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'PENDING_VALUE_LABEL_REQUIRED') {
      return NextResponse.json({ error: 'Label required' }, { status: 400 });
    }
    console.error('[pending-accepted-values POST]', error);
    return NextResponse.json({ error: 'Failed to create pending value' }, { status: 500 });
  }
}
