import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount, stripe, matchesCurrentMode, isTestMode } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if account ID matches current mode (test/live)
    if (user.stripeConnectAccountId && !matchesCurrentMode(user.stripeConnectAccountId)) {
      // Account is from different mode, clear it
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          stripeConnectAccountId: null,
          stripeConnectOnboardingCompleted: false
        }
      });
      return NextResponse.json({
        hasAccount: false,
        isCompleted: false,
        accountId: null
      });
    }

    // Check if account exists in Stripe and get real status
    let isCompleted = false;
    if (user.stripeConnectAccountId && stripe) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
        isCompleted = account.charges_enabled && account.payouts_enabled;
        
        // Update database with real status
        await prisma.user.update({
          where: { email: session.user.email },
          data: { stripeConnectOnboardingCompleted: isCompleted }
        });
      } catch (err: any) {
        console.error('Error checking Stripe account:', err);
        // If account doesn't exist (e.g., test account in live mode or vice versa),
        // clear the account ID and mark as not completed
        if (err.code === 'resource_missing' || err.statusCode === 404) {
          await prisma.user.update({
            where: { email: session.user.email },
            data: { 
              stripeConnectAccountId: null,
              stripeConnectOnboardingCompleted: false
            }
          });
          isCompleted = false;
        } else {
          // Use database value if API call fails for other reasons
          isCompleted = !!user.stripeConnectOnboardingCompleted;
        }
      }
    }

    return NextResponse.json({
      hasAccount: !!user.stripeConnectAccountId,
      isCompleted,
      accountId: user.stripeConnectAccountId
    });

  } catch (error) {
    console.error('Stripe Connect status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe Connect status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true, 
        name: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user already has a completed Stripe Connect account, return success
    if (user.stripeConnectOnboardingCompleted && user.stripeConnectAccountId) {
      return NextResponse.json({ 
        success: true, 
        message: 'Stripe Connect already set up',
        accountId: user.stripeConnectAccountId
      });
    }

    // Create or get existing Stripe Connect account
    let accountId = user.stripeConnectAccountId;
    
    // Check if existing account is valid (not a fake test ID)
    const isFakeTestAccount = accountId && accountId.startsWith('acct_test_');
    
    if (!accountId || isFakeTestAccount) {
      // Clear fake account ID if exists
      if (isFakeTestAccount) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            stripeConnectAccountId: null,
            stripeConnectOnboardingCompleted: false 
          }
        });
        accountId = null;
      }
      
      // Create new account
      if (!accountId) {
        try {
          console.log('🔍 Creating new Stripe Connect account for user:', user.email);
          console.log('🔍 Stripe mode:', isTestMode ? 'TEST' : 'LIVE');
          const connectAccount = await createConnectAccount(
            user.email,
            'NL',
            'express'
          );
          accountId = connectAccount.id;
          console.log('✅ Stripe Connect account created:', accountId);

          // Update user with new account ID
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeConnectAccountId: accountId }
          });
          console.log('✅ User updated with account ID');
        } catch (error: any) {
          console.error('❌ Error creating Connect account:', error);
          console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            type: error.type,
            statusCode: error.statusCode,
            raw: error.raw,
            fullError: JSON.stringify(error, null, 2)
          });
          
          // Check for specific Stripe Connect setup errors - NO links to Stripe Dashboard for users!
          let errorMessage = 'Er is een probleem opgetreden bij het verbinden met Stripe. Probeer het later opnieuw.';
          let helpUrl: string | null = null;
          
          // More specific error handling - user-friendly messages only
          if (error.message?.includes('responsibilities') || error.message?.includes('platform-profile') || error.code === 'account_invalid') {
            errorMessage = 'Stripe Connect is momenteel niet beschikbaar. Neem contact op met de beheerder om dit op te lossen.';
            // NO helpUrl - users shouldn't go to Stripe Dashboard
          } else if (error.message?.includes('Invalid API key') || error.code === 'api_key_expired') {
            errorMessage = 'Stripe configuratie probleem. Neem contact op met de beheerder.';
          } else if (error.message?.includes('rate_limit') || error.code === 'rate_limit') {
            errorMessage = 'Te veel requests. Wacht even en probeer het opnieuw.';
          } else if (error.code === 'account_already_exists') {
            // Account might already exist, try to continue
            console.log('⚠️ Account might already exist, continuing...');
            // Don't return error, let it continue to create account link
            // But we still need an accountId, so try to get it from error or continue without
          } else {
            // Generic error - don't expose technical details to users
            errorMessage = 'Er is een probleem opgetreden bij het verbinden met Stripe. Probeer het later opnieuw of neem contact op met de beheerder.';
          }
          
          // Only return error if it's not a "already exists" type error
          if (error.code !== 'account_already_exists') {
            return NextResponse.json(
              { 
                error: errorMessage,
                details: error.code || error.type,
                statusCode: error.statusCode,
                stripeErrorCode: error.code,
                stripeErrorType: error.type
              },
              { status: 500 }
            );
          }
          // If account already exists, continue without accountId (will be handled below)
        }
      }
    }

    // If we don't have an accountId at this point, we can't continue
    if (!accountId) {
      console.error('❌ No account ID available to create onboarding link');
      return NextResponse.json(
        { 
          error: 'Stripe Connect is momenteel niet beschikbaar. Neem contact op met de beheerder om dit op te lossen.',
          details: 'No account ID available after account creation attempt'
        },
        { status: 500 }
      );
    }

    // Create Stripe account link for onboarding
    if (!stripe) {
      console.error('❌ Stripe not configured - STRIPE_SECRET_KEY missing or invalid');
      return NextResponse.json(
        { error: 'Stripe not configured. Please check your Stripe API keys.' },
        { status: 500 }
      );
    }
    
    // Get base URL - use NEXT_PUBLIC_BASE_URL if available, otherwise default to localhost
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://homecheff.nl';
    
    console.log('🔍 Creating Stripe account link:', {
      accountId,
      baseUrl,
      isTestMode,
      hasStripe: !!stripe,
      accountIdPrefix: accountId?.substring(0, 12)
    });
    
    let accountLink;
    try {
      accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/seller/stripe/refresh`,
        return_url: `${baseUrl}/seller/stripe/success`,
        type: 'account_onboarding',
      });
    } catch (error: any) {
      console.error('❌ Error creating Stripe account link:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        statusCode: error.statusCode
      });
      
      // Check for specific Stripe Connect setup errors - NO links to Stripe Dashboard for users!
      let errorMessage = 'Er is een probleem opgetreden bij het verbinden met Stripe. Probeer het later opnieuw.';
      let helpUrl: string | null = null;
      
      if (error.message?.includes('responsibilities') || error.message?.includes('platform-profile')) {
        errorMessage = 'Stripe Connect is momenteel niet beschikbaar. Neem contact op met de beheerder.';
        // NO helpUrl - users shouldn't go to Stripe Dashboard
      } else if (error.message?.includes('Invalid API key')) {
        errorMessage = 'Stripe configuratie probleem. Neem contact op met de beheerder.';
      } else if (error.message?.includes('rate_limit')) {
        errorMessage = 'Te veel requests. Wacht even en probeer het opnieuw.';
      } else if (error.message) {
        // Don't expose technical error details to users
        errorMessage = 'Er is een probleem opgetreden. Probeer het later opnieuw of neem contact op met de beheerder.';
      }
      
      return NextResponse.json(
        { error: errorMessage, details: error.code || error.type },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: accountId
    });

  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    
    // User-friendly error messages - NO technical details
    let errorMessage = 'Er is een probleem opgetreden bij het verbinden met Stripe. Probeer het later opnieuw.';
    
    if (error instanceof Error) {
      if (error.message.includes('No such account')) {
        errorMessage = 'Stripe Connect account niet gevonden. Probeer het opnieuw.';
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'Stripe configuratie probleem. Neem contact op met de beheerder.';
      } else if (error.message.includes('rate_limit')) {
        errorMessage = 'Te veel requests. Wacht even en probeer het opnieuw.';
      }
      // Don't expose other technical error details
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}