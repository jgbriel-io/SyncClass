#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validação de Fase 1: Centralização 100% de Strings
 * Procura por 6 tipos de tags/atributos com strings hardcoded
 */

const PATTERNS = {
  // 1. Conteúdo entre tags HTML
  htmlContent: {
    regex: /(<(?:p|span|div|h[1-6]|label|button|a|li|td|th|strong|em|small)(?:\s[^>]*)?>)([^<{]+)(<\/\1>)/g,
    type: 'HTML Content',
    description: 'Texto entre tags HTML'
  },
  // 2. Atributo placeholder
  placeholder: {
    regex: /placeholder=["']([^"']+)["']/g,
    type: 'Placeholder',
    description: 'Atributo placeholder'
  },
  // 3. Atributo title
  title: {
    regex: /title=["']([^"']+)["']/g,
    type: 'Title',
    description: 'Atributo title'
  },
  // 4. Atributo aria-label
  ariaLabel: {
    regex: /aria-label=["']([^"']+)["']/g,
    type: 'Aria-label',
    description: 'Atributo aria-label'
  },
  // 5. Atributo alt
  alt: {
    regex: /alt=["']([^"']+)["']/g,
    type: 'Alt',
    description: 'Atributo alt'
  },
  // 6. Conteúdo de option
  option: {
    regex: /<option(?:\s[^>]*)?>([^<{]+)<\/option>/g,
    type: 'Option',
    description: 'Conteúdo de <option>'
  }
};

// Fase 1 locations
const FASE1_LOCATIONS = [
  'src/components/ui',
  'src/components/layout',
  'src/ErrorBoundary.tsx',
  'src/NavLink.tsx',
  'src/SectionErrorBoundary.tsx',
  'src/withSectionErrorBoundary.tsx'
];

// Strings que são permitidas (variáveis, expressões, etc)
const ALLOWED_PATTERNS = [
  /^\s*\{.*\}\s*$/, // {variable}
  /^\s*\$\{.*\}\s*$/, // ${variable}
  /^\s*<.*>\s*$/, // <component>
  /^\s*$/, // empty
];

function isAllowed(text) {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(text));
}

function getFiles(location) {
  const fullPath = path.join(process.cwd(), location);
  
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    return [location];
  }
  
  if (stat.isDirectory()) {
    return fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
      .map(f => path.join(location, f));
  }
  
  return [];
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];
  
  // Check each pattern
  for (const [key, pattern] of Object.entries(PATTERNS)) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'g');
    
    while ((match = regex.exec(content)) !== null) {
      // Extract the text content (usually group 1 or 2)
      let text = match[1] || match[2] || '';
      
      // Skip if it's allowed (variable, expression, etc)
      if (isAllowed(text)) {
        continue;
      }
      
      // Skip if it's a JSX expression
      if (text.includes('{') || text.includes('$')) {
        continue;
      }
      
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      findings.push({
        file: filePath,
        line: lineNumber,
        type: pattern.type,
        text: text.trim(),
        match: match[0]
      });
    }
  }
  
  return findings;
}

function main() {
  console.log('🔍 Validando Fase 1: Centralização 100% de Strings\n');
  console.log('Locais a validar:');
  FASE1_LOCATIONS.forEach(loc => console.log(`  - ${loc}`));
  console.log('\n' + '='.repeat(80) + '\n');
  
  const allFiles = [];
  const allFindings = [];
  
  // Collect all files
  for (const location of FASE1_LOCATIONS) {
    const files = getFiles(location);
    allFiles.push(...files);
  }
  
  console.log(`Total de arquivos encontrados: ${allFiles.length}\n`);
  
  // Validate each file
  for (const file of allFiles) {
    const findings = validateFile(file);
    if (findings.length > 0) {
      allFindings.push(...findings);
    }
  }
  
  // Generate report
  if (allFindings.length === 0) {
    console.log('✅ VALIDAÇÃO PASSOU!');
    console.log('0% de strings hardcoded encontradas em Fase 1');
    console.log('\nArquivos validados:');
    allFiles.forEach(f => console.log(`  ✓ ${f}`));
    process.exit(0);
  } else {
    console.log('❌ VALIDAÇÃO FALHOU!');
    console.log(`${allFindings.length} strings hardcoded encontradas:\n`);
    
    // Group by file
    const byFile = {};
    for (const finding of allFindings) {
      if (!byFile[finding.file]) {
        byFile[finding.file] = [];
      }
      byFile[finding.file].push(finding);
    }
    
    // Print findings
    for (const [file, findings] of Object.entries(byFile)) {
      console.log(`\n📄 ${file}`);
      findings.forEach(f => {
        console.log(`  Linha ${f.line}: [${f.type}] "${f.text}"`);
        console.log(`    Match: ${f.match.substring(0, 60)}...`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\nResumo: ${allFindings.length} strings hardcoded em ${Object.keys(byFile).length} arquivos`);
    process.exit(1);
  }
}

main();
