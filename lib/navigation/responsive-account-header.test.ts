import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';

const root = join(__dirname, '../..');

describe('responsive account header — no half-visible names', () => {
  it('NavBar does not truncate username with max-w-32', () => {
    const src = readFileSync(join(root, 'components/NavBar.tsx'), 'utf8');
    assert.equal(src.includes('max-w-32'), false);
    assert.equal(/truncate[^\\n]{0,40}(user|name|displayName)/i.test(src), false);
  });

  it('SimplifiedAccountMenu shows full name with break-words', () => {
    const src = readFileSync(
      join(root, 'components/navigation/SimplifiedAccountMenu.tsx'),
      'utf8',
    );
    assert.match(src, /break-words/);
    assert.match(src, /Dashboard/);
    assert.match(src, /ECOSYSTEM_PANEL_HEADING/);
    assert.equal(src.includes('Verdiensten'), false); // finance is not top-level
  });

  it('primary dashboard resolves to /mijn-homecheff', () => {
    const src = readFileSync(
      join(root, 'lib/navigation/primary-dashboard.ts'),
      'utf8',
    );
    assert.match(src, /MY_HOMECHEFF_HUB_PATH/);
    assert.match(src, /return MY_HOMECHEFF_HUB_PATH/);
  });
});
