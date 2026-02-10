const fs = require('fs');
const path = require('path');

// Read both files
const nl = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/i18n/nl.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/i18n/en.json'), 'utf8'));

// Comprehensive translation dictionary
const translations = {
  // Common Dutch -> English
  'Voer je eigen sleutel in (min. 32 tekens)': 'Enter your own key (min. 32 characters)',
  'Alleen geverifieerde verkopers': 'Only verified sellers',
  'Alleen met foto\'s': 'Only with photos',
  'Alleen met reviews': 'Only with reviews',
  'Plaats of postcode...': 'Place or postcode...',
  'Zoek op naam of email...': 'Search by name or email...',
  'Zoek op naam, username, email, telefoonnummer...': 'Search by name, username, email, phone number...',
  'Zoek in product titels...': 'Search in product titles...',
  'Zoek in producten, gerechten, makers...': 'Search in products, dishes, makers...',
  'Zoek in producten...': 'Search in products...',
  'Naam voor deze zoekopdracht...': 'Name for this search...',
  'Vertel iets over jezelf...': 'Tell us about yourself...',
  'Typ een bericht...': 'Type a message...',
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
  'Verder winkelen': 'Continue shopping',
  'Kon adres niet valideren. Probeer het opnieuw.': 'Could not validate address. Try again.',
  'Meals': 'Meals',
  'Afrekenen': 'Checkout',
  'Binnen 3 uur': 'Within 3 hours',
  'Onbekende fout': 'Unknown error',
  'Valideer je adres om beschikbare jongeren bezorgers te zien.': 'Validate your address to see available teen deliverers.',
  'Binnen radius van zowel verkoper als koper': 'Within radius of both seller and buyer',
  
  // Common English -> Dutch
  'Click to see details': 'Klik voor details',
  'CONVERSATION BETWEEN:': 'GESPREK TUSSEN:',
  'Number of conversations:': 'Aantal gesprekken:',
  'Date range:': 'Datumbereik:',
  'Last Update:': 'Laatste update:',
  'message': 'bericht',
  'Message count:': 'Aantal berichten:',
  'Metadata available:': 'Metadata beschikbaar:',
  'No messages yet': 'Nog geen berichten',
  'Roles:': 'Rollen:',
  'Admin since': 'Admin sinds',
  'Status:': 'Status:',
  'Time:': 'Tijd:',
  'Total': 'Totaal',
  'Unknown': 'Onbekend',
  'Add': 'Toevoegen',
  'All': 'Alles',
  'All products': 'Alle producten',
  'Back': 'Terug',
  'Back to dashboard': 'Terug naar dashboard',
  'Cancel': 'Annuleren',
  'Cancelled': 'Geannuleerd',
};

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

// Function to check if string is likely Dutch
function isLikelyDutch(str) {
  if (!str || typeof str !== 'string' || str.length < 3) return false;
  const dutchWords = ['je ', 'jouw', 'inloggen', 'winkelwagen', 'bezorgers', 'verkopers', 'kosten', 'sessie', 'beschikbaar', 'afhankelijk', 'vul ', 'postcode', 'huisnummer', 'bezorgopties', 'bezorgt', 'bestelling', 'binnen', 'uur', 'onbekende', 'fout', 'valideer', 'adres', 'jongeren', 'radius', 'zowel', 'als', 'controleer', 'gevonden', 'notificaties', 'omgeving', 'toestemming', 'validatie', 'duurt', 'probeer', 'opnieuw', 'gebied', 'ontvangen', 'gekozen', 'tijdslot', 'opgetreden', 'afrekenen', 'voltooi', 'kon', 'niet', 'valideren', 'maaltijden', 'zoek', 'op', 'naam', 'email', 'telefoonnummer', 'producten', 'gerechten', 'makers', 'foto', 'reviews', 'vertel', 'iets', 'over', 'jezelf', 'typ', 'bericht', 'woonplaats', 'amsterdam', 'voor', 'deze', 'zoekopdracht', 'alleen', 'met', 'geverifieerde', 'plaats', 'of', 'telefoon', 'tijdslot', 'beschikbaar', 'bezorgers', 'gebied', 'ontvangen', 'notificatie', 'fout', 'opgetreden', 'afrekenen', 'voltooi', 'bestelling', 'verder', 'winkelen', 'kon', 'adres', 'niet', 'valideren', 'probeer', 'opnieuw', 'binnen', 'radius', 'zowel', 'verkoper', 'koper'];
  const lower = str.toLowerCase();
  const hasDutchWord = dutchWords.some(word => lower.includes(word));
  const hasEnglishWord = ['click', 'available', 'cancel', 'back', 'add', 'all products', 'the ', 'message', 'total', 'unknown', 'status', 'time', 'roles', 'number of', 'conversation', 'date range', 'last update', 'metadata'].some(word => lower.includes(word));
  return hasDutchWord && !hasEnglishWord;
}

// Function to check if string is likely English
function isLikelyEnglish(str) {
  if (!str || typeof str !== 'string' || str.length < 3) return false;
  const englishWords = ['click', 'available', 'cancel', 'back', 'add', 'all products', 'the ', 'message', 'total', 'unknown', 'status', 'time', 'roles', 'number of', 'conversation', 'date range', 'last update', 'metadata'];
  const lower = str.toLowerCase();
  const hasEnglishWord = englishWords.some(word => lower.includes(word));
  const hasDutchWord = ['klik', 'beschikbaar', 'annuleren', 'terug', 'toevoegen', 'alle producten', 'bericht', 'totaal', 'onbekend', 'status', 'tijd', 'rollen', 'aantal', 'gesprek', 'datumbereik', 'laatste update'].some(word => lower.includes(word));
  return hasEnglishWord && !hasDutchWord;
}

// Function to recursively fix language mismatches
function fixLanguageMismatches(obj, otherObj, path = '', fixed = { count: 0 }, isNl = true) {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string' && value.length > 0) {
      // Check if this looks like the wrong language
      if (isNl && isLikelyEnglish(value)) {
        // Try translation dictionary first
        if (translations[value]) {
          obj[key] = translations[value];
          fixed.count++;
        } else {
          // Try to get from EN file
          const enValue = getNestedValue(otherObj, fullPath);
          if (enValue && typeof enValue === 'string' && !isLikelyEnglish(enValue)) {
            obj[key] = enValue;
            fixed.count++;
          }
        }
      } else if (!isNl && isLikelyDutch(value)) {
        // Try translation dictionary first
        if (translations[value]) {
          obj[key] = translations[value];
          fixed.count++;
        } else {
          // Try to get from NL file
          const nlValue = getNestedValue(otherObj, fullPath);
          if (nlValue && typeof nlValue === 'string' && !isLikelyDutch(nlValue)) {
            obj[key] = nlValue;
            fixed.count++;
          } else {
            // Extract and use as fallback
            const extracted = value.replace(/^(je|jouw|de|het|een)\s+/i, '').trim();
            if (extracted && extracted !== value) {
              obj[key] = extracted;
              fixed.count++;
            }
          }
        }
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      fixLanguageMismatches(value, otherObj, fullPath, fixed, isNl);
    }
  }
  return fixed.count;
}

console.log('=== FIXING ALL LANGUAGE MISMATCHES ===\n');

// Fix NL file (remove English)
const nlFixed = fixLanguageMismatches(nl, en, '', { count: 0 }, true);
console.log(`Fixed ${nlFixed} English strings in NL file`);

// Fix EN file (remove Dutch)
const enFixed = fixLanguageMismatches(en, nl, '', { count: 0 }, false);
console.log(`Fixed ${enFixed} Dutch strings in EN file\n`);

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

// Final verification
function countMismatches(obj, isNl = true) {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      if (isNl && isLikelyEnglish(value)) count++;
      else if (!isNl && isLikelyDutch(value)) count++;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countMismatches(value, isNl);
    }
  }
  return count;
}

const remainingNl = countMismatches(nl, true);
const remainingEn = countMismatches(en, false);

console.log(`\nRemaining mismatches:`);
console.log(`NL: ${remainingNl} potentially English strings`);
console.log(`EN: ${remainingEn} potentially Dutch strings`);

if (remainingNl === 0 && remainingEn === 0) {
  console.log('\n✅ All language mismatches fixed!');
} else {
  console.log('\n⚠️  Some mismatches may remain in FAQ sections (long texts)');
}











