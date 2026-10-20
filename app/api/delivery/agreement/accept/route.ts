import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  DELIVERY_AGREEMENT_DOCUMENT_ID,
  deliveryAgreementAcceptanceData,
} from '@/lib/delivery/delivery-agreement';
import { decideDashboardAgreementWrite } from '@/lib/delivery/delivery-agreement-version';
import { recordAgreementAcceptance } from '@/lib/delivery/courier-payable';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || body.acceptDeliveryAgreement !== true) {
    return NextResponse.json(
      { error: 'De bezorgerovereenkomst is verplicht.', code: 'AGREEMENT_REQUIRED' },
      { status: 400 },
    );
  }
  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId },
    select: { id: true, deliveryAgreementAcceptedAt: true, deliveryAgreementDocumentId: true },
  });
  if (!profile) {
    return NextResponse.json({ error: 'Geen bezorgprofiel', code: 'NO_PROFILE' }, { status: 404 });
  }
  const existing = await prisma.deliveryAgreementAcceptance.findFirst({
    where: { deliveryProfileId: profile.id },
    orderBy: { acceptedAt: 'desc' },
  });
  const decision = decideDashboardAgreementWrite({
    profileAcceptedAt: profile.deliveryAgreementAcceptedAt,
    existing,
  });
  if (decision.writeVersionRow) {
    await recordAgreementAcceptance(prisma, {
      deliveryProfileId: profile.id,
      userId,
      language: 'nl',
    });
  }
  if (decision.writeProfileTimestamp) {
    await prisma.deliveryProfile.update({
      where: { id: profile.id },
      data: deliveryAgreementAcceptanceData(),
    });
  }
  const saved = await prisma.deliveryProfile.findUnique({
    where: { id: profile.id },
    select: { deliveryAgreementAcceptedAt: true, deliveryAgreementDocumentId: true },
  });
  return NextResponse.json({
    accepted: true,
    acceptedAt: saved?.deliveryAgreementAcceptedAt ?? profile.deliveryAgreementAcceptedAt,
    documentId: saved?.deliveryAgreementDocumentId ?? profile.deliveryAgreementDocumentId ?? DELIVERY_AGREEMENT_DOCUMENT_ID,
    unchanged: decision.unchanged,
  });
}
