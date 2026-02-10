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
  const componentsDir = path.join(__dirname, '..', 'components');
  const files = findFiles(componentsDir);
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
  Object.entries(categorizedIssues).forEach(([pattern, issues]) => {
    const uniqueFiles = [...new Set(issues.map(i => i.file))];
  });
  inconsistentFiles.forEach(({ file, issues, usesGetDisplayName }) => {
    const uniquePatterns = [...new Set(issues.map(i => i.pattern))];
    if (!usesGetDisplayName) {
    }
  });

  // Samenvatting
  // Prioriteit voor fixes
  const highPriorityFiles = inconsistentFiles.filter(f => !f.usesGetDisplayName);
  
  if (highPriorityFiles.length > 0) {
    highPriorityFiles.forEach(({ file }) => {
    });
  }

  // Aanbevelingen
}

// Run de audit
auditDisplayConsistency();
