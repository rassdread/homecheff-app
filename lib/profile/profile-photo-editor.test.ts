import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('profile photo editor UI contract', () => {
  it('uses a visible labeled file input instead of hidden input.click()', () => {
    const editor = readFileSync(
      join(root, 'components/profile/v2/ProfileV2HeroPhotoEdit.tsx'),
      'utf8',
    );
    assert.match(editor, /htmlFor=\{pickId\}/);
    assert.match(editor, /type="file"/);
    assert.match(editor, /opacity-0/);
    assert.match(editor, /data-hc-profile-photo-choose/);
    assert.match(editor, /data-hc-profile-photo-save/);
    assert.match(editor, /data-hc-profile-photo-cancel/);
    assert.match(editor, /createPortal/);
    assert.doesNotMatch(editor, /fileInputRef\.current\?\.click\(\)/);
  });

  it('owner avatar opens the editor instead of the media lightbox', () => {
    const header = readFileSync(
      join(root, 'components/profile/v2/ProfileV2Header.tsx'),
      'utf8',
    );
    assert.match(header, /onOwnerEdit=\{canEditPhoto/);
    assert.match(header, /onPreview=\{canEditPhoto \? undefined/);
    assert.match(header, /data-hc-profile-photo-open/);
    assert.match(header, /data-hc-profile-photo-badge/);
  });
});
