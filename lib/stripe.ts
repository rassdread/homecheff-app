import Stripe from 'stripe';
import {
  DEFAULT_PLATFORM_FEE_PERCENT,
  STRIPE_FIXED_FEE_CENTS,
  STRIPE_FEE_PERCENTAGE,
} from './fees';

// Helper om omgevingsvariabelen te normaliseren (trim en leeg -> undefined)
const sanitizeEnv = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

// Test mode - gebruik sandbox keys
const STRIPE_SECRET_KEY = sanitizeEnv(process.env.STRIPE_SECRET_KEY);
export const isTestMode = !STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.startsWith('sk_test');

// Helper om te detecteren of een Stripe ID test of live is
export function isStripeTestId(id: string | null | undefined): boolean {
  if (!id) return false;
  // Stripe IDs hebben verschillende prefixes voor test/live
  // Account: acct_test_ / acct_
  // Session: cs_test_ / cs_live_
  // Payment Intent: pi_test_ / pi_
  // Transfer: tr_test_ / tr_
  return id.startsWith('acct_test_') || 
         id.startsWith('cs_test_') || 
         id.startsWith('pi_test_') || 
         id.startsWith('tr_test_') ||
         id.startsWith('ch_test_') ||
         id.startsWith('evt_test_');
}

// Helper om te checken of een Stripe ID matcht met de huidige mode
export function matchesCurrentMode(id: string | null | undefined): boolean {
  if (!id) return false;
  const isTestId = isStripeTestId(id);
  return isTestId === isTestMode;
}

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

// Stripe Connect client ID
export const STRIPE_CONNECT_CLIENT_ID = sanitizeEnv(process.env.STRIPE_CONNECT_CLIENT_ID);

// Subscription Plan to Stripe Price ID mapping (geschoonde waarden)
export const PLAN_TO_PRICE: Record<string, string | undefined> = {
  BASIC: sanitizeEnv(process.env.STRIPE_PRICE_BASIC),
  PRO: sanitizeEnv(process.env.STRIPE_PRICE_PRO),
  PREMIUM: sanitizeEnv(process.env.STRIPE_PRICE_PREMIUM),
};

// Map subscription plan names (from form/Stripe) to database subscription names
export const SUBSCRIPTION_NAME_MAP: Record<string, string> = {
  'basic': 'Basic',
  'pro': 'Pro',
  'premium': 'Premium',
  'BASIC': 'Basic',
  'PRO': 'Pro',
  'PREMIUM': 'Premium'
};

// Helper function to normalize subscription plan name to database format
export function normalizeSubscriptionName(plan: string): string {
  return SUBSCRIPTION_NAME_MAP[plan] || plan;
}

const BUSINESS_PLATFORM_FEES: Record<'BASIC' | 'PRO' | 'PREMIUM', number> = {
  BASIC: 7,
  PRO: 4,
  PREMIUM: 2,
};

// Bereken uitbetaling voor verkoper
export function calculatePayout(amount: number, userType: 'individual' | 'business' = 'individual', subscriptionType?: 'BASIC' | 'PRO' | 'PREMIUM'): {
  totalAmount: number;
  stripeFee: number;
  homecheffFee: number;
  sellerPayout: number;
} {
  const totalAmount = amount;
  const stripeFee = (totalAmount * STRIPE_FEE_PERCENTAGE) + (STRIPE_FIXED_FEE_CENTS / 100);
  
  // Bepaal HomeCheff fee op basis van gebruikerstype
  let homecheffFeePercentage: number;
  if (userType === 'individual') {
    homecheffFeePercentage = DEFAULT_PLATFORM_FEE_PERCENT;
  } else {
    // Voor bedrijven, gebruik subscription type
    homecheffFeePercentage = subscriptionType 
      ? BUSINESS_PLATFORM_FEES[subscriptionType]
      : DEFAULT_PLATFORM_FEE_PERCENT; // Fallback naar individueel tarief
  }
  
  const homecheffFee = totalAmount * homecheffFeePercentage / 100;
  const sellerPayout = totalAmount - homecheffFee;

  return {
    totalAmount,
    stripeFee: Math.round(stripeFee * 100) / 100,
    homecheffFee: Math.round(homecheffFee * 100) / 100,
    sellerPayout: Math.round(sellerPayout * 100) / 100,
  };
}

// Maak Stripe Payment Intent
export async function createPaymentIntent(
  amount: number,
  currency: string = 'eur',
  metadata: Record<string, string> = {}
) {
  const { totalAmount } = calculatePayout(amount);
  
  if (isTestMode) {
    // Mock payment intent voor test modus
    return {
      id: `pi_test_${Date.now()}`,
      amount: Math.round(totalAmount * 100),
      currency,
      status: 'requires_payment_method',
      metadata: {
        ...metadata,
        homecheff_app: 'true',
        test_mode: 'true',
      },
    };
  }
  
  return await stripe!.paymentIntents.create({
    amount: Math.round(totalAmount * 100), // Stripe verwacht centen
    currency,
    metadata: {
      ...metadata,
      homecheff_app: 'true',
    },
  });
}

// Maak Stripe Connect account voor verkoper
export async function createConnectAccount(
  email: string,
  country: string = 'NL',
  type: 'express' | 'standard' = 'express'
) {
  if (!stripe) {
    throw new Error('Stripe not configured. Missing STRIPE_SECRET_KEY.');
  }
  
  try {
    // Always use real Stripe API (works in both test and live mode)
    return await stripe.accounts.create({
      type,
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    // Preserve the original Stripe error so we can check for specific error codes
    const stripeError = error as any;
    stripeError.originalMessage = error.message;
    stripeError.originalCode = error.code;
    stripeError.originalType = error.type;
    stripeError.originalStatusCode = error.statusCode;
    throw stripeError; // Throw the original error so we can access code, type, etc.
  }
}

// Format bedrag voor Stripe (euro naar centen)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Maak Stripe Connect Express account link voor onboarding
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  if (isTestMode) {
    return {
      url: `${returnUrl}?account_id=${accountId}&test=true`,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };
  }
  
  return await stripe!.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

// Haal Stripe Connect account op
export async function getConnectAccount(accountId: string) {
  if (isTestMode) {
    return {
      id: accountId,
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
    };
  }
  
  return await stripe!.accounts.retrieve(accountId);
}

// Maak betaling met Stripe Connect (split payment)
export async function createConnectPaymentIntent(
  amount: number,
  applicationFeeAmount: number,
  transferData: { destination: string },
  currency: string = 'eur',
  metadata: Record<string, string> = {}
) {
  if (isTestMode) {
    return {
      id: `pi_test_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency,
      application_fee_amount: Math.round(applicationFeeAmount * 100),
      transfer_data: transferData,
      status: 'requires_payment_method',
      metadata: {
        ...metadata,
        homecheff_connect: 'true',
        test_mode: 'true',
      },
    };
  }
  
  return await stripe!.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    application_fee_amount: Math.round(applicationFeeAmount * 100),
    transfer_data: transferData,
    metadata: {
      ...metadata,
      homecheff_connect: 'true',
    },
  });
}

// Maak uitbetaling naar verkoper
export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  metadata: Record<string, string> = {}
) {
  if (isTestMode) {
    // Mock transfer voor test modus
    return {
      id: `tr_test_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: 'eur',
      destination: destinationAccountId,
      metadata: {
        ...metadata,
        homecheff_payout: 'true',
        test_mode: 'true',
      },
    };
  }
  
  return await stripe!.transfers.create({
    amount: Math.round(amount * 100), // Stripe verwacht centen
    currency: 'eur',
    destination: destinationAccountId,
    metadata: {
      ...metadata,
      homecheff_payout: 'true',
    },
  });
}