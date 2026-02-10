const fs = require('fs');
const path = require('path');

// Read translation files
const nlPath = path.join(__dirname, '../public/i18n/nl.json');
const enPath = path.join(__dirname, '../public/i18n/en.json');

const nl = JSON.parse(fs.readFileSync(nlPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Helper function to set nested value
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

// Helper function to get nested value
function getNestedValue(obj, keyPath) {
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

// Translations to add to nl.json (from en.json)
const missingInNl = [
  { key: 'dorpsplein.useProfileLocation', en: 'Use profile location', nl: 'Gebruik profiel locatie' },
  { key: 'dorpsplein.profile', en: 'Profile', nl: 'Profiel' },
  { key: 'dorpsplein.profilePhotoAlt', en: 'Profile photo', nl: 'Profielfoto' },
  { key: 'dorpsplein.swipeForNextPhoto', en: 'Swipe for next photo', nl: 'Veeg voor volgende foto' },
  { key: 'errors.mustBeAffiliateToDelete', en: 'You must be an affiliate yourself to delete sub-affiliates', nl: 'Je moet zelf affiliate zijn om sub-affiliates te verwijderen' },
  { key: 'errors.noPermissionToDelete', en: 'You do not have permission to delete this sub-affiliate', nl: 'Je hebt geen toestemming om deze sub-affiliate te verwijderen' },
  { key: 'affiliate.mustAcceptPrivacy', en: 'You must accept the privacy policy to continue.', nl: 'Je moet het privacybeleid accepteren om door te gaan.' },
  { key: 'affiliate.mustAcceptTerms', en: 'You must accept the terms and conditions to continue.', nl: 'Je moet de algemene voorwaarden accepteren om door te gaan.' },
  { key: 'affiliate.mustAcceptAffiliate', en: 'You must accept the affiliate program agreement to continue.', nl: 'Je moet de affiliate programma overeenkomst accepteren om door te gaan.' },
  { key: 'affiliate.dashboard.qrCodeGenerating', en: 'QR code is being generated...', nl: 'QR code wordt gegenereerd...' }
];

console.log('🔄 Adding remaining missing translations to nl.json...\n');

// Add missing translations to nl.json
let addedToNl = 0;
for (const item of missingInNl) {
  const existing = getNestedValue(nl, item.key);
  if (existing === null) {
    setNestedValue(nl, item.key, item.nl);
    addedToNl++;
    console.log(`  ✅ Added: ${item.key}`);
  } else {
    console.log(`  ⏭️  Already exists: ${item.key}`);
  }
}

// Also fix typo in en.json: "use prorile location" -> "use profile location"
if (en.dorpsplein && en.dorpsplein.useProfileLocation === 'Use prorile location') {
  en.dorpsplein.useProfileLocation = 'Use profile location';
  console.log(`  ✅ Fixed typo in en.json: dorpsplein.useProfileLocation`);
}

// Write updated files
fs.writeFileSync(nlPath, JSON.stringify(nl, null, 2) + '\n', 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');

console.log(`\n✅ Done!`);
console.log(`   Added ${addedToNl} translations to nl.json\n`);




