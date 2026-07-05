import { NextRequest, NextResponse } from 'next/server';
import {
  handleDeliveryMarketplaceError,
  resolveDeliveryMarketplaceUser,
} from '@/lib/delivery/delivery-marketplace-api';
import { DeliveryRequestService } from '@/lib/delivery/delivery-request-service';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await resolveDeliveryMarketplaceUser();
    if ('error' in authResult) return authResult.error;

    const result = await DeliveryRequestService.completeDelivery(
      authResult.userId,
      params.id,
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleDeliveryMarketplaceError(error);
  }
}
