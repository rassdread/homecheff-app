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

// Function to check if string is likely Dutch
function isLikelyDutch(str) {
  if (!str || typeof str !== 'string' || str.length < 3) return false;
  const dutchIndicators = ['je ', 'jouw', 'jou ', 'inloggen', 'winkelwagen', 'bezorgers', 'verkopers', 'kosten', 'sessie', 'beschikbaar', 'afhankelijk', 'vul ', 'postcode', 'huisnummer', 'bezorgopties', 'bezorgt', 'bestelling', 'binnen', 'uur', 'onbekende', 'fout', 'valideer', 'adres', 'jongeren', 'zowel', 'als', 'controleer', 'gevonden', 'notificaties', 'omgeving', 'toestemming', 'validatie', 'duurt', 'probeer', 'opnieuw', 'gebied', 'ontvangen', 'gekozen', 'tijdslot', 'opgetreden', 'afrekenen', 'voltooi', 'kon', 'niet', 'valideren', 'maaltijden', 'zoek', 'op ', 'naam', 'email', 'telefoonnummer', 'producten', 'gerechten', 'makers', 'foto', 'reviews', 'vertel', 'iets', 'over', 'jezelf', 'typ', 'bericht', 'woonplaats', 'voor', 'deze', 'zoekopdracht', 'alleen', 'met', 'geverifieerde', 'plaats', 'of', 'telefoon', 'tijdslot', 'beschikbaar', 'bezorgers', 'gebied', 'ontvangen', 'notificatie', 'fout', 'opgetreden', 'afrekenen', 'voltooi', 'bestelling', 'verder', 'winkelen', 'kon', 'adres', 'niet', 'valideren', 'probeer', 'opnieuw', 'binnen', 'zowel', 'verkoper', 'koper', 'afstanden', 'worden', 'berekend', 'vanaf', 'totale', 'omzet', 'actieve', 'gebruikers', 'systeem', 'events', 'laatste', 'dagen', 'vandaag', 'recente', 'gebruikers', 'producten', 'geen', 'gevonden', 'totaal', 'revenue', 'active', 'users', 'system', 'events', 'last', 'days', 'today', 'recent', 'users', 'products', 'no', 'found', 'total', 'revenue'];
  const lower = str.toLowerCase();
  return dutchIndicators.some(word => lower.includes(word)) && 
         !lower.includes('click') && 
         !lower.includes('available') && 
         !lower.includes('cancel') &&
         !lower.includes('radius') && // radius is same in both
         !lower.includes('materials') && // materials is same
         !lower.includes('search') && // search is same
         !lower.includes('type') && // type is same
         !lower.includes('name') && // name is same
         !lower.includes('email') && // email is same
         !lower.includes('phone'); // phone is same
}

// Comprehensive translation function
function translateDutchToEnglish(dutchText) {
  // Direct translations
  const directTranslations = {
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
    'Afstanden worden berekend vanaf {address}': 'Distances are calculated from {address}',
    'Totale Omzet': 'Total Revenue',
    'Actieve Gebruikers': 'Active Users',
    'Systeem Events': 'System Events',
    'Laatste 7 dagen': 'Last 7 days',
    'Vandaag': 'Today',
    'Recente Gebruikers': 'Recent Users',
    'Recente Producten': 'Recent Products',
    'Geen gebruikers gevonden': 'No users found',
    'Geen producten gevonden': 'No products found',
  };
  
  if (directTranslations[dutchText]) {
    return directTranslations[dutchText];
  }
  
  // Pattern-based translations
  let translated = dutchText;
  
  // Common word replacements
  translated = translated.replace(/je /gi, 'your ');
  translated = translated.replace(/jouw /gi, 'your ');
  translated = translated.replace(/inloggen/gi, 'login');
  translated = translated.replace(/winkelwagen/gi, 'shopping cart');
  translated = translated.replace(/bezorgers/gi, 'deliverers');
  translated = translated.replace(/verkopers/gi, 'sellers');
  translated = translated.replace(/kosten/gi, 'cost');
  translated = translated.replace(/sessie/gi, 'session');
  translated = translated.replace(/beschikbaar/gi, 'available');
  translated = translated.replace(/afhankelijk/gi, 'depends');
  translated = translated.replace(/vul /gi, 'enter ');
  translated = translated.replace(/postcode/gi, 'postcode');
  translated = translated.replace(/huisnummer/gi, 'house number');
  translated = translated.replace(/bezorgopties/gi, 'delivery options');
  translated = translated.replace(/bezorgt/gi, 'delivers');
  translated = translated.replace(/bestelling/gi, 'order');
  translated = translated.replace(/binnen/gi, 'within');
  translated = translated.replace(/uur/gi, 'hours');
  translated = translated.replace(/onbekende/gi, 'unknown');
  translated = translated.replace(/fout/gi, 'error');
  translated = translated.replace(/valideer/gi, 'validate');
  translated = translated.replace(/adres/gi, 'address');
  translated = translated.replace(/jongeren/gi, 'teen');
  translated = translated.replace(/zowel/gi, 'both');
  translated = translated.replace(/als/gi, 'and');
  translated = translated.replace(/controleer/gi, 'check');
  translated = translated.replace(/gevonden/gi, 'found');
  translated = translated.replace(/notificaties/gi, 'notifications');
  translated = translated.replace(/omgeving/gi, 'area');
  translated = translated.replace(/toestemming/gi, 'permission');
  translated = translated.replace(/validatie/gi, 'validation');
  translated = translated.replace(/duurt/gi, 'takes');
  translated = translated.replace(/probeer/gi, 'try');
  translated = translated.replace(/opnieuw/gi, 'again');
  translated = translated.replace(/gebied/gi, 'area');
  translated = translated.replace(/ontvangen/gi, 'receive');
  translated = translated.replace(/gekozen/gi, 'chosen');
  translated = translated.replace(/tijdslot/gi, 'time slot');
  translated = translated.replace(/opgetreden/gi, 'occurred');
  translated = translated.replace(/afrekenen/gi, 'checkout');
  translated = translated.replace(/voltooi/gi, 'complete');
  translated = translated.replace(/kon/gi, 'could');
  translated = translated.replace(/niet/gi, 'not');
  translated = translated.replace(/valideren/gi, 'validate');
  translated = translated.replace(/maaltijden/gi, 'meals');
  translated = translated.replace(/zoek/gi, 'search');
  translated = translated.replace(/op /gi, 'by ');
  translated = translated.replace(/naam/gi, 'name');
  translated = translated.replace(/email/gi, 'email');
  translated = translated.replace(/telefoonnummer/gi, 'phone number');
  translated = translated.replace(/producten/gi, 'products');
  translated = translated.replace(/gerechten/gi, 'dishes');
  translated = translated.replace(/makers/gi, 'makers');
  translated = translated.replace(/foto/gi, 'photo');
  translated = translated.replace(/reviews/gi, 'reviews');
  translated = translated.replace(/vertel/gi, 'tell');
  translated = translated.replace(/iets/gi, 'something');
  translated = translated.replace(/over/gi, 'about');
  translated = translated.replace(/jezelf/gi, 'yourself');
  translated = translated.replace(/typ/gi, 'type');
  translated = translated.replace(/bericht/gi, 'message');
  translated = translated.replace(/woonplaats/gi, 'place');
  translated = translated.replace(/voor/gi, 'for');
  translated = translated.replace(/deze/gi, 'this');
  translated = translated.replace(/zoekopdracht/gi, 'search');
  translated = translated.replace(/alleen/gi, 'only');
  translated = translated.replace(/met/gi, 'with');
  translated = translated.replace(/geverifieerde/gi, 'verified');
  translated = translated.replace(/plaats/gi, 'place');
  translated = translated.replace(/of/gi, 'or');
  translated = translated.replace(/telefoon/gi, 'phone');
  translated = translated.replace(/verder/gi, 'continue');
  translated = translated.replace(/winkelen/gi, 'shopping');
  
  // Capitalize first letter
  if (translated.length > 0) {
    translated = translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  
  return translated;
}

// Function to recursively find and fix Dutch strings in EN
function fixDutchInEn(obj, nlObj, path = '', fixed = { count: 0 }) {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string' && isLikelyDutch(value)) {
      // Skip FAQ sections for now (they're long and can be done manually)
      if (fullPath.includes('faq') && value.length > 100) {
        continue;
      }
      
      // Try to get from NL file first (it should be the same)
      const nlValue = getNestedValue(nlObj, fullPath);
      if (nlValue && typeof nlValue === 'string' && nlValue === value) {
        // This is definitely Dutch - translate it
        const translated = translateDutchToEnglish(value);
        obj[key] = translated;
        fixed.count++;
      } else {
        // Translate directly
        const translated = translateDutchToEnglish(value);
        obj[key] = translated;
        fixed.count++;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      fixDutchInEn(value, nlObj, fullPath, fixed);
    }
  }
  return fixed.count;
}

console.log('=== FIXING ALL DUTCH IN EN ===\n');

const fixed = fixDutchInEn(en, nl, '', { count: 0 });
console.log(`Fixed ${fixed} Dutch strings in EN file\n`);

// Save updated file
fs.writeFileSync(
  path.join(__dirname, '../public/i18n/en.json'),
  JSON.stringify(en, null, 2) + '\n',
  'utf8'
);

console.log('✅ File updated!');

// Final check
function countDutchInEn(obj, count = 0) {
  for (const value of Object.values(obj)) {
    if (typeof value === 'string' && isLikelyDutch(value) && !value.includes('faq') && value.length < 200) {
      count++;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countDutchInEn(value, 0);
    }
  }
  return count;
}

const remaining = countDutchInEn(en);
console.log(`\nRemaining short Dutch strings in EN (excluding FAQ): ${remaining}`);

if (remaining === 0) {
  console.log('\n✅ All short Dutch strings fixed!');
} else {
  console.log('\n⚠️  Some may remain in FAQ sections (long texts)');
}











