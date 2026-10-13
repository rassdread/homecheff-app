import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deliveryRegistrationReturnFromCallback,
  deliveryRegistrationReturnPath,
} from '@/lib/auth/delivery-registration-return';

describe('delivery registration return path', () => {
  it('keeps the three public signup routes and standard UTM keys', () => {
    assert.equal(
      deliveryRegistrationReturnFromCallback(
        '/delivery/company/signup?utm_source=indeed&utm_content=almere',
      ),
      '/delivery/company/signup?utm_source=indeed&utm_content=almere',
    );
    assert.equal(deliveryRegistrationReturnPath('/delivery/signup'), '/delivery/signup');
    assert.equal(deliveryRegistrationReturnPath('/login'), null);
    assert.equal(deliveryRegistrationReturnFromCallback('https://evil.example/delivery/signup'), null);
    assert.equal(
      deliveryRegistrationReturnFromCallback('/delivery/signup?utm_source=a@b.nl'),
      '/delivery/signup',
    );
  });
});
