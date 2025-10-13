#!/usr/bin/env node

/**
 * Audit Display Consistency Script
 * 
 * Dit script controleert alle componenten op consistentie van display name logica
 * en identificeert componenten die hun eigen fallback logica gebruiken.
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

function auditDisplayConsistency() {
  console.log('🔍 Audit Display Consistency\n');
  console.log('=' .repeat(80));

  const componentsDir = path.join(__dirname, '..', 'components');
  const files = findFiles(componentsDir);

  console.log(`📊 Geanalyseerde bestanden: ${files.length}\n`);

  const issues = [];
  const inconsistentFiles = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(componentsDir, file);
    
    // Check voor inconsistent display name patterns
    const patterns = [
      // Fallback patterns die inconsistent zijn
      { pattern: /user\.name\s*\|\|\s*user\.username/, name: 'user.name || user.username' },
      { pattern: /\.name\s*\|\|\s*\.username/, name: '.name || .username' },
      { pattern: /user\.username\s*\|\|\s*user\.name/, name: 'user.username || user.name' },
      { pattern: /\.username\s*\|\|\s*\.name/, name: '.username || .name' },
      
      // Inline fallback patterns
      { pattern: /user\.name\s*\|\|\s*'[^']*'/, name: 'user.name || fallback' },
      { pattern: /\.name\s*\|\|\s*'[^']*'/, name: '.name || fallback' },
      { pattern: /user\.username\s*\|\|\s*'[^']*'/, name: 'user.username || fallback' },
      { pattern: /\.username\s*\|\|\s*'[^']*'/, name: '.username || fallback' },
      
      // Triple fallback patterns
      { pattern: /user\.name\s*\|\|\s*user\.username\s*\|\|\s*'[^']*'/, name: 'user.name || user.username || fallback' },
      { pattern: /\.name\s*\|\|\s*\.username\s*\|\|\s*'[^']*'/, name: '.name || .username || fallback' },
    ];

    let fileIssues = [];
    
    patterns.forEach(({ pattern, name }) => {
      const matches = content.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          fileIssues.push({
            type: 'inconsistent_fallback',
            pattern: name,
            match: match.trim(),
            file: relativePath
          });
        });
      }
    });

    // Check of getDisplayName wordt gebruikt
    const usesGetDisplayName = content.includes('getDisplayName');
    
    if (fileIssues.length > 0) {
      inconsistentFiles.push({
        file: relativePath,
        issues: fileIssues,
        usesGetDisplayName
      });
    }

    issues.push(...fileIssues);
  });

  // Categoriseer issues
  const categorizedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.pattern]) {
      acc[issue.pattern] = [];
    }
    acc[issue.pattern].push(issue);
    return acc;
  }, {});

  console.log('📋 Gevonden Inconsistente Patterns:\n');
  
  Object.entries(categorizedIssues).forEach(([pattern, issues]) => {
    console.log(`🔸 ${pattern}: ${issues.length} occurrences`);
    const uniqueFiles = [...new Set(issues.map(i => i.file))];
    console.log(`   Bestanden: ${uniqueFiles.join(', ')}`);
    console.log('');
  });

  console.log('📁 Bestanden met Inconsistente Display Logic:\n');
  
  inconsistentFiles.forEach(({ file, issues, usesGetDisplayName }) => {
    console.log(`📄 ${file}`);
    console.log(`   Issues: ${issues.length}`);
    console.log(`   Gebruikt getDisplayName: ${usesGetDisplayName ? 'Ja' : 'Nee'}`);
    
    const uniquePatterns = [...new Set(issues.map(i => i.pattern))];
    console.log(`   Patterns: ${uniquePatterns.join(', ')}`);
    
    if (!usesGetDisplayName) {
      console.log(`   ⚠️  AANBEVELING: Vervang door getDisplayName functie`);
    }
    console.log('');
  });

  // Samenvatting
  console.log('📊 Samenvatting:\n');
  console.log(`Totaal inconsistenties: ${issues.length}`);
  console.log(`Bestanden met issues: ${inconsistentFiles.length}`);
  console.log(`Bestanden die getDisplayName gebruiken: ${inconsistentFiles.filter(f => f.usesGetDisplayName).length}`);
  console.log(`Bestanden die getDisplayName NIET gebruiken: ${inconsistentFiles.filter(f => !f.usesGetDisplayName).length}`);

  // Prioriteit voor fixes
  const highPriorityFiles = inconsistentFiles.filter(f => !f.usesGetDisplayName);
  
  if (highPriorityFiles.length > 0) {
    console.log('\n🚨 Hoge Prioriteit voor Fixes:\n');
    highPriorityFiles.forEach(({ file }) => {
      console.log(`   - ${file}`);
    });
  }

  // Aanbevelingen
  console.log('\n💡 Aanbevelingen:\n');
  console.log('1. Vervang alle inline fallback logica door getDisplayName functie');
  console.log('2. Importeer getDisplayName uit @/lib/displayName in alle componenten');
  console.log('3. Test alle componenten na wijzigingen');
  console.log('4. Overweeg om ESLint regel toe te voegen om inline fallbacks te voorkomen');
}

// Run de audit
auditDisplayConsistency();
