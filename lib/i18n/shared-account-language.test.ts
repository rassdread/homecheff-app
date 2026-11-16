import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  loadSharedAccountLanguage,
  rememberSharedAccountLanguage,
  resetSharedAccountLanguage,
} from './shared-account-language';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe('shared account language', () => {
  it('uses one request for many simultaneous readers of the same account', async () => {
    resetSharedAccountLanguage();
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return jsonResponse({ language: 'nl' });
    };

    const results = await Promise.all(
      Array.from({ length: 40 }, () =>
        loadSharedAccountLanguage('user-a', fetchImpl),
      ),
    );

    assert.equal(calls, 1);
    assert.deepEqual(results, Array.from({ length: 40 }, () => 'nl'));
  });

  it('does not refetch a resolved preference for the same account', async () => {
    resetSharedAccountLanguage();
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return jsonResponse({ language: 'en' });
    };

    await loadSharedAccountLanguage('user-a', fetchImpl);
    await loadSharedAccountLanguage('user-a', fetchImpl);

    assert.equal(calls, 1);
  });

  it('fetches again for a different account', async () => {
    resetSharedAccountLanguage();
    const seen: string[] = [];
    const fetchImpl = async () => {
      seen.push('fetch');
      return jsonResponse({ language: seen.length === 1 ? 'nl' : 'en' });
    };

    const first = await loadSharedAccountLanguage('user-a', fetchImpl);
    const second = await loadSharedAccountLanguage('user-b', fetchImpl);

    assert.equal(first, 'nl');
    assert.equal(second, 'en');
    assert.equal(seen.length, 2);
  });

  it('drops a failed request so the next read can retry once', async () => {
    resetSharedAccountLanguage();
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return jsonResponse({}, false);
      return jsonResponse({ language: 'nl' });
    };

    const failed = await Promise.all(
      Array.from({ length: 8 }, () =>
        loadSharedAccountLanguage('user-a', fetchImpl),
      ),
    );
    const retried = await loadSharedAccountLanguage('user-a', fetchImpl);

    assert.deepEqual(failed, Array.from({ length: 8 }, () => null));
    assert.equal(calls, 2);
    assert.equal(retried, 'nl');
  });

  it('keeps an explicit language change without another read', async () => {
    resetSharedAccountLanguage();
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return jsonResponse({ language: 'nl' });
    };

    await loadSharedAccountLanguage('user-a', fetchImpl);
    rememberSharedAccountLanguage('user-a', 'en');
    const next = await loadSharedAccountLanguage('user-a', fetchImpl);

    assert.equal(calls, 1);
    assert.equal(next, 'en');
  });
});
