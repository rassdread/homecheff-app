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

// Translation dictionary for specific strings
const translations = {
  'Voer je eigen sleutel in (min. 32 tekens)': 'Enter your own key (min. 32 characters)',
  'Alleen geverifieerde verkopers': 'Only verified sellers',
  'Plaats of postcode...': 'Place or postcode...',
  'Typ je bericht hier...': 'Type your message here...',
  'Typ een woonplaats of postcode, bv. Amsterdam of 1012AB': 'Type a place or postcode, e.g. Amsterdam or 1012AB',
  'Typ je vraag hier...': 'Type your question here...',
  'Je gebruikt Google om in te loggen, dus je hoeft geen wachtwoord in te voeren.': 'You are using Google to log in, so you do not need to enter a password.',
  'Adres niet gevonden': 'Address not found',
  'Controleer postcode en huisnummer': 'Check postcode and house number',
  'Je ontvangt nu meldingen over nieuwe producten in jouw omgeving': 'You now receive notifications about new products in your area',
  'Toestemming beschikbaar': 'Permission available',
  'Validatie duurt te lang, probeer opnieuw': 'Validation takes too long, try again',
  'Alle beschikbare bezorgers in jouw gebied ontvangen een notificatie': 'All available deliverers in your area receive a notification',
  'Beschikbaar in jouw gekozen tijdslot': 'Available in your chosen time slot',
  'Er is een fout opgetreden bij het afrekenen': 'An error occurred during checkout',
  'Voltooi je bestelling': 'Complete your order',
  'Kon adres niet valideren. Probeer het opnieuw.': 'Could not validate address. Try again.',
  'Meals': 'Meals',
};

// Function to check if string is likely Dutch
function isLikelyDutch(str) {
  const dutchWords = ['je ', 'jouw', 'inloggen', 'winkelwagen', 'bezorgers', 'verkopers', 'kosten', 'sessie', 'beschikbaar', 'afhankelijk', 'vul ', 'postcode', 'huisnummer', 'bezorgopties', 'bezorgt', 'bestelling', 'binnen', 'uur', 'onbekende', 'fout', 'valideer', 'adres', 'jongeren', 'radius', 'zowel', 'als', 'controleer', 'gevonden', 'notificaties', 'omgeving', 'toestemming', 'validatie', 'duurt', 'probeer', 'opnieuw', 'gebied', 'ontvangen', 'gekozen', 'tijdslot', 'opgetreden', 'afrekenen', 'voltooi', 'kon', 'niet', 'valideren', 'maaltijden'];
  const lower = str.toLowerCase();
  return dutchWords.some(word => lower.includes(word)) && 
         !lower.includes('click') && 
         !lower.includes('available') && 
         !lower.includes('cancel') &&
         !lower.includes('radius') && // radius is same in both
         !lower.includes('materials'); // materials is same
}

// Function to recursively find and fix Dutch strings in EN
function fixDutchInEn(obj, nlObj, path = '', fixed = { count: 0 }) {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string' && isLikelyDutch(value)) {
      // Try translation dictionary first
      if (translations[value]) {
        obj[key] = translations[value];
        fixed.count++;
      } else {
        // Try to get from NL file (it should be the same)
        const nlValue = getNestedValue(nlObj, fullPath);
        if (nlValue && typeof nlValue === 'string' && nlValue === value) {
          // This is the same as NL, so it's definitely Dutch - need translation
          // For now, keep it but mark for manual review
          console.log(`  ⚠️  Needs manual translation: ${fullPath}`);
        }
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      fixDutchInEn(value, nlObj, fullPath, fixed);
    }
  }
  return fixed.count;
}

console.log('=== FIXING REMAINING DUTCH IN EN ===\n');

const fixed = fixDutchInEn(en, nl, '', { count: 0 });
console.log(`\nFixed ${fixed} Dutch strings in EN file`);

// Save updated file
fs.writeFileSync(
  path.join(__dirname, '../public/i18n/en.json'),
  JSON.stringify(en, null, 2) + '\n',
  'utf8'
);

console.log('\n✅ File updated!');











