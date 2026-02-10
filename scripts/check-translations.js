const fs = require('fs');
const path = require('path');

// Read translation files
const nlPath = path.join(__dirname, '../public/i18n/nl.json');
const enPath = path.join(__dirname, '../public/i18n/en.json');

const nl = JSON.parse(fs.readFileSync(nlPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Recursively get all keys from an object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursively get keys from nested objects
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      // This is a leaf node (actual translation value)
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Get value by key path
function getValueByPath(obj, keyPath) {
  const keys = keyPath.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  
  return value;
}

// Get all keys from Dutch (base language)
const nlKeys = getAllKeys(nl);
const enKeys = getAllKeys(en);

console.log('\n📊 Vertaling Compleetheid Analyse\n');
console.log('=' .repeat(50));

// Count translations
let translatedCount = 0;
let missingCount = 0;
let emptyCount = 0;
const missingKeys = [];
const emptyKeys = [];

for (const key of nlKeys) {
  const enValue = getValueByPath(en, key);
  const nlValue = getValueByPath(nl, key);
  
  if (enValue === null) {
    missingCount++;
    missingKeys.push(key);
  } else if (typeof enValue === 'string' && enValue.trim() === '') {
    emptyCount++;
    emptyKeys.push(key);
  } else {
    translatedCount++;
  }
}

const totalKeys = nlKeys.length;
const completionPercentage = ((translatedCount / totalKeys) * 100).toFixed(2);

console.log(`\n📈 Statistieken:\n`);
console.log(`  Totaal aantal keys (NL):     ${totalKeys}`);
console.log(`  Vertaald (EN):              ${translatedCount}`);
console.log(`  Ontbrekend:                 ${missingCount}`);
console.log(`  Leeg:                       ${emptyCount}`);
console.log(`\n  ✅ Compleetheid:            ${completionPercentage}%\n`);

// Show missing keys (first 20)
if (missingKeys.length > 0) {
  console.log(`\n⚠️  Ontbrekende keys (eerste ${Math.min(20, missingKeys.length)}):\n`);
  missingKeys.slice(0, 20).forEach(key => {
    console.log(`  - ${key}`);
  });
  if (missingKeys.length > 20) {
    console.log(`  ... en ${missingKeys.length - 20} meer`);
  }
}

// Show empty keys (first 10)
if (emptyKeys.length > 0) {
  console.log(`\n⚠️  Lege keys (eerste ${Math.min(10, emptyKeys.length)}):\n`);
  emptyKeys.slice(0, 10).forEach(key => {
    console.log(`  - ${key}`);
  });
  if (emptyKeys.length > 10) {
    console.log(`  ... en ${emptyKeys.length - 10} meer`);
  }
}

// Check for extra keys in EN that don't exist in NL
const extraKeys = enKeys.filter(key => getValueByPath(nl, key) === null);
if (extraKeys.length > 0) {
  console.log(`\n⚠️  Extra keys in EN die niet in NL bestaan (${extraKeys.length}):\n`);
  extraKeys.slice(0, 10).forEach(key => {
    console.log(`  - ${key}`);
  });
  if (extraKeys.length > 10) {
    console.log(`  ... en ${extraKeys.length - 10} meer`);
  }
}

console.log('\n' + '='.repeat(50) + '\n');

// Summary
console.log(`📊 SAMENVATTING:`);
console.log(`   Je bent op ${completionPercentage}% van de vertalingen compleet.`);
console.log(`   ${translatedCount} van de ${totalKeys} keys zijn vertaald.\n`);




