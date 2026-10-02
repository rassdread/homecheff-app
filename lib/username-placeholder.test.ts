import assert from 'node:assert/strict';
import test from 'node:test';
import { needsDefinitiveUsername } from './account-requirements';
import {
  isDisallowedFinalUsername,
  usernameContainsTempPlaceholder,
} from './username-placeholder';

test('a stored definitive username is not a placeholder', () => {
  for (const username of ['Rass', 'sergio', 'attempt', 'contemporary']) {
    assert.equal(usernameContainsTempPlaceholder(username), false);
    assert.equal(needsDefinitiveUsername(username), false);
    assert.equal(isDisallowedFinalUsername(username), false);
  }
});

test('missing and generated placeholders still need a definitive username', () => {
  for (const username of [null, undefined, '', '   ', 'temp_1763833239379_g0ctb9e2x', 'user_1234']) {
    assert.equal(needsDefinitiveUsername(username), true);
  }
  assert.equal(usernameContainsTempPlaceholder(null), false);
  assert.equal(usernameContainsTempPlaceholder('temp_1763833239379_g0ctb9e2x'), true);
  assert.equal(isDisallowedFinalUsername('temp_1_ab'), true);
});
