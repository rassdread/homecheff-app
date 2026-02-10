'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';

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
  variant = 'default', 
  size = 'md',
  className = '',
  quantity = 1,
  onAdded,
}: AddToCartButtonProps) {
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
        setErrorMessage('Dit product is helaas niet meer op voorraad.');
      } else {
        setErrorMessage(`Je hebt al het maximum aantal (${remaining}) voor dit product in je winkelwagen.`);
      }
      setIsAdded(false);
      return;
    }

    setIsAdded(true);

    if (!result.success && result.reason === 'LIMIT_REACHED' && result.availableQuantity !== null) {
      const maxAllowed = result.availableQuantity;
      const currentQuantity = result.newQuantity;
      setErrorMessage(`Maximaal ${maxAllowed} beschikbaar. Je winkelwagen bevat nu ${currentQuantity} stuks.`);
    } else {
      setErrorMessage(null);
    }

    onAdded?.();
    
    // Reset added state after 2 seconds
    setTimeout(() => setIsAdded(false), 2000);
  };

  const buttonSizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const goToCheckout = () => {
    router.push('/checkout');
  };

  const renderCartShortcut = () => (
    <Button
      type="button"
      variant="outline"
      onClick={goToCheckout}
      className={`${buttonSizes[size]} w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-primary-brand text-primary-brand bg-white hover:bg-primary-50`}
    >
      <ShoppingCart className={`${iconSizes[size]}`} />
      Ga naar afrekenen
      <ArrowRight className={`${iconSizes[size]}`} />
    </Button>
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        variant={variant}
        className={`${buttonSizes[size]} ${className}`}
      >
        {isAdding ? (
          <>
            <div className={`${iconSizes[size]} mr-2 animate-spin rounded-full border-2 border-current border-t-transparent`} />
            Toevoegen...
          </>
        ) : isAdded ? (
          <>
            <Check className={`${iconSizes[size]} mr-2`} />
            Toegevoegd!
          </>
        ) : (
          <>
            <ShoppingCart className={`${iconSizes[size]} mr-2`} />
            In winkelwagen
          </>
        )}
      </Button>

      {(isAdded || totalItems > 0) && renderCartShortcut()}

      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

