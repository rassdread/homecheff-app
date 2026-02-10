'use client';
import { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2, Euro } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import { calculateFees, getCartExpirationInfo } from '@/lib/cart';
import { useTranslation } from '@/hooks/useTranslation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { t } = useTranslation();
  const { items: cart, updateQuantity, removeItem, clearCart } = useCart();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsRemoving(itemId);
    // Add a small delay for better UX
    setTimeout(() => {
      removeItem(itemId);
      setIsRemoving(null);
    }, 200);
  };

  const handleClearCart = () => {
    if (confirm(t('cart.confirmClearCart'))) {
      clearCart();
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const fees = calculateFees(totalAmount);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-brand rounded-full">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
              <h2 className="text-xl font-bold text-neutral-900">
                Winkelwagen ({totalItems})
              </h2>
              <p className="text-sm text-neutral-600">
                {totalItems > 0 ? 'Klaar om af te rekenen?' : 'Voeg producten toe aan je winkelwagen'}
              </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mb-6">
                  <ShoppingCart className="w-10 h-10 text-primary-brand" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                  Je winkelwagen is leeg
                </h3>
                <p className="text-neutral-600 text-center mb-8 max-w-sm">
                  Voeg producten toe aan je winkelwagen om verder te gaan
                </p>
                <Link
                  href="/inspiratie"
                  onClick={onClose}
                  className="px-8 py-4 bg-primary-brand text-white rounded-xl hover:bg-primary-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>Verder winkelen</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Items */}
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl p-4 transition-all duration-200 border border-neutral-200 hover:shadow-md ${
                      isRemoving === item.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg overflow-hidden flex-shrink-0 border border-primary-200">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                            <Euro className="w-6 h-6 text-primary-brand" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-neutral-900 truncate mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-neutral-600 mb-2">
                          van Verkoper
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-full bg-white border border-primary-200 flex items-center justify-center hover:bg-primary-50 hover:border-primary-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Minus className="w-4 h-4 text-primary-brand" />
                            </button>
                            <span className="w-8 text-center font-medium text-neutral-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-white border border-primary-200 flex items-center justify-center hover:bg-primary-50 hover:border-primary-brand transition-all duration-200"
                            >
                              <Plus className="w-4 h-4 text-primary-brand" />
                            </button>
                          </div>

                          {/* Price and Remove */}
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-primary-brand text-lg">
                              €{((item.priceCents * item.quantity) / 100).toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 hover:bg-red-100 rounded-full transition-all duration-200 hover:scale-110"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Clear Cart Button */}
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Alle items verwijderen
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-neutral-200 p-6 bg-gradient-to-r from-neutral-50 to-primary-50">
              {/* Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-neutral-900">Totaal:</span>
                  <span className="text-primary-brand">€{((totalAmount + fees.stripeFee) / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full bg-primary-brand text-white py-4 rounded-xl hover:bg-primary-700 transition-all duration-200 font-semibold text-center block shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Afrekenen ({totalItems} items)
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
