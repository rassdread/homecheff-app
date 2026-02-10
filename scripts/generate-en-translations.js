const fs = require('fs');
const path = require('path');

// Read nl.json
const nlPath = path.join(__dirname, '../public/i18n/nl.json');
const nl = JSON.parse(fs.readFileSync(nlPath, 'utf8'));

// Translation mapping for common Dutch to English
const translations = {
  // Navigation
  'Inloggen': 'Login',
  'Registreren': 'Register',
  'Profiel': 'Profile',
  'Bestellingen': 'Orders',
  'Winkelwagen': 'Shopping Cart',
  'Uitloggen': 'Logout',
  'Instellingen': 'Settings',
  'Help': 'Help',
  
  // Common
  'Home': 'Home',
  'Dashboard': 'Dashboard',
  'Berichten': 'Messages',
  'Mijn Profiel': 'My Profile',
  'Privacy Instellingen': 'Privacy Settings',
  'Admin Dashboard': 'Admin Dashboard',
  'Verkoper Dashboard': 'Seller Dashboard',
  'Bezorger Dashboard': 'Delivery Dashboard',
  'Multi-rol gebruiker': 'Multi-role user',
  'Werken bij': 'Work With Us',
  
  // Categories
  'Dorpsplein': 'Village Square',
  'Inspiratie': 'Inspiration',
  'FAQ': 'FAQ',
  
  // Messages
  'Verstuur bericht': 'Send message',
  'Typ een bericht...': 'Type a message...',
  'Geen berichten gevonden': 'No messages found',
  
  // Cart
  'Je winkelwagen staat klaar voor jouw volgende ontdekking': 'Your shopping cart is ready for your next discovery',
  'Ontdek wat er nu beschikbaar is in je buurt': 'Discover what is now available in your area',
  'Naar checkout': 'Go to checkout',
  'Subtotaal': 'Subtotal',
  'Totaal': 'Total',
  'Aantal': 'Quantity',
  'Verwijderen': 'Remove',
  
  // Hero
  'Welkom, {username}! Wat zal het vandaag worden?': 'Welcome, {username}! What will it be today?',
  'Zoek naar gerechten, producten of verkopers…': 'Search for dishes, products or sellers…',
  'Filters': 'Filters',
  'Filters resetten': 'Reset Filters',
  'Mijn profiel': 'My Profile',
};

// Function to translate a value
function translateValue(value, key = '') {
  if (typeof value === 'string') {
    // Check direct translation
    if (translations[value]) {
      return translations[value];
    }
    // Keep placeholders and common patterns
    if (value.includes('{')) {
      return value; // Keep as is for now, will need manual translation
    }
    // Return original if no translation found
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(item => translateValue(item, key));
    }
    const translated = {};
    for (const [k, v] of Object.entries(value)) {
      translated[k] = translateValue(v, k);
    }
    return translated;
  }
  return value;
}

// Generate en.json structure
const en = {};
for (const [key, value] of Object.entries(nl)) {
  en[key] = translateValue(value, key);
}

// Write to file
const enPath = path.join(__dirname, '../public/i18n/en.json');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');

console.log('✅ Generated en.json with', Object.keys(en).length, 'top-level keys');
console.log('⚠️  Note: Many translations are placeholders and need manual review');











