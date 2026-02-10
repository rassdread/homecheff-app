const fs = require('fs');
const path = require('path');

// Count files
function countFiles(dir, excludeDirs = ['node_modules', 'backup-extracted', '.next', 'dist']) {
  let count = 0;
  let files = [];
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);
      
      // Skip excluded directories
      if (excludeDirs.some(exclude => relativePath.includes(exclude))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
        count++;
        files.push(relativePath);
      }
    }
  }
  
  walkDir(dir);
  return { count, files };
}

// Check if file uses translations
function usesTranslations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('useTranslation') || content.includes('from \'@/hooks/useTranslation\'');
  } catch (e) {
    return false;
  }
}

// Check for hardcoded Dutch text (simple check)
function hasHardcodedDutch(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Common Dutch words/phrases
    const dutchPatterns = [
      /(?:^|\s)(?:Inloggen|Registreren|Winkelwagen|Berichten|Profiel|Bestellingen|Uitloggen|Instellingen|Annuleren|Opslaan|Verwijderen|Bewerken|Toevoegen|Zoeken|Filteren|Sorteren|Volgende|Vorige|Terug|Sluiten|Openen|Bevestigen|Afwijzen|Ja|Nee|Ja|Nee|Ophalen|Bezorgen|Verzenden|Ontvangen|Gelezen|Ongelezen|Nieuw|Oud|Hoog|Laag|Actief|Inactief|Beschikbaar|Niet beschikbaar|Geladen|Laden|Fout|Succes|Waarschuwing|Informatie|Details|Overzicht|Lijst|Kaart|Grafiek|Tabel|Rapport|Export|Import|Download|Upload|Verwijder|Bewerk|Toevoeg|Zoek|Filter|Sorteer|Volgende|Vorige|Terug|Sluit|Open|Bevestig|Afwijs)(?:\s|$)/i,
      /(?:^|\s)(?:van|voor|met|zonder|door|naar|over|onder|tussen|tijdens|na|voor|sinds|tot|bij|op|in|uit|aan|tegen|langs|rond|doorheen|binnen|buiten|boven|onder|achter|voor|naast|tegenover|tussen|onder|boven|naast|tegenover|tussen|onder|boven|naast|tegenover)(?:\s|$)/i,
      /(?:^|\s)(?:de|het|een|een|van|voor|met|zonder|door|naar|over|onder|tussen|tijdens|na|voor|sinds|tot|bij|op|in|uit|aan|tegen|langs|rond|doorheen|binnen|buiten|boven|onder|achter|voor|naast|tegenover|tussen|onder|boven|naast|tegenover)(?:\s|$)/i
    ];
    
    // Skip if file uses translations (likely translated)
    if (usesTranslations(filePath)) {
      return false;
    }
    
    // Check for Dutch patterns (but exclude comments and strings that are clearly not UI text)
    const lines = content.split('\n');
    for (const line of lines) {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        continue;
      }
      
      // Check for Dutch patterns in strings
      for (const pattern of dutchPatterns) {
        if (pattern.test(line)) {
          // Make sure it's not in a comment or import
          if (!line.includes('import') && !line.includes('//') && line.includes('"') || line.includes("'")) {
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

// Main analysis
const appDir = path.join(process.cwd(), 'app');
const componentsDir = path.join(process.cwd(), 'components');

const appStats = countFiles(appDir);
const componentStats = countFiles(componentsDir);

let appWithTranslations = 0;
let appWithHardcoded = 0;
let componentsWithTranslations = 0;
let componentsWithHardcoded = 0;

// Analyze app files
for (const file of appStats.files) {
  if (usesTranslations(file)) {
    appWithTranslations++;
  } else if (hasHardcodedDutch(file)) {
    appWithHardcoded++;
  }
}

// Analyze component files
for (const file of componentStats.files) {
  if (usesTranslations(file)) {
    componentsWithTranslations++;
  } else if (hasHardcodedDutch(file)) {
    componentsWithHardcoded++;
  }
}

const totalFiles = appStats.count + componentStats.count;
const totalWithTranslations = appWithTranslations + componentsWithTranslations;
const totalWithHardcoded = appWithHardcoded + componentsWithHardcoded;
const totalNeutral = totalFiles - totalWithTranslations - totalWithHardcoded;

const translationPercentage = ((totalWithTranslations / totalFiles) * 100).toFixed(1);
const hardcodedPercentage = ((totalWithHardcoded / totalFiles) * 100).toFixed(1);
const neutralPercentage = ((totalNeutral / totalFiles) * 100).toFixed(1);

console.log('=== VERTALING COVERAGE ANALYSE ===\n');
console.log(`📁 Totaal bestanden: ${totalFiles}`);
console.log(`   - App pagina's: ${appStats.count}`);
console.log(`   - Componenten: ${componentStats.count}\n`);

console.log(`✅ Met vertalingen (useTranslation): ${totalWithTranslations} (${translationPercentage}%)`);
console.log(`   - App pagina's: ${appWithTranslations}`);
console.log(`   - Componenten: ${componentsWithTranslations}\n`);

console.log(`⚠️  Met hardcoded Nederlandse tekst: ${totalWithHardcoded} (${hardcodedPercentage}%)`);
console.log(`   - App pagina's: ${appWithHardcoded}`);
console.log(`   - Componenten: ${componentsWithHardcoded}\n`);

console.log(`📄 Neutraal/geen UI tekst: ${totalNeutral} (${neutralPercentage}%)\n`);

console.log(`🎯 VERTALING COVERAGE: ${translationPercentage}%`);
console.log(`📊 Geschatte tweetaligheid: ${translationPercentage}% (componenten met vertalingen)`);




