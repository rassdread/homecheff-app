'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCart, addToCart, updateCartItemQuantity, removeFromCart, clearCart, setCartUserId, type Cart, type CartItem } from '@/lib/cart';

export function useCart() {
  const { data: session } = useSession();
  const [cart, setCart] = useState<Cart>({ items: [], totalItems: 0, totalAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set user ID for cart isolation
    if (session?.user?.email) {
      setCartUserId(session.user.email);
    } else {
      setCartUserId(null);
    }

    // Load cart from localStorage on mount
    const loadedCart = getCart();
    setCart(loadedCart);
    setIsLoading(false);
  }, [session]);

  const addItem = (product: {
    id: string;
    title: string;
    priceCents: number;
    image?: string;
    sellerName: string;
    sellerId: string;
    deliveryMode: 'PICKUP' | 'DELIVERY' | 'BOTH';
  }, quantity: number = 1) => {
    const updatedCart = addToCart(product, quantity);
    setCart(updatedCart);
    return updatedCart;
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const updatedCart = updateCartItemQuantity(itemId, quantity);
    setCart(updatedCart);
    return updatedCart;
  };

  const removeItem = (itemId: string) => {
    const updatedCart = removeFromCart(itemId);
    setCart(updatedCart);
    return updatedCart;
  };

  const clear = () => {
    const updatedCart = clearCart();
    setCart(updatedCart);
    return updatedCart;
  };

  const refresh = () => {
    const loadedCart = getCart();
    setCart(loadedCart);
    return loadedCart;
  };

  return {
    cart,
    isLoading,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    refresh,
  };
}


