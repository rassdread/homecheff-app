import { clearAllCartData, rememberCartOwner } from './cart';

/**
 * What the cart may do with the current session observation.
 * A loading or failed read is not a logout and must not delete stored lines.
 */
export type CartSessionSignal =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'account'; userId: string; email?: string | null }
  | { kind: 'confirmed-logout' };

export type CartSessionResult = 'kept' | 'account' | 'cleared';

/**
 * Restore happens by reading the key that is already stored.
 * The owner is updated only for a real account id.
 * A confirmed logout is the only signal that deletes cart keys.
 */
export function applyCartSession(signal: CartSessionSignal): CartSessionResult {
  if (typeof window === 'undefined') return 'kept';
  if (signal.kind === 'loading' || signal.kind === 'unavailable') return 'kept';
  if (signal.kind === 'confirmed-logout') {
    clearAllCartData();
    return 'cleared';
  }

  const userId = signal.userId.trim();
  if (!userId || userId.includes('@')) return 'kept';
  rememberCartOwner({ userId, email: signal.email ?? null });
  return 'account';
}
