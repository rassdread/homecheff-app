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

// Translations to add to en.json (from nl.json)
const missingInEn = [
  { key: 'place.fillAllFields', nl: 'Vul alle velden in.', en: 'Fill in all fields.' },
  { key: 'place.save', nl: 'Opslaan', en: 'Save' },
  { key: 'place.addLocation', nl: 'Locatie toevoegen', en: 'Add location' },
  { key: 'place.description', nl: 'Voeg een locatie toe voor je product, dienst of ruimte. Vul het adres en een korte omschrijving in.', en: 'Add a location for your product, service or space. Fill in the address and a short description.' },
  { key: 'place.descriptionPlaceholder', nl: 'Omschrijving', en: 'Description' },
  { key: 'place.addressMustBeValidated', nl: 'Adres moet gevalideerd zijn (selecteer een suggestie uit de lijst).', en: 'Address must be validated (select a suggestion from the list).' },
  { key: 'place.locationSavedSuccess', nl: 'Locatie succesvol opgeslagen!', en: 'Location successfully saved!' },
  { key: 'sell.title', nl: 'Zet je bedrijf op de kaart — groei met je lokale community', en: 'Put your business on the map — grow with your local community' },
  { key: 'sell.subtitle', nl: 'Kies het abonnement dat bij jouw bedrijf past. Transparante prijzen, maandelijks opzegbaar en zonder verborgen kosten.', en: 'Choose the subscription that fits your business. Transparent prices, cancelable monthly and without hidden costs.' },
  { key: 'sell.confirmationFailed', nl: 'Bevestigen mislukt', en: 'Confirmation failed' },
  { key: 'sell.cannotConfirmSubscription', nl: 'Kon abonnement niet bevestigen. Neem contact op met support.', en: 'Could not confirm subscription. Please contact support.' },
  { key: 'sell.confirmingSubscription', nl: 'We bevestigen je abonnement, een moment geduld...', en: 'We are confirming your subscription, please wait...' },
  { key: 'register.validation.addressLookupFailed', nl: 'Adres lookup mislukt', en: 'Address lookup failed' }
];

// Extra keys in en.json that need to be added to nl.json
const extraInEn = [
  { key: 'admin.saving', en: 'Saving...', nl: 'Opslaan...' },
  { key: 'admin.editPermissions', en: 'Edit Permissions', nl: 'Rechten bewerken' },
  { key: 'admin.savePermissionsError', en: 'Error saving permissions', nl: 'Fout bij opslaan rechten' },
  { key: 'admin.saveAdminRolesError', en: 'Error saving admin roles', nl: 'Fout bij opslaan admin rollen' },
  { key: 'admin.saveError', en: 'Error saving', nl: 'Fout bij opslaan' },
  { key: 'navbar.affiliateDashboard', en: 'Affiliate Dashboard', nl: 'Affiliate Dashboard' },
  { key: 'common.mapLoading', en: 'Map is loading...', nl: 'Kaart wordt geladen...' },
  { key: 'common.unknown', en: 'Unknown', nl: 'Onbekend' },
  { key: 'common.status', en: 'Status:', nl: 'Status:' },
  { key: 'common.profile', en: 'Profile', nl: 'Profiel' }
];

console.log('🔄 Adding missing translations to en.json...\n');

// Add missing translations to en.json
let addedToEn = 0;
for (const item of missingInEn) {
  const existing = getNestedValue(en, item.key);
  if (existing === null) {
    setNestedValue(en, item.key, item.en);
    addedToEn++;
    console.log(`  ✅ Added: ${item.key}`);
  } else {
    console.log(`  ⏭️  Already exists: ${item.key}`);
  }
}

console.log(`\n🔄 Adding missing translations to nl.json...\n`);

// Add extra translations to nl.json
let addedToNl = 0;
for (const item of extraInEn) {
  const existing = getNestedValue(nl, item.key);
  if (existing === null) {
    setNestedValue(nl, item.key, item.nl);
    addedToNl++;
    console.log(`  ✅ Added: ${item.key}`);
  } else {
    console.log(`  ⏭️  Already exists: ${item.key}`);
  }
}

// Write updated files
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(nlPath, JSON.stringify(nl, null, 2) + '\n', 'utf8');

console.log(`\n✅ Done!`);
console.log(`   Added ${addedToEn} translations to en.json`);
console.log(`   Added ${addedToNl} translations to nl.json\n`);




