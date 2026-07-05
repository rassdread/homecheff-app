/**
 * Validate marketplace taxonomy registry and i18n parity.
 * Syncs label data from taxonomy-labels.data.ts into public/i18n/*.json.
 *
 * Run: npx tsx scripts/validate-marketplace-taxonomy.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { MARKETPLACE_TAXONOMY } from '../lib/marketplace/taxonomy';
import {
  getLegacySpecializationMappingKeys,
  legacySpecializationToTaxonomyId,
} from '../lib/marketplace/taxonomy-migrate';
import {
  getOfferTaxonomyItems,
  getMarketplaceTaxonomyRegistryMap,
} from '../lib/marketplace/taxonomy-resolve';
import { resolveMarketplaceI18nPath } from '../lib/marketplace/taxonomy-i18n';
import {
  BLOCKLIST_LABELS,
  TAXONOMY_GROUP_LABELS,
  TAXONOMY_ITEM_LABELS,
  TAXONOMY_UI_LABELS,
} from '../lib/marketplace/taxonomy-labels.data';

const ROOT = path.resolve(__dirname, '..');
const NL_PATH = path.join(ROOT, 'public/i18n/nl.json');
const EN_PATH = path.join(ROOT, 'public/i18n/en.json');

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function buildTaxonomyI18nSection(
  lang: 'nl' | 'en',
): Record<string, unknown> {
  const taxonomy: Record<string, unknown> = { groups: {} };
  const groups = taxonomy.groups as Record<string, unknown>;

  for (const [groupId, pair] of Object.entries(TAXONOMY_GROUP_LABELS)) {
    const [cat, name] = groupId.split('.');
    if (!groups[cat]) groups[cat] = {};
    (groups[cat] as Record<string, unknown>)[name] = { label: pair[lang] };
  }

  for (const [itemId, pair] of Object.entries(TAXONOMY_ITEM_LABELS)) {
    const [cat, name] = itemId.split('.');
    if (!taxonomy[cat]) taxonomy[cat] = {};
    (taxonomy[cat] as Record<string, unknown>)[name] = { label: pair[lang] };
  }

  const blocklist: Record<string, unknown> = {};
  for (const [slug, pair] of Object.entries(BLOCKLIST_LABELS)) {
    blocklist[slug] = {
      label: pair[lang],
      reason: lang === 'nl' ? pair.reasonNl : pair.reasonEn,
    };
  }

  const badges: Record<string, string> = {};
  for (const [key, pair] of Object.entries(TAXONOMY_UI_LABELS.badges)) {
    badges[key] = pair[lang];
  }

  const regulation: Record<string, string> = {};
  for (const [key, pair] of Object.entries(TAXONOMY_UI_LABELS.regulation)) {
    regulation[key] = pair[lang];
  }

  return { taxonomy, blocklist, badges, regulation };
}

function syncI18nFiles(): void {
  for (const { filePath, lang } of [
    { filePath: NL_PATH, lang: 'nl' as const },
    { filePath: EN_PATH, lang: 'en' as const },
  ]) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<
      string,
      unknown
    >;
    const marketplace = (raw.marketplace ?? {}) as Record<string, unknown>;
    const section = buildTaxonomyI18nSection(lang);
    marketplace.taxonomy = section.taxonomy;
    marketplace.blocklist = section.blocklist;
    marketplace.badges = section.badges;
    marketplace.regulation = section.regulation;
    raw.marketplace = marketplace;
    fs.writeFileSync(filePath, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  }
}

function validateRegistry(): void {
  const ids = new Set<string>();
  for (const entry of MARKETPLACE_TAXONOMY) {
    assert(!ids.has(entry.id), `Duplicate taxonomy id: ${entry.id}`);
    ids.add(entry.id);
  }

  const map = getMarketplaceTaxonomyRegistryMap();
  for (const entry of MARKETPLACE_TAXONOMY) {
    if (entry.parentId) {
      assert(map.has(entry.parentId), `Missing parentId ${entry.parentId} for ${entry.id}`);
    }
    if (!entry.blocked) {
      assert(!!entry.labelKey, `Missing labelKey for ${entry.id}`);
    }
    if (entry.blocked) {
      assert(!!entry.blockReasonKey, `Missing blockReasonKey for ${entry.id}`);
    }
  }

  const offerDefault = getOfferTaxonomyItems();
  const alcoholInDefault = offerDefault.filter((e) =>
    e.regulated?.includes('alcohol'),
  );
  assert(
    alcoholInDefault.length === 0,
    'futureOnly alcohol items must not appear in default getOfferTaxonomyItems()',
  );

  const alcoholWithFlag = getOfferTaxonomyItems({ includeFutureOnly: true }).filter(
    (e) => e.regulated?.includes('alcohol'),
  );
  assert(
    alcoholWithFlag.length === 2,
    'Expected 2 alcohol items when includeFutureOnly is true',
  );

  for (const legacyKey of getLegacySpecializationMappingKeys()) {
    const mapped = legacySpecializationToTaxonomyId(legacyKey);
    assert(mapped !== null, `Legacy slug maps to unknown id: ${legacyKey}`);
    assert(map.has(mapped!), `Legacy mapping target missing in registry: ${legacyKey} → ${mapped}`);
  }

  assert(
    Object.keys(TAXONOMY_ITEM_LABELS).length >= 88,
    'Label data should cover all non-blocked taxonomy items',
  );
  assert(
    Object.keys(TAXONOMY_GROUP_LABELS).length >= 13,
    'Label data should cover all taxonomy groups',
  );
}

function validateI18nParity(): void {
  const nl = JSON.parse(fs.readFileSync(NL_PATH, 'utf8')) as Record<string, unknown>;
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8')) as Record<string, unknown>;
  const nlMarketplace = nl.marketplace as Record<string, unknown>;
  const enMarketplace = en.marketplace as Record<string, unknown>;

  for (const entry of MARKETPLACE_TAXONOMY) {
    if (entry.blocked) continue;
    const nlVal = resolveMarketplaceI18nPath(nlMarketplace, entry.labelKey);
    const enVal = resolveMarketplaceI18nPath(enMarketplace, entry.labelKey);
    assert(!!nlVal, `Missing NL i18n for ${entry.labelKey}`);
    assert(!!enVal, `Missing EN i18n for ${entry.labelKey}`);
  }

  for (const entry of MARKETPLACE_TAXONOMY) {
    if (!entry.blocked || !entry.blockReasonKey) continue;
    const nlReason = resolveMarketplaceI18nPath(nlMarketplace, entry.blockReasonKey);
    const enReason = resolveMarketplaceI18nPath(enMarketplace, entry.blockReasonKey);
    assert(!!nlReason, `Missing NL block reason for ${entry.blockReasonKey}`);
    assert(!!enReason, `Missing EN block reason for ${entry.blockReasonKey}`);
  }

  for (const groupId of Object.keys(TAXONOMY_GROUP_LABELS)) {
    const key = `marketplace.taxonomy.groups.${groupId}.label`;
    assert(resolveMarketplaceI18nPath(nlMarketplace, key), `Missing NL ${key}`);
    assert(resolveMarketplaceI18nPath(enMarketplace, key), `Missing EN ${key}`);
  }

  for (const [uiKey, pair] of Object.entries(TAXONOMY_UI_LABELS.badges)) {
    const key = `marketplace.badges.${uiKey}`;
    assert(resolveMarketplaceI18nPath(nlMarketplace, key) === pair.nl, `NL badge mismatch ${key}`);
    assert(resolveMarketplaceI18nPath(enMarketplace, key) === pair.en, `EN badge mismatch ${key}`);
  }
}

function main(): void {
  syncI18nFiles();
  validateRegistry();
  validateI18nParity();

  const itemCount = MARKETPLACE_TAXONOMY.filter((e) => e.level === 'item' && !e.blocked).length;
  const groupCount = MARKETPLACE_TAXONOMY.filter((e) => e.level === 'group').length;
  const blockedCount = MARKETPLACE_TAXONOMY.filter((e) => e.blocked).length;
  const futureCount = MARKETPLACE_TAXONOMY.filter((e) => e.futureOnly).length;

  console.log('✅ marketplace taxonomy validation passed');
  console.log(`   items: ${itemCount}, groups: ${groupCount}, blocked: ${blockedCount}, futureOnly: ${futureCount}`);
  console.log(`   legacy mappings: ${getLegacySpecializationMappingKeys().length}`);
}

main();
