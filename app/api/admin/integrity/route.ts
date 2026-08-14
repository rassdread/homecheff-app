/**
 * TRUST-1 — admin integrity queue + restore/remove.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  adminMarkUnderReview,
  adminRemoveProductIntegrity,
  adminRestoreProductIntegrity,
} from '@/lib/trust/admin-integrity-actions';
import {
  aggregateIntegrityCredibility,
} from '@/lib/trust/credibility';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) return null;
  const role = (user.role || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        {
          integrityStatus: {
            in: [
              'REVIEW_REQUIRED',
              'TEMPORARILY_HIDDEN',
              'UNDER_REVIEW',
              'REMOVED',
            ],
          },
        },
        {
          integrityReports: {
            some: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
          },
        },
      ],
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      isActive: true,
      integrityStatus: true,
      integrityHiddenAt: true,
      integrityHiddenReason: true,
      createdAt: true,
      seller: {
        select: {
          userId: true,
          displayName: true,
          User: { select: { id: true, username: true, email: true, name: true } },
        },
      },
      integrityReports: {
        where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
        select: {
          id: true,
          reason: true,
          credibilityWeight: true,
          createdAt: true,
          reporterId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      integrityActions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          note: true,
          createdAt: true,
          actorUserId: true,
        },
      },
    },
  });

  const items = products.map((p) => {
    const agg = aggregateIntegrityCredibility(
      p.integrityReports.map((r) => ({
        reporterId: r.reporterId,
        credibilityWeight: r.credibilityWeight,
        reason: r.reason,
        createdAt: r.createdAt,
      })),
    );
    return {
      productId: p.id,
      title: p.title,
      isActive: p.isActive,
      integrityStatus: p.integrityStatus,
      integrityHiddenAt: p.integrityHiddenAt,
      integrityHiddenReason: p.integrityHiddenReason,
      uniqueReporters: agg.uniqueReporters,
      weightSum: agg.weightSum,
      reasons: [...new Set(p.integrityReports.map((r) => r.reason))],
      reportCount: p.integrityReports.length,
      seller: {
        userId: p.seller.User?.id ?? p.seller.userId,
        name: p.seller.User?.name ?? p.seller.displayName,
        username: p.seller.User?.username,
        // email for admin only
        email: p.seller.User?.email,
      },
      actions: p.integrityActions,
      // reporter ids kept internal for admin; not for seller UIs
      reports: p.integrityReports.map((r) => ({
        id: r.id,
        reason: r.reason,
        weight: r.credibilityWeight,
        createdAt: r.createdAt,
      })),
    };
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const productId = typeof body.productId === 'string' ? body.productId : '';
  const action = typeof body.action === 'string' ? body.action : '';
  const note = typeof body.note === 'string' ? body.note : undefined;
  if (!productId || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    if (action === 'RESTORE') {
      const result = await adminRestoreProductIntegrity({
        productId,
        actorUserId: admin.id,
        note,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === 'REMOVE') {
      const result = await adminRemoveProductIntegrity({
        productId,
        actorUserId: admin.id,
        note,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === 'UNDER_REVIEW') {
      const result = await adminMarkUnderReview({
        productId,
        actorUserId: admin.id,
        note,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[admin/integrity]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
