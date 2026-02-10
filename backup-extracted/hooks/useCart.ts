'use client';

import { useState, useEffect, useRef } from 'react';
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

export type CartLimitReason = 'OUT_OF_STOCK' | 'LIMIT_REACHED';

export interface AddItemResult {
  success: boolean;
  addedQuantity: number;
  newQuantity: number;
  availableQuantity: number | null;
  reason?: CartLimitReason;
}

export interface UpdateQuantityResult {
  success: boolean;
  quantity: number;
  availableQuantity: number | null;
  reason?: CartLimitReason;
}

const getNumericLimit = (source: { maxQuantity?: number | null; stock?: number | null } | null | undefined): number | null => {
  if (!source) return null;
  const fromMaxQuantity = source.maxQuantity;
  if (typeof fromMaxQuantity === 'number' && fromMaxQuantity >= 0) {
    return fromMaxQuantity;
  }
  if ('stock' in source) {
    const fromStock = (source as any).stock;
    if (typeof fromStock === 'number' && fromStock >= 0) {
      return fromStock;
    }
  }
  return null;
};

const recalculateCartTotals = (cart: Cart) => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const userId = (session?.user as any)?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    // Detect explicit logout (previously logged-in user -> no user)
    if (previousUserId && !userId) {
      clearAllCartData();
      setCartUserId(null);
    }

    // Set the user ID for cart isolation
    setCartUserId(userId);

    // Load cart from lib/cart.ts
    const cart = getCart();
    setItems(cart.items);

    previousUserIdRef.current = userId;
  }, [session, status]);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity: number = 1): AddItemResult => {
    const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    const cart = getCart();
    const existingItemIndex = cart.items.findIndex(i => i.productId === item.id);

    const existingItem = existingItemIndex >= 0 ? cart.items[existingItemIndex] : null;
    const incomingLimit = getNumericLimit(item);
    const existingLimit = getNumericLimit(existingItem);
    const effectiveLimit = incomingLimit !== null ? incomingLimit : existingLimit;

    let addedQuantity = 0;
    let newQuantity = existingItem ? existingItem.quantity : 0;
    let didMutate = false;
    let reason: CartLimitReason | undefined;

    if (existingItem) {
      // Ensure the stored limit is up to date
      if (incomingLimit !== null && incomingLimit !== existingItem.maxQuantity) {
        existingItem.maxQuantity = incomingLimit;
        didMutate = true;
      }

      // Clamp existing quantity if stock has decreased
      if (effectiveLimit !== null && existingItem.quantity > effectiveLimit) {
        existingItem.quantity = effectiveLimit;
        didMutate = true;
      }
    }

    if (effectiveLimit !== null) {
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const maxAddable = Math.max(0, effectiveLimit - currentQuantity);

      if (maxAddable <= 0) {
        reason = effectiveLimit === 0 ? 'OUT_OF_STOCK' : 'LIMIT_REACHED';
      } else {
        addedQuantity = Math.min(normalizedQuantity, maxAddable);
        if (existingItem) {
          existingItem.quantity += addedQuantity;
          didMutate = true;
        } else {
          cart.items.push({
            id: `${item.id}_${Date.now()}`,
            productId: item.id,
            title: item.title,
            priceCents: item.priceCents,
            quantity: addedQuantity,
            image: item.image,
            sellerName: (item as any).sellerName || 'Verkoper',
            sellerId: (item as any).sellerId || '',
            deliveryMode: (item as any).deliveryMode || 'PICKUP',
            maxQuantity: effectiveLimit,
          });
          didMutate = true;
        }
        if (existingItem) {
          existingItem.maxQuantity = effectiveLimit;
        } else {
          const insertedIndex = cart.items.findIndex(i => i.productId === item.id);
          if (insertedIndex >= 0) {
            cart.items[insertedIndex].maxQuantity = effectiveLimit;
          }
        }

        if (addedQuantity < normalizedQuantity) {
          reason = 'LIMIT_REACHED';
        }
      }
      newQuantity = existingItem
        ? existingItem.quantity
        : addedQuantity;
    } else {
      // Unlimited stock
      if (existingItem) {
        existingItem.quantity += normalizedQuantity;
        existingItem.maxQuantity = null;
        didMutate = true;
      } else {
        cart.items.push({
          id: `${item.id}_${Date.now()}`,
          productId: item.id,
          title: item.title,
          priceCents: item.priceCents,
          quantity: normalizedQuantity,
          image: item.image,
          sellerName: (item as any).sellerName || 'Verkoper',
          sellerId: (item as any).sellerId || '',
          deliveryMode: (item as any).deliveryMode || 'PICKUP',
          maxQuantity: null,
        });
        addedQuantity = normalizedQuantity;
        newQuantity = normalizedQuantity;
        didMutate = true;
      }
      addedQuantity = normalizedQuantity;
      newQuantity = existingItem ? existingItem.quantity : normalizedQuantity;
    }

    if (didMutate) {
      recalculateCartTotals(cart);
      saveCart(cart);
      setItems([...cart.items]);
    }

    return {
      success: addedQuantity > 0 && addedQuantity === normalizedQuantity && !reason,
      addedQuantity,
      newQuantity,
      availableQuantity: effectiveLimit,
      reason,
    };
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

  const updateQuantity = (id: string, quantity: number): UpdateQuantityResult => {
    if (quantity <= 0) {
      removeItem(id);
      return {
        success: true,
        quantity: 0,
        availableQuantity: 0,
        reason: 'OUT_OF_STOCK',
      };
    }
    
    const cart = getCart();
    const itemIndex = cart.items.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      const item = cart.items[itemIndex];
      const limit = getNumericLimit(item);
      let finalQuantity = quantity;
      let reason: CartLimitReason | undefined;

      if (limit !== null && quantity > limit) {
        finalQuantity = limit;
        reason = 'LIMIT_REACHED';
      }

      item.quantity = finalQuantity;

      recalculateCartTotals(cart);
      saveCart(cart);
      setItems([...cart.items]);

      return {
        success: reason === undefined,
        quantity: finalQuantity,
        availableQuantity: limit,
        reason,
      };
    }
    
    return {
      success: false,
      quantity,
      availableQuantity: null,
    };
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