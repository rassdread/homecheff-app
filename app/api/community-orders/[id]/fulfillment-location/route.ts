import { NextRequest, NextResponse } from 'next/server';
import { resolveProposalApiUser } from '@/lib/proposals/proposal-api';
import {
  completeFulfillmentLocation,
  FulfillmentLocationError,
  getFulfillmentLocationView,
} from '@/lib/proposals/fulfillment-location-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await resolveProposalApiUser();
    if ('error' in auth) return auth.error;
    const view = await getFulfillmentLocationView(params.id, auth.userId);
    return NextResponse.json(view);
  } catch (e) {
    if (e instanceof FulfillmentLocationError) {
      return NextResponse.json(
        { error: e.message, errorKey: e.errorKey },
        { status: e.status },
      );
    }
    console.error('[fulfillment-location GET]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await resolveProposalApiUser();
    if ('error' in auth) return auth.error;

    const body = (await req.json().catch(() => ({}))) as {
      address?: {
        address?: string;
        houseNumber?: string;
        postalCode?: string;
        city?: string;
        place?: string;
        country?: string;
      };
      addressLine?: string | null;
      scheduleDate?: string | null;
      scheduleTimeWindow?: string | null;
      useSavedProfileAddress?: boolean;
    };

    const result = await completeFulfillmentLocation(auth.userId, params.id, body);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof FulfillmentLocationError) {
      return NextResponse.json(
        { error: e.message, errorKey: e.errorKey },
        { status: e.status },
      );
    }
    console.error('[fulfillment-location POST]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
