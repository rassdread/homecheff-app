/**
 * Ordinary Delen sends the title and public link.
 * The item description is not the share message.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildExactlyOnceWebShareData } from './exactly-once-share';

const root = resolve(process.cwd());

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('ordinary share contract', () => {
  it('native payload keeps the title and one link when text repeats the title', () => {
    const data = buildExactlyOnceWebShareData({
      title: 'Testmaaltijd',
      text: 'Testmaaltijd',
      url: 'https://homecheff.eu/product/test',
    });
    assert.equal(data.title, 'Testmaaltijd');
    assert.equal(data.text, undefined);
    assert.equal(data.url, 'https://homecheff.eu/product/test');
  });

  it('an optional note is sent once and does not repeat the link', () => {
    const data = buildExactlyOnceWebShareData({
      title: 'Testmaaltijd',
      text: 'Eigen bericht',
      url: 'https://homecheff.eu/product/test',
    });
    assert.equal(data.text, 'Eigen bericht');
    assert.equal(data.url, 'https://homecheff.eu/product/test');
    assert.equal(String(data.text).includes('https://'), false);
  });

  it('card and detail share open the public link before any promotion choice', () => {
    for (const file of [
      'components/marketplace/tiles/primitives/TileShareAction.tsx',
      'components/ui/ShareButton.tsx',
    ]) {
      const src = read(file);
      const shareAt = src.indexOf('invokeNativeShareOnce');
      const chooserAt = src.indexOf('setChooserOpen(true)');
      assert.ok(shareAt > 0, file);
      assert.ok(chooserAt > shareAt, file);
      assert.match(src, /toAbsolutePublicUrl/);
      assert.doesNotMatch(src, /shareText=\{description/);
      assert.match(src, /Promoot/);
    }
  });

  it('the HomeCheff menu copies only the link and starts from the title', () => {
    const src = read('components/share/HomecheffVisibleShareSheet.tsx');
    assert.match(src, /const composedText = note\.trim\(\) \|\| shareTitle/);
    assert.match(src, /copyPublicUrl\(effectiveUrl/);
    assert.match(src, /readOnly/);
    assert.match(src, /setCopied\(true\)/);
    assert.doesNotMatch(src, /shareText \|\| shareTitle/);
    assert.match(src, /\}, \[url, shareTitle\]\)/);
  });
});
