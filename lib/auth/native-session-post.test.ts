import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  nativeDocumentRedirectTarget,
  nativeSessionPostAllowed,
} from '@/lib/auth/native-session-post';

const requestUrl = 'https://homecheff.eu/api/auth/native/google';

describe('native session post', () => {
  it('accepts the site and the installed app, and refuses a foreign login form', () => {
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'https://homecheff.eu',
        fetchSite: 'same-origin',
      }),
      true,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'https://www.homecheff.eu',
        fetchSite: 'same-site',
      }),
      true,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'capacitor://localhost',
        fetchSite: 'cross-site',
      }),
      true,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'https://evil.example',
        fetchSite: 'cross-site',
      }),
      false,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'https://homecheff.nl',
        fetchSite: 'cross-site',
      }),
      false,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: null,
        fetchSite: null,
      }),
      false,
    );
  });

  it('keeps only a safe internal next destination', () => {
    const notice = nativeDocumentRedirectTarget(
      '/auth/social-success?next=%2Fnotifications%2Fadmin%2Fcampaign-1',
      requestUrl,
    );
    assert.equal(
      notice,
      'https://homecheff.eu/auth/social-success?next=%2Fnotifications%2Fadmin%2Fcampaign-1',
    );
    assert.equal(
      nativeDocumentRedirectTarget('/auth/social-success?next=https%3A%2F%2Fevil.example', requestUrl),
      'https://homecheff.eu/auth/social-success',
    );
    assert.equal(
      nativeDocumentRedirectTarget('/auth/social-success?next=%2Flogin', requestUrl),
      'https://homecheff.eu/auth/social-success',
    );
    assert.equal(
      nativeDocumentRedirectTarget('https://evil.example/phish', requestUrl),
      'https://homecheff.eu/',
    );
    assert.equal(nativeDocumentRedirectTarget('//evil.example', requestUrl), 'https://homecheff.eu/');
    assert.equal(nativeDocumentRedirectTarget('', requestUrl), null);
  });
});
