# Design Document - Sprint 23: Centralização 100% de Strings

## Overview

Sprint 23 implementa centralização completa de strings em todos os 20 locais (16 pastas + 4 arquivos soltos). O design estabelece:

1. **Estratégia de varredura**: ordem de execução, prioridade, checklist de 6 tipos de tags/atributos
2. **Padrão de refatoração**: como substituir strings hardcoded por referências centralizadas
3. **Estrutura de content files**: organização genérica (common.ts) vs. domínio-específica (activities.ts, students.ts, etc)
4. **Validação**: checklist de 6 tipos de tags/atributos para garantir 0% hardcoding
5. **Fluxo de execução**: sequência de tarefas, dependências, marcos

---

## Architecture

### Estratégia de Varredura

A varredura segue ordem de **prioridade + dependência**:

#### Fase 1: Fundação (Semana 1)
- **Prioridade Alta**: Componentes genéricos e reutilizáveis
- Ordem:
  1. `src/components/ui/` — componentes base (shadcn + custom)
  2. `src/components/layout/` — shells, headers, footers
  3. Arquivos soltos: `ErrorBoundary.tsx`, `NavLink.tsx`, `SectionErrorBoundary.tsx`, `withSectionErrorBoundary.tsx`

**Justificativa**: Estes componentes são importados por TODOS os outros. Centralizar aqui primeiro reduz refatoração em cascata.

#### Fase 2: Domínios Principais (Semana 2-3)
- **Prioridade Alta**: Componentes de domínio com maior volume de strings
- Ordem:
  4. `src/components/students/` — maior volume de strings
  5. `src/components/teachers/` — volume médio
  6. `src/components/financial/` — volume médio
  7. `src/components/classes/` — volume médio
  8. `src/components/activities/` — ✅ JÁ 100% FEITO (referência)

**Justificativa**: Estes componentes contêm lógica de negócio e strings específicas de domínio. Centralizar aqui estabelece padrão para outros.

#### Fase 3: Componentes Secundários (Semana 3-4)
- **Prioridade Média**: Componentes de suporte e admin
- Ordem:
  9. `src/components/admin/` — componentes de admin
  10. `src/components/dashboard/` — dashboards
  11. `src/components/overview/` — visões gerais
  12. `src/components/auth/` — autenticação
  13. `src/components/filters/` — filtros
  14. `src/components/student/` — singular (student detail)
  15. `src/components/users/` — gerenciamento de usuários
  16. `src/components/pwa/` — PWA-specific

**Justificativa**: Estes componentes dependem de componentes das Fases 1-2. Centralizar por último reduz conflitos de merge.

### Checklist de 6 Tipos de Tags/Atributos

Para CADA arquivo em CADA local, procurar por:

```
[ ] 1. Conteúdo entre tags HTML
    - <p>Texto</p>, <span>Texto</span>, <div>Texto</div>
    - <h1>Texto</h1>, <h2>Texto</h2>, ..., <h6>Texto</h6>
    - <label>Texto</label>, <button>Texto</button>, <a>Texto</a>
    - <li>Texto</li>, <td>Texto</td>, <th>Texto</th>
    - <strong>Texto</strong>, <em>Texto</em>, <small>Texto</small>

[ ] 2. Atributo placeholder="..."
    - <input placeholder="Dica aqui" />
    - <textarea placeholder="Dica aqui" />

[ ] 3. Atributo title="..."
    - <div title="Tooltip aqui">...</div>
    - <button title="Ação aqui">...</button>

[ ] 4. Atributo aria-label="..."
    - <button aria-label="Fechar">X</button>
    - <div aria-label="Carregando">...</div>

[ ] 5. Atributo alt="..."
    - <img alt="Descrição aqui" />
    - <Icon alt="Descrição aqui" />

[ ] 6. Conteúdo de <option>Texto</option>
    - <select>
        <option>Selecione...</option>
        <option>Opção 1</option>
      </select>
```

---

## Components and Interfaces

### Padrão de Refatoração

#### Antes (Hardcoded)
```tsx
export const StudentCard = ({ student }) => {
  return (
    <div>
      <h2>{student.name}</h2>
      <p>Email: {student.email}</p>
      <button title="Editar aluno">Editar</button>
      <input placeholder="Buscar aluno..." />
      <img alt="Avatar do aluno" src={student.avatar} />
      <select>
        <option>Selecione uma turma</option>
        <option>Turma A</option>
      </select>
    </div>
  );
};
```

#### Depois (Centralizado)
```tsx
import { content } from '@/content/students';
import { content as commonContent } from '@/content/common';

export const StudentCard = ({ student }) => {
  return (
    <div>
      <h2>{student.name}</h2>
      <p>{commonContent.labels.email}: {student.email}</p>
      <button title={commonContent.tooltips.edit}>
        {commonContent.buttons.edit}
      </button>
      <input placeholder={content.placeholders.searchStudent} />
      <img alt={content.aria.studentAvatar} src={student.avatar} />
      <select>
        <option>{content.labels.selectClass}</option>
        <option>{content.labels.classA}</option>
      </select>
    </div>
  );
};
```

### Regras de Refatoração

1. **Importar content**: `import { content } from '@/content/{domain}';`
2. **Substituir strings**: `"Texto"` → `{content.category.key}`
3. **Manter estrutura**: Não refatorar lógica, apenas strings
4. **Validar imports**: Garantir que todas as chaves existem em content files
5. **Testar**: Executar componente após refatoração para validar comportamento

---

## Data Models

### Estrutura de `/src/content/`

#### 1. `common.ts` — Strings Genéricas

Centraliza strings reutilizáveis em múltiplos componentes:

```ts
export const content = {
  // Labels genéricos
  labels: {
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Deletar',
    edit: 'Editar',
    add: 'Adicionar',
    close: 'Fechar',
    loading: 'Carregando...',
    noData: 'Nenhum dado disponível',
    email: 'Email',
    name: 'Nome',
    status: 'Status',
    date: 'Data',
    action: 'Ação',
    actions: 'Ações',
  },

  // Placeholders de inputs
  placeholders: {
    search: 'Buscar...',
    enterName: 'Digite o nome',
    enterEmail: 'Digite o email',
    enterPassword: 'Digite a senha',
  },

  // Textos de botões
  buttons: {
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Deletar',
    edit: 'Editar',
    add: 'Adicionar',
    submit: 'Enviar',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
  },

  // Tooltips genéricos
  tooltips: {
    save: 'Salvar alterações',
    cancel: 'Cancelar operação',
    delete: 'Deletar item',
    edit: 'Editar item',
    add: 'Adicionar novo item',
    close: 'Fechar',
  },

  // Mensagens de erro genéricas
  errors: {
    required: 'Campo obrigatório',
    invalidEmail: 'Email inválido',
    passwordTooShort: 'Senha muito curta',
    somethingWentWrong: 'Algo deu errado',
    tryAgain: 'Tente novamente',
    notFound: 'Não encontrado',
  },

  // Labels de acessibilidade
  aria: {
    loading: 'Carregando',
    close: 'Fechar',
    menu: 'Menu',
    search: 'Buscar',
    delete: 'Deletar',
    edit: 'Editar',
  },
};
```

#### 2. `students.ts` — Strings de Alunos

```ts
export const content = {
  labels: {
    students: 'Alunos',
    student: 'Aluno',
    studentName: 'Nome do Aluno',
    studentEmail: 'Email do Aluno',
    selectClass: 'Selecione uma turma',
    classA: 'Turma A',
    classB: 'Turma B',
    noStudents: 'Nenhum aluno encontrado',
    addStudent: 'Adicionar Aluno',
    editStudent: 'Editar Aluno',
    deleteStudent: 'Deletar Aluno',
  },

  placeholders: {
    searchStudent: 'Buscar aluno...',
    enterStudentName: 'Digite o nome do aluno',
    enterStudentEmail: 'Digite o email do aluno',
  },

  tooltips: {
    editStudent: 'Editar informações do aluno',
    deleteStudent: 'Deletar aluno',
    viewStudentDetails: 'Ver detalhes do aluno',
  },

  aria: {
    studentAvatar: 'Avatar do aluno',
    studentStatus: 'Status do aluno',
  },

  errors: {
    studentNotFound: 'Aluno não encontrado',
    failedToCreateStudent: 'Falha ao criar aluno',
    failedToUpdateStudent: 'Falha ao atualizar aluno',
    failedToDeleteStudent: 'Falha ao deletar aluno',
  },
};
```

#### 3. `teachers.ts`, `financial.ts`, `classes.ts`, `activities.ts`, `users.ts`

Seguem o mesmo padrão de `students.ts`, com categorias específicas do domínio.

### Estrutura de Chaves

Convenção de nomenclatura:

```
content.{category}.{subcategory}_{descriptor}

Exemplos:
- content.labels.student_name
- content.placeholders.search_student
- content.buttons.save_changes
- content.tooltips.edit_student
- content.errors.student_not_found
- content.aria.student_avatar
```

---

## Correctness Properties

**Avaliação de PBT**: Esta feature é **Infrastructure as Code (IaC)** — refatoração de strings em componentes React. Não é adequada para property-based testing porque:

1. Não há funções puras com input/output variável
2. Não há propriedades universais a testar
3. Validação é estrutural (presença/ausência de strings), não comportamental
4. Melhor abordagem: validação estática (regex), testes de snapshot, checklist manual

**Conclusão**: Omitir Correctness Properties. Usar validação estática + testes de snapshot.

---

## Error Handling

### Cenários de Erro

#### 1. String Hardcoded Não Encontrada em Content File
**Cenário**: Refatorador tenta usar `content.labels.unknownKey` que não existe.
**Tratamento**: 
- TypeScript error em tempo de compilação (type-safe)
- Adicionar chave em content file antes de usar
- Validação: `npm run build` deve passar

#### 2. Import de Content File Incorreto
**Cenário**: Componente importa `@/content/students` mas deveria importar `@/content/common`.
**Tratamento**:
- Code review detecta
- Validação: verificar se chave existe no arquivo importado
- Refatorar import para arquivo correto

#### 3. String Parcialmente Centralizada
**Cenário**: Componente tem 90% de strings centralizadas, mas 10% ainda hardcoded.
**Tratamento**:
- Validação falha (regex encontra strings hardcoded)
- Relatório aponta linhas específicas
- Refatorador corrige antes de merge

#### 4. Mudança em Content File Quebra Componentes
**Cenário**: Chave `content.labels.save` é renomeada para `content.buttons.save`.
**Tratamento**:
- TypeScript error em todos os componentes que usam chave antiga
- Buscar e substituir em todos os arquivos
- Validação: `npm run build` deve passar

---

## Testing Strategy

### Validação Estática (Regex)

Script para detectar strings hardcoded em componentes:

```bash
# Procurar por padrões de strings hardcoded
grep -r '>\s*[A-Z][^<{]*</\|placeholder="\|title="\|aria-label="\|alt="\|<option>[^<{]*</option>' \
  src/components/ \
  --include="*.tsx" \
  --exclude-dir=node_modules
```

**Checklist de Padrões**:
- `>Texto<` — conteúdo entre tags
- `placeholder="..."` — hints
- `title="..."` — tooltips
- `aria-label="..."` — acessibilidade
- `alt="..."` — imagens
- `<option>Texto</option>` — selects

### Testes de Snapshot

Para cada componente refatorado, criar snapshot test:

```tsx
// StudentCard.test.tsx
import { render } from '@testing-library/react';
import { StudentCard } from './StudentCard';

describe('StudentCard', () => {
  it('renders with centralized content', () => {
    const { container } = render(
      <StudentCard student={{ name: 'João', email: 'joao@example.com' }} />
    );
    expect(container).toMatchSnapshot();
  });
});
```

**Objetivo**: Garantir que refatoração não alterou estrutura HTML.

### Checklist de Validação Manual

Para CADA local auditado:

```
[ ] Fase 1: Auditoria
  [ ] Listar TODOS os arquivos no local
  [ ] Para CADA arquivo, procurar por 6 tipos de tags/atributos
  [ ] Registrar strings hardcoded encontradas
  [ ] Gerar relatório de strings por arquivo

[ ] Fase 2: Centralização
  [ ] Adicionar strings em content files (common.ts + domain-specific)
  [ ] Validar que todas as chaves são type-safe
  [ ] Executar `npm run build` — deve passar

[ ] Fase 3: Refatoração
  [ ] Importar content files em componentes
  [ ] Substituir TODAS as strings hardcoded
  [ ] Manter estrutura e lógica intacta
  [ ] Executar `npm run build` — deve passar

[ ] Fase 4: Validação
  [ ] Executar regex para detectar strings hardcoded restantes
  [ ] Executar snapshot tests
  [ ] Verificar que 0% de strings hardcoded permanecem
  [ ] Gerar relatório final
```

### Marcos de Conclusão

- **Fase 1 Completa**: Todas as 20 locais auditadas, relatório consolidado gerado
- **Fase 2 Completa**: Todas as strings centralizadas em content files, `npm run build` passa
- **Fase 3 Completa**: Todos os componentes refatorados, `npm run build` passa
- **Fase 4 Completa**: Validação passa, 0% de strings hardcoded, relatório final gerado

---

## Fluxo de Execução

### Sequência de Tarefas

```
Sprint 23: Centralização 100% de Strings
├── Fase 1: Fundação (Semana 1)
│   ├── 1.1 Auditar src/components/ui/
│   ├── 1.2 Auditar src/components/layout/
│   ├── 1.3 Auditar ErrorBoundary.tsx
│   ├── 1.4 Auditar NavLink.tsx
│   ├── 1.5 Auditar SectionErrorBoundary.tsx
│   ├── 1.6 Auditar withSectionErrorBoundary.tsx
│   ├── 1.7 Centralizar strings em common.ts
│   ├── 1.8 Refatorar componentes da Fase 1
│   └── 1.9 Validar Fase 1 (0% hardcoding)
│
├── Fase 2: Domínios Principais (Semana 2-3)
│   ├── 2.1 Auditar src/components/students/
│   ├── 2.2 Auditar src/components/teachers/
│   ├── 2.3 Auditar src/components/financial/
│   ├── 2.4 Auditar src/components/classes/
│   ├── 2.5 Auditar src/components/activities/ (referência)
│   ├── 2.6 Centralizar strings em domain-specific files
│   ├── 2.7 Refatorar componentes da Fase 2
│   └── 2.8 Validar Fase 2 (0% hardcoding)
│
├── Fase 3: Componentes Secundários (Semana 3-4)
│   ├── 3.1 Auditar src/components/admin/
│   ├── 3.2 Auditar src/components/dashboard/
│   ├── 3.3 Auditar src/components/overview/
│   ├── 3.4 Auditar src/components/auth/
│   ├── 3.5 Auditar src/components/filters/
│   ├── 3.6 Auditar src/components/student/
│   ├── 3.7 Auditar src/components/users/
│   ├── 3.8 Auditar src/components/pwa/
│   ├── 3.9 Centralizar strings restantes
│   ├── 3.10 Refatorar componentes da Fase 3
│   └── 3.11 Validar Fase 3 (0% hardcoding)
│
└── Fase 4: Validação Final (Semana 4)
    ├── 4.1 Executar validação estática (regex)
    ├── 4.2 Executar snapshot tests
    ├── 4.3 Gerar relatório consolidado
    ├── 4.4 Documentar padrão em /docs/front/
    └── 4.5 Marcar Sprint 23 como COMPLETA (0% hardcoding)
```

### Dependências Entre Tarefas

```
Fase 1 (Fundação) → Fase 2 (Domínios) → Fase 3 (Secundários) → Fase 4 (Validação)
```

- Fase 1 deve ser concluída antes de Fase 2 (componentes base são importados por todos)
- Fase 2 deve ser concluída antes de Fase 3 (domínios são importados por secundários)
- Fase 3 deve ser concluída antes de Fase 4 (validação final)

---

## Referência: Componentes Já Centralizados

### `src/components/activities/` — ✅ 100% FEITO

Exemplo de referência para padrão de centralização:

```tsx
// ActivitiesTableRow.tsx
import { content } from '@/content/activities';
import { content as commonContent } from '@/content/common';

export const ActivitiesTableRow = ({ activity }) => {
  return (
    <tr>
      <td>{activity.title}</td>
      <td>{activity.status}</td>
      <td>
        <button title={commonContent.tooltips.edit}>
          {commonContent.buttons.edit}
        </button>
      </td>
    </tr>
  );
};
```

---

## Próximos Passos

1. ✅ Design.md criado (este documento)
2. ⏳ Tasks.md — criar 20 tarefas (uma por local)
3. ⏳ Executar Fase 1 (Fundação)
4. ⏳ Executar Fase 2 (Domínios)
5. ⏳ Executar Fase 3 (Secundários)
6. ⏳ Executar Fase 4 (Validação)
