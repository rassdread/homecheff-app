import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { processAttributionOnSignup } from '@/lib/affiliate-attribution';
import { trackOpportunityEventServer } from '@/lib/analytics/opportunity-analytics-server';
import {
  deliverySignupErrorToJson,
  runDeliverySignup,
  type DeliverySignupInput,
} from '@/lib/delivery/delivery-signup-service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUserId =
      session?.user && typeof (session.user as { id?: string }).id === 'string'
        ? (session.user as { id: string }).id
        : null;

    let body: DeliverySignupInput;
    try {
      body = (await req.json()) as DeliverySignupInput;
    } catch {
      return NextResponse.json(
        {
          error: 'Controleer de gemarkeerde gegevens en probeer opnieuw.',
          code: 'VALIDATION',
        },
        { status: 400 }
      );
    }

    // Legacy clients may still send parentalConsent — never an 18+ exception.
    if (body && typeof body === 'object' && 'parentalConsent' in body) {
      delete (body as { parentalConsent?: unknown }).parentalConsent;
    }

    const result = await runDeliverySignup({
      prisma,
      input: body,
      sessionUserId,
    });

    if (!result.ok) {
      return NextResponse.json(deliverySignupErrorToJson(result), {
        status: result.status,
      });
    }

    const providerType = result.deliveryProfile.providerType || 'INDEPENDENT';
    const opportunityId =
      providerType === 'DELIVERY_BUSINESS'
        ? 'delivery_company'
        : 'delivery_individual';

    // Attribution + analytics only after atomic user+profile success.
    // Skip re-lock when recovering an existing account that already signed up.
    if (!result.recovered && !sessionUserId) {
      try {
        await processAttributionOnSignup(
          result.user.id,
          req.headers.get('cookie'),
          providerType === 'DELIVERY_BUSINESS'
        );
        void trackOpportunityEventServer({
          eventType: 'SIGNUP_COMPLETED',
          userId: result.user.id,
          metadata: {
            opportunityId,
            surface: 'delivery_signup',
            product: 'delivery',
          },
        });
        void trackOpportunityEventServer({
          eventType: 'CANONICAL_ATTRIBUTION_LOCKED',
          userId: result.user.id,
          metadata: {
            opportunityId,
            note: 'attempted_via_processAttributionOnSignup',
          },
        });
      } catch (attrErr) {
        console.error('[delivery-signup] attribution side-effect failed', attrErr);
      }
    }

    void trackOpportunityEventServer({
      eventType: 'DELIVERY_PROVIDER_PROFILE_CREATED',
      userId: result.user.id,
      entityId: result.deliveryProfile.id,
      metadata: {
        opportunityId,
        providerType,
        surface: 'delivery_signup',
        recovered: result.recovered,
      },
    });
    if (result.deliveryProfile.isActive) {
      void trackOpportunityEventServer({
        eventType: 'DELIVERY_PROVIDER_ACTIVATED',
        userId: result.user.id,
        entityId: result.deliveryProfile.id,
        metadata: {
          opportunityId,
          providerType,
        },
      });
    }

    return NextResponse.json({
      success: true,
      recovered: result.recovered,
      user: result.user,
      deliveryProfile: result.deliveryProfile,
      business: result.business ?? null,
    });
  } catch (error: unknown) {
    console.error('[delivery-signup] unhandled', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json(
      {
        error:
          'Er ging iets mis bij het afronden van je bezorgeraanmelding. Je gegevens zijn bewaard. Probeer het opnieuw of log in om verder te gaan.',
        code: 'INTERNAL',
      },
      { status: 500 }
    );
  }
}
