import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  INSPIRATION_FEED_MAX_PAGES,
  INSPIRATION_FEED_PAGE_TAKE,
  inspirationFeedShouldContinue,
} from './inspiration-feed-page';

describe('inspiration feed pages', () => {
  it('continues after a full page', () => {
    assert.equal(
      inspirationFeedShouldContinue({
        pageLength: INSPIRATION_FEED_PAGE_TAKE,
        pagesFetched: 1,
      }),
      true,
    );
  });

  it('stops on a short page and at the page cap', () => {
    assert.equal(
      inspirationFeedShouldContinue({
        pageLength: INSPIRATION_FEED_PAGE_TAKE - 1,
        pagesFetched: 1,
      }),
      false,
    );
    assert.equal(
      inspirationFeedShouldContinue({
        pageLength: INSPIRATION_FEED_PAGE_TAKE,
        pagesFetched: INSPIRATION_FEED_MAX_PAGES,
      }),
      false,
    );
  });
});
