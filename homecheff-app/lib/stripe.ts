import Stripe from 'stripe';

// Test mode - gebruik sandbox keys
const isTestMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test');

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

// Stripe Connect client ID
export const STRIPE_CONNECT_CLIENT_ID = process.env.STRIPE_CONNECT_CLIENT_ID;

// Fee structuur
export const FEE_STRUCTURE = {
  STRIPE_FEE_PERCENTAGE: 1.4, // 1.4% + €0.25 per transactie
  STRIPE_FIXED_FEE: 0.25, // €0.25 per transactie
  HOMECHEFF_INDIVIDUAL_FEE: 12, // 12% voor particulieren
  HOMECHEFF_BUSINESS_FEES: {
    BASIC: 7,    // 7% voor Basic abonnement
    PRO: 4,      // 4% voor Pro abonnement  
    PREMIUM: 2   // 2% voor Premium abonnement
  }
};

// Bereken uitbetaling voor verkoper
export function calculatePayout(amount: number, userType: 'individual' | 'business' = 'individual', subscriptionType?: 'BASIC' | 'PRO' | 'PREMIUM'): {
  totalAmount: number;
  stripeFee: number;
  homecheffFee: number;
  sellerPayout: number;
} {
  const totalAmount = amount;
  const stripeFee = (totalAmount * FEE_STRUCTURE.STRIPE_FEE_PERCENTAGE / 100) + FEE_STRUCTURE.STRIPE_FIXED_FEE;
  
  // Bepaal HomeCheff fee op basis van gebruikerstype
  let homecheffFeePercentage: number;
  if (userType === 'individual') {
    homecheffFeePercentage = FEE_STRUCTURE.HOMECHEFF_INDIVIDUAL_FEE;
  } else {
    // Voor bedrijven, gebruik subscription type
    homecheffFeePercentage = subscriptionType 
      ? FEE_STRUCTURE.HOMECHEFF_BUSINESS_FEES[subscriptionType]
      : FEE_STRUCTURE.HOMECHEFF_INDIVIDUAL_FEE; // Fallback naar individueel tarief
  }
  
  const homecheffFee = totalAmount * homecheffFeePercentage / 100;
  const sellerPayout = totalAmount - stripeFee - homecheffFee;

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
  if (isTestMode) {
    // Mock connect account voor test modus
    return {
      id: `acct_test_${Date.now()}`,
      type,
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      test_mode: true,
    };
  }
  
  return await stripe!.accounts.create({
    type,
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
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