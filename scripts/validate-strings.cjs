#!/usr/bin/env node

/**
 * Script de validação estática para detectar strings hardcoded em componentes React
 * 
 * Procura por 6 tipos de tags/atributos:
 * 1. Conteúdo entre tags HTML (p, span, div, h1-h6, label, button, a, li, td, th, strong, em, small)
 * 2. Atributo placeholder="..."
 * 3. Atributo title="..."
 * 4. Atributo aria-label="..."
 * 5. Atributo alt="..."
 * 6. Conteúdo de <option>Texto</option>
 */

const fs = require('fs');
const path = require('path');

// 20 locais a auditar
const LOCATIONS = [
  // Fase 1: Fundação
  'src/components/ui',
  'src/components/layout',
  'src/components/ErrorBoundary.tsx',
  'src/components/NavLink.tsx',
  'src/components/SectionErrorBoundary.tsx',
  'src/components/withSectionErrorBoundary.tsx',
  
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
  'src/components/pwa',
];

// Padrões regex para detectar strings hardcoded
const PATTERNS = [
  {
    name: 'Conteúdo entre tags HTML',
    regex: /<(p|span|div|h[1-6]|label|button|a|li|td|th|strong|em|small)([^>]*)>([^<{]*[A-Za-zÀ-ÿ][^<{]*)<\/\1>/g,
    captureGroup: 3,
  },
  {
    name: 'Atributo placeholder',
    regex: /placeholder=["']([^"'{]*[A-Za-zÀ-ÿ][^"'{]*)["']/g,
    captureGroup: 1,
  },
  {
    name: 'Atributo title',
    regex: /title=["']([^"'{]*[A-Za-zÀ-ÿ][^"'{]*)["']/g,
    captureGroup: 1,
  },
  {
    name: 'Atributo aria-label',
    regex: /aria-label=["']([^"'{]*[A-Za-zÀ-ÿ][^"'{]*)["']/g,
    captureGroup: 1,
  },
  {
    name: 'Atributo alt',
    regex: /alt=["']([^"'{]*[A-Za-zÀ-ÿ][^"'{]*)["']/g,
    captureGroup: 1,
  },
  {
    name: 'Conteúdo de <option>',
    regex: /<option([^>]*)>([^<{]*[A-Za-zÀ-ÿ][^<{]*)<\/option>/g,
    captureGroup: 2,
  },
];

// Resultados globais
const results = {
  totalLocations: LOCATIONS.length,
  locationsScanned: 0,
  totalFiles: 0,
  filesWithHardcoding: 0,
  totalHardcodedStrings: 0,
  locationResults: [],
};

/**
 * Verifica se um caminho existe
 */
function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lista todos os arquivos .tsx em um diretório recursivamente
 */
function getTsxFiles(dir) {
  const files = [];
  
  if (!exists(dir)) {
    return files;
  }
  
  const stat = fs.statSync(dir);
  
  if (stat.isFile() && dir.endsWith('.tsx')) {
    return [dir];
  }
  
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      files.push(...getTsxFiles(fullPath));
    }
  }
  
  return files;
}

/**
 * Detecta strings hardcoded em um arquivo
 */
function detectHardcodedStrings(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];
  
  for (const pattern of PATTERNS) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    
    while ((match = regex.exec(content)) !== null) {
      const hardcodedString = match[pattern.captureGroup].trim();
      
      // Ignorar strings vazias, apenas espaços, ou que começam com {
      if (!hardcodedString || hardcodedString.startsWith('{') || /^\s*$/.test(hardcodedString)) {
        continue;
      }
      
      // Encontrar linha
      const position = match.index;
      let lineNumber = 1;
      let charCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1; // +1 para \n
        if (charCount > position) {
          lineNumber = i + 1;
          break;
        }
      }
      
      findings.push({
        type: pattern.name,
        string: hardcodedString,
        line: lineNumber,
        context: lines[lineNumber - 1]?.trim() || '',
      });
    }
  }
  
  return findings;
}

/**
 * Audita um local (pasta ou arquivo)
 */
function auditLocation(location) {
  console.log(`\n🔍 Auditando: ${location}`);
  
  if (!exists(location)) {
    console.log(`   ⚠️  Local não encontrado: ${location}`);
    return {
      location,
      exists: false,
      files: [],
      totalFiles: 0,
      filesWithHardcoding: 0,
      totalHardcodedStrings: 0,
    };
  }
  
  const files = getTsxFiles(location);
  const fileResults = [];
  let filesWithHardcoding = 0;
  let totalHardcodedStrings = 0;
  
  for (const file of files) {
    const findings = detectHardcodedStrings(file);
    
    if (findings.length > 0) {
      filesWithHardcoding++;
      totalHardcodedStrings += findings.length;
      fileResults.push({
        file: file.replace(/\\/g, '/'),
        hardcodedCount: findings.length,
        findings,
      });
    }
  }
  
  const locationResult = {
    location,
    exists: true,
    files: fileResults,
    totalFiles: files.length,
    filesWithHardcoding,
    totalHardcodedStrings,
    status: totalHardcodedStrings === 0 ? '✅ 100% centralizado' : `❌ ${totalHardcodedStrings} strings hardcoded`,
  };
  
  console.log(`   📁 Arquivos: ${files.length}`);
  console.log(`   ${locationResult.status}`);
  
  return locationResult;
}

/**
 * Gera relatório em Markdown
 */
function generateReport() {
  const timestamp = new Date().toISOString().split('T')[0];
  
  let report = `# Relatório de Validação Estática - Sprint 23\n\n`;
  report += `**Data:** ${timestamp}\n\n`;
  report += `**Objetivo:** Validar 0% de strings hardcoded em todos os 20 locais\n\n`;
  report += `---\n\n`;
  
  // Resumo Executivo
  report += `## Resumo Executivo\n\n`;
  report += `- **Locais auditados:** ${results.locationsScanned}/${results.totalLocations}\n`;
  report += `- **Arquivos escaneados:** ${results.totalFiles}\n`;
  report += `- **Arquivos com hardcoding:** ${results.filesWithHardcoding}\n`;
  report += `- **Total de strings hardcoded:** ${results.totalHardcodedStrings}\n`;
  report += `- **Status:** ${results.totalHardcodedStrings === 0 ? '✅ PASSOU (0% hardcoding)' : '❌ FALHOU'}\n\n`;
  
  // Resultados por Local
  report += `## Resultados por Local\n\n`;
  
  for (const locationResult of results.locationResults) {
    if (!locationResult.exists) {
      report += `### ${locationResult.location}\n\n`;
      report += `⚠️ **Local não encontrado**\n\n`;
      continue;
    }
    
    report += `### ${locationResult.location}\n\n`;
    report += `- **Arquivos:** ${locationResult.totalFiles}\n`;
    report += `- **Arquivos com hardcoding:** ${locationResult.filesWithHardcoding}\n`;
    report += `- **Strings hardcoded:** ${locationResult.totalHardcodedStrings}\n`;
    report += `- **Status:** ${locationResult.status}\n\n`;
    
    if (locationResult.files.length > 0) {
      report += `#### Detalhes\n\n`;
      
      for (const fileResult of locationResult.files) {
        report += `**${fileResult.file}** (${fileResult.hardcodedCount} strings)\n\n`;
        
        for (const finding of fileResult.findings) {
          report += `- **Linha ${finding.line}** | ${finding.type}\n`;
          report += `  - String: \`${finding.string}\`\n`;
          report += `  - Contexto: \`${finding.context.substring(0, 100)}${finding.context.length > 100 ? '...' : ''}\`\n\n`;
        }
      }
    }
  }
  
  // Checklist de 6 Tipos
  report += `## Checklist de 6 Tipos de Tags/Atributos\n\n`;
  report += `- [x] 1. Conteúdo entre tags HTML (p, span, div, h1-h6, label, button, a, li, td, th, strong, em, small)\n`;
  report += `- [x] 2. Atributo placeholder="..."\n`;
  report += `- [x] 3. Atributo title="..."\n`;
  report += `- [x] 4. Atributo aria-label="..."\n`;
  report += `- [x] 5. Atributo alt="..."\n`;
  report += `- [x] 6. Conteúdo de <option>Texto</option>\n\n`;
  
  // Conclusão
  report += `## Conclusão\n\n`;
  
  if (results.totalHardcodedStrings === 0) {
    report += `✅ **VALIDAÇÃO PASSOU**\n\n`;
    report += `Todos os ${results.totalLocations} locais estão 100% centralizados. Nenhuma string hardcoded foi encontrada.\n\n`;
    report += `Sprint 23 está COMPLETA.\n`;
  } else {
    report += `❌ **VALIDAÇÃO FALHOU**\n\n`;
    report += `Foram encontradas ${results.totalHardcodedStrings} strings hardcoded em ${results.filesWithHardcoding} arquivos.\n\n`;
    report += `**Próximos passos:**\n`;
    report += `1. Revisar arquivos listados acima\n`;
    report += `2. Centralizar strings em /src/content/\n`;
    report += `3. Refatorar componentes\n`;
    report += `4. Re-executar validação\n`;
  }
  
  return report;
}

/**
 * Main
 */
function main() {
  console.log('🚀 Iniciando validação estática de strings...\n');
  console.log(`📋 Locais a auditar: ${LOCATIONS.length}\n`);
  
  for (const location of LOCATIONS) {
    const locationResult = auditLocation(location);
    results.locationResults.push(locationResult);
    results.locationsScanned++;
    
    if (locationResult.exists) {
      results.totalFiles += locationResult.totalFiles;
      results.filesWithHardcoding += locationResult.filesWithHardcoding;
      results.totalHardcodedStrings += locationResult.totalHardcodedStrings;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(60));
  console.log(`Locais auditados: ${results.locationsScanned}/${results.totalLocations}`);
  console.log(`Arquivos escaneados: ${results.totalFiles}`);
  console.log(`Arquivos com hardcoding: ${results.filesWithHardcoding}`);
  console.log(`Total de strings hardcoded: ${results.totalHardcodedStrings}`);
  console.log(`Status: ${results.totalHardcodedStrings === 0 ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log('='.repeat(60) + '\n');
  
  // Gerar relatório
  const report = generateReport();
  const reportPath = 'REGEX_VALIDATION_REPORT.md';
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`📄 Relatório gerado: ${reportPath}\n`);
  
  // Exit code
  process.exit(results.totalHardcodedStrings === 0 ? 0 : 1);
}

main();
