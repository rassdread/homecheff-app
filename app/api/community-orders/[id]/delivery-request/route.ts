import { NextRequest, NextResponse } from 'next/server';
import {
  handleDeliveryMarketplaceError,
  resolveDeliveryMarketplaceUser,
} from '@/lib/delivery/delivery-marketplace-api';
import { DeliveryRequestService } from '@/lib/delivery/delivery-request-service';
import type { CreateDeliveryRequestInput } from '@/lib/delivery/delivery-marketplace-types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await resolveDeliveryMarketplaceUser();
    if ('error' in authResult) return authResult.error;

    const body = (await req.json().catch(() => ({}))) as CreateDeliveryRequestInput;
    const result = await DeliveryRequestService.createFromCommunityOrder(
      authResult.userId,
      params.id,
      body,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleDeliveryMarketplaceError(error);
  }
}
