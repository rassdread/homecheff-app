'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, ShoppingCart, Trash2, Euro } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import { calculateFees } from '@/lib/cart';
import { groupCartBySeller } from '@/lib/checkout/fulfillment-phase1';
import { useTranslation } from '@/hooks/useTranslation';
import CartAgreementSection from '@/components/cart/CartAgreementSection';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { t } = useTranslation();
  const { items: cart, updateQuantity, removeItem, clearCart } = useCart();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Bij openen: scroll naar boven zodat de banner/header van de winkelwagen zichtbaar is
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      requestAnimationFrame(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      });
    }
  }, [isOpen]);

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
  const sellerGroups = groupCartBySeller(cart);

  if (!isOpen) return null;

  // Portal naar body zodat de drawer boven de navbar/banner verschijnt (niet erachter)
  const drawerContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[99998]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[99999]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-brand rounded-full">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
              <h2 className="text-xl font-bold text-neutral-900">
                {t('cart.titleWithCount', { count: totalItems })}
              </h2>
              <p className="text-sm text-neutral-600">
                {totalItems > 0 ? t('cart.headerReady') : t('cart.headerAddPrompt')}
              </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label={t('buttons.close')}
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto">
            <section className="p-6" aria-labelledby="cart-products-heading">
              <h3 id="cart-products-heading" className="text-base font-bold text-neutral-900">
                {t('cart.title')}
              </h3>
              {sellerGroups.length > 1 ? (
                <p className="mt-1 text-xs text-neutral-600">{t('cart.mixedSellersHint')}</p>
              ) : null}
              {cart.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <h4 className="text-lg font-bold text-neutral-900 mb-2">
                    {t('cart.emptyTitle')}
                  </h4>
                  <p className="text-neutral-600 text-center mb-6 max-w-sm">
                    {t('cart.emptyHint')}
                  </p>
                  <Link
                    href="/#homecheff-feed"
                    onClick={onClose}
                    className="px-6 py-3 bg-primary-brand text-white rounded-xl hover:bg-primary-700 font-semibold"
                  >
                    {t('cart.continueShopping')}
                  </Link>
                </div>
              ) : (
              <div className="mt-4 space-y-6">
                {sellerGroups.map((group) => (
                  <div key={group.sellerId || 'seller'} className="space-y-4">
                    <p className="text-sm font-semibold text-neutral-800">
                      {group.sellerName || t('cart.providerFallback')}
                    </p>
                {group.items.map((item) => (
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
                          {t('cart.soldBy', {
                            name:
                              item.sellerName && item.sellerName !== 'Verkoper'
                                ? item.sellerName
                                : t('cart.providerFallback'),
                          })}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label={t('cart.quantity')}
                              className="w-8 h-8 rounded-full bg-white border border-primary-200 flex items-center justify-center hover:bg-primary-50 hover:border-primary-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Minus className="w-4 h-4 text-primary-brand" />
                            </button>
                            <span className="w-8 text-center font-medium text-neutral-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              aria-label={t('cart.quantity')}
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
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              aria-label={t('cart.remove')}
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
                    {sellerGroups.length > 1 && group.sellerId ? (
                      <Link
                        href={`/checkout?sellerId=${encodeURIComponent(group.sellerId)}`}
                        onClick={onClose}
                        className="block w-full rounded-xl bg-primary-brand py-3 text-center text-sm font-semibold text-white"
                      >
                        {t('cart.checkoutThisSeller', { name: group.sellerName || t('cart.providerFallback') })}
                      </Link>
                    ) : null}
                  </div>
                ))}

                {/* Clear Cart Button */}
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {t('cart.clearAll')}
                  </button>
                )}
              </div>
              )}
            </section>
            <CartAgreementSection active={isOpen} />
          </div>

          {/* Footer */}
          {sellerGroups.length === 1 && sellerGroups[0]?.sellerId && (
            <div className="border-t border-neutral-200 p-6 bg-gradient-to-r from-neutral-50 to-primary-50">
              {/* Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-neutral-900">{t('cart.totalLabel')}</span>
                  <span className="text-primary-brand">€{((totalAmount + fees.stripeFee) / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href={`/checkout?sellerId=${encodeURIComponent(sellerGroups[0].sellerId)}`}
                onClick={onClose}
                className="w-full bg-primary-brand text-white py-4 rounded-xl hover:bg-primary-700 transition-all duration-200 font-semibold text-center block shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('cart.checkoutWithCount', { count: totalItems })}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null;
}
