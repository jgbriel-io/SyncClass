# Requirements Document - Sprint 23: Centralização 100% de Strings

## Introduction

Esta sprint visa alcançar 0% de strings hardcoded em TODOS os componentes do projeto. Cada pasta de componentes será auditada completamente, procurando por TODAS as tags/atributos possíveis com texto. O objetivo é garantir que 100% das strings de UI venham de arquivos centralizados em `/content`, seguindo o padrão de i18n estabelecido.

## Glossary

- **Hardcoded String**: Texto literal escrito diretamente no JSX ou atributos HTML
- **Centralized Content**: Strings armazenadas em `/src/content/` (common.ts, domain-specific files)
- **Component**: Arquivo React (.tsx) em `src/components/`
- **String Tag**: Conteúdo entre tags HTML (p, span, div, h1-h6, label, button, a, li, td, th, strong, em, small)
- **String Attribute**: Atributos HTML que contêm texto (placeholder, title, aria-label, alt, option)
- **Audit**: Varredura completa de um componente procurando por strings hardcoded
- **Refactor**: Substituição de strings hardcoded por referências ao arquivo de conteúdo centralizado

## Escopo Completo - TODAS as Pastas de Componentes

1. `src/components/activities/` — 10 arquivos
2. `src/components/admin/` — 7 arquivos
3. `src/components/auth/` — 3 arquivos
4. `src/components/classes/` — múltiplos arquivos
5. `src/components/dashboard/` — múltiplos arquivos
6. `src/components/filters/` — múltiplos arquivos
7. `src/components/financial/` — múltiplos arquivos
8. `src/components/layout/` — múltiplos arquivos
9. `src/components/overview/` — múltiplos arquivos
10. `src/components/pwa/` — múltiplos arquivos
11. `src/components/student/` — múltiplos arquivos
12. `src/components/students/` — múltiplos arquivos
13. `src/components/teachers/` — múltiplos arquivos
14. `src/components/ui/` — componentes UI (shadcn + custom)
15. `src/components/users/` — múltiplos arquivos
16. Arquivos soltos: `ErrorBoundary.tsx`, `NavLink.tsx`, `SectionErrorBoundary.tsx`, `withSectionErrorBoundary.tsx`

**Total: 16 pastas + 4 arquivos soltos = 20 locais a auditar**

## Requirements

### Requirement 1: Auditoria Completa de TODAS as Pastas

**User Story:** Como desenvolvedor, quero auditar TODAS as 16 pastas de componentes + 4 arquivos soltos, para que eu identifique 100% das strings hardcoded em cada local.

#### Acceptance Criteria

1. WHEN a auditoria é iniciada, THE Auditor SHALL varrer TODAS as 20 locais (16 pastas + 4 arquivos):
   - ✅ src/components/activities/
   - ✅ src/components/admin/
   - ✅ src/components/auth/
   - ✅ src/components/classes/
   - ✅ src/components/dashboard/
   - ✅ src/components/filters/
   - ✅ src/components/financial/
   - ✅ src/components/layout/
   - ✅ src/components/overview/
   - ✅ src/components/pwa/
   - ✅ src/components/student/
   - ✅ src/components/students/
   - ✅ src/components/teachers/
   - ✅ src/components/ui/
   - ✅ src/components/users/
   - ✅ ErrorBoundary.tsx
   - ✅ NavLink.tsx
   - ✅ SectionErrorBoundary.tsx
   - ✅ withSectionErrorBoundary.tsx
2. WHILE auditando CADA local, THE Auditor SHALL procurar por strings em 6 tipos de tags/atributos:
   - Conteúdo entre tags HTML (p, span, div, h1-h6, label, button, a, li, td, th, strong, em, small)
   - Atributo `placeholder="..."`
   - Atributo `title="..."`
   - Atributo `aria-label="..."`
   - Atributo `alt="..."`
   - Conteúdo de `<option>Texto</option>`
3. WHEN uma string hardcoded é encontrada, THE Auditor SHALL registrar: arquivo, linha, tipo de tag/atributo, conteúdo exato
4. IF nenhuma string hardcoded é encontrada em um local, THEN THE Auditor SHALL marcar como "100% centralizado"
5. THE Auditor SHALL gerar relatório consolidado com estatísticas por pasta
6. **CRITICAL:** Nenhuma exceção será aceita — nem um ponto final, nem um espaço, nem uma vírgula

### Requirement 2: Centralização de Strings Genéricas

**User Story:** Como desenvolvedor, quero centralizar strings genéricas em `/content/common.ts`, para que eu reutilize labels, placeholders, botões e tooltips em múltiplos componentes.

#### Acceptance Criteria

1. WHEN uma string genérica é identificada (ex: "Salvar", "Cancelar", "Carregando..."), THE Content_Manager SHALL adicionar em `/content/common.ts` sob a categoria apropriada:
   - `common.labels.*` — labels genéricos
   - `common.placeholders.*` — hints de inputs
   - `common.buttons.*` — textos de botões
   - `common.tooltips.*` — tooltips genéricos
   - `common.errors.*` — mensagens de erro genéricas
   - `common.aria.*` — labels de acessibilidade
2. WHILE centralizando, THE Content_Manager SHALL garantir que a chave seja descritiva e reutilizável
3. IF uma string já existe em common.ts, THEN THE Content_Manager SHALL reutilizar a chave existente
4. THE Content_Manager SHALL manter versionamento de mudanças em common.ts

### Requirement 3: Centralização de Strings de Domínio

**User Story:** Como desenvolvedor, quero centralizar strings específicas de domínio em arquivos temáticos, para que eu organize conteúdo por contexto (alunos, professores, financeiro, etc).

#### Acceptance Criteria

1. WHEN uma string é específica de um domínio (ex: "Alunos", "Atividades Pendentes"), THE Content_Manager SHALL adicionar em arquivo temático:
   - `activities.*` — strings de atividades
   - `students.*` — strings de alunos
   - `teachers.*` — strings de professores
   - `financial.*` — strings de financeiro
   - `classes.*` — strings de aulas
   - `users.*` — strings de usuários
2. WHILE centralizando, THE Content_Manager SHALL garantir que a chave reflita o contexto
3. IF um arquivo temático não existe, THEN THE Content_Manager SHALL criar com estrutura consistente
4. THE Content_Manager SHALL documentar a estrutura de cada arquivo temático

### Requirement 4: Refatoração de Componentes

**User Story:** Como desenvolvedor, quero refatorar componentes para usar strings centralizadas, para que eu elimine 100% de hardcoding.

#### Acceptance Criteria

1. WHEN um componente é refatorado, THE Refactor_Engine SHALL substituir TODAS as strings hardcoded por imports de `/content`
2. WHILE refatorando, THE Refactor_Engine SHALL:
   - Importar `content` do arquivo apropriado
   - Substituir strings por referências (ex: `{content.labels.save}`)
   - Manter estrutura e lógica do componente intacta
   - Não introduzir mudanças de comportamento
3. IF um componente usa strings em múltiplos arquivos de conteúdo, THEN THE Refactor_Engine SHALL importar todos necessários
4. WHEN refatoração é concluída, THE Refactor_Engine SHALL validar que nenhuma string hardcoded permanece
5. THE Refactor_Engine SHALL executar testes para garantir que refatoração não quebrou funcionalidade

### Requirement 5: Validação de Centralização

**User Story:** Como desenvolvedor, quero validar que 0% de strings hardcoded permanecem, para que eu garanta conformidade com o padrão.

#### Acceptance Criteria

1. WHEN validação é executada, THE Validator SHALL varrer TODOS os componentes refatorados
2. WHILE validando, THE Validator SHALL procurar por padrões de strings hardcoded em 6 tipos de tags/atributos
3. IF uma string hardcoded é encontrada, THEN THE Validator SHALL falhar e reportar localização exata
4. IF nenhuma string hardcoded é encontrada, THEN THE Validator SHALL passar com status "100% centralizado"
5. THE Validator SHALL gerar relatório final consolidado por pasta

### Requirement 6: Documentação de Padrão

**User Story:** Como desenvolvedor, quero documentar o padrão de centralização, para que eu mantenha consistência em futuras mudanças.

#### Acceptance Criteria

1. THE Documentation SHALL descrever estrutura de `/content/` com exemplos
2. THE Documentation SHALL listar todas as pastas de componentes auditadas
3. THE Documentation SHALL fornecer guia passo-a-passo para adicionar novas strings
4. THE Documentation SHALL incluir checklist de validação para novos componentes
5. THE Documentation SHALL ser mantida em `/docs/front/` ou similar

## Notes

- Nenhuma exceção será aceita — nem um ponto final, nem um espaço
- Todas as 6 categorias de tags/atributos devem ser verificadas em CADA componente
- Strings vazias ("") e espaços em branco devem ser tratados como strings
- Comentários em código não precisam ser centralizados
