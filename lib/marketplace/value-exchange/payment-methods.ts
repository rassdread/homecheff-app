/**
 * Payment method registry — Phase 4A.
 */

import type { ValuePaymentMethodContract } from './value-exchange-contract';
import { VALUE_PAYMENT_METHODS } from './value-exchange-contract';

const KEY = 'marketplace.valueExchange.payment';

export const PAYMENT_METHOD_REGISTRY: Record<
  (typeof VALUE_PAYMENT_METHODS)[number],
  ValuePaymentMethodContract
> = {
  MONEY: {
    id: 'MONEY',
    emoji: '💶',
    labelKey: `${KEY}.money`,
    icon: '💶',
    barterOpenness: ['MONEY'],
    priceModels: ['FIXED', 'FROM_PRICE', 'HOURLY', 'DAILY'],
    tilePriceKey: 'marketplace.tile.price.fixed',
  },
  BARTER: {
    id: 'BARTER',
    emoji: '🔄',
    labelKey: `${KEY}.barter`,
    icon: '🔄',
    barterOpenness: ['BARTER_ONLY'],
    priceModels: ['ON_REQUEST'],
    tilePriceKey: 'marketplace.tile.price.barterOnly',
  },
  MONEY_AND_BARTER: {
    id: 'MONEY_AND_BARTER',
    emoji: '💶🔄',
    labelKey: `${KEY}.moneyAndBarter`,
    icon: '💶🔄',
    barterOpenness: ['MONEY_AND_BARTER'],
    priceModels: ['FIXED', 'FROM_PRICE', 'HOURLY', 'DAILY', 'ON_REQUEST'],
    tilePriceKey: 'marketplace.tile.price.moneyAndBarter',
  },
  VOLUNTARY_CONTRIBUTION: {
    id: 'VOLUNTARY_CONTRIBUTION',
    emoji: '🤝',
    labelKey: `${KEY}.voluntary`,
    icon: '🤝',
    barterOpenness: ['MONEY', 'MONEY_AND_BARTER'],
    priceModels: ['VOLUNTARY'],
    tilePriceKey: 'marketplace.tile.price.voluntary',
  },
  ON_REQUEST: {
    id: 'ON_REQUEST',
    emoji: '💬',
    labelKey: `${KEY}.onRequest`,
    icon: '💬',
    barterOpenness: ['MONEY', 'MONEY_AND_BARTER', 'BARTER_ONLY'],
    priceModels: ['ON_REQUEST'],
    tilePriceKey: 'marketplace.tile.price.onRequest',
  },
};

export function resolvePaymentMethod(input: {
  barterOpenness?: string | null;
  priceModel?: string | null;
}): (typeof VALUE_PAYMENT_METHODS)[number] {
  const openness = String(input.barterOpenness ?? 'MONEY').toUpperCase();
  const priceModel = String(input.priceModel ?? 'FIXED').toUpperCase();

  if (openness === 'BARTER_ONLY') return 'BARTER';
  if (priceModel === 'VOLUNTARY') return 'VOLUNTARY_CONTRIBUTION';
  if (priceModel === 'ON_REQUEST' && openness === 'MONEY') return 'ON_REQUEST';
  if (openness === 'MONEY_AND_BARTER') return 'MONEY_AND_BARTER';
  return 'MONEY';
}

export function listPaymentMethods(): ValuePaymentMethodContract[] {
  return VALUE_PAYMENT_METHODS.map((id) => PAYMENT_METHOD_REGISTRY[id]);
}
