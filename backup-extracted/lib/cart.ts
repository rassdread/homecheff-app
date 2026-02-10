import { calculatePlatformFeeCents, calculateStripeFeeForBuyer } from './fees';

// Shopping Cart Management
export interface CartItem {
  id: string;
  productId: string;
  title: string;
  priceCents: number;
  quantity: number;
  image?: string;
  sellerName: string;
  sellerId: string;
  deliveryMode: 'PICKUP' | 'DELIVERY' | 'BOTH';
  maxQuantity?: number | null;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  lastUpdated?: number; // Timestamp for cart expiration
}

// Cart storage in localStorage with user-specific keys
const CART_KEY_PREFIX = 'homecheff_cart_';

export function getActiveCartIdentifier(): string {
  if (typeof window === 'undefined') {
    return 'default';
  }

  const userId = localStorage.getItem('current_user_id');
  if (userId) {
    return userId;
  }

  let anonymousId = sessionStorage.getItem('anonymous_cart_id');
  if (!anonymousId) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('anonymous_cart_id', anonymousId);
  }

  return anonymousId;
}

function getCartKey(): string {
  const identifier = getActiveCartIdentifier();
  return `${CART_KEY_PREFIX}${identifier}`;
}

export function getCart(): Cart {
  if (typeof window === 'undefined') return { items: [], totalItems: 0, totalAmount: 0 };
  
  try {
    const cartKey = getCartKey();
    const stored = localStorage.getItem(cartKey);
    if (!stored) return { items: [], totalItems: 0, totalAmount: 0 };
    
    const cart = JSON.parse(stored);
    
    // Check if cart has expired (30 minutes)
    const CART_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds
    const now = Date.now();
    
    if (cart.lastUpdated && (now - cart.lastUpdated) > CART_EXPIRY_TIME) {
      // Cart has expired, clear it
      const emptyCart = { items: [], totalItems: 0, totalAmount: 0, lastUpdated: now };
      saveCart(emptyCart);
      return emptyCart;
    }
    
    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum: number, item: CartItem) => sum + (item.priceCents * item.quantity), 0);
    
    return cart;
  } catch {
    return { items: [], totalItems: 0, totalAmount: 0 };
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cartKey = getCartKey();
    // Always update the timestamp when saving
    const cartWithTimestamp = { ...cart, lastUpdated: Date.now() };
    localStorage.setItem(cartKey, JSON.stringify(cartWithTimestamp));
  } catch (error) {
    console.error('Failed to save cart:', error);
  }
}

export function addToCart(product: {
  id: string;
  title: string;
  priceCents: number;
  image?: string;
  sellerName: string;
  sellerId: string;
  deliveryMode: 'PICKUP' | 'DELIVERY' | 'BOTH';
  maxQuantity?: number | null;
  stock?: number | null;
}, quantity: number = 1): Cart {
  const cart = getCart();
  const existingItemIndex = cart.items.findIndex(item => item.productId === product.id);
  const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
  const limit = typeof product.maxQuantity === 'number'
    ? product.maxQuantity
    : typeof product.stock === 'number'
      ? product.stock
      : null;
  
  if (existingItemIndex >= 0) {
    // Update existing item
    const existingItem = cart.items[existingItemIndex];
    if (limit !== null) {
      const allowedAddition = Math.max(0, limit - existingItem.quantity);
      const quantityToAdd = Math.min(normalizedQuantity, allowedAddition);
      if (quantityToAdd > 0) {
        existingItem.quantity += quantityToAdd;
      }
      existingItem.maxQuantity = limit;
    } else {
      existingItem.quantity += normalizedQuantity;
      existingItem.maxQuantity = null;
    }
  } else {
    // Add new item
    if (limit === null || limit > 0) {
      const quantityToAdd = limit === null ? normalizedQuantity : Math.min(normalizedQuantity, limit);
      if (quantityToAdd > 0) {
        cart.items.push({
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          title: product.title,
          priceCents: product.priceCents,
          quantity: quantityToAdd,
          image: product.image,
          sellerName: product.sellerName,
          sellerId: product.sellerId,
          deliveryMode: product.deliveryMode,
          maxQuantity: limit,
        });
      }
    }
  }
  
  // Recalculate totals
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  
  saveCart(cart);
  return cart;
}

export function updateCartItemQuantity(itemId: string, quantity: number): Cart {
  const cart = getCart();
  const itemIndex = cart.items.findIndex(item => item.id === itemId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }
  }
  
  // Recalculate totals
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  
  saveCart(cart);
  return cart;
}

export function removeFromCart(itemId: string): Cart {
  const cart = getCart();
  cart.items = cart.items.filter(item => item.id !== itemId);
  
  // Recalculate totals
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  
  saveCart(cart);
  return cart;
}

export function clearCart(): Cart {
  const cart = { items: [], totalItems: 0, totalAmount: 0, lastUpdated: Date.now() };
  saveCart(cart);
  return cart;
}

// Set user ID for cart isolation
export function setCartUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (userId) {
    localStorage.setItem('current_user_id', userId);
  } else {
    localStorage.removeItem('current_user_id');
  }
}

// Clear all cart data (for logout)
export function clearAllCartData(): void {
  if (typeof window === 'undefined') return;
  
  // Clear current user ID
  localStorage.removeItem('current_user_id');
  
  // Clear session storage for anonymous carts
  sessionStorage.removeItem('anonymous_cart_id');
  
  // Clear all cart-related localStorage items
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CART_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Get cart expiration info
export function getCartExpirationInfo(): { isExpired: boolean; timeRemaining: number; timeRemainingText: string } {
  if (typeof window === 'undefined') return { isExpired: false, timeRemaining: 0, timeRemainingText: '' };
  
  try {
    const cartKey = getCartKey();
    const stored = localStorage.getItem(cartKey);
    if (!stored) return { isExpired: false, timeRemaining: 0, timeRemainingText: '' };
    
    const cart = JSON.parse(stored);
    if (!cart.lastUpdated) return { isExpired: false, timeRemaining: 0, timeRemainingText: '' };
    
    const CART_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    const timeRemaining = CART_EXPIRY_TIME - (now - cart.lastUpdated);
    const isExpired = timeRemaining <= 0;
    
    let timeRemainingText = '';
    if (!isExpired) {
      const minutes = Math.floor(timeRemaining / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      if (minutes > 0) {
        timeRemainingText = `${minutes}m ${seconds}s`;
      } else {
        timeRemainingText = `${seconds}s`;
      }
    }
    
    return { isExpired, timeRemaining, timeRemainingText };
  } catch {
    return { isExpired: false, timeRemaining: 0, timeRemainingText: '' };
  }
}

// Calculate fees for buyers (only Stripe fee)
export function calculateFees(totalAmount: number): {
  stripeFee: number;
  homecheffFee: number;
  total: number;
} {
  const amountCents = Math.round(totalAmount);
  const { buyerTotalCents, stripeFeeCents } = calculateStripeFeeForBuyer(amountCents);
  
  return {
    stripeFee: stripeFeeCents,
    homecheffFee: 0,
    total: buyerTotalCents,
  };
}

// Calculate fees for sellers (for payout calculation)
export function calculateSellerFees(totalAmount: number): {
  stripeFee: number;
  homecheffFee: number;
  netAmount: number;
} {
  const amountCents = Math.round(totalAmount);
  const stripeFee = 0;
  const homecheffFee = calculatePlatformFeeCents(amountCents);
  const netAmount = amountCents - homecheffFee;

  return {
    stripeFee,
    homecheffFee,
    netAmount,
  };
}

