"use client";
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";
import { CreditCard, Loader2 } from "lucide-react";

// Test modus - geen echte Stripe keys nodig
const isTestMode = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === 'test';
const stripePromise = isTestMode ? null : loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentButtonProps {
  productId: string;
  amount: number;
  productTitle: string;
  sellerName: string;
}

export default function PaymentButton({ 
  productId, 
  amount, 
  productTitle, 
  sellerName 
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isTestMode) {
        // Test modus - simuleer betaling
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simuleer loading
        window.location.href = `/payment/success?payment_id=test_${Date.now()}`;
        return;
      }

      // Maak betaling aan
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment creation failed");
      }

      // Redirect naar Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?payment_id=${data.paymentId}`,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Betaling Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Product:</span>
            <span className="font-medium">{productTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Verkoper:</span>
            <span className="font-medium">{sellerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Totaal:</span>
            <span className="font-semibold text-lg">€{amount.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>• Stripe fee: 1.4% + €0.25</p>
            <p>• HomeCheff fee: 5%</p>
            <p>• Verkoper ontvangt: 93.6%</p>
          </div>
          {isTestMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
              <p className="text-yellow-800 text-xs">
                🧪 Test modus - Geen echte betaling
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {isTestMode ? 'Test betaling...' : 'Betaling verwerken...'}
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {isTestMode ? 'Test betaling' : 'Nu betalen met Stripe'}
          </>
        )}
      </Button>
    </div>
  );
}