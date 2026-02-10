const fs = require('fs');
const path = require('path');

// Read translation files
const enPath = path.join(__dirname, '../public/i18n/en.json');
const nlPath = path.join(__dirname, '../public/i18n/nl.json');
const pagePath = path.join(__dirname, '../app/affiliate/page-client.tsx');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const nl = JSON.parse(fs.readFileSync(nlPath, 'utf8'));
const pageCode = fs.readFileSync(pagePath, 'utf8');

// Extract all translation keys used in the page
const translationPattern = /t\(['"](affiliate\.[^'"]+)['"]\)/g;
const matches = [];
let match;
while ((match = translationPattern.exec(pageCode)) !== null) {
  matches.push(match[1]);
}

const usedKeys = [...new Set(matches)].sort();

console.log('\n📊 Affiliate Page Translation Analysis\n');
console.log('='.repeat(60));
console.log(`\nUsed keys in page: ${usedKeys.length}\n`);

// Helper function to check if key exists (handles nested keys)
function hasKey(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  return true;
}

// Check which keys are missing
const missingEn = [];
const missingNl = [];
const emptyEn = [];
const emptyNl = [];

usedKeys.forEach(key => {
  if (!hasKey(en, key)) {
    missingEn.push(key);
  } else {
    const value = key.split('.').reduce((obj, k) => obj?.[k], en);
    if (!value || value.trim() === '') {
      emptyEn.push(key);
    }
  }
  
  if (!hasKey(nl, key)) {
    missingNl.push(key);
  } else {
    const value = key.split('.').reduce((obj, k) => obj?.[k], nl);
    if (!value || value.trim() === '') {
      emptyNl.push(key);
    }
  }
});

console.log('❌ Missing in EN:', missingEn.length);
if (missingEn.length > 0) {
  console.log('   Keys:', missingEn.slice(0, 20).join(', '));
  if (missingEn.length > 20) console.log(`   ... and ${missingEn.length - 20} more`);
}

console.log('\n❌ Missing in NL:', missingNl.length);
if (missingNl.length > 0) {
  console.log('   Keys:', missingNl.slice(0, 20).join(', '));
  if (missingNl.length > 20) console.log(`   ... and ${missingNl.length - 20} more`);
}

console.log('\n⚠️  Empty in EN:', emptyEn.length);
if (emptyEn.length > 0) {
  console.log('   Keys:', emptyEn.slice(0, 10).join(', '));
}

console.log('\n⚠️  Empty in NL:', emptyNl.length);
if (emptyNl.length > 0) {
  console.log('   Keys:', emptyNl.slice(0, 10).join(', '));
}

// Summary
console.log('\n' + '='.repeat(60));
const totalIssues = missingEn.length + missingNl.length + emptyEn.length + emptyNl.length;
if (totalIssues === 0) {
  console.log('\n✅ All translations are complete!');
} else {
  console.log(`\n⚠️  Total issues found: ${totalIssues}`);
  console.log(`   - Missing EN: ${missingEn.length}`);
  console.log(`   - Missing NL: ${missingNl.length}`);
  console.log(`   - Empty EN: ${emptyEn.length}`);
  console.log(`   - Empty NL: ${emptyNl.length}`);
}

console.log('\n');




