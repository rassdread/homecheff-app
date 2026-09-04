import assert from 'node:assert/strict';
import {
  isDeliveryBusinessProvider,
  resolveProviderCardKind,
  resolveProviderDisplayName,
} from './provider-identity';

assert.equal(isDeliveryBusinessProvider('DELIVERY_BUSINESS'), true);
assert.equal(isDeliveryBusinessProvider('INDEPENDENT'), false);
assert.equal(resolveProviderCardKind('DELIVERY_BUSINESS'), 'COMPANY');
assert.equal(resolveProviderCardKind('INDEPENDENT'), 'INDIVIDUAL');
assert.equal(
  resolveProviderDisplayName({
    providerType: 'DELIVERY_BUSINESS',
    companyDisplayName: 'Vlaardingen Express',
    userName: 'Owner',
  }),
  'Vlaardingen Express',
);
assert.equal(
  resolveProviderDisplayName({
    providerType: 'INDEPENDENT',
    companyDisplayName: 'Ignored',
    userName: 'Jan',
  }),
  'Jan',
);

console.log('provider-identity.test.ts: ok');
