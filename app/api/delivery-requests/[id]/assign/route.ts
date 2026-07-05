import { NextRequest, NextResponse } from 'next/server';
import {
  handleDeliveryMarketplaceError,
  resolveDeliveryMarketplaceUser,
} from '@/lib/delivery/delivery-marketplace-api';
import { DeliveryRequestService } from '@/lib/delivery/delivery-request-service';
import type { AssignCourierInput } from '@/lib/delivery/delivery-marketplace-types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await resolveDeliveryMarketplaceUser();
    if ('error' in authResult) return authResult.error;

    const body = (await req.json()) as AssignCourierInput;
    const result = await DeliveryRequestService.assignCourier(
      authResult.userId,
      params.id,
      body,
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleDeliveryMarketplaceError(error);
  }
}
