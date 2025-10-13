#!/usr/bin/env node

/**
 * Safe Display Name Fix Script
 * 
 * Dit script fix alleen de display name consistentie ZONDER functionaliteit te wijzigen.
 * Het vervangt alleen inconsistente fallback logica door getDisplayName functie.
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, extension = '.tsx') {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, extension));
    } else if (stat.isFile() && item.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function safeFixDisplayNames() {
  console.log('🔧 Safe Display Name Fix - Alleen Consistentie\n');
  console.log('=' .repeat(80));

  const componentsDir = path.join(__dirname, '..', 'components');
  const files = findFiles(componentsDir);

  console.log(`📊 Bestanden om te controleren: ${files.length}\n`);

  const fixes = [];
  const alreadyFixed = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(componentsDir, file);
    
    // Skip als het bestand al getDisplayName gebruikt
    if (content.includes('getDisplayName')) {
      alreadyFixed.push(relativePath);
      return;
    }

    // Alleen veilige patterns vervangen - GEEN functionaliteit wijzigen
    const safeReplacements = [
      // Alleen fallback logica vervangen, geen andere logica
      {
        pattern: /user\.name\s*\|\|\s*'([^']*)'/g,
        replacement: 'getDisplayName(user)',
        description: 'user.name || fallback'
      },
      {
        pattern: /\.name\s*\|\|\s*'([^']*)'/g,
        replacement: 'getDisplayName(user)',
        description: '.name || fallback'
      },
      {
        pattern: /user\.username\s*\|\|\s*'([^']*)'/g,
        replacement: 'getDisplayName(user)',
        description: 'user.username || fallback'
      },
      {
        pattern: /\.username\s*\|\|\s*'([^']*)'/g,
        replacement: 'getDisplayName(user)',
        description: '.username || fallback'
      }
    ];

    let fileChanged = false;
    let newContent = content;

    safeReplacements.forEach(({ pattern, replacement, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        fileChanged = true;
        
        matches.forEach(match => {
          fixes.push({
            file: relativePath,
            original: match,
            replacement: replacement,
            description: description
          });
        });
      }
    });

    // Voeg import toe als er wijzigingen zijn
    if (fileChanged && !content.includes("import { getDisplayName }")) {
      // Zoek naar de eerste import statement
      const importMatch = newContent.match(/^import.*from.*;$/m);
      if (importMatch) {
        const importIndex = importMatch.index + importMatch[0].length;
        newContent = newContent.slice(0, importIndex) + 
                    "\nimport { getDisplayName } from '@/lib/displayName';" +
                    newContent.slice(importIndex);
      }
    }

    // Schrijf alleen terug als er wijzigingen zijn
    if (fileChanged) {
      fs.writeFileSync(file, newContent, 'utf8');
    }
  });

  console.log('✅ Al Gefixte Bestanden (gebruiken al getDisplayName):\n');
  alreadyFixed.forEach(file => {
    console.log(`   - ${file}`);
  });

  console.log(`\n🔧 Toegepaste Fixes: ${fixes.length}\n`);
  
  if (fixes.length > 0) {
    const filesFixed = [...new Set(fixes.map(f => f.file))];
    
    filesFixed.forEach(file => {
      const fileFixes = fixes.filter(f => f.file === file);
      console.log(`📄 ${file}:`);
      fileFixes.forEach(fix => {
        console.log(`   ${fix.description}: "${fix.original}" → "${fix.replacement}"`);
      });
      console.log('');
    });
  } else {
    console.log('Geen fixes nodig - alle bestanden zijn al consistent!\n');
  }

  console.log('📊 Samenvatting:\n');
  console.log(`Bestanden al gefixed: ${alreadyFixed.length}`);
  console.log(`Bestanden nu gefixed: ${[...new Set(fixes.map(f => f.file))].length}`);
  console.log(`Totaal fixes toegepast: ${fixes.length}`);
  
  console.log('\n✅ Veilige fixes toegepast - GEEN functionaliteit gewijzigd!\n');
}

// Run de veilige fix
safeFixDisplayNames();
