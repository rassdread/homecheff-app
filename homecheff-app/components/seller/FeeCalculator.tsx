'use client';

import { useState, useEffect } from 'react';
import { Euro, Calculator, Info } from 'lucide-react';

interface FeeBreakdown {
  totalAmount: number;
  stripeFee: number;
  homecheffFee: number;
  netAmount: number;
  stripeFeePercentage: string;
  homecheffFeePercentage: string;
}

export default function FeeCalculator() {
  const [amount, setAmount] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<FeeBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateFees = async (totalAmount: number) => {
    if (totalAmount <= 0) {
      setBreakdown(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/seller/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount }),
      });

      if (response.ok) {
        const data = await response.json();
        setBreakdown(data.breakdown);
      }
    } catch (error) {
      console.error('Error calculating fees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateFees(amount);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [amount]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-brand rounded-full">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Fee Calculator
          </h3>
          <p className="text-sm text-neutral-600">
            Bereken hoeveel je ontvangt na fees
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="mb-6">
        <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 mb-2">
          Verkoopprijs (in euro's)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Euro className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 border border-primary-200">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Verkoopprijs:</span>
                <span className="font-semibold">€{(breakdown.totalAmount / 100).toFixed(2)}</span>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 text-xs">💡 Stripe fee wordt door koper betaald</span>
                  <span className="text-green-600 text-xs font-medium">€0.00</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-neutral-600">HomeCheff platform fee ({breakdown.homecheffFeePercentage}%):</span>
                <span className="font-semibold text-red-600">-€{(breakdown.homecheffFee / 100).toFixed(2)}</span>
              </div>
              
              <div className="border-t border-primary-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary-brand">Je ontvangt:</span>
                  <span className="text-lg font-bold text-primary-brand">€{(breakdown.netAmount / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-info-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-info-800">
                <p className="font-medium mb-1">💡 Tips voor verkopers:</p>
                <ul className="space-y-1">
                  <li>• Houd rekening met de 12% platform fee bij het instellen van je verkoopprijzen</li>
                  <li>• Stripe fee (1.4% + €0.25) wordt door de koper betaald</li>
                  <li>• Je ontvangt: Verkoopprijs - 12% HomeCheff fee</li>
                  <li>• Uitbetalingen gebeuren automatisch via Stripe Connect</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-brand"></div>
        </div>
      )}
    </div>
  );
}
