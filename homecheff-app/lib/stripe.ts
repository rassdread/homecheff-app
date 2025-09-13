import Stripe from 'stripe';

// Test mode - gebruik sandbox keys
const isTestMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test');

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

// Fee structuur
export const FEE_STRUCTURE = {
  STRIPE_FEE_PERCENTAGE: 1.4, // 1.4% + €0.25 per transactie
  STRIPE_FIXED_FEE: 0.25, // €0.25 per transactie
  HOMECHEFF_FEE_PERCENTAGE: 5, // 5% naar HomeCheff
  SELLER_PERCENTAGE: 93.6, // Rest naar verkoper (100% - 1.4% - 5% = 93.6%)
};

// Bereken uitbetaling voor verkoper
export function calculatePayout(amount: number): {
  totalAmount: number;
  stripeFee: number;
  homecheffFee: number;
  sellerPayout: number;
} {
  const totalAmount = amount;
  const stripeFee = (totalAmount * FEE_STRUCTURE.STRIPE_FEE_PERCENTAGE / 100) + FEE_STRUCTURE.STRIPE_FIXED_FEE;
  const homecheffFee = totalAmount * FEE_STRUCTURE.HOMECHEFF_FEE_PERCENTAGE / 100;
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