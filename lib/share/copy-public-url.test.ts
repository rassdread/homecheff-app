import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { copyPublicUrl } from './copy-public-url';

const link = 'https://homecheff.eu/product/testmaaltijd';
const description = 'Lokale testmaaltijd voor de bezorgcontrole';

describe('copy public url', () => {
  it('reports copied only after the public link is written', async () => {
    const written: string[] = [];
    const result = await copyPublicUrl(link, async (value) => {
      written.push(value);
    });
    assert.equal(result, 'copied');
    assert.deepEqual(written, [link]);
    assert.equal(written.some((value) => value.includes(description)), false);
  });

  it('reports manual selection when the clipboard write is refused', async () => {
    const result = await copyPublicUrl(link, async () => {
      throw new DOMException('denied', 'NotAllowedError');
    });
    assert.equal(result, 'manual');
  });
});
