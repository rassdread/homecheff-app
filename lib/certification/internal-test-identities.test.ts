import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isDisposableCertEmail,
  isInternalTestKeepEmail,
  isInternalTestKeepUsername,
} from '@/lib/certification/internal-test-identities';

describe('internal test identities', () => {
  it('keeps MediaCert and rejects disposable validation emails', () => {
    assert.equal(isInternalTestKeepEmail('mediacert+homecheff@example.com'), true);
    assert.equal(isInternalTestKeepUsername('MediaCertHC'), true);
    assert.equal(isDisposableCertEmail('mediacert+homecheff@example.com'), false);
    assert.equal(
      isDisposableCertEmail('appcert+buyer@homecheff-validation.test'),
      true,
    );
  });

  it('never treats homecheff.eu as disposable', () => {
    assert.equal(isDisposableCertEmail('photo@homecheff.eu'), false);
    assert.equal(isDisposableCertEmail('hello@gmail.com'), false);
  });
});
