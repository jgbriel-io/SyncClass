#!/usr/bin/env node

/**
 * Validação Estática de Strings Hardcoded
 * Procura por 6 tipos de padrões em componentes React
 */

const fs = require('fs');
const path = require('path');

// Padrões regex para detectar strings hardcoded
const patterns = {
  htmlContent: {
    name: 'Conteúdo entre tags HTML',
    regex: />([A-Z][^<{]*[a-z][^<{]*)</g,
    description: '>Texto<'
  },
  placeholder: {
    name: 'Atributo placeholder',
    regex: /placeholder=["']([^"']+)["']/g,
    description: 'placeholder="..."'
  },
  title: {
    name: 'Atributo title',
    regex: /title=["']([^"']+)["']/g,
    description: 'title="..."'
  },
  ariaLabel: {
    name: 'Atributo aria-label',
    regex: /aria-label=["']([^"']+)["']/g,
    description: 'aria-label="..."'
  },
  alt: {
    name: 'Atributo alt',
    regex: /alt=["']([^"']+)["']/g,
    description: 'alt="..."'
  },
  option: {
    name: 'Conteúdo de <option>',
    regex: /<option[^>]*>([^<]+)<\/option>/g,
    description: '<option>Texto</option>'
  }
};

// Exceções: strings que são OK (variáveis, imports, etc)
const exceptions = [
  '{',
  '}',
  '$',
  '&',
  '...',
  '—',
  '–',
  '•',
  '°',
  '©',
  '™',
  '®',
  '€',
  '£',
  '¥',
  '₹',
  '₽',
  '₩',
  '₪',
  '₦',
  '₨',
  '₱',
  '₡',
  '₲',
  '₴',
  '₵',
  '₸',
  '₹',
  '₺',
  '₼',
  '₾',
  '₿',
  '🔒',
  '🔓',
  '✓',
  '✕',
  '✗',
  '✘',
  '✙',
  '✚',
  '✛',
  '✜',
  '✝',
  '✞',
  '✟',
  '✠',
  '✡',
  '✢',
  '✣',
  '✤',
  '✥',
  '✦',
  '✧',
  '★',
  '☆',
  '✨',
  '⭐',
  '🌟',
  '💫',
  '✪',
  '✫',
  '✬',
  '✭',
  '✮',
  '✯',
  '✰',
  '✱',
  '✲',
  '✳',
  '✴',
  '✵',
  '✶',
  '✷',
  '✸',
  '✹',
  '✺',
  '✻',
  '✼',
  '✽',
  '✾',
  '✿',
  '❀',
  '❁',
  '❂',
  '❃',
  '❄',
  '❅',
  '❆',
  '❇',
  '❈',
  '❉',
  '❊',
  '❋',
  '❌',
  '❎',
  '❏',
  '❐',
  '❑',
  '❒',
  '❓',
  '❔',
  '❕',
  '❖',
  '❗',
  '❘',
  '❙',
  '❚',
  '❛',
  '❜',
  '❝',
  '❞',
  '❟',
  '❠',
  '❡',
  '❢',
  '❣',
  '❤',
  '❥',
  '❦',
  '❧',
  '❨',
  '❩',
  '❪',
  '❫',
  '❬',
  '❭',
  '❮',
  '❯',
  '❰',
  '❱',
  '❲',
  '❳',
  '❴',
  '❵',
  '❶',
  '❷',
  '❸',
  '❹',
  '❺',
  '❻',
  '❼',
  '❽',
  '❾',
  '❿',
  '➀',
  '➁',
  '➂',
  '➃',
  '➄',
  '➅',
  '➆',
  '➇',
  '➈',
  '➉',
  '➊',
  '➋',
  '➌',
  '➍',
  '➎',
  '➏',
  '➐',
  '➑',
  '➒',
  '➓',
  '➔',
  '➕',
  '➖',
  '➗',
  '➘',
  '➙',
  '➚',
  '➛',
  '➜',
  '➝',
  '➞',
  '➟',
  '➠',
  '➡',
  '➢',
  '➣',
  '➤',
  '➥',
  '➦',
  '➧',
  '➨',
  '➩',
  '➪',
  '➫',
  '➬',
  '➭',
  '➮',
  '➯',
  '➰',
  '➱',
  '➲',
  '➳',
  '➴',
  '➵',
  '➶',
  '➷',
  '➸',
  '➹',
  '➺',
  '➻',
  '➼',
  '➽',
  '➾',
  '➿',
  '⬀',
  '⬁',
  '⬂',
  '⬃',
  '⬄',
  '⬅',
  '⬆',
  '⬇',
  '⬈',
  '⬉',
  '⬊',
  '⬋',
  '⬌',
  '⬍',
  '⬎',
  '⬏',
  '⬐',
  '⬑',
  '⬒',
  '⬓',
  '⬔',
  '⬕',
  '⬖',
  '⬗',
  '⬘',
  '⬙',
  '⬚',
  '⬛',
  '⬜',
  '⬝',
  '⬞',
  '⬟',
  '⬠',
  '⬡',
  '⬢',
  '⬣',
  '⬤',
  '⬥',
  '⬦',
  '⬧',
  '⬨',
  '⬩',
  '⬪',
  '⬫',
  '⬬',
  '⬭',
  '⬮',
  '⬯',
  '⬰',
  '⬱',
  '⬲',
  '⬳',
  '⬴',
  '⬵',
  '⬶',
  '⬷',
  '⬸',
  '⬹',
  '⬺',
  '⬻',
  '⬼',
  '⬽',
  '⬾',
  '⬿',
  '⭀',
  '⭁',
  '⭂',
  '⭃',
  '⭄',
  '⭅',
  '⭆',
  '⭇',
  '⭈',
  '⭉',
  '⭊',
  '⭋',
  '⭌',
  '⭍',
  '⭎',
  '⭏',
  '⭐',
  '⭑',
  '⭒',
  '⭓',
  '⭔',
  '⭕',
  '⭖',
  '⭗',
  '⭘',
  '⭙',
  '⭚',
  '⭛',
  '⭜',
  '⭝',
  '⭞',
  '⭟',
  '⭠',
  '⭡',
  '⭢',
  '⭣',
  '⭤',
  '⭥',
  '⭦',
  '⭧',
  '⭨',
  '⭩',
  '⭪',
  '⭫',
  '⭬',
  '⭭',
  '⭮',
  '⭯',
  '⭰',
  '⭱',
  '⭲',
  '⭳',
  '⭴',
  '⭵',
  '⭶',
  '⭷',
  '⭸',
  '⭹',
  '⭺',
  '⭻',
  '⭼',
  '⭽',
  '⭾',
  '⭿',
  '⮀',
  '⮁',
  '⮂',
  '⮃',
  '⮄',
  '⮅',
  '⮆',
  '⮇',
  '⮈',
  '⮉',
  '⮊',
  '⮋',
  '⮌',
  '⮍',
  '⮎',
  '⮏',
  '⮐',
  '⮑',
  '⮒',
  '⮓',
  '⮔',
  '⮕',
  '⮖',
  '⮗',
  '⮘',
  '⮙',
  '⮚',
  '⮛',
  '⮜',
  '⮝',
  '⮞',
  '⮟',
  '⮠',
  '⮡',
  '⮢',
  '⮣',
  '⮤',
  '⮥',
  '⮦',
  '⮧',
  '⮨',
  '⮩',
  '⮪',
  '⮫',
  '⮬',
  '⮭',
  '⮮',
  '⮯',
  '⮰',
  '⮱',
  '⮲',
  '⮳',
  '⮴',
  '⮵',
  '⮶',
  '⮷',
  '⮸',
  '⮹',
  '⮺',
  '⮻',
  '⮼',
  '⮽',
  '⮾',
  '⮿',
  '⯀',
  '⯁',
  '⯂',
  '⯃',
  '⯄',
  '⯅',
  '⯆',
  '⯇',
  '⯈',
  '⯉',
  '⯊',
  '⯋',
  '⯌',
  '⯍',
  '⯎',
  '⯏',
  '⯐',
  '⯑',
  '⯒',
  '⯓',
  '⯔',
  '⯕',
  '⯖',
  '⯗',
  '⯘',
  '⯙',
  '⯚',
  '⯛',
  '⯜',
  '⯝',
  '⯞',
  '⯟',
  '⯠',
  '⯡',
  '⯢',
  '⯣',
  '⯤',
  '⯥',
  '⯦',
  '⯧',
  '⯨',
  '⯩',
  '⯪',
  '⯫',
  '⯬',
  '⯭',
  '⯮',
  '⯯',
  '⯰',
  '⯱',
  '⯲',
  '⯳',
  '⯴',
  '⯵',
  '⯶',
  '⯷',
  '⯸',
  '⯹',
  '⯺',
  '⯻',
  '⯼',
  '⯽',
  '⯾',
  '⯿',
  '/',
  '\\',
  '|',
  '~',
  '`',
  '@',
  '#',
  '%',
  '^',
  '&',
  '*',
  '(',
  ')',
  '-',
  '_',
  '=',
  '+',
  '[',
  ']',
  '{',
  '}',
  ';',
  ':',
  '"',
  "'",
  '<',
  '>',
  ',',
  '.',
  '?',
  '!',
  ' ',
  '\n',
  '\t',
  '\r'
];

function isException(text) {
  // Strings muito curtas (1-2 caracteres) são geralmente exceções
  if (text.length <= 2) return true;
  
  // Strings que contêm apenas exceções
  return exceptions.includes(text.trim());
}

function getLineNumber(content, match) {
  const beforeMatch = content.substring(0, match.index);
  return beforeMatch.split('\n').length;
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const findings = [];

    // Pular arquivos de teste e snapshot
    if (filePath.includes('.test.') || filePath.includes('.snap')) {
      return findings;
    }

    // Pular arquivos que não são TSX
    if (!filePath.endsWith('.tsx')) {
      return findings;
    }

    // Procurar por cada padrão
    for (const [patternKey, pattern] of Object.entries(patterns)) {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(content)) !== null) {
        const text = match[1] || match[0];
        
        // Pular exceções
        if (isException(text)) continue;
        
        // Pular strings que contêm variáveis/imports
        if (text.includes('{') || text.includes('$') || text.includes('import')) continue;
        
        findings.push({
          type: pattern.name,
          pattern: pattern.description,
          text: text.substring(0, 100), // Limitar a 100 caracteres
          line: getLineNumber(content, match),
          match: match[0].substring(0, 100)
        });
      }
    }

    return findings;
  } catch (error) {
    console.error(`Erro ao ler ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dirPath) {
  const results = {};
  
  function walk(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Pular node_modules e __snapshots__
        if (file === 'node_modules' || file === '__snapshots__') continue;
        walk(filePath);
      } else if (file.endsWith('.tsx')) {
        const findings = scanFile(filePath);
        if (findings.length > 0) {
          results[filePath] = findings;
        }
      }
    }
  }
  
  walk(dirPath);
  return results;
}

function generateReport(results) {
  let report = '# Relatório de Validação Estática - Strings Hardcoded\n\n';
  report += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
  
  let totalFindings = 0;
  const findingsByType = {};
  const findingsByFolder = {};
  
  // Contar findings
  for (const [file, findings] of Object.entries(results)) {
    totalFindings += findings.length;
    
    // Agrupar por tipo
    for (const finding of findings) {
      if (!findingsByType[finding.type]) {
        findingsByType[finding.type] = 0;
      }
      findingsByType[finding.type]++;
      
      // Agrupar por pasta
      const folder = file.split('/')[1]; // src/components/{folder}
      if (!findingsByFolder[folder]) {
        findingsByFolder[folder] = 0;
      }
      findingsByFolder[folder]++;
    }
  }
  
  // Resumo
  report += '## Resumo\n\n';
  report += `- **Total de Strings Hardcoded Encontradas**: ${totalFindings}\n`;
  report += `- **Arquivos Afetados**: ${Object.keys(results).length}\n`;
  report += `- **Status**: ${totalFindings === 0 ? '✅ 0% hardcoding (PASSOU)' : '❌ Strings hardcoded detectadas (FALHOU)'}\n\n`;
  
  // Estatísticas por tipo
  report += '## Estatísticas por Tipo de String\n\n';
  for (const [type, count] of Object.entries(findingsByType)) {
    report += `- ${type}: ${count}\n`;
  }
  report += '\n';
  
  // Estatísticas por pasta
  report += '## Estatísticas por Pasta\n\n';
  for (const [folder, count] of Object.entries(findingsByFolder).sort((a, b) => b[1] - a[1])) {
    report += `- ${folder}: ${count}\n`;
  }
  report += '\n';
  
  // Detalhes por arquivo
  if (totalFindings > 0) {
    report += '## Detalhes por Arquivo\n\n';
    
    for (const [file, findings] of Object.entries(results)) {
      report += `### ${file}\n\n`;
      
      for (const finding of findings) {
        report += `- **Linha ${finding.line}** | ${finding.type}\n`;
        report += `  - Padrão: ${finding.pattern}\n`;
        report += `  - Texto: \`${finding.text}\`\n`;
        report += `  - Match: \`${finding.match}\`\n\n`;
      }
    }
  }
  
  return report;
}

// Executar validação
console.log('🔍 Iniciando validação estática de strings hardcoded...\n');

const results = scanDirectory('src/components');
const report = generateReport(results);

// Salvar relatório
fs.writeFileSync('STATIC_VALIDATION_REPORT.md', report);

console.log(report);
console.log('\n✅ Relatório salvo em: STATIC_VALIDATION_REPORT.md');

// Exit com código apropriado
process.exit(Object.keys(results).length > 0 ? 1 : 0);
