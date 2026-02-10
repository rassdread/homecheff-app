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

// Function to find all placeholder keys
function findPlaceholders(obj, path = '') {
  const placeholders = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string' && (value.startsWith('[EN:') || value.startsWith('[NL:'))) {
      placeholders.push({ path: fullPath, value, isEn: value.startsWith('[EN:') });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      placeholders.push(...findPlaceholders(value, fullPath));
    }
  }
  return placeholders;
}

// Find placeholders in both files
const nlPlaceholders = findPlaceholders(nl);
const enPlaceholders = findPlaceholders(en);

console.log(`Found ${nlPlaceholders.length} placeholders in NL`);
console.log(`Found ${enPlaceholders.length} placeholders in EN\n`);

// Translation dictionary for common terms
const translations = {
  // Admin
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
  
  // Common UI
  'Add': 'Toevoegen',
  'All': 'Alles',
  'All products': 'Alle producten',
  'Analytics': 'Analytics',
  'Detailed reports': 'Gedetailleerde rapporten',
  'Detailed insights into your sales': 'Gedetailleerde inzichten in je verkopen',
  'Average Rating': 'Gemiddelde beoordeling',
  'Back': 'Terug',
  'Back to dashboard': 'Terug naar dashboard',
  'Cancel': 'Annuleren',
  'Cancelled': 'Geannuleerd',
  
  // Checkout
  'Address validated': 'Adres gevalideerd',
  'Address validated and calculating': 'Adres gevalideerd en aan het berekenen',
  'All available deliverers receive notification': 'Alle beschikbare bezorgers ontvangen een melding',
  'Available in chosen time slot': 'Beschikbaar in gekozen tijdslot',
  'Cannot validate address': 'Kan adres niet valideren',
  'Cart empty': 'Winkelwagen leeg',
  'Checkout error': 'Checkout fout',
  'Checkout title': 'Afrekenen',
  'Complete order': 'Bestelling voltooien',
  'Continue shopping': 'Verder winkelen',
  'Could not validate address': 'Kon adres niet valideren',
  'Delivery time': 'Bezorgtijd',
  'DHL/PostNL': 'DHL/PostNL',
  'Fill postcode and house number': 'Vul postcode en huisnummer in',
  'First accepts delivers': 'Eerste die accepteert bezorgt',
  'Local delivery estimated time': 'Geschatte tijd lokale bezorging',
  'Login': 'Inloggen',
  'Login required message': 'Je moet ingelogd zijn om af te rekenen',
  'No deliverers available': 'Geen bezorgers beschikbaar',
  'Notes (optional)': 'Notities (optioneel)',
  'Notes placeholder': 'Bijv. bel aan bij de voordeur',
};

// Function to extract text from placeholder
function extractPlaceholderText(placeholder) {
  if (placeholder.startsWith('[EN:')) {
    return placeholder.replace(/^\[EN:\s*/, '').replace(/\s*\]$/, '');
  }
  if (placeholder.startsWith('[NL:')) {
    return placeholder.replace(/^\[NL:\s*/, '').replace(/\s*\]$/, '');
  }
  return placeholder;
}

// Fix NL placeholders (they should have Dutch text, get from EN if available)
let fixedNl = 0;
for (const { path: keyPath, value, isEn } of nlPlaceholders) {
  const extractedText = extractPlaceholderText(value);
  
  // If it's an EN placeholder in NL file, try to get the EN value and translate
  if (isEn) {
    const enValue = getNestedValue(en, keyPath);
    if (enValue && typeof enValue === 'string' && !enValue.startsWith('[')) {
      // Use translation dictionary or keep EN value as fallback
      const translation = translations[enValue] || enValue;
      setNestedValue(nl, keyPath, translation);
      fixedNl++;
    } else if (translations[extractedText]) {
      setNestedValue(nl, keyPath, translations[extractedText]);
      fixedNl++;
    }
  }
}

// Fix EN placeholders (they should have English text, get from NL if available)
let fixedEn = 0;
for (const { path: keyPath, value, isEn } of enPlaceholders) {
  const extractedText = extractPlaceholderText(value);
  
  // If it's an NL placeholder in EN file, try to get the NL value
  if (!isEn) {
    const nlValue = getNestedValue(nl, keyPath);
    if (nlValue && typeof nlValue === 'string' && !nlValue.startsWith('[')) {
      // Reverse lookup in translations or use NL value as fallback
      const reverseTranslation = Object.entries(translations).find(([en, nl]) => nl === nlValue);
      const translation = reverseTranslation ? reverseTranslation[0] : nlValue;
      setNestedValue(en, keyPath, translation);
      fixedEn++;
    } else if (extractedText) {
      // Use extracted text as is (it's already in the target language)
      setNestedValue(en, keyPath, extractedText);
      fixedEn++;
    }
  }
}

console.log(`Fixed ${fixedNl} placeholders in NL`);
console.log(`Fixed ${fixedEn} placeholders in EN\n`);

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
console.log('\n⚠️  Remaining placeholders may need manual translation');











