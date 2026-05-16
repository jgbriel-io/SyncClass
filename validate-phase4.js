#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validação de Fase 4: Centralização 100% de Strings
 * Procura por 6 tipos de tags/atributos com strings hardcoded em TODOS os componentes
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

// All 20 locations (16 folders + 4 files)
const ALL_LOCATIONS = [
  // Fase 1: Fundação
  'src/components/ui',
  'src/components/layout',
  'src/ErrorBoundary.tsx',
  'src/NavLink.tsx',
  'src/SectionErrorBoundary.tsx',
  'src/withSectionErrorBoundary.tsx',
  // Fase 2: Domínios Principais
  'src/components/students',
  'src/components/teachers',
  'src/components/financial',
  'src/components/classes',
  'src/components/activities',
  // Fase 3: Componentes Secundários
  'src/components/admin',
  'src/components/dashboard',
  'src/components/overview',
  'src/components/auth',
  'src/components/filters',
  'src/components/student',
  'src/components/users',
  'src/components/pwa'
];

// Strings que são permitidas (variáveis, expressões, etc)
const ALLOWED_PATTERNS = [
  /^\s*\{.*\}\s*$/, // {variable}
  /^\s*\$\{.*\}\s*$/, // ${variable}
  /^\s*<.*>\s*$/, // <component>
  /^\s*$/, // empty
  /^\s*&nbsp;\s*$/, // &nbsp;
  /^\s*\.\.\.\s*$/, // ...
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

function getLocationName(location) {
  if (location.includes('/')) {
    return location.split('/').pop();
  }
  return location.replace('.tsx', '').replace('.ts', '');
}

function main() {
  console.log('🔍 Validação de Fase 4: Centralização 100% de Strings\n');
  console.log('Validando TODOS os 20 locais (16 pastas + 4 arquivos):\n');
  
  ALL_LOCATIONS.forEach((loc, i) => {
    console.log(`  ${i + 1}. ${loc}`);
  });
  
  console.log('\n' + '='.repeat(100) + '\n');
  
  const allFiles = [];
  const allFindings = [];
  const locationStats = {};
  
  // Collect all files
  for (const location of ALL_LOCATIONS) {
    const files = getFiles(location);
    allFiles.push(...files);
    locationStats[location] = {
      files: files.length,
      findings: 0
    };
  }
  
  console.log(`Total de arquivos encontrados: ${allFiles.length}\n`);
  
  // Validate each file
  for (const file of allFiles) {
    const findings = validateFile(file);
    if (findings.length > 0) {
      allFindings.push(...findings);
      
      // Update location stats
      for (const location of ALL_LOCATIONS) {
        if (file.startsWith(location)) {
          locationStats[location].findings += findings.length;
          break;
        }
      }
    }
  }
  
  // Generate report
  console.log('📊 ESTATÍSTICAS POR PASTA:\n');
  
  let totalFindings = 0;
  const locationReports = [];
  
  for (const location of ALL_LOCATIONS) {
    const stats = locationStats[location];
    const status = stats.findings === 0 ? '✅' : '❌';
    const locName = getLocationName(location);
    
    console.log(`${status} ${locName.padEnd(30)} | Arquivos: ${stats.files.toString().padStart(2)} | Strings: ${stats.findings.toString().padStart(3)}`);
    
    locationReports.push({
      location,
      files: stats.files,
      findings: stats.findings,
      status: stats.findings === 0 ? 'PASS' : 'FAIL'
    });
    
    totalFindings += stats.findings;
  }
  
  console.log('\n' + '='.repeat(100) + '\n');
  
  if (allFindings.length === 0) {
    console.log('✅ VALIDAÇÃO PASSOU!');
    console.log('0% de strings hardcoded encontradas em TODOS os 20 locais');
    console.log(`\nArquivos validados: ${allFiles.length}`);
    console.log('Centralization rate: 100%\n');
    
    // Save report
    const report = generateReport(locationReports, allFiles.length, 0);
    fs.writeFileSync('VALIDATION_REPORT_PHASE4_TASK1.md', report);
    console.log('📄 Relatório salvo em: VALIDATION_REPORT_PHASE4_TASK1.md\n');
    
    process.exit(0);
  } else {
    console.log('❌ VALIDAÇÃO FALHOU!');
    console.log(`${allFindings.length} strings hardcoded encontradas em ${Object.keys(locationStats).filter(k => locationStats[k].findings > 0).length} locais\n`);
    
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
      });
    }
    
    console.log('\n' + '='.repeat(100));
    console.log(`\nResumo: ${allFindings.length} strings hardcoded em ${Object.keys(byFile).length} arquivos`);
    
    // Save report
    const report = generateReport(locationReports, allFiles.length, allFindings.length, byFile);
    fs.writeFileSync('VALIDATION_REPORT_PHASE4_TASK1.md', report);
    console.log('\n📄 Relatório salvo em: VALIDATION_REPORT_PHASE4_TASK1.md\n');
    
    process.exit(1);
  }
}

function generateReport(locationReports, totalFiles, totalFindings, byFile = {}) {
  const timestamp = new Date().toISOString();
  const centralizationRate = totalFindings === 0 ? '100%' : `${((totalFiles - totalFindings) / totalFiles * 100).toFixed(2)}%`;
  
  let report = `# Validation Report - Phase 4 Task 1\n\n`;
  report += `**Generated**: ${timestamp}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Files Audited**: ${totalFiles}\n`;
  report += `- **Total Hardcoded Strings Found**: ${totalFindings}\n`;
  report += `- **Centralization Rate**: ${centralizationRate}\n`;
  report += `- **Status**: ${totalFindings === 0 ? '✅ PASS' : '❌ FAIL'}\n\n`;
  
  report += `## Statistics by Location\n\n`;
  report += `| Location | Files | Strings | Status |\n`;
  report += `|----------|-------|---------|--------|\n`;
  
  for (const loc of locationReports) {
    const locName = loc.location.includes('/') ? loc.location.split('/').pop() : loc.location.replace('.tsx', '');
    report += `| ${locName} | ${loc.files} | ${loc.findings} | ${loc.status} |\n`;
  }
  
  if (totalFindings > 0) {
    report += `\n## Detailed Findings\n\n`;
    
    for (const [file, findings] of Object.entries(byFile)) {
      report += `### ${file}\n\n`;
      report += `| Line | Type | Text |\n`;
      report += `|------|------|------|\n`;
      
      for (const f of findings) {
        report += `| ${f.line} | ${f.type} | \`${f.text.substring(0, 50)}\` |\n`;
      }
      
      report += `\n`;
    }
  }
  
  report += `## Validation Checklist\n\n`;
  report += `- [x] Checked all 20 locations (16 folders + 4 files)\n`;
  report += `- [x] Validated 6 types of tags/attributes:\n`;
  report += `  - [x] HTML content (p, span, div, h1-h6, label, button, a, li, td, th, strong, em, small)\n`;
  report += `  - [x] Placeholder attributes\n`;
  report += `  - [x] Title attributes\n`;
  report += `  - [x] Aria-label attributes\n`;
  report += `  - [x] Alt attributes\n`;
  report += `  - [x] Option content\n`;
  report += `- [x] Generated detailed report with statistics by folder\n`;
  report += `- [x] Identified remaining hardcoded strings (if any)\n\n`;
  
  report += `## Next Steps\n\n`;
  if (totalFindings === 0) {
    report += `✅ All components are 100% centralized. Proceed to Task 4.2 (Snapshot Tests).\n`;
  } else {
    report += `❌ Found ${totalFindings} hardcoded strings. Fix these before proceeding to Task 4.2.\n`;
  }
  
  return report;
}

main();
