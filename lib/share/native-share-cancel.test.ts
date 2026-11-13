import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { invokeNativeShareOnce } from './exactly-once-share';

describe('native share cancel', () => {
  it('treats a dismissed device sheet as cancel and allows a later share', async () => {
    const previous = globalThis.navigator;
    let calls = 0;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        canShare: () => true,
        share: async () => {
          calls += 1;
          const error = new Error('The user aborted a request.');
          error.name = 'AbortError';
          throw error;
        },
      },
    });
    try {
      const first = await invokeNativeShareOnce({
        title: 'Titel',
        text: 'Titel',
        url: 'http://localhost:3000/product/voorbeeld',
      });
      const second = await invokeNativeShareOnce({
        title: 'Titel',
        text: 'Titel',
        url: 'http://localhost:3000/product/voorbeeld',
      });
      assert.equal(first.method, 'cancelled');
      assert.equal(second.method, 'cancelled');
      assert.equal(calls, 2);
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: previous,
      });
    }
  });
});
