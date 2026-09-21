import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { toCanonicalTaxonomyId } from '@/lib/marketplace/taxonomy-normalize';
import {
  getEntryFlowItemsForGroup,
  getMarketplaceTaxonomyGroupsByCategory,
  getMarketplaceTaxonomyItem,
} from '@/lib/marketplace/taxonomy-resolve';
import {
  accordionGroupIdForTaxonomyId,
  accordionGroupNeedsSearch,
  accordionGroupsForSelection,
  constrainSpecializationsToOneCategory,
  filterAccordionGroupItems,
  getOfferAccordionGroups,
  getServiceAccordionGroups,
  isServiceMarketplaceCategory,
  isStudioSessionTaxonomyId,
  marketplaceCategoryFromSpecializations,
  selectionRequiresCustomLabel,
  STUDIO_SESSION_TAXONOMY_ID,
} from '@/lib/marketplace/taxonomy-accordion';
import { TAXONOMY_GROUP_LABELS, TAXONOMY_ITEM_LABELS } from '@/lib/marketplace/taxonomy-labels.data';
import { isWorkshopTaxonomyId } from '@/lib/marketplace/form-config';

const MUSIC_GROUP = 'grp.artistic.music';

describe('service taxonomy accordion registry', () => {
  it('exposes studio session under Music & audio without duplicating workshop', () => {
    const studio = getMarketplaceTaxonomyItem(STUDIO_SESSION_TAXONOMY_ID);
    assert.equal(studio?.parentId, MUSIC_GROUP);
    assert.equal(studio?.category, 'ARTISTIC_SERVICE');
    assert.equal(TAXONOMY_ITEM_LABELS['artistic.studio_session'].nl, 'Studiosessie');
    assert.equal(TAXONOMY_GROUP_LABELS['artistic.music'].nl, 'Muziek & audio');
    assert.equal(isStudioSessionTaxonomyId(STUDIO_SESSION_TAXONOMY_ID), true);
    assert.equal(isWorkshopTaxonomyId(STUDIO_SESSION_TAXONOMY_ID), false);
  });

  it('reuses existing music, voice, workshop, course-adjacent ids', () => {
    assert.equal(getMarketplaceTaxonomyItem('artistic.music')?.parentId, MUSIC_GROUP);
    assert.equal(getMarketplaceTaxonomyItem('artistic.voice')?.parentId, MUSIC_GROUP);
    assert.equal(getMarketplaceTaxonomyItem('knowledge.workshop')?.id, 'knowledge.workshop');
    assert.equal(getMarketplaceTaxonomyItem('knowledge.musicclass')?.id, 'knowledge.musicclass');
    assert.equal(getMarketplaceTaxonomyItem('knowledge.coaching')?.id, 'knowledge.coaching');
    assert.equal(getMarketplaceTaxonomyItem('design.photo')?.id, 'design.photo');
    assert.equal(getMarketplaceTaxonomyItem('design.video')?.id, 'design.video');
  });

  it('adds missing learning types without renaming workshop', () => {
    assert.equal(TAXONOMY_ITEM_LABELS['knowledge.workshop'].nl, 'Workshop');
    assert.equal(TAXONOMY_ITEM_LABELS['knowledge.course'].nl, 'Cursus');
    assert.equal(TAXONOMY_ITEM_LABELS['knowledge.training'].nl, 'Training / bijscholing');
    assert.equal(isWorkshopTaxonomyId('knowledge.course'), true);
    assert.equal(isWorkshopTaxonomyId('knowledge.training'), true);
  });

  it('keeps artistic groups collapsed by default and opens the selected group on edit', () => {
    const groups = getMarketplaceTaxonomyGroupsByCategory('ARTISTIC_SERVICE').map((g) => g.id);
    assert.deepEqual(groups, [
      'grp.artistic.music',
      'grp.artistic.body',
      'grp.artistic.visual',
    ]);
    assert.deepEqual(accordionGroupsForSelection('ARTISTIC_SERVICE', []), []);
    assert.deepEqual(
      accordionGroupsForSelection('ARTISTIC_SERVICE', ['artistic.studio_session']),
      [MUSIC_GROUP],
    );
    assert.equal(accordionGroupIdForTaxonomyId('knowledge.workshop'), 'grp.knowledge.all');
  });

  it('offers an Other choice per service accordion group', () => {
    const music = getEntryFlowItemsForGroup(MUSIC_GROUP, 'offer').map((item) => item.id);
    assert.ok(music.includes('artistic.music_other'));
    assert.equal(selectionRequiresCustomLabel(['artistic.music_other']), true);
    assert.equal(getMarketplaceTaxonomyItem('design.other')?.requiresCustomLabel, true);
    assert.equal(getMarketplaceTaxonomyItem('knowledge.other')?.requiresCustomLabel, true);
    assert.equal(getMarketplaceTaxonomyItem('practical.other')?.requiresCustomLabel, true);
  });

  it('lists Music, Creative and Learning as sibling service accordion groups', () => {
    const ids = getServiceAccordionGroups().map((group) => group.id);
    assert.equal(ids[0], 'grp.artistic.music');
    assert.ok(ids.includes('grp.design.media'));
    assert.ok(ids.includes('grp.knowledge.all'));
    assert.deepEqual(
      constrainSpecializationsToOneCategory([
        'artistic.studio_session',
        'knowledge.workshop',
      ]),
      ['knowledge.workshop'],
    );
    assert.equal(
      marketplaceCategoryFromSpecializations(['artistic.studio_session'], 'KNOWLEDGE'),
      'ARTISTIC_SERVICE',
    );
  });

  it('uses progressive disclosure groups for food and garden too', () => {
    const createGroups = getOfferAccordionGroups('CREATE').map((g) => g.id);
    assert.deepEqual(createGroups, [
      'grp.create.meals',
      'grp.create.international',
      'grp.create.pantry',
      'grp.create.craft',
    ]);
    assert.equal(getMarketplaceTaxonomyItem('create.cuisine_surinamese')?.parentId, 'grp.create.international');
    assert.equal(getMarketplaceTaxonomyItem('create.coffee')?.parentId, 'grp.create.pantry');
    assert.equal(getMarketplaceTaxonomyItem('create.preserves')?.parentId, 'grp.create.pantry');
    assert.equal(TAXONOMY_GROUP_LABELS['create.international'].nl, 'Wereldkeuken');
    assert.equal(TAXONOMY_GROUP_LABELS['create.pantry'].nl, 'Dranken & voorraad');
    assert.equal(selectionRequiresCustomLabel(['create.pantry_other']), true);
    const growGroups = getOfferAccordionGroups('GROW').map((g) => g.id);
    assert.deepEqual(growGroups, [
      'grp.grow.vegetables',
      'grp.grow.fruit',
      'grp.grow.herbs',
      'grp.grow.other',
    ]);
    assert.equal(getMarketplaceTaxonomyItem('create.cake')?.parentId, 'grp.create.meals');
    assert.equal(getMarketplaceTaxonomyItem('grow.tomato')?.parentId, 'grp.grow.vegetables');
    assert.equal(accordionGroupNeedsSearch(8), false);
    assert.equal(accordionGroupNeedsSearch(10), true);
    const fruit = getEntryFlowItemsForGroup('grp.grow.fruit', 'offer');
    const filtered = filterAccordionGroupItems(
      fruit,
      'mango',
      [],
      (id) => TAXONOMY_ITEM_LABELS[id]?.nl ?? id,
    );
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'grow.mango');
    assert.equal(selectionRequiresCustomLabel(['create.meals_other']), true);
    assert.equal(selectionRequiresCustomLabel(['grow.misc_other']), true);
    assert.equal(getMarketplaceTaxonomyItem('create.craft_other')?.requiresCustomLabel, true);
    assert.equal(getMarketplaceTaxonomyItem('create.international_other')?.requiresCustomLabel, true);
    const designGroups = getOfferAccordionGroups('DESIGN').map((g) => g.id);
    assert.ok(designGroups.includes('grp.artistic.music'));
    assert.ok(designGroups.includes('grp.design.web'));
    assert.ok(!designGroups.includes('grp.create.meals'));
  });

  it('maps studio session to SERVICE listing kind, workshop stays WORKSHOP', () => {
    assert.equal(isServiceMarketplaceCategory('ARTISTIC_SERVICE'), true);
    assert.equal(isServiceMarketplaceCategory('CREATE'), false);
    assert.equal(
      deriveListingKind({
        marketplaceCategory: 'ARTISTIC_SERVICE',
        specializations: ['artistic.studio_session'],
        listingIntent: 'OFFER',
      }).listingKind,
      'SERVICE',
    );
    assert.equal(
      deriveListingKind({
        marketplaceCategory: 'KNOWLEDGE',
        specializations: ['knowledge.workshop'],
        listingIntent: 'OFFER',
      }).listingKind,
      'WORKSHOP',
    );
    assert.equal(
      deriveListingKind({
        marketplaceCategory: 'KNOWLEDGE',
        specializations: ['knowledge.course'],
        listingIntent: 'OFFER',
      }).listingKind,
      'WORKSHOP',
    );
  });

  it('normalizes studio and course aliases onto canonical ids', () => {
    assert.equal(toCanonicalTaxonomyId('studiosessie'), 'artistic.studio_session');
    assert.equal(toCanonicalTaxonomyId('cursus'), 'knowledge.course');
    assert.equal(toCanonicalTaxonomyId('bijscholing'), 'knowledge.training');
    assert.equal(toCanonicalTaxonomyId('workshop'), 'knowledge.workshop');
    assert.equal(toCanonicalTaxonomyId('artistic.studio_session'), 'artistic.studio_session');
  });
});
