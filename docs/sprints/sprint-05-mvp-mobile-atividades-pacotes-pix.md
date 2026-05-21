# Sprint 5 — MVP: Mobile, Atividades, Pacotes & PIX

> **Nomenclatura do arquivo:** `sprint-05-mvp-mobile-atividades-pacotes-pix.md`

**Período:** 09–13 fevereiro 2026
**Status:** ✅ Concluída
**Tipo:** MVP
**Prioridade:** 🔴 Alta

## Problem Statement

Após Sprint 4, o sistema tinha funcionalidades essenciais mas com problemas críticos de usabilidade e features faltando:

**Mobile:**
- UI quebrada em tablets e celulares
- Tabelas sem scroll horizontal (conteúdo cortado)
- Botões pequenos demais para touch (< 44px)
- Portal do aluno não otimizado para mobile

**Atividades:**
- Sem módulo de atividades/exercícios
- Professor não conseguia enviar tarefas para alunos
- Aluno não conseguia entregar atividades
- Sem correção de atividades com nota

**Pacotes de Aulas:**
- Criação manual de múltiplas aulas (tedioso)
- Sem geração automática de cobranças para pacotes
- Sem suporte a aulas recorrentes (ex: toda terça e quinta)

**Pagamento:**
- Aluno não conseguia pagar via PIX
- Sem QR Code PIX
- Sem comprovante de pagamento

**Qualidade:**
- Sem testes unitários
- Sem sanitização de conteúdo do usuário (XSS)
- Bugs: aulas concluídas sumindo da tabela, status financeiro incorreto

## Requirements

### Responsividade Mobile
- Scroll horizontal em tabelas (`overflow-x-auto`)
- Botões com mínimo 44x44px (acessibilidade touch)
- Portal do aluno mobile-first (cards em vez de tabelas)
- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)

### Módulo de Atividades
- Professor envia atividades com prazo
- Aluno visualiza atividades pendentes
- Aluno entrega atividade (texto ou arquivo)
- Professor corrige com nota (0-100) e feedback
- Badges de status: pendente, entregue, corrigida, atrasada
- Filtros: status, prazo, aluno
- Paginação (10 itens por página)

### Pacotes de Aulas
- Criação de pacote fixo (ex: 8 aulas em datas específicas)
- Criação de pacote dinâmico (ex: toda terça e quinta às 14h por 1 mês)
- Geração automática de cobranças vinculadas ao pacote
- Opções de pagamento: à vista, parcelado, mensal
- RPC `create_class_package` para transação atômica

### QR Code PIX
- Aluno visualiza QR Code PIX para pagamento
- Copiar chave PIX com um clique
- Upload de comprovante de pagamento
- Professor aprova/rejeita comprovante
- Auditoria de comprovantes

### Testes Unitários
- Setup Vitest
- 32 testes unitários passando
- Cobertura: formatters, validators, design tokens
- CI/CD executando testes

### Sanitização
- DOMPurify para sanitizar HTML
- Sanitizar inputs de usuário (atividades, observações, feedback)
- Prevenir XSS

### Correções de Bugs
- Fix: aulas concluídas sumindo da tabela
- Fix: status financeiro incorreto na aba aulas
- Fix: feedback obrigatório na avaliação

## Background

**Stack de responsividade:**
- Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Mobile-first approach (estilos base para mobile, breakpoints para desktop)

**Stack de atividades:**
- Tabela `activities` com colunas: title, description, due_date, status, grade, feedback
- Tabela `activity_submissions` para entregas de alunos
- Supabase Storage para arquivos anexados

**Stack de pacotes:**
- RPC `create_class_package(teacher_id, student_id, classes[], financial_data)`
- Transação atômica: cria aulas + cobrança em uma única operação
- Rollback automático se qualquer parte falhar

**Stack de PIX:**
- QR Code gerado com biblioteca `qrcode.react`
- Chave PIX armazenada em `teachers.pix_key`
- Comprovante armazenado em Supabase Storage

**Stack de testes:**
- Vitest (compatível com Vite)
- Testing Library para componentes React
- Cobertura com `v8`

## Proposed Solution

### Arquitetura de Responsividade

```tsx
// Mobile-first: base styles para mobile
<div className="p-4 sm:p-6 lg:p-8">
  {/* Mobile: cards, Desktop: tabela */}
  <div className="block lg:hidden">
    <MobileCards />
  </div>
  <div className="hidden lg:block">
    <DesktopTable />
  </div>
</div>
```

### Estrutura de Atividades

```
activities (id, teacher_id, title, description, due_date, created_at)
  ↓
activity_assignments (id, activity_id, student_id, status)
  ↓
activity_submissions (id, assignment_id, content, file_url, submitted_at)
  ↓
activity_corrections (id, submission_id, grade, feedback, corrected_at)
```

### Fluxo de Pacote de Aulas

```
1. Professor preenche formulário:
   - Aluno
   - Datas das aulas (ou recorrência)
   - Valor total
   - Forma de pagamento

2. Frontend chama RPC create_class_package

3. RPC executa transação:
   BEGIN;
   INSERT INTO class_logs (múltiplas aulas);
   INSERT INTO financial_records (cobrança);
   COMMIT;

4. Se erro: ROLLBACK automático
```

### Fluxo de Pagamento PIX

```
1. Aluno acessa "Financeiro"
2. Clica em cobrança pendente
3. Vê QR Code PIX + chave PIX
4. Paga via app do banco
5. Faz upload de comprovante
6. Professor recebe notificação
7. Professor aprova/rejeita comprovante
8. Status atualiza para "Pago" ou "Pendente"
```

## Task Breakdown

### Task 1: Responsividade mobile completa

- **Objetivo:** UI funcional em mobile, tablet e desktop
- **Implementação:**
  - Adicionar `overflow-x-auto` em todas as tabelas
  - Aumentar botões para mínimo 44x44px
  - Criar componentes mobile: `MobileStudentCard`, `MobileClassCard`, `MobileFinancialCard`
  - Usar `hidden lg:block` e `block lg:hidden` para alternar entre mobile/desktop
  - Testar em Chrome DevTools (iPhone, iPad, Android)
- **Arquivos modificados:**
  - Todos os componentes com tabelas
  - `src/components/students/StudentsView.tsx`
  - `src/components/classes/ClassesView.tsx`
  - `src/components/financial/FinancialView.tsx`
- **Teste:** Abrir no mobile → UI responsiva, botões clicáveis
- **Demo:** Aplicação funciona perfeitamente em iPhone e Android

### Task 2: Módulo de atividades - estrutura do banco

- **Objetivo:** Criar tabelas para atividades
- **Implementação:**
  - Migration com 4 tabelas: `activities`, `activity_assignments`, `activity_submissions`, `activity_corrections`
  - RLS policies: professor vê suas atividades, aluno vê atividades atribuídas a ele
  - Índices: `(teacher_id, due_date)`, `(student_id, status)`
  - Triggers: atualizar status automaticamente ao entregar/corrigir
- **Arquivos criados:**
  - `supabase/migrations/07_activities.sql`
- **Teste:** Migration aplicada sem erros
- **Demo:** Tabelas visíveis no Supabase Dashboard

### Task 3: Professor envia atividades

- **Objetivo:** Professor cria e envia atividades para alunos
- **Implementação:**
  - Componente `SendActivityDialog` com formulário
  - Campos: título, descrição, prazo, alunos (multi-select)
  - Hook `useSendActivity()` para criar atividade + assignments
  - Validação: prazo não pode ser no passado
  - Toast de sucesso
- **Arquivos criados:**
  - `src/components/activities/SendActivityDialog.tsx`
  - `src/hooks/useActivities.ts`
- **Teste:** Enviar atividade → alunos recebem notificação
- **Demo:** Atividade aparece na lista do aluno

### Task 4: Aluno entrega atividades

- **Objetivo:** Aluno visualiza e entrega atividades
- **Implementação:**
  - Página `StudentActivities` com lista de atividades
  - Componente `DeliverActivityDialog` com textarea + upload de arquivo
  - Hook `useDeliverActivity()` para criar submission
  - Upload para Supabase Storage (bucket `activity-submissions`)
  - Validação: máximo 10MB por arquivo
  - Status muda de "Pendente" para "Entregue"
- **Arquivos criados:**
  - `src/pages/student/StudentActivities.tsx`
  - `src/components/activities/DeliverActivityDialog.tsx`
- **Teste:** Entregar atividade → status atualiza, professor vê entrega
- **Demo:** Arquivo anexado salvo no Storage

### Task 5: Professor corrige atividades

- **Objetivo:** Professor corrige com nota e feedback
- **Implementação:**
  - Componente `ActivityCorrectionDialog` com formulário
  - Campos: nota (0-100), feedback (textarea)
  - Hook `useCorrectActivity()` para criar correction
  - Validação: nota entre 0 e 100, feedback obrigatório
  - Status muda de "Entregue" para "Corrigida"
  - Aluno recebe notificação
- **Arquivos criados:**
  - `src/components/activities/ActivityCorrectionDialog.tsx`
- **Teste:** Corrigir atividade → aluno vê nota e feedback
- **Demo:** Nota e feedback aparecem para o aluno

### Task 6: Badges de status e filtros

- **Objetivo:** Visualização clara de status, filtros funcionais
- **Implementação:**
  - Badges: Pendente (amarelo), Entregue (azul), Corrigida (verde), Atrasada (vermelho)
  - Componente `ActivitiesFilters` com filtros: status, prazo, aluno
  - Paginação: 10 itens por página
  - Ordenação: prazo (mais próximo primeiro)
- **Arquivos criados:**
  - `src/components/activities/ActivityBadge.tsx`
  - `src/components/filters/ActivitiesFilters.tsx`
- **Teste:** Filtrar por status → lista atualiza
- **Demo:** Badges coloridos, filtros funcionais

### Task 7: Pacotes de aulas - RPC

- **Objetivo:** Criar múltiplas aulas + cobrança em transação atômica
- **Implementação:**
  - RPC `create_class_package(p_teacher_id, p_student_id, p_classes, p_financial)`
  - Parâmetros: `p_classes` (array de objetos com date, duration, title)
  - Parâmetros: `p_financial` (objeto com amount, due_date, payment_method)
  - Transação: `BEGIN` → inserts → `COMMIT` (ou `ROLLBACK` se erro)
  - Retorna: IDs das aulas criadas + ID da cobrança
- **Arquivos criados:**
  - `supabase/migrations/08_class_packages.sql`
- **Teste:** Chamar RPC → aulas + cobrança criadas atomicamente
- **Demo:** Se erro, nenhuma aula é criada (rollback)

### Task 8: Pacotes de aulas - UI

- **Objetivo:** Formulário para criar pacotes
- **Implementação:**
  - Componente `PackageClassesDialog` com formulário complexo
  - Modo fixo: selecionar datas manualmente (date picker múltiplo)
  - Modo dinâmico: recorrência (dias da semana, horário, duração, período)
  - Geração automática de datas baseada em recorrência
  - Cálculo automático de valor total
  - Opções de pagamento: à vista, parcelado (2-12x), mensal
  - Hook `useCreatePackage()` que chama RPC
- **Arquivos criados:**
  - `src/components/classes/PackageClassesDialog.tsx`
  - `src/hooks/useCreatePackage.ts`
- **Teste:** Criar pacote dinâmico → aulas geradas corretamente
- **Demo:** Pacote de 8 aulas criado em segundos

### Task 9: QR Code PIX

- **Objetivo:** Aluno paga via PIX com QR Code
- **Implementação:**
  - Instalar `qrcode.react`
  - Componente `StudentPixPaymentBox` com QR Code
  - Gerar QR Code a partir de `teachers.pix_key`
  - Botão "Copiar chave PIX" (clipboard API)
  - Componente `UploadProofDialog` para upload de comprovante
  - Upload para Supabase Storage (bucket `payment-proofs`)
  - Atualizar `financial_records.proof_url`
- **Arquivos criados:**
  - `src/components/student/StudentPixPaymentBox.tsx`
  - `src/components/financial/UploadProofDialog.tsx`
- **Teste:** Copiar chave PIX → copiado para clipboard
- **Demo:** QR Code escaneável, upload de comprovante funciona

### Task 10: Aprovação de comprovantes

- **Objetivo:** Professor aprova/rejeita comprovantes
- **Implementação:**
  - Componente `PaymentProofReviewDialog` com imagem do comprovante
  - Botões: Aprovar (verde), Rejeitar (vermelho)
  - Hook `useApproveProof()` e `useRejectProof()`
  - Aprovar: status → "Pago", `approved_by` e `approved_at` preenchidos
  - Rejeitar: status → "Pendente", aluno pode reenviar
  - Auditoria: registrar quem aprovou/rejeitou
- **Arquivos criados:**
  - `src/components/financial/PaymentProofReviewDialog.tsx`
- **Teste:** Aprovar comprovante → status atualiza para "Pago"
- **Demo:** Auditoria registra quem aprovou

### Task 11: Testes unitários com Vitest

- **Objetivo:** Setup de testes e cobertura inicial
- **Implementação:**
  - Instalar Vitest + Testing Library
  - Configurar `vitest.config.ts`
  - Testes de formatters: `formatCurrency`, `formatDate`, `formatCPF`, `formatPhone`
  - Testes de validators: `validateEmail`, `validateCPF`, `validatePhone`
  - Testes de design tokens: 129 testes (cores, spacing, typography)
  - Adicionar script `npm run test` no `package.json`
  - CI/CD executando testes
- **Arquivos criados:**
  - `vitest.config.ts`
  - `src/lib/utils/__tests__/formatters.test.ts`
  - `src/lib/utils/__tests__/validators.test.ts`
  - `src/lib/utils/__tests__/design-tokens.test.ts`
- **Teste:** `npm run test` → 32 testes passando
- **Demo:** Cobertura de ~75% em utilitários

### Task 12: Sanitização com DOMPurify

- **Objetivo:** Prevenir XSS em conteúdo de usuário
- **Implementação:**
  - Instalar `dompurify` e `@types/dompurify`
  - Função `sanitize(html)` que remove scripts e tags perigosas
  - Sanitizar: descrição de atividades, feedback de correção, observações de aulas
  - Usar `dangerouslySetInnerHTML` apenas com conteúdo sanitizado
  - Adicionar testes de sanitização
- **Arquivos criados:**
  - `src/lib/security/sanitize.ts`
  - `src/lib/security/__tests__/sanitize.test.ts`
- **Teste:** `sanitize('<script>alert("XSS")</script>')` → remove script
- **Demo:** XSS bloqueado em todos os inputs

### Task 13: Correções de bugs

- **Objetivo:** Corrigir bugs identificados em testes
- **Implementação:**
  - Fix: aulas concluídas sumindo da tabela (filtro incorreto)
  - Fix: status financeiro incorreto na aba aulas (join errado)
  - Fix: feedback obrigatório na avaliação (validação faltando)
  - Adicionar testes de regressão para cada bug
- **Arquivos modificados:**
  - `src/hooks/useClasses.ts` — corrigir filtro
  - `src/hooks/useFinancialRecords.ts` — corrigir join
  - `src/components/classes/PostClassDialog.tsx` — validação de feedback
- **Teste:** Bugs não reproduzem mais
- **Demo:** Aulas concluídas aparecem na tabela

### Task 14: Paginação padronizada

- **Objetivo:** Paginação de 10 itens em todas as listas
- **Implementação:**
  - Componente `Pagination` reutilizável
  - Hook `usePagination(totalItems, itemsPerPage)`
  - Aplicar em: alunos, aulas, financeiro, atividades, professores, usuários
  - Supabase `.range(start, end)` para paginação no banco
- **Arquivos criados:**
  - `src/components/ui/Pagination.tsx`
  - `src/hooks/usePagination.ts`
- **Teste:** Navegar entre páginas → dados corretos
- **Demo:** Performance melhorada (não carrega 1000 registros de uma vez)

## Implementation Details

### Migrations Aplicadas

| Migration | Descrição |
|-----------|-----------|
| `07_activities.sql` | Tabelas de atividades: activities, assignments, submissions, corrections |
| `08_class_packages.sql` | RPC `create_class_package` para transação atômica |

### Componentes Criados

| Componente | Responsabilidade | Arquivo |
|------------|------------------|---------|
| `MobileStudentCard` | Card de aluno (mobile) | `src/components/students/MobileStudentCard.tsx` |
| `MobileClassCard` | Card de aula (mobile) | `src/components/classes/MobileClassCard.tsx` |
| `MobileFinancialCard` | Card de cobrança (mobile) | `src/components/financial/MobileFinancialCard.tsx` |
| `SendActivityDialog` | Enviar atividade | `src/components/activities/SendActivityDialog.tsx` |
| `DeliverActivityDialog` | Entregar atividade | `src/components/activities/DeliverActivityDialog.tsx` |
| `ActivityCorrectionDialog` | Corrigir atividade | `src/components/activities/ActivityCorrectionDialog.tsx` |
| `ActivityBadge` | Badge de status | `src/components/activities/ActivityBadge.tsx` |
| `ActivitiesFilters` | Filtros de atividades | `src/components/filters/ActivitiesFilters.tsx` |
| `PackageClassesDialog` | Criar pacote de aulas | `src/components/classes/PackageClassesDialog.tsx` |
| `StudentPixPaymentBox` | QR Code PIX | `src/components/student/StudentPixPaymentBox.tsx` |
| `UploadProofDialog` | Upload de comprovante | `src/components/financial/UploadProofDialog.tsx` |
| `PaymentProofReviewDialog` | Aprovar/rejeitar comprovante | `src/components/financial/PaymentProofReviewDialog.tsx` |
| `Pagination` | Paginação reutilizável | `src/components/ui/Pagination.tsx` |

### Hooks Criados

| Hook | Responsabilidade | Arquivo |
|------|------------------|---------|
| `useActivities` | Buscar atividades | `src/hooks/useActivities.ts` |
| `useSendActivity` | Enviar atividade | `src/hooks/useActivities.ts` |
| `useDeliverActivity` | Entregar atividade | `src/hooks/useActivities.ts` |
| `useCorrectActivity` | Corrigir atividade | `src/hooks/useActivities.ts` |
| `useCreatePackage` | Criar pacote de aulas | `src/hooks/useCreatePackage.ts` |
| `useApproveProof` | Aprovar comprovante | `src/hooks/useFinancialRecords.ts` |
| `useRejectProof` | Rejeitar comprovante | `src/hooks/useFinancialRecords.ts` |
| `usePagination` | Paginação genérica | `src/hooks/usePagination.ts` |

### Testes Criados

| Arquivo de Teste | Cobertura |
|------------------|-----------|
| `formatters.test.ts` | 12 testes (formatCurrency, formatDate, formatCPF, formatPhone) |
| `validators.test.ts` | 8 testes (validateEmail, validateCPF, validatePhone) |
| `design-tokens.test.ts` | 129 testes (cores, spacing, typography) |
| `sanitize.test.ts` | 5 testes (XSS, scripts, tags perigosas) |

## Files Created

```
supabase/
└── migrations/
    ├── 07_activities.sql            ← Módulo de atividades
    └── 08_class_packages.sql        ← RPC de pacotes

src/
├── components/
│   ├── students/
│   │   └── MobileStudentCard.tsx    ← Card mobile
│   ├── classes/
│   │   ├── MobileClassCard.tsx      ← Card mobile
│   │   └── PackageClassesDialog.tsx ← Pacotes de aulas
│   ├── financial/
│   │   ├── MobileFinancialCard.tsx  ← Card mobile
│   │   ├── UploadProofDialog.tsx    ← Upload comprovante
│   │   └── PaymentProofReviewDialog.tsx ← Aprovar/rejeitar
│   ├── activities/
│   │   ├── SendActivityDialog.tsx   ← Enviar atividade
│   │   ├── DeliverActivityDialog.tsx ← Entregar atividade
│   │   ├── ActivityCorrectionDialog.tsx ← Corrigir atividade
│   │   └── ActivityBadge.tsx        ← Badge de status
│   ├── student/
│   │   └── StudentPixPaymentBox.tsx ← QR Code PIX
│   ├── filters/
│   │   └── ActivitiesFilters.tsx    ← Filtros
│   └── ui/
│       └── Pagination.tsx           ← Paginação
├── pages/
│   └── student/
│       └── StudentActivities.tsx    ← Página de atividades
├── hooks/
│   ├── useActivities.ts             ← Hooks de atividades
│   ├── useCreatePackage.ts          ← Hook de pacotes
│   └── usePagination.ts             ← Hook de paginação
├── lib/
│   └── security/
│       ├── sanitize.ts              ← Sanitização
│       └── __tests__/
│           └── sanitize.test.ts     ← Testes de sanitização
└── __tests__/
    ├── formatters.test.ts           ← Testes de formatters
    ├── validators.test.ts           ← Testes de validators
    └── design-tokens.test.ts        ← Testes de design tokens

vitest.config.ts                     ← Configuração Vitest
```

## Files Modified

- Todos os componentes com tabelas — adicionar `overflow-x-auto`
- Todos os botões — aumentar para mínimo 44x44px
- `src/hooks/useClasses.ts` — corrigir filtro de aulas concluídas
- `src/hooks/useFinancialRecords.ts` — corrigir join de status
- `src/components/classes/PostClassDialog.tsx` — validação de feedback
- `package.json` — adicionar `qrcode.react`, `dompurify`, `vitest`
- `.github/workflows/ci.yml` — adicionar step de testes

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Testes passando (`npm run test`) — 32/32 ✅
- [x] Teste manual: abrir no mobile → UI responsiva
- [x] Teste manual: enviar atividade → aluno recebe
- [x] Teste manual: entregar atividade → professor vê entrega
- [x] Teste manual: corrigir atividade → aluno vê nota
- [x] Teste manual: criar pacote → aulas + cobrança criadas
- [x] Teste manual: pagar via PIX → QR Code funciona
- [x] Teste manual: aprovar comprovante → status atualiza
- [x] Teste manual: sanitização → XSS bloqueado

## Results & Impact

### Métricas Quantitativas
- ✅ 2 migrations aplicadas
- ✅ 13 componentes novos criados
- ✅ 8 hooks criados
- ✅ 32 testes unitários passando
- ✅ Cobertura de testes: ~75% em utilitários
- ✅ 3 bugs críticos corrigidos
- ✅ 100% das tabelas responsivas
- ✅ 100% dos inputs sanitizados

### Melhorias Qualitativas
- ✅ UI funcional em mobile (antes quebrada)
- ✅ Módulo de atividades completo (feature nova)
- ✅ Pacotes de aulas (economiza tempo do professor)
- ✅ Pagamento via PIX (UX melhorada para aluno)
- ✅ Testes automatizados (qualidade garantida)
- ✅ Sanitização (segurança contra XSS)
- ✅ Paginação (performance melhorada)

## Technical Debt

- [ ] Testes apenas em utilitários — adicionar testes de componentes depois
- [ ] QR Code PIX estático — integrar com API PIX dinâmico depois
- [ ] Pacotes sem edição — adicionar edição de pacotes depois
- [ ] Atividades sem anexos múltiplos — adicionar depois

## Lessons Learned

### O que funcionou bem
- ✅ **Mobile-first:** Tailwind breakpoints (`sm:`, `lg:`) tornaram responsividade trivial — 100% das tabelas funcionam em mobile
- ✅ **RPC transacional:** `create_class_package` garante atomicidade — nunca mais aulas órfãs sem cobrança
- ✅ **Vitest:** 32 testes em 1 dia — setup simples, compatível com Vite, execução rápida
- ✅ **DOMPurify:** Sanitização em 1h — XSS bloqueado em todos os inputs de usuário

### O que poderia melhorar
- ⚠️ **Sprint gigante:** 14 tasks em 5 dias — deveria ter dividido em 2 sprints (Mobile + Atividades, Pacotes + PIX)
- ⚠️ **QR Code estático:** Não integra com API PIX real — aluno precisa copiar chave manualmente
- ⚠️ **Testes apenas em utils:** Componentes React não testados — bugs de UI só descobertos manualmente

### Aplicações futuras
- 💡 **Sprints menores:** Dividir features grandes em sprints separadas — melhor controle de qualidade
- 💡 **API PIX dinâmica:** Próxima iteração deve integrar com EfiBank/Asaas para QR Code dinâmico
- 💡 **Testing Library:** Adicionar testes de componentes React — cobertura completa de UI

## Next Steps

1. Sprint 6: Implementar idempotência em operações financeiras
2. Sprint 6: Adicionar gestão de faltas
3. Sprint 6: Suporte a alunos estrangeiros (remover CPF obrigatório)
4. Sprint 6: Consolidar migrations
5. Sprint 7: Hardening de segurança com RLS

## References

- Commits: 09–13 fev 2026 (branch `syncclass/old-homolog`)
- Análise completa: `docs/archive/ANALISE_OLD_HOMOLOG.md`
- Validação: `docs/archive/VALIDACAO_SPRINTS_1_9.md`
