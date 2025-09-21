'use client';
import { useState } from 'react';
import { ShoppingCart, Plus, Check } from 'lucide-react';
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
    deliveryMode: 'PICKUP' | 'DELIVERY' | 'BOTH';
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AddToCartButton({ 
  product, 
  variant = 'default', 
  size = 'md',
  className = ''
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addItem(product);
    setIsAdding(false);
    setIsAdded(true);
    
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

  if (isAdded) {
    return (
      <Button
        variant={variant}
        className={`${buttonSizes[size]} ${className} bg-green-600 hover:bg-green-700 text-white`}
        disabled
      >
        <Check className={`${iconSizes[size]} mr-2`} />
        Toegevoegd!
      </Button>
    );
  }

  return (
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
      ) : (
        <>
          <ShoppingCart className={`${iconSizes[size]} mr-2`} />
          In winkelwagen
        </>
      )}
    </Button>
  );
}


