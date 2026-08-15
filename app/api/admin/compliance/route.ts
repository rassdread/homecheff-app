/**
 * LEGAL-4A — admin compliance foundation API.
 * GET: DSA state + seller DAC7 readiness report
 * POST: set DSA assessment OR set Business.verified (factual admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildAdminComplianceReport } from '@/lib/compliance/admin-compliance-report';
import {
  getDsaApplicabilityAssessment,
  setDsaApplicabilityAssessment,
} from '@/lib/compliance/dsa-assessment-store';
import { isDsaApplicabilityState } from '@/lib/compliance/dsa-applicability';
import { canSetBusinessVerified } from '@/lib/compliance/business-verified';
import { COMPLIANCE_AXES } from '@/lib/compliance/axes';

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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const yearParam = req.nextUrl.searchParams.get('year');
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  if (!Number.isFinite(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  const report = await buildAdminComplianceReport({ year, take: 40 });
  return NextResponse.json({
    axes: COMPLIANCE_AXES,
    ...report,
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = typeof body.action === 'string' ? body.action : '';

  if (action === 'set_dsa_applicability') {
    if (!isDsaApplicabilityState(body.state)) {
      return NextResponse.json({ error: 'Invalid DSA state' }, { status: 400 });
    }
    const note =
      typeof body.assessmentNote === 'string' ? body.assessmentNote : null;
    if (!note || note.trim().length < 12) {
      return NextResponse.json(
        { error: 'assessmentNote required (basis for reviewed state)' },
        { status: 400 },
      );
    }
    let reviewDueAt: Date | null = null;
    if (typeof body.reviewDueAt === 'string' && body.reviewDueAt.trim()) {
      const d = new Date(body.reviewDueAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: 'Invalid reviewDueAt' },
          { status: 400 },
        );
      }
      reviewDueAt = d;
    }
    const assessment = await setDsaApplicabilityAssessment({
      state: body.state,
      assessmentNote: note,
      reviewDueAt,
      updatedByUserId: admin.id,
    });
    return NextResponse.json({ ok: true, dsa: assessment });
  }

  if (action === 'set_business_verified') {
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const verified = body.verified === true;
    const note = typeof body.note === 'string' ? body.note : '';
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    if (verified) {
      const gate = canSetBusinessVerified({
        adminAttested: body.adminAttested === true,
        note,
      });
      if (!gate.ok) {
        return NextResponse.json({ error: gate.reason }, { status: 400 });
      }
    }
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return NextResponse.json(
        { error: 'Business record not found' },
        { status: 404 },
      );
    }
    const updated = await prisma.business.update({
      where: { userId },
      data: verified
        ? {
            verified: true,
            verifiedAt: new Date(),
            verifiedNote: note.trim(),
            verifiedByUserId: admin.id,
          }
        : {
            verified: false,
            verifiedAt: null,
            verifiedNote: note.trim() || null,
            verifiedByUserId: admin.id,
          },
    });
    return NextResponse.json({
      ok: true,
      business: {
        userId: updated.userId,
        verified: updated.verified,
        verifiedAt: updated.verifiedAt,
        verifiedNote: updated.verifiedNote,
      },
    });
  }

  if (action === 'get_dsa_only') {
    const dsa = await getDsaApplicabilityAssessment();
    return NextResponse.json({ ok: true, dsa });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
