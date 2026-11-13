import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getCart, rememberCartOwner, saveCart } from './cart';

function installStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true });
  return store;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('cart owner identity', () => {
  it('moves a cart saved under the email to the account id before checkout reads it', () => {
    const store = installStorage();
    const email = 'koper@example.com';
    localStorage.setItem('current_user_id', email);
    saveCart({
      items: [
        {
          id: 'line-1',
          productId: 'product-1',
          title: 'Testmaaltijd met bezorging',
          priceCents: 800,
          quantity: 1,
          sellerName: 'Verkoper',
          sellerId: 'seller-1',
          deliveryMode: 'DELIVERY',
        },
      ],
      totalItems: 1,
      totalAmount: 800,
    });

    rememberCartOwner({ userId: 'account-1', email });

    assert.equal(localStorage.getItem('current_user_id'), 'account-1');
    assert.equal(store.has(`homecheff_cart_${email}`), false);
    const cart = getCart();
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0]?.deliveryMode, 'DELIVERY');
    assert.equal(cart.items[0]?.quantity, 1);
    assert.equal(cart.totalAmount, 800);
  });

  it('does not replace an existing account cart with an empty email cart', () => {
    installStorage();
    localStorage.setItem('current_user_id', 'account-1');
    saveCart({
      items: [
        {
          id: 'line-1',
          productId: 'product-1',
          title: 'Testmaaltijd met bezorging',
          priceCents: 800,
          quantity: 1,
          sellerName: 'Verkoper',
          sellerId: 'seller-1',
          deliveryMode: 'DELIVERY',
        },
      ],
      totalItems: 1,
      totalAmount: 800,
    });
    localStorage.setItem(
      'homecheff_cart_koper@example.com',
      JSON.stringify({ items: [], totalItems: 0, totalAmount: 0 }),
    );

    rememberCartOwner({ userId: 'account-1', email: 'koper@example.com' });

    assert.equal(getCart().items.length, 1);
  });
});
