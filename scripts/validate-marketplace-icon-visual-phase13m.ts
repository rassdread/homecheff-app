#!/usr/bin/env npx tsx
/**
 * Phase 13M — Marketplace icon color & visual consistency guard.
 *
 * Run: npx tsx scripts/validate-marketplace-icon-visual-phase13m.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  DISCOVERY_VERTICAL_ICON_CLASSES,
  LEGACY_VERTICAL_CHIP_CLASSES,
  MAIN_CATEGORY_ICON_CLASSES,
  SETTLEMENT_ICON_COLOR,
  TAXONOMY_TONE_ICON_CLASSES,
} from '../lib/marketplace/marketplace-icon-colors';
import { TAXONOMY_TONE_CLASSES } from '../lib/marketplace/taxonomy-tone';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function mustUseSsot(rel: string, patterns: string[]) {
  const src = read(rel);
  assert(exists(rel), `file exists: ${rel}`);
  for (const pattern of patterns) {
    assert(src.includes(pattern), `${rel} uses ${pattern}`);
  }
}

function mustNotInclude(rel: string, forbidden: string[], label: string) {
  const src = read(rel);
  const hit = forbidden.find((f) => src.includes(f));
  assert(!hit, `${label}${hit ? ` (found ${hit})` : ''}`);
}

async function main() {
  console.log('=== Phase 13M — Marketplace Icon Visual Polish ===\n');

  console.log('13M.1 Deliverables');
  assert(
    exists('docs/audits/MARKETPLACE_ICON_COLOR_VISUAL_POLISH_PHASE13M_AUDIT.md'),
    'audit doc',
  );
  assert(
    exists('docs/progress/UX_FINALIZATION_PHASE13M_ICON_VISUAL_POLISH.md'),
    'progress doc',
  );
  assert(exists('scripts/validate-marketplace-icon-visual-phase13m.ts'), 'validator');
  assert(exists('lib/marketplace/marketplace-icon-colors.ts'), 'icon color SSOT');

  console.log('\n13M.2 SSOT palette completeness');
  const tones = [
    'food',
    'garden',
    'creative',
    'artistic',
    'service',
    'knowledge',
    'international',
    'blocked',
  ] as const;
  for (const tone of tones) {
    assert(Boolean(TAXONOMY_TONE_ICON_CLASSES[tone]), `icon class for tone:${tone}`);
    assert(Boolean(TAXONOMY_TONE_CLASSES[tone]), `badge shell for tone:${tone}`);
  }
  assert(Object.keys(SETTLEMENT_ICON_COLOR).length === 4, 'four settlement icon colors');
  assert(
    LEGACY_VERTICAL_CHIP_CLASSES.GROWN.includes('emerald'),
    'legacy GROWN chip uses emerald (not green)',
  );
  assert(
    !LEGACY_VERTICAL_CHIP_CLASSES.DESIGNER.includes('yellow'),
    'legacy DESIGNER chip no longer yellow',
  );
  assert(
    MAIN_CATEGORY_ICON_CLASSES.DELIVERY.includes('cyan'),
    'delivery main category richer cyan',
  );

  console.log('\n13M.3 Shared renderers');
  const taxonomyIcon = read('components/products/marketplace/TaxonomyLucideIcon.tsx');
  assert(taxonomyIcon.includes('resolveTaxonomyIconClass'), 'TaxonomyLucideIcon uses SSOT');
  assert(taxonomyIcon.includes('tone?:'), 'TaxonomyLucideIcon accepts tone prop');

  const settlementIcon = read('components/marketplace/SettlementLucideIcon.tsx');
  assert(settlementIcon.includes('SETTLEMENT_ICON_COLOR'), 'SettlementLucideIcon uses SSOT');

  console.log('\n13M.4 Tiles & detail surfaces');
  mustUseSsot('components/marketplace/tiles/primitives/TileBadgeRow.tsx', [
    'TAXONOMY_TONE_CLASSES',
    'tone={badge.taxonomyTone}',
  ]);
  mustUseSsot('components/marketplace/tiles/primitives/TileAcceptedValueIcons.tsx', [
    'tone={icon.taxonomyTone}',
  ]);
  mustUseSsot('components/marketplace/tiles/primitives/TileSettlementRow.tsx', [
    'SettlementLucideIcon',
  ]);
  mustUseSsot('components/product/detail/ProductDetailSettlementSection.tsx', [
    'SettlementLucideIcon',
  ]);
  mustNotInclude(
    'components/marketplace/tiles/primitives/TileSettlementRow.tsx',
    ['text-emerald-600', 'text-amber-600'],
    'TileSettlementRow has no inline settlement colors',
  );

  console.log('\n13M.5 Filters, entry flow & accepted values');
  mustUseSsot('components/feed/ImprovedFilterBar.tsx', ['LEGACY_VERTICAL_CHIP_CLASSES']);
  mustUseSsot('components/inspiratie/InspiratieContent.tsx', ['LEGACY_VERTICAL_CHIP_CLASSES']);
  mustUseSsot('components/home/HomeVerticalChipStrip.tsx', ['DISCOVERY_VERTICAL_ICON_CLASSES']);
  mustUseSsot('components/feed/AcceptedValuesDiscoveryFilter.tsx', [
    'taxonomyToneChipClass',
    'tone={item.tone}',
  ]);
  mustUseSsot('components/marketplace/AcceptedValueChip.tsx', [
    'TAXONOMY_TONE_CLASSES',
    'tone={entry.tone}',
  ]);
  mustUseSsot('components/products/marketplace/TaxonomySpecializationPicker.tsx', [
    'taxonomyToneChipClass',
    'tone={item.tone}',
  ]);

  console.log('\n13M.6 Legacy detail accents aligned');
  mustUseSsot('components/product/ListingDetailPage.tsx', ['LEGACY_VERTICAL_DETAIL_CLASSES']);
  mustUseSsot('components/inspiratie/InspiratieDetail.tsx', ['LEGACY_VERTICAL_DETAIL_CLASSES']);
  mustUseSsot('components/inspiratie/InstructionDetailSection.tsx', [
    'LEGACY_VERTICAL_ICON_CLASSES',
  ]);

  console.log('\n13M.7 Discovery vertical slug map');
  assert(
    DISCOVERY_VERTICAL_ICON_CLASSES.cheff === TAXONOMY_TONE_ICON_CLASSES.food,
    'cheff vertical → food tone',
  );
  assert(
    DISCOVERY_VERTICAL_ICON_CLASSES.designer === TAXONOMY_TONE_ICON_CLASSES.creative,
    'designer vertical → creative tone',
  );

  console.log('\n---');
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) process.exit(1);
  console.log('\nPhase 13M validator OK — visual-only icon color SSOT in place.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
