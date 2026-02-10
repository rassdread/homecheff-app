const fs = require('fs');
const path = require('path');

// Read both files
const nl = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/i18n/nl.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/i18n/en.json'), 'utf8'));

// Function to get all nested keys
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.push(fullKey);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    }
  }
  return keys;
}

// Get all keys from both files
const nlKeys = getAllKeys(nl).sort();
const enKeys = getAllKeys(en).sort();

console.log('=== DETAILED COMPARISON ===\n');
console.log(`NL total keys: ${nlKeys.length}`);
console.log(`EN total keys: ${enKeys.length}\n`);

// Find missing keys
const missingInEn = nlKeys.filter(k => !enKeys.includes(k));
const missingInNl = enKeys.filter(k => !nlKeys.includes(k));

if (missingInEn.length > 0) {
  console.log(`❌ Missing in EN (${missingInEn.length}):`);
  missingInEn.slice(0, 20).forEach(k => console.log(`  - ${k}`));
  if (missingInEn.length > 20) console.log(`  ... and ${missingInEn.length - 20} more`);
  console.log('');
}

if (missingInNl.length > 0) {
  console.log(`❌ Missing in NL (${missingInNl.length}):`);
  missingInNl.slice(0, 20).forEach(k => console.log(`  - ${k}`));
  if (missingInNl.length > 20) console.log(`  ... and ${missingInNl.length - 20} more`);
  console.log('');
}

// Function to get nested value
function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
}

// Function to set nested value
function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

// Add missing keys to EN (copy structure from NL, keep EN values if they exist)
console.log('=== FIXING MISSING KEYS ===\n');
let addedToEn = 0;
for (const key of missingInEn) {
  const nlValue = getNestedValue(nl, key);
  if (nlValue !== undefined) {
    // Use placeholder English text based on Dutch
    const placeholder = typeof nlValue === 'string' ? `[EN: ${nlValue}]` : nlValue;
    setNestedValue(en, key, placeholder);
    addedToEn++;
  }
}

// Add missing keys to NL (copy structure from EN, keep NL values if they exist)
let addedToNl = 0;
for (const key of missingInNl) {
  const enValue = getNestedValue(en, key);
  if (enValue !== undefined) {
    // Use placeholder Dutch text based on English
    const placeholder = typeof enValue === 'string' ? `[NL: ${enValue}]` : enValue;
    setNestedValue(nl, key, placeholder);
    addedToNl++;
  }
}

console.log(`Added ${addedToEn} missing keys to EN`);
console.log(`Added ${addedToNl} missing keys to NL\n`);

// Save updated files
fs.writeFileSync(
  path.join(__dirname, '../public/i18n/en.json'),
  JSON.stringify(en, null, 2) + '\n',
  'utf8'
);
fs.writeFileSync(
  path.join(__dirname, '../public/i18n/nl.json'),
  JSON.stringify(nl, null, 2) + '\n',
  'utf8'
);

console.log('✅ Files updated!');
console.log('\n⚠️  Note: Placeholder translations ([EN: ...] and [NL: ...]) need manual translation');











