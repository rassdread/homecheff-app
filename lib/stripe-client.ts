import { loadStripe } from '@stripe/stripe-js';
import { financialStripePublishableKey } from '@/lib/stripe-runtime-guard';

let stripePromise: Promise<any> | null = null;

function previewBrowserHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app');
}

export const getStripe = () => {
  if (!stripePromise) {
    const key = financialStripePublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
      previewHost: previewBrowserHost(),
    });
    if (!key) return null;
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};


