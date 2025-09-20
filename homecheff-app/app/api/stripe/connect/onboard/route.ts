import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount, createAccountLink } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal user op
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Als user al een Stripe Connect account heeft, geef de bestaande link terug
    if (user.stripeConnectAccountId && user.stripeConnectOnboardingCompleted) {
      return NextResponse.json({
        success: true,
        message: 'Stripe Connect account al ingesteld',
        accountId: user.stripeConnectAccountId
      });
    }

    let accountId = user.stripeConnectAccountId;

    // Maak nieuw Stripe Connect account als er nog geen is
    if (!accountId) {
      const account = await createConnectAccount(user.email!);
      accountId = account.id;

      // Sla account ID op in database
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectAccountId: accountId }
      });
    }

    // Maak onboarding link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const accountLink = await createAccountLink(
      accountId,
      `${baseUrl}/profile?stripe_refresh=true`,
      `${baseUrl}/profile?stripe_success=true`
    );

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: accountId
    });

  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
}
