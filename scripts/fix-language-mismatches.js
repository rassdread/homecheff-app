const fs = require('fs');
const path = require('path');

// Read both files
const nl = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/i18n/nl.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/i18n/en.json'), 'utf8'));

// Translation dictionary for common English -> Dutch
const enToNl = {
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
  'New product': 'Nieuw product',
  'Add product': 'Product toevoegen',
};

// Translation dictionary for common Dutch -> English
const nlToEn = {
  'Inloggen': 'Login',
  'Registreren': 'Register',
  'Winkelwagen': 'Shopping Cart',
  'Berichten': 'Messages',
  'Profiel': 'Profile',
  'Bestellingen': 'Orders',
  'Uitloggen': 'Logout',
  'Instellingen': 'Settings',
  'Help': 'Help',
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

// Function to check if string is likely English
function isLikelyEnglish(str) {
  const englishWords = ['click', 'available', 'cancel', 'back', 'add', 'all products', 'the ', 'message', 'total', 'unknown', 'status', 'time', 'roles'];
  const lower = str.toLowerCase();
  return englishWords.some(word => lower.includes(word)) && 
         !lower.includes('klik') && 
         !lower.includes('beschikbaar') && 
         !lower.includes('annuleren') && 
         !lower.includes('terug') &&
         !lower.includes('toevoegen') &&
         !lower.includes('bericht') &&
         !lower.includes('totaal') &&
         !lower.includes('onbekend') &&
         !lower.includes('status') &&
         !lower.includes('tijd') &&
         !lower.includes('rollen');
}

// Function to check if string is likely Dutch
function isLikelyDutch(str) {
  const dutchWords = ['inloggen', 'registreren', 'winkelwagen', 'berichten', 'profiel', 'bestellingen', 'uitloggen', 'instellingen'];
  const lower = str.toLowerCase();
  return dutchWords.some(word => lower.includes(word));
}

// Function to recursively fix language mismatches
function fixLanguageMismatches(obj, otherObj, path = '', fixed = { count: 0 }, isNl = true) {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string' && value.length > 0) {
      // Check if this looks like the wrong language
      if (isNl && isLikelyEnglish(value)) {
        // Try to get from EN file first
        const enValue = getNestedValue(otherObj, fullPath);
        if (enValue && typeof enValue === 'string' && !isLikelyEnglish(enValue)) {
          // Use translation dictionary or keep EN value
          const translation = enToNl[value] || enToNl[enValue] || enValue;
          obj[key] = translation;
          fixed.count++;
        } else if (enToNl[value]) {
          obj[key] = enToNl[value];
          fixed.count++;
        }
      } else if (!isNl && isLikelyDutch(value)) {
        // Try to get from NL file first
        const nlValue = getNestedValue(otherObj, fullPath);
        if (nlValue && typeof nlValue === 'string' && !isLikelyDutch(nlValue)) {
          // Use translation dictionary or keep NL value
          const translation = nlToEn[value] || nlToEn[nlValue] || nlValue;
          obj[key] = translation;
          fixed.count++;
        } else if (nlToEn[value]) {
          obj[key] = nlToEn[value];
          fixed.count++;
        }
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      fixLanguageMismatches(value, otherObj, fullPath, fixed, isNl);
    }
  }
  return fixed.count;
}

console.log('=== FIXING LANGUAGE MISMATCHES ===\n');

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

// Verify - check for remaining issues
function findRemainingIssues(obj, path = '', issues = [], isNl = true) {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string' && value.length > 0) {
      if (isNl && isLikelyEnglish(value)) {
        issues.push({ path: fullPath, value: value.substring(0, 80) });
      } else if (!isNl && isLikelyDutch(value)) {
        issues.push({ path: fullPath, value: value.substring(0, 80) });
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      findRemainingIssues(value, fullPath, issues, isNl);
    }
  }
  return issues;
}

const remainingNl = findRemainingIssues(nl, '', [], true);
const remainingEn = findRemainingIssues(en, '', [], false);

console.log(`\nRemaining issues:`);
console.log(`NL: ${remainingNl.length} potentially English strings`);
console.log(`EN: ${remainingEn.length} potentially Dutch strings`);

if (remainingNl.length > 0) {
  console.log('\nSample NL issues:');
  remainingNl.slice(0, 5).forEach(i => console.log(`  - ${i.path}: ${i.value}`));
}

if (remainingEn.length > 0) {
  console.log('\nSample EN issues:');
  remainingEn.slice(0, 5).forEach(i => console.log(`  - ${i.path}: ${i.value}`));
}











