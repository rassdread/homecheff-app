'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getCart, 
  saveCart, 
  clearAllCartData, 
  setCartUserId,
  CartItem as LibCartItem,
  Cart
} from '@/lib/cart';

export interface CartItem extends LibCartItem {}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Set user ID for cart isolation when session changes
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
      // User logged out - clear cart
      clearAllCartData();
      setItems([]);
      return;
    }

    // Set the user ID for cart isolation
    setCartUserId(userId);

    // Load cart from lib/cart.ts
    const cart = getCart();
    setItems(cart.items);
  }, [session]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const cart = getCart();
    const existingItemIndex = cart.items.findIndex(i => i.productId === item.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      cart.items.push({
        id: `${item.id}_${Date.now()}`,
        productId: item.id,
        title: item.title,
        priceCents: item.priceCents,
        quantity: 1,
        image: item.image,
        sellerName: (item as any).sellerName || 'Verkoper',
        sellerId: (item as any).sellerId || '',
        deliveryMode: (item as any).deliveryMode || 'PICKUP',
      });
    }
    
    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.priceCents * i.quantity), 0);
    
    saveCart(cart);
    setItems([...cart.items]);
  };

  const removeItem = (id: string) => {
    const cart = getCart();
    cart.items = cart.items.filter(item => item.id !== id);
    
    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
    
    saveCart(cart);
    setItems([...cart.items]);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    const cart = getCart();
    const itemIndex = cart.items.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity = quantity;
    }
    
    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
    
    saveCart(cart);
    setItems([...cart.items]);
  };

  const clearCart = () => {
    const cart = { items: [], totalItems: 0, totalAmount: 0, lastUpdated: Date.now() };
    saveCart(cart);
    setItems([]);
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