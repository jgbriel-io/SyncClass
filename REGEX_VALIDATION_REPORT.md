# Relatório de Validação Estática - Sprint 23

**Data:** 2026-05-16

**Objetivo:** Validar 0% de strings hardcoded em todos os 20 locais

---

## Resumo Executivo

- **Locais auditados:** 19/19
- **Arquivos escaneados:** 176
- **Arquivos com hardcoding:** 12
- **Total de strings hardcoded:** 18
- **Status:** ❌ FALHOU

## Resultados por Local

### src/components/ui

- **Arquivos:** 66
- **Arquivos com hardcoding:** 6
- **Strings hardcoded:** 7
- **Status:** ❌ 7 strings hardcoded

#### Detalhes

**src/components/ui/breadcrumb.tsx** (1 strings)

- **Linha 78** | Conteúdo entre tags HTML
  - String: `More`
  - Contexto: `<span className="sr-only">More</span>`

**src/components/ui/carousel.tsx** (2 strings)

- **Linha 189** | Conteúdo entre tags HTML
  - String: `Previous slide`
  - Contexto: `<span className="sr-only">Previous slide</span>`

- **Linha 217** | Conteúdo entre tags HTML
  - String: `Next slide`
  - Contexto: `<span className="sr-only">Next slide</span>`

**src/components/ui/dialog.tsx** (1 strings)

- **Linha 47** | Conteúdo entre tags HTML
  - String: `Close`
  - Contexto: `<span className="sr-only">Close</span>`

**src/components/ui/sheet.tsx** (1 strings)

- **Linha 62** | Conteúdo entre tags HTML
  - String: `Close`
  - Contexto: `<span className="sr-only">Close</span>`

**src/components/ui/sidebar.tsx** (1 strings)

- **Linha 238** | Conteúdo entre tags HTML
  - String: `Toggle Sidebar`
  - Contexto: `<span className="sr-only">Toggle Sidebar</span>`

**src/components/ui/stat-card.tsx** (1 strings)

- **Linha 81** | Conteúdo entre tags HTML
  - String: `vs mês anterior`
  - Contexto: `<span className="text-muted-foreground font-normal ml-1">`

### src/components/layout

- **Arquivos:** 11
- **Arquivos com hardcoding:** 4
- **Strings hardcoded:** 6
- **Status:** ❌ 6 strings hardcoded

#### Detalhes

**src/components/layout/AdminLayout.tsx** (1 strings)

- **Linha 149** | Conteúdo entre tags HTML
  - String: `E`
  - Contexto: `<span className="text-sidebar-primary-foreground font-bold text-base">E</span>`

**src/components/layout/SettingsPreferenciasTab.tsx** (3 strings)

- **Linha 11** | Conteúdo entre tags HTML
  - String: `Opções de tema, idioma e notificações em breve.`
  - Contexto: `<p className="text-sm text-muted-foreground">`

- **Linha 22** | Conteúdo entre tags HTML
  - String: `Instale o app na sua tela inicial para acesso mais rápido e funcionamento offline.`
  - Contexto: `<p className="text-sm text-muted-foreground mb-3">`

- **Linha 48** | Conteúdo entre tags HTML
  - String: `App instalado!`
  - Contexto: `<span className="text-sm font-medium">App instalado!</span>`

**src/components/layout/StudentLayout.tsx** (1 strings)

- **Linha 47** | Conteúdo entre tags HTML
  - String: `E`
  - Contexto: `<span className="text-primary-foreground font-bold text-xs">E</span>`

**src/components/layout/TeacherLayout.tsx** (1 strings)

- **Linha 155** | Conteúdo entre tags HTML
  - String: `E`
  - Contexto: `<span className="text-sidebar-primary-foreground font-bold text-base">E</span>`

### src/components/ErrorBoundary.tsx

- **Arquivos:** 1
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/NavLink.tsx

- **Arquivos:** 1
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/SectionErrorBoundary.tsx

- **Arquivos:** 1
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/withSectionErrorBoundary.tsx

- **Arquivos:** 1
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/students

- **Arquivos:** 10
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/teachers

- **Arquivos:** 7
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/financial

- **Arquivos:** 8
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/classes

- **Arquivos:** 16
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/activities

- **Arquivos:** 10
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/admin

- **Arquivos:** 7
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/dashboard

- **Arquivos:** 8
- **Arquivos com hardcoding:** 1
- **Strings hardcoded:** 3
- **Status:** ❌ 3 strings hardcoded

#### Detalhes

**src/components/dashboard/MetricCard.test.tsx** (3 strings)

- **Linha 10** | Atributo title
  - String: `Total de Alunos`
  - Contexto: `title="Total de Alunos"`

- **Linha 22** | Atributo title
  - String: `Cancelamentos`
  - Contexto: `title="Cancelamentos"`

- **Linha 34** | Atributo title
  - String: `Receita`
  - Contexto: `title="Receita"`

### src/components/overview

- **Arquivos:** 2
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/auth

- **Arquivos:** 4
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/filters

- **Arquivos:** 7
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/student

- **Arquivos:** 6
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

### src/components/users

- **Arquivos:** 9
- **Arquivos com hardcoding:** 1
- **Strings hardcoded:** 2
- **Status:** ❌ 2 strings hardcoded

#### Detalhes

**src/components/users/UsersTableRow.tsx** (2 strings)

- **Linha 136** | Conteúdo entre tags HTML
  - String: `Conta arquivada`
  - Contexto: `<p className="text-xs text-amber-600">`

- **Linha 151** | Conteúdo entre tags HTML
  - String: `Arquivado`
  - Contexto: `<span className="text-xs text-muted-foreground">`

### src/components/pwa

- **Arquivos:** 1
- **Arquivos com hardcoding:** 0
- **Strings hardcoded:** 0
- **Status:** ✅ 100% centralizado

## Checklist de 6 Tipos de Tags/Atributos

- [x] 1. Conteúdo entre tags HTML (p, span, div, h1-h6, label, button, a, li, td, th, strong, em, small)
- [x] 2. Atributo placeholder="..."
- [x] 3. Atributo title="..."
- [x] 4. Atributo aria-label="..."
- [x] 5. Atributo alt="..."
- [x] 6. Conteúdo de <option>Texto</option>

## Conclusão

❌ **VALIDAÇÃO FALHOU**

Foram encontradas 18 strings hardcoded em 12 arquivos.

**Próximos passos:**
1. Revisar arquivos listados acima
2. Centralizar strings em /src/content/
3. Refatorar componentes
4. Re-executar validação
