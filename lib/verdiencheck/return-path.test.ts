import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveVerdienCheckReturnPath, safeInternalReturnPath } from './return-path';

describe('VerdienCheck return path', () => {
  it('allows internal routes and rejects open redirects', () => {
    assert.equal(safeInternalReturnPath('/faq'), '/faq');
    assert.equal(safeInternalReturnPath('/sell/new?x=1'), '/sell/new?x=1');
    assert.equal(safeInternalReturnPath('https://evil.example/faq'), null);
    assert.equal(safeInternalReturnPath('//evil.example'), null);
    assert.equal(safeInternalReturnPath('/\\evil.example'), null);
    assert.equal(safeInternalReturnPath('/%2F%2Fevil.example'), null);
    assert.equal(safeInternalReturnPath('/faq/../../etc'), null);
    assert.equal(safeInternalReturnPath('/verdiencheck'), null);
    assert.equal(safeInternalReturnPath('/verdiencheck?from=faq'), null);
  });

  it('prefers returnTo, then a known from page, then home', () => {
    assert.equal(
      resolveVerdienCheckReturnPath({ returnTo: '/careers', from: 'faq' }),
      '/careers',
    );
    assert.equal(resolveVerdienCheckReturnPath({ from: 'faq' }), '/faq');
    assert.equal(resolveVerdienCheckReturnPath({ from: 'seller' }), '/sell');
    assert.equal(resolveVerdienCheckReturnPath({ from: 'werken-bij' }), '/werken-bij');
    assert.equal(resolveVerdienCheckReturnPath({ from: '/notifications' }), '/notifications');
    assert.equal(
      resolveVerdienCheckReturnPath({ from: 'direct', referrerPath: '/faq' }),
      '/faq',
    );
    assert.equal(resolveVerdienCheckReturnPath({ from: 'https://evil.example' }), '/');
    assert.equal(resolveVerdienCheckReturnPath({}), '/');
  });
});
