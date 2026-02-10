import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { DeliveryCountdownService } from '@/lib/delivery-countdown';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { orderId } = params;

    const countdownData = await DeliveryCountdownService.getRemainingTime(orderId);

    return NextResponse.json(countdownData);
  } catch (error) {
    console.error('Error fetching countdown data:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van countdown data' },
      { status: 500 }
    );
  }
}


