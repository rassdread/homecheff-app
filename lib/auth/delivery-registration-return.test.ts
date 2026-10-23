import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deliveryRegistrationReturnFromCallback,
  deliveryRegistrationReturnPath,
  shouldResumeDeliveryRegistrationIntent,
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

  it('does not send a courier from a workspace or the wizard back to signup', () => {
    assert.equal(
      shouldResumeDeliveryRegistrationIntent('/delivery/dashboard', '/delivery/signup'),
      false,
    );
    assert.equal(
      shouldResumeDeliveryRegistrationIntent(
        '/delivery/dashboard/?welcome=true&newSignup=true',
        '/delivery/signup/',
      ),
      false,
    );
    assert.equal(
      shouldResumeDeliveryRegistrationIntent(
        '/delivery/company/dashboard',
        '/delivery/company/signup',
      ),
      false,
    );
    assert.equal(
      shouldResumeDeliveryRegistrationIntent('/delivery/signup', '/delivery/signup'),
      false,
    );
    assert.equal(
      shouldResumeDeliveryRegistrationIntent('/login', '/delivery/signup'),
      true,
    );
    assert.equal(
      shouldResumeDeliveryRegistrationIntent('/', '/delivery/signup?utm_source=indeed'),
      true,
    );
    assert.equal(shouldResumeDeliveryRegistrationIntent('/delivery/dashboard', '/'), true);
  });
});
