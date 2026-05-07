'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from '@/hooks/useTranslation';

interface AddToCartButtonProps {
  product: {
    id: string;
    title: string;
    priceCents: number;
    image?: string;
    sellerName: string;
    sellerId: string;
    deliveryMode: string; // Can be 'PICKUP', 'DELIVERY', 'SHIPPING', 'BOTH', or comma-separated
    stock?: number | null;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  quantity?: number;
  onAdded?: () => void;
}

export default function AddToCartButton({ 
  product, 
  size = 'md',
  className = '',
  quantity = 1,
  onAdded,
}: AddToCartButtonProps) {
  const { t, tOr } = useTranslation();
  const { addItem, totalItems } = useCart();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  const handleAddToCart = async () => {
    setErrorMessage(null);
    setIsAdding(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = addItem({
      ...product,
      productId: product.id,
      maxQuantity: typeof product.stock === 'number' && product.stock >= 0 ? product.stock : null,
    }, normalizedQuantity);

    setIsAdding(false);
    if (result.addedQuantity <= 0) {
      const remaining = result.availableQuantity ?? 0;
      if (result.reason === 'OUT_OF_STOCK' || remaining === 0) {
        setErrorMessage(tOr('cart.outOfStockMessage', 'This product is no longer in stock.', 'Dit product is helaas niet meer op voorraad.'));
      } else {
        setErrorMessage(
          tOr(
            'cart.alreadyMaxInCart',
            `You already have the maximum (${remaining}) of this product in your cart.`,
            `Je hebt al het maximum aantal (${remaining}) voor dit product in je winkelwagen.`,
          ),
        );
      }
      setIsAdded(false);
      return;
    }

    setIsAdded(true);

    if (!result.success && result.reason === 'LIMIT_REACHED' && result.availableQuantity !== null) {
      const maxAllowed = result.availableQuantity;
      const currentQuantity = result.newQuantity;
      setErrorMessage(
        tOr(
          'cart.limitReachedMessage',
          `Maximum ${maxAllowed} available. Your cart now contains ${currentQuantity}.`,
          `Maximaal ${maxAllowed} beschikbaar. Je winkelwagen bevat nu ${currentQuantity} stuks.`,
        ),
      );
    } else {
      setErrorMessage(null);
    }

    onAdded?.();
    
    // Reset added state after 2 seconds
    setTimeout(() => setIsAdded(false), 2000);
  };

  const sizeStyles = {
    sm: { padding: 'px-3 py-2', text: 'text-sm', icon: 'w-4 h-4' },
    md: { padding: 'px-4 py-3', text: 'text-base', icon: 'w-5 h-5' },
    lg: { padding: 'px-6 py-4', text: 'text-base sm:text-lg', icon: 'w-5 h-5' },
  } as const;
  const sz = sizeStyles[size];

  const goToCheckout = () => {
    router.push('/checkout');
  };

  const labelAdd = tOr('cart.addToCart', 'Add to cart', 'In winkelwagen');
  const labelAdded = tOr('cart.addedToCart', 'Added to cart', 'Toegevoegd');
  const labelAdding = tOr('cart.adding', 'Adding...', 'Toevoegen...');
  const labelCheckout = tOr('cart.goToCheckout', 'Go to checkout', 'Ga naar afrekenen');

  const primaryBase = `inline-flex w-full items-center justify-center gap-2 rounded-2xl ${sz.padding} ${sz.text} font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed`;

  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAdding}
        title={isAdded ? labelAdded : labelAdd}
        aria-label={isAdded ? labelAdded : labelAdd}
        className={`${primaryBase} bg-white text-gray-900 shadow-xl hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-80 ${className}`}
      >
        {isAdding ? (
          <>
            <span
              className={`${sz.icon} animate-spin rounded-full border-2 border-current border-t-transparent flex-shrink-0`}
              aria-hidden
            />
            <span>{labelAdding}</span>
          </>
        ) : isAdded ? (
          <>
            <Check className={`${sz.icon} flex-shrink-0 text-emerald-600`} aria-hidden />
            <span>{labelAdded}</span>
          </>
        ) : (
          <>
            <ShoppingCart className={`${sz.icon} flex-shrink-0`} aria-hidden />
            <span>{labelAdd}</span>
          </>
        )}
      </button>

      {(isAdded || totalItems > 0) && (
        <button
          type="button"
          onClick={goToCheckout}
          title={labelCheckout}
          aria-label={labelCheckout}
          className={`${primaryBase} bg-white/15 text-white border border-white/40 backdrop-blur-sm hover:bg-white/25 hover:scale-[1.02] active:scale-[0.99]`}
        >
          <ShoppingCart className={`${sz.icon} flex-shrink-0`} aria-hidden />
          <span>{labelCheckout}</span>
          <ArrowRight className={`${sz.icon} flex-shrink-0`} aria-hidden />
        </button>
      )}

      {errorMessage && (
        <p className="text-sm font-medium text-red-100 bg-red-700/40 rounded-xl px-3 py-2">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

