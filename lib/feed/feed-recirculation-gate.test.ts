import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('feed recirculation is not ended by a discovery constraint', () => {
  it('does not stop load-more before the existing recirculation batch', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'components/feed/GeoFeed.tsx'),
      'utf8',
    );
    assert.equal(
      src.includes('shouldRecirculate && discoveryConstraintActiveRef'),
      false,
    );
    assert.equal(src.includes('data-testid="feed-recirculation"'), true);
  });
});
