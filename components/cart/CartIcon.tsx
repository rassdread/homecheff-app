'use client';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import CartDrawer from './CartDrawer';
import { useTranslation } from '@/hooks/useTranslation';

export default function CartIcon() {
  const { items: cart, totalItems } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="relative p-2 text-gray-600 hover:text-primary-brand transition-colors rounded-lg hover:bg-gray-50"
        disabled={false}
        title={t('cart.title')}
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-brand text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
      
      <CartDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
}

