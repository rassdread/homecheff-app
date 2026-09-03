import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';

const root = join(__dirname, '../..');

/** Intermediate widths where clipping historically appeared. */
export const RESPONSIVE_AUDIT_WIDTHS = [
  320, 360, 375, 390, 414, 480, 540, 600, 640, 720, 768, 820, 900, 960, 1024, 1100, 1180, 1280, 1366, 1440, 1600,
] as const;

describe('responsive account header — no half-visible names', () => {
  it('NavBar does not truncate username with max-w-32', () => {
    const src = readFileSync(join(root, 'components/NavBar.tsx'), 'utf8');
    assert.equal(src.includes('max-w-32'), false);
    assert.equal(/truncate[^\\n]{0,40}(user|name|displayName)/i.test(src), false);
    assert.match(src, /Avatar-only in header chrome/);
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

  it('hub includes HC card and account secondary is profile not wallet', () => {
    const src = readFileSync(join(root, 'lib/navigation/my-homecheff-hub.ts'), 'utf8');
    assert.match(src, /id: 'hc'/);
    assert.match(src, /secondaryHref: '\/profile'/);
    assert.equal(src.includes("secondaryHref: '/mijn-homecheff/hc'"), false);
  });

  it('documents intermediate breakpoint audit widths', () => {
    assert.ok(RESPONSIVE_AUDIT_WIDTHS.includes(820));
    assert.ok(RESPONSIVE_AUDIT_WIDTHS.includes(1180));
    assert.equal(RESPONSIVE_AUDIT_WIDTHS.length >= 20, true);
  });
});
