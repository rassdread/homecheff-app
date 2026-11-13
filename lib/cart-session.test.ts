import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  addToCart,
  getCart,
  getCartItemsSnapshot,
  saveCart,
  subscribeCartStore,
  type CartItem,
} from './cart';
import { applyCartSession } from './cart-session';
import { clearSensitiveUserDataOnLogout } from './session-cleanup';

function line(productId: string, quantity = 1): CartItem {
  return {
    id: `line-${productId}`,
    productId,
    title: 'Testmaaltijd met bezorging',
    priceCents: 800,
    quantity,
    sellerName: 'Verkoper',
    sellerId: 'seller-1',
    deliveryMode: 'DELIVERY',
  };
}

function installStorage() {
  const buckets = {
    local: new Map<string, string>(),
    session: new Map<string, string>(),
  };
  const storage = (bucket: Map<string, string>) => ({
    getItem: (key: string) => (bucket.has(key) ? bucket.get(key)! : null),
    setItem: (key: string, value: string) => {
      bucket.set(key, String(value));
    },
    removeItem: (key: string) => {
      bucket.delete(key);
    },
    key: (index: number) => [...bucket.keys()][index] ?? null,
    get length() {
      return bucket.size;
    },
    clear: () => bucket.clear(),
  });
  Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage(buckets.local),
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage(buckets.session),
    configurable: true,
  });
  return buckets.local;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('cart session order', () => {
  it('reads a stored account cart before a later session, and a failed session does not delete it', () => {
    const store = installStorage();
    localStorage.setItem('current_user_id', 'account-a');
    saveCart({
      items: [line('product-1')],
      totalItems: 1,
      totalAmount: 800,
    });

    assert.equal(applyCartSession({ kind: 'loading' }), 'kept');
    assert.equal(getCartItemsSnapshot().length, 1);

    assert.equal(applyCartSession({ kind: 'unavailable' }), 'kept');
    assert.equal(store.has('homecheff_cart_account-a'), true);
    assert.equal(getCart().items[0]?.quantity, 1);
    assert.equal(getCart().items[0]?.deliveryMode, 'DELIVERY');

    assert.equal(
      applyCartSession({
        kind: 'account',
        userId: 'account-a',
        email: 'koper@example.com',
      }),
      'account',
    );
    assert.equal(getCart().items.length, 1);
    assert.equal(applyCartSession({ kind: 'unavailable' }), 'kept');
    assert.equal(getCartItemsSnapshot().length, 1);
  });

  it('shares one snapshot between the drawer and checkout, including after a repeated init', () => {
    installStorage();
    const seen: number[] = [];
    const unsubscribe = subscribeCartStore(() => {
      seen.push(getCartItemsSnapshot().reduce((sum, item) => sum + item.quantity, 0));
    });

    applyCartSession({ kind: 'account', userId: 'account-a', email: 'koper@example.com' });
    addToCart({
      id: 'product-1',
      title: 'Testmaaltijd met bezorging',
      priceCents: 800,
      sellerName: 'Verkoper',
      sellerId: 'seller-1',
      deliveryMode: 'DELIVERY',
    });
    const drawer = getCartItemsSnapshot();
    const checkout = getCartItemsSnapshot();
    assert.equal(drawer, checkout);
    assert.equal(drawer.length, 1);
    assert.equal(drawer[0]?.quantity, 1);

    applyCartSession({ kind: 'loading' });
    applyCartSession({ kind: 'account', userId: 'account-a', email: 'koper@example.com' });
    assert.equal(getCart().items.length, 1);
    assert.equal(getCart().totalItems, 1);
    assert.ok(seen.includes(1));
    unsubscribe();
  });

  it('adopts an email cart once and does not let an empty email cart replace account lines', () => {
    const store = installStorage();
    localStorage.setItem('current_user_id', 'koper@example.com');
    saveCart({
      items: [line('product-1')],
      totalItems: 1,
      totalAmount: 800,
    });

    applyCartSession({ kind: 'loading' });
    assert.equal(store.has('homecheff_cart_koper@example.com'), true);
    applyCartSession({
      kind: 'account',
      userId: 'account-a',
      email: 'koper@example.com',
    });
    assert.equal(store.has('homecheff_cart_koper@example.com'), false);
    assert.equal(getCart().items.length, 1);
    assert.equal(localStorage.getItem('current_user_id'), 'account-a');

    localStorage.setItem(
      'homecheff_cart_koper@example.com',
      JSON.stringify({ items: [], totalItems: 0, totalAmount: 0 }),
    );
    applyCartSession({
      kind: 'account',
      userId: 'account-a',
      email: 'koper@example.com',
    });
    assert.equal(getCart().items.length, 1);
    assert.equal(store.has('homecheff_cart_koper@example.com'), true);
  });

  it('keeps both carts when each already has lines and shows the account cart', () => {
    const store = installStorage();
    localStorage.setItem(
      'homecheff_cart_koper@example.com',
      JSON.stringify({ items: [line('email-product')], totalItems: 1, totalAmount: 800 }),
    );
    localStorage.setItem('current_user_id', 'account-a');
    saveCart({
      items: [line('account-product')],
      totalItems: 1,
      totalAmount: 800,
    });

    applyCartSession({
      kind: 'account',
      userId: 'account-a',
      email: 'koper@example.com',
    });

    assert.equal(getCart().items[0]?.productId, 'account-product');
    const emailCart = JSON.parse(store.get('homecheff_cart_koper@example.com')!);
    assert.equal(emailCart.items[0].productId, 'email-product');
  });

  it('hides the previous account on logout and restores each account on the next sign-in', () => {
    const store = installStorage();
    applyCartSession({ kind: 'account', userId: 'account-a', email: 'a@example.com' });
    saveCart({
      items: [line('product-a')],
      totalItems: 1,
      totalAmount: 800,
    });

    clearSensitiveUserDataOnLogout();
    assert.equal(localStorage.getItem('current_user_id'), null);
    assert.equal(getCartItemsSnapshot().length, 0);
    assert.equal(store.has('homecheff_cart_account-a'), true);

    applyCartSession({ kind: 'account', userId: 'account-b', email: 'b@example.com' });
    assert.equal(getCart().items.length, 0);
    addToCart({
      id: 'product-b',
      title: 'Testmaaltijd met bezorging',
      priceCents: 800,
      sellerName: 'Verkoper',
      sellerId: 'seller-1',
      deliveryMode: 'DELIVERY',
    });
    assert.equal(getCart().items[0]?.productId, 'product-b');

    clearSensitiveUserDataOnLogout();
    applyCartSession({ kind: 'account', userId: 'account-a', email: 'a@example.com' });
    assert.equal(getCart().items[0]?.productId, 'product-a');
    assert.equal(getCart().items.some((item) => item.productId === 'product-b'), false);
    const accountB = JSON.parse(store.get('homecheff_cart_account-b')!);
    assert.equal(accountB.items[0].productId, 'product-b');
  });
});
