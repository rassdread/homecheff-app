const fs = require('fs');
const path = require('path');

// Common Dutch words/phrases that should be translated
const dutchPatterns = [
  /(?:^|\s)(?:Inloggen|Registreren|Winkelwagen|Berichten|Profiel|Bestellingen|Uitloggen|Instellingen|Annuleren|Opslaan|Verwijderen|Bewerken|Toevoegen|Zoeken|Filteren|Sorteren|Volgende|Vorige|Terug|Sluiten|Openen|Bevestigen|Afwijzen|Laden|Fout|Succes|Waarschuwing|Weet je zeker|Deze actie|kan niet|ongedaan|verwijderen|aanmaken|bijwerken|Geen|Niet|Alle|Totaal|Actief|Inactief|Beschikbaar|Niet beschikbaar|Geladen|Kaart wordt geladen|Fout bij|Succesvol|Mislukt|Opgeslagen|Bijgewerkt|Verwijderd|Toegevoegd|Bewerkt|Gevonden|Niet gevonden|Zoek|Filter|Sorteer|Volgende|Vorige|Terug|Sluit|Open|Bevestig|Afwijs|Ja|Nee|Ophalen|Bezorgen|Verzenden|Ontvangen|Gelezen|Ongelezen|Nieuw|Oud|Hoog|Laag)(?:\s|$)/i,
  /(?:^|\s)(?:van|voor|met|zonder|door|naar|over|onder|tussen|tijdens|na|voor|sinds|tot|bij|op|in|uit|aan|tegen|langs|rond|doorheen|binnen|buiten|boven|onder|achter|voor|naast|tegenover)(?:\s|$)/i,
];

function usesTranslations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('useTranslation') || content.includes('t(');
  } catch (e) {
    return false;
  }
}

function findHardcodedDutch(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findHardcodedDutch(filePath, results);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Skip if already uses translations
      if (usesTranslations(filePath)) {
        continue;
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for Dutch patterns
        for (const pattern of dutchPatterns) {
          if (pattern.test(content)) {
            // Extract lines with matches
            const lines = content.split('\n');
            const matches = [];
            lines.forEach((line, index) => {
              if (pattern.test(line)) {
                matches.push({ line: index + 1, content: line.trim() });
              }
            });
            
            if (matches.length > 0) {
              results.push({
                file: filePath,
                matches: matches.slice(0, 5) // Limit to first 5 matches
              });
              break; // Only add file once
            }
          }
        }
      } catch (e) {
        // Skip files that can't be read
      }
    }
  }
  
  return results;
}

// Start from project root
const projectRoot = path.join(__dirname, '..');
const appDir = path.join(projectRoot, 'app');
const componentsDir = path.join(projectRoot, 'components');

console.log('=== ZOEKEN NAAR HARDCODED NEDERLANDSE TEKST ===\n');

const appResults = findHardcodedDutch(appDir);
const componentResults = findHardcodedDutch(componentsDir);

console.log(`📁 App bestanden met hardcoded tekst: ${appResults.length}`);
appResults.slice(0, 20).forEach(result => {
  console.log(`  - ${result.file.replace(projectRoot + path.sep, '')}`);
  result.matches.forEach(match => {
    console.log(`    Regel ${match.line}: ${match.content.substring(0, 60)}...`);
  });
});

console.log(`\n📁 Component bestanden met hardcoded tekst: ${componentResults.length}`);
componentResults.slice(0, 20).forEach(result => {
  console.log(`  - ${result.file.replace(projectRoot + path.sep, '')}`);
  result.matches.forEach(match => {
    console.log(`    Regel ${match.line}: ${match.content.substring(0, 60)}...`);
  });
});

console.log(`\n✅ Totaal: ${appResults.length + componentResults.length} bestanden met hardcoded Nederlandse tekst`);




