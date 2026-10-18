import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  DELIVERY_AGREEMENT_DOCUMENT_ID,
  deliveryAgreementAcceptanceData,
} from '@/lib/delivery/delivery-agreement';

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
  if (profile.deliveryAgreementAcceptedAt) {
    return NextResponse.json({
      accepted: true,
      acceptedAt: profile.deliveryAgreementAcceptedAt,
      documentId: profile.deliveryAgreementDocumentId,
      unchanged: true,
    });
  }
  const saved = await prisma.deliveryProfile.update({
    where: { id: profile.id },
    data: deliveryAgreementAcceptanceData(),
    select: { deliveryAgreementAcceptedAt: true, deliveryAgreementDocumentId: true },
  });
  return NextResponse.json({
    accepted: true,
    acceptedAt: saved.deliveryAgreementAcceptedAt,
    documentId: saved.deliveryAgreementDocumentId ?? DELIVERY_AGREEMENT_DOCUMENT_ID,
    unchanged: false,
  });
}
