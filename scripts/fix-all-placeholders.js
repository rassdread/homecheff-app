const fs = require('fs');
const path = require('path');

// Read both files
const nl = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/i18n/nl.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/i18n/en.json'), 'utf8'));

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

// Function to recursively find and fix placeholders
function fixPlaceholdersInObject(obj, otherObj, path = '', fixed = { count: 0 }) {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string') {
      if (value.startsWith('[EN:') || value.startsWith('[NL:')) {
        // Try to get value from other language file
        const otherValue = getNestedValue(otherObj, fullPath);
        if (otherValue && typeof otherValue === 'string' && !otherValue.startsWith('[')) {
          // Use the other language value (it's already translated)
          obj[key] = otherValue;
          fixed.count++;
        } else {
          // Extract text from placeholder and use it
          const extracted = value.replace(/^\[(?:EN|NL):\s*/, '').replace(/\s*\]$/, '');
          if (extracted && extracted !== value) {
            obj[key] = extracted;
            fixed.count++;
          }
        }
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      fixPlaceholdersInObject(value, otherObj, fullPath, fixed);
    }
  }
  return fixed.count;
}

console.log('=== FIXING PLACEHOLDERS ===\n');

// Fix NL placeholders using EN values
const nlFixed = fixPlaceholdersInObject(nl, en);
console.log(`Fixed ${nlFixed} placeholders in NL using EN values`);

// Fix EN placeholders using NL values
const enFixed = fixPlaceholdersInObject(en, nl);
console.log(`Fixed ${enFixed} placeholders in EN using NL values\n`);

// Save updated files
fs.writeFileSync(
  path.join(__dirname, '../public/i18n/nl.json'),
  JSON.stringify(nl, null, 2) + '\n',
  'utf8'
);
fs.writeFileSync(
  path.join(__dirname, '../public/i18n/en.json'),
  JSON.stringify(en, null, 2) + '\n',
  'utf8'
);

console.log('✅ Files updated!');

// Count remaining placeholders
function countPlaceholders(obj) {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (typeof value === 'string' && (value.startsWith('[EN:') || value.startsWith('[NL:'))) {
      count++;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countPlaceholders(value);
    }
  }
  return count;
}

const remainingNl = countPlaceholders(nl);
const remainingEn = countPlaceholders(en);

console.log(`\nRemaining placeholders:`);
console.log(`NL: ${remainingNl}`);
console.log(`EN: ${remainingEn}`);

if (remainingNl === 0 && remainingEn === 0) {
  console.log('\n✅ All placeholders fixed!');
} else {
  console.log('\n⚠️  Some placeholders remain - these may need manual translation');
}











