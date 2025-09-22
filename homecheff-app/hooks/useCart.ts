'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { clearAllCartData } from '@/lib/cart';

export interface CartItem {
  id: string;
  title: string;
  priceCents: number;
  quantity: number;
  image?: string;
  seller?: {
    id: string;
    name: string;
  };
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Clear cart when user changes (session isolation)
    if (!session) {
      clearAllCartData();
      setItems([]);
      return;
    }

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
        clearAllCartData();
        setItems([]);
      }
    }
  }, [session]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const updated = prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
        localStorage.setItem('cart', JSON.stringify(updated));
        return updated;
      } else {
        const updated = [...prev, { ...item, quantity: 1 }];
        localStorage.setItem('cart', JSON.stringify(updated));
        return updated;
      }
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      );
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
    isOpen,
    setIsOpen
  };
}