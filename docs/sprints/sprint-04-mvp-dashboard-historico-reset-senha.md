# Sprint 4 — MVP: Dashboard, Histórico & Reset Senha

> **Nomenclatura do arquivo:** `sprint-04-mvp-dashboard-historico-reset-senha.md`

**Período:** 31 janeiro – 08 fevereiro 2026
**Status:** ✅ Concluída
**Tipo:** MVP
**Prioridade:** 🔴 Alta

## Problem Statement

Após Sprint 3, o sistema tinha base sólida mas faltavam features essenciais para uso real:

**Dashboard:**
- Dashboard genérico sem métricas relevantes
- Sem gráficos de crescimento
- Sem visão de faturamento futuro
- Sem indicadores de performance

**Gestão de Usuários:**
- Sem reset de senha (usuários presos se esquecerem senha)
- Sem hard delete (alunos arquivados ocupam espaço permanentemente)
- Sem sincronização entre abas (deletar em "Alunos" não refletia em "Usuários")
- Sem reativação de contas
- Sem upload de foto de perfil

**Histórico:**
- Aluno não conseguia ver seu próprio histórico de aulas
- Sem timeline unificada de eventos
- Sem auditoria de pagamentos

**Busca:**
- Sem busca global (usuário tinha que navegar por múltiplas páginas)

**Validação:**
- Emails inválidos aceitos (ex: `usuario@gmial.com`)
- Sem rate limit (vulnerável a spam)

## Requirements

### Dashboard Avançado
- Gráfico de crescimento de alunos (filtros: 1/3/6/12 meses)
- Visão diária de aulas
- Cards de métricas: total de alunos, faturamento mensal, aulas do mês
- Previsão de faturamento (cobranças pendentes)
- Aniversariantes do mês
- Aulas de hoje

### Histórico do Aluno
- Página `StudentHistory` com timeline de eventos
- Histórico de aulas (data, duração, observações)
- Histórico de pagamentos (valor, data, status)
- Filtros por período

### Reset de Senha
- Usuário pode resetar própria senha (esqueci senha)
- Admin pode resetar senha de qualquer usuário
- Professor pode resetar senha de aluno vinculado
- Logout automático após mudança de senha
- Edge Function unificada `reset-password`

### Gestão de Usuários
- Hard delete de professores (exclusão permanente)
- Sincronização entre abas (deletar em "Alunos" reflete em "Usuários")
- Reativação de contas arquivadas
- Upload de foto de perfil
- Edge Function `admin-delete-user` tolerante a falhas

### Busca Global
- Search bar no header
- Busca em: alunos, professores, usuários
- Busca por: nome, email, telefone
- Resultados agrupados por tipo

### Validação de Email
- Whitelist de provedores reais (gmail.com, outlook.com, etc.)
- Rejeitar typos comuns (gmial.com, hotmial.com)
- Rate limit: máximo 10 tentativas por minuto

### Auditoria
- Histórico de pagamentos para admin
- Quem aprovou/rejeitou comprovante
- Data e hora de cada ação

## Background

**Stack de gráficos:**
- Recharts para gráficos de linha/barra
- Tailwind para cards de métricas

**Fluxo de reset de senha:**
```
1. Usuário clica "Esqueci senha"
2. Frontend chama Edge Function reset-password
3. Edge Function gera token único
4. Envia email com link de reset
5. Usuário clica no link e define nova senha
6. Logout automático em todas as sessões
```

**Hard delete vs Soft delete:**
- Soft delete: `deleted_at` preenchido, registro preservado
- Hard delete: registro removido permanentemente do banco
- Usar hard delete apenas quando necessário (LGPD, limpeza)

## Proposed Solution

### Arquitetura de Dashboard

```tsx
// Dashboard com múltiplos cards
<DashboardView>
  <MetricsCards />        // Total alunos, faturamento, aulas
  <GrowthChart />         // Gráfico de crescimento
  <TodayClasses />        // Aulas de hoje
  <Birthdays />           // Aniversariantes
  <UpcomingPayments />    // Cobranças pendentes
</DashboardView>
```

### Estrutura de Histórico

```tsx
// Timeline de eventos
<StudentHistory studentId={id}>
  <TimelineItem type="class" />
  <TimelineItem type="payment" />
  <TimelineItem type="activity" />
</StudentHistory>
```

### Fluxo de Hard Delete

```
1. Admin clica "Excluir Permanentemente"
2. Dialog de confirmação (dupla confirmação)
3. Frontend chama Edge Function admin-delete-user
4. Edge Function:
   - Deleta de auth.users
   - Deleta de profiles
   - Deleta de students/teachers
   - Deleta registros relacionados (ou marca como órfãos)
5. Sincroniza UI (remove de todas as abas)
```

## Task Breakdown

### Task 1: Dashboard com gráfico de crescimento

- **Objetivo:** Visualizar crescimento de alunos ao longo do tempo
- **Implementação:**
  - Instalar `recharts`
  - Componente `GrowthChart` com gráfico de linha
  - Filtros: 1 mês, 3 meses, 6 meses, 12 meses
  - Query: `SELECT DATE(created_at), COUNT(*) FROM students GROUP BY DATE(created_at)`
  - Visão diária (eixo X: dias, eixo Y: total de alunos)
  - Tooltip com data e total
- **Arquivos criados:**
  - `src/components/dashboard/GrowthChart.tsx`
- **Teste:** Selecionar filtro "3 meses" → gráfico atualiza
- **Demo:** Gráfico mostra crescimento de alunos nos últimos 3 meses

### Task 2: Cards de métricas

- **Objetivo:** Exibir métricas principais no dashboard
- **Implementação:**
  - Componente `MetricsCards` com 3 cards
  - Card 1: Total de alunos ativos
  - Card 2: Faturamento mensal (soma de `financial_records` do mês)
  - Card 3: Total de aulas do mês
  - Ícones do Lucide React
  - Cores semânticas (design tokens)
- **Arquivos criados:**
  - `src/components/dashboard/MetricsCards.tsx`
- **Teste:** Dashboard carrega → cards mostram valores corretos
- **Demo:** Cards atualizam em tempo real

### Task 3: Previsão de faturamento

- **Objetivo:** Mostrar cobranças pendentes (a receber)
- **Implementação:**
  - Componente `UpcomingPayments` com lista de cobranças pendentes
  - Query: `SELECT * FROM financial_records WHERE status = 'pending' ORDER BY due_date`
  - Exibir: aluno, valor, data de vencimento
  - Total a receber (soma de valores pendentes)
- **Arquivos criados:**
  - `src/components/dashboard/UpcomingPayments.tsx`
- **Teste:** Dashboard carrega → lista de cobranças pendentes aparece
- **Demo:** Total a receber calculado corretamente

### Task 4: Aniversariantes do mês

- **Objetivo:** Exibir alunos que fazem aniversário no mês atual
- **Implementação:**
  - Componente `Birthdays` com lista de aniversariantes
  - Query: `SELECT * FROM students WHERE EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM NOW())`
  - Exibir: nome, data de aniversário
  - Ordenar por dia do mês
- **Arquivos criados:**
  - `src/components/dashboard/Birthdays.tsx`
- **Teste:** Dashboard carrega → aniversariantes do mês aparecem
- **Demo:** Lista ordenada por dia do aniversário

### Task 5: Aulas de hoje

- **Objetivo:** Exibir aulas agendadas para hoje
- **Implementação:**
  - Componente `TodayClasses` com lista de aulas
  - Query: `SELECT * FROM class_logs WHERE DATE(class_date) = CURRENT_DATE`
  - Exibir: aluno, horário, duração
  - Ordenar por horário
- **Arquivos criados:**
  - `src/components/dashboard/TodayClasses.tsx`
- **Teste:** Dashboard carrega → aulas de hoje aparecem
- **Demo:** Lista ordenada por horário

### Task 6: Página de histórico do aluno

- **Objetivo:** Aluno visualiza seu próprio histórico
- **Implementação:**
  - Página `StudentHistory` com timeline de eventos
  - Query de aulas: `SELECT * FROM class_logs WHERE student_id = ?`
  - Query de pagamentos: `SELECT * FROM financial_records WHERE student_id = ?`
  - Componente `TimelineItem` genérico
  - Filtros por período (último mês, últimos 3 meses, último ano)
  - Ordenar por data (mais recente primeiro)
- **Arquivos criados:**
  - `src/pages/student/StudentHistory.tsx`
  - `src/components/student/TimelineItem.tsx`
- **Teste:** Aluno acessa histórico → vê aulas e pagamentos
- **Demo:** Timeline ordenada cronologicamente

### Task 7: Upload de foto de perfil

- **Objetivo:** Usuário pode fazer upload de foto
- **Implementação:**
  - Componente `ProfilePhotoUpload` com input de arquivo
  - Upload para Supabase Storage (bucket `avatars`)
  - Validação: apenas imagens (jpg, png), máximo 2MB
  - Crop automático para 200x200px
  - Atualizar `profiles.avatar_url`
  - Exibir foto no header
- **Arquivos criados:**
  - `src/components/profile/ProfilePhotoUpload.tsx`
- **Teste:** Upload de foto → foto aparece no header
- **Demo:** Foto salva no Supabase Storage

### Task 8: Reset de senha unificado

- **Objetivo:** Unificar fluxos de reset de senha
- **Implementação:**
  - Edge Function `reset-password` (substitui `admin-reset-password` e `teacher-reset-password`)
  - Aceita parâmetros: `userId`, `requestedBy`, `role`
  - Gera token único e envia email
  - Página `ResetPassword` com formulário de nova senha
  - Logout automático após mudança de senha (invalidar sessões)
  - Professor pode resetar senha de aluno vinculado
- **Arquivos criados:**
  - `supabase/functions/reset-password/index.ts`
  - `src/pages/ResetPassword.tsx`
- **Arquivos deletados:**
  - `supabase/functions/admin-reset-password/index.ts`
  - `supabase/functions/teacher-reset-password/index.ts`
- **Teste:** Resetar senha → email enviado, nova senha funciona
- **Demo:** Logout automático após mudança

### Task 9: Hard delete de professores

- **Objetivo:** Permitir exclusão permanente de professores
- **Implementação:**
  - Botão "Excluir Permanentemente" (vermelho, ícone de alerta)
  - Dialog de confirmação dupla ("Digite EXCLUIR para confirmar")
  - Edge Function `admin-delete-user` com parâmetro `hardDelete: true`
  - Deletar de: `auth.users`, `profiles`, `teachers`
  - Marcar alunos vinculados como órfãos (ou reatribuir)
  - Sincronizar UI (remover de todas as abas)
- **Arquivos criados:**
  - `supabase/functions/admin-delete-user/index.ts`
  - `src/components/teachers/HardDeleteDialog.tsx`
- **Teste:** Hard delete → registro removido permanentemente
- **Demo:** Sincronização entre abas funciona

### Task 10: Reativação de contas

- **Objetivo:** Reativar contas arquivadas
- **Implementação:**
  - Botão "Reativar" em alunos/professores arquivados
  - Mutation: `UPDATE profiles SET deleted_at = NULL WHERE id = ?`
  - Atualizar UI (mover de "Arquivados" para "Ativos")
  - Toast de sucesso
- **Arquivos criados:**
  - `src/hooks/useReactivateAccount.ts`
- **Teste:** Reativar conta → conta volta para lista de ativos
- **Demo:** Conta reativada pode fazer login

### Task 11: Search bar global

- **Objetivo:** Busca rápida em todo o sistema
- **Implementação:**
  - Componente `GlobalSearch` no header
  - Input com ícone de lupa
  - Busca em: `students`, `teachers`, `profiles`
  - Busca por: `name ILIKE %query%`, `email ILIKE %query%`, `phone ILIKE %query%`
  - Resultados agrupados por tipo (Alunos, Professores, Usuários)
  - Clicar em resultado → navega para página de detalhes
  - Debounce de 300ms
- **Arquivos criados:**
  - `src/components/layout/GlobalSearch.tsx`
- **Teste:** Digitar nome → resultados aparecem
- **Demo:** Busca funciona em tempo real

### Task 12: Validação de email com whitelist

- **Objetivo:** Rejeitar emails inválidos e typos
- **Implementação:**
  - Função `validateEmail(email)` com whitelist de provedores
  - Provedores válidos: gmail.com, outlook.com, hotmail.com, yahoo.com, icloud.com, etc.
  - Rejeitar typos: gmial.com, hotmial.com, outlok.com
  - Sugerir correção ("Você quis dizer gmail.com?")
  - Rate limit: máximo 10 tentativas por minuto (tabela `rate_limit_tracker`)
- **Arquivos criados:**
  - `src/lib/utils/email-validator.ts`
  - `supabase/migrations/05_rate_limit.sql`
- **Teste:** Email inválido → mensagem de erro com sugestão
- **Demo:** Rate limit bloqueia após 10 tentativas

### Task 13: Auditoria de pagamentos

- **Objetivo:** Rastrear quem aprovou/rejeitou comprovantes
- **Implementação:**
  - Adicionar colunas em `financial_records`: `approved_by`, `approved_at`, `rejected_by`, `rejected_at`
  - Componente `PaymentHistoryDialog` com timeline de ações
  - Exibir: quem criou, quem aprovou, quem rejeitou, datas
  - Apenas admin vê auditoria completa
- **Arquivos criados:**
  - `supabase/migrations/06_payment_audit.sql`
  - `src/components/financial/PaymentHistoryDialog.tsx`
- **Teste:** Aprovar pagamento → `approved_by` e `approved_at` preenchidos
- **Demo:** Admin vê histórico completo de ações

### Task 14: Unificação de Extrato e Financeiro

- **Objetivo:** Consolidar views de financeiro
- **Implementação:**
  - Unificar `FinancialView` e `ExtractView` em uma única view
  - Timeline unificada: aulas + pagamentos + cobranças
  - Filtros: período, status, tipo
  - Ordenar por data (mais recente primeiro)
- **Arquivos criados:**
  - `src/components/financial/UnifiedFinancialView.tsx`
- **Arquivos deletados:**
  - `src/components/financial/ExtractView.tsx`
- **Teste:** View unificada → mostra aulas e pagamentos juntos
- **Demo:** Timeline ordenada cronologicamente

## Implementation Details

### Migrations Aplicadas

| Migration | Descrição |
|-----------|-----------|
| `05_rate_limit.sql` | Tabela `rate_limit_tracker` para rate limiting |
| `06_payment_audit.sql` | Colunas de auditoria em `financial_records` |

### Edge Functions Criadas/Modificadas

| Function | Responsabilidade |
|----------|------------------|
| `reset-password` | Reset de senha unificado (substitui 2 funções) |
| `admin-delete-user` | Hard delete de usuários (tolerante a falhas) |

### Componentes Criados

| Componente | Responsabilidade | Arquivo |
|------------|------------------|---------|
| `GrowthChart` | Gráfico de crescimento | `src/components/dashboard/GrowthChart.tsx` |
| `MetricsCards` | Cards de métricas | `src/components/dashboard/MetricsCards.tsx` |
| `UpcomingPayments` | Cobranças pendentes | `src/components/dashboard/UpcomingPayments.tsx` |
| `Birthdays` | Aniversariantes do mês | `src/components/dashboard/Birthdays.tsx` |
| `TodayClasses` | Aulas de hoje | `src/components/dashboard/TodayClasses.tsx` |
| `StudentHistory` | Histórico do aluno | `src/pages/student/StudentHistory.tsx` |
| `TimelineItem` | Item de timeline | `src/components/student/TimelineItem.tsx` |
| `ProfilePhotoUpload` | Upload de foto | `src/components/profile/ProfilePhotoUpload.tsx` |
| `HardDeleteDialog` | Dialog de hard delete | `src/components/teachers/HardDeleteDialog.tsx` |
| `GlobalSearch` | Busca global | `src/components/layout/GlobalSearch.tsx` |
| `PaymentHistoryDialog` | Auditoria de pagamentos | `src/components/financial/PaymentHistoryDialog.tsx` |
| `UnifiedFinancialView` | View unificada | `src/components/financial/UnifiedFinancialView.tsx` |

### Hooks Criados

| Hook | Responsabilidade | Arquivo |
|------|------------------|---------|
| `useReactivateAccount` | Reativar conta arquivada | `src/hooks/useReactivateAccount.ts` |
| `useGlobalSearch` | Busca global | `src/hooks/useGlobalSearch.ts` |

## Files Created

```
supabase/
├── migrations/
│   ├── 05_rate_limit.sql            ← Rate limiting
│   └── 06_payment_audit.sql         ← Auditoria de pagamentos
└── functions/
    ├── reset-password/
    │   └── index.ts                 ← Reset unificado
    └── admin-delete-user/
        └── index.ts                 ← Hard delete

src/
├── components/
│   ├── dashboard/
│   │   ├── GrowthChart.tsx          ← Gráfico de crescimento
│   │   ├── MetricsCards.tsx         ← Cards de métricas
│   │   ├── UpcomingPayments.tsx     ← Cobranças pendentes
│   │   ├── Birthdays.tsx            ← Aniversariantes
│   │   └── TodayClasses.tsx         ← Aulas de hoje
│   ├── student/
│   │   └── TimelineItem.tsx         ← Item de timeline
│   ├── profile/
│   │   └── ProfilePhotoUpload.tsx   ← Upload de foto
│   ├── teachers/
│   │   └── HardDeleteDialog.tsx     ← Dialog de hard delete
│   ├── layout/
│   │   └── GlobalSearch.tsx         ← Busca global
│   └── financial/
│       ├── PaymentHistoryDialog.tsx ← Auditoria
│       └── UnifiedFinancialView.tsx ← View unificada
├── pages/
│   ├── student/
│   │   └── StudentHistory.tsx       ← Histórico do aluno
│   └── ResetPassword.tsx            ← Reset de senha
├── hooks/
│   ├── useReactivateAccount.ts      ← Hook de reativação
│   └── useGlobalSearch.ts           ← Hook de busca
└── lib/
    └── utils/
        └── email-validator.ts       ← Validação de email
```

## Files Modified

- `src/components/layout/Header.tsx` — Adicionar `GlobalSearch`
- `src/pages/admin/Dashboard.tsx` — Adicionar novos componentes
- `src/pages/teacher/Dashboard.tsx` — Adicionar novos componentes
- `package.json` — Adicionar `recharts`

## Files Deleted

- `supabase/functions/admin-reset-password/index.ts` — Substituído por `reset-password`
- `supabase/functions/teacher-reset-password/index.ts` — Substituído por `reset-password`
- `src/components/financial/ExtractView.tsx` — Unificado em `UnifiedFinancialView`

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Teste manual: gráfico de crescimento → dados corretos
- [x] Teste manual: cards de métricas → valores corretos
- [x] Teste manual: upload de foto → foto aparece no header
- [x] Teste manual: reset de senha → email enviado, logout automático
- [x] Teste manual: hard delete → registro removido permanentemente
- [x] Teste manual: reativar conta → conta volta para ativos
- [x] Teste manual: busca global → resultados corretos
- [x] Teste manual: validação de email → typos rejeitados
- [x] Teste manual: auditoria de pagamentos → histórico completo

## Results & Impact

### Métricas Quantitativas
- ✅ 2 migrations aplicadas
- ✅ 2 Edge Functions criadas/modificadas
- ✅ 12 componentes novos criados
- ✅ 2 hooks criados
- ✅ 3 arquivos deletados (código unificado)
- ✅ 1 biblioteca adicionada (recharts)

### Melhorias Qualitativas
- ✅ Dashboard informativo com métricas relevantes
- ✅ Histórico completo para alunos
- ✅ Reset de senha funcional (não precisa mais de admin)
- ✅ Hard delete para limpeza de dados (LGPD)
- ✅ Busca global (UX melhorada)
- ✅ Validação de email robusta (menos erros)
- ✅ Auditoria de pagamentos (rastreabilidade)
- ✅ Código unificado (menos duplicação)

## Technical Debt

- [ ] Gráfico de crescimento básico — adicionar mais métricas depois
- [ ] Upload de foto sem crop manual — adicionar editor depois
- [ ] Busca global sem filtros avançados — adicionar depois
- [ ] Auditoria apenas em pagamentos — expandir para outras entidades depois

## Lessons Learned

### O que funcionou bem
- ✅ **Recharts:** Gráficos profissionais em 2h — biblioteca madura, documentação excelente
- ✅ **Edge Functions unificadas:** `reset-password` substituiu 2 funções — código DRY, manutenção simplificada
- ✅ **Hard delete tolerante a falhas:** `admin-delete-user` não quebra se registro já foi deletado — robustez aumentada
- ✅ **Busca global:** UX melhorada drasticamente — usuários não precisam navegar por múltiplas páginas

### O que poderia melhorar
- ⚠️ **Sprint longa:** 14 tasks em 9 dias — deveria ter priorizado features críticas
- ⚠️ **Upload de foto sem validação:** Aceita qualquer tamanho — risco de storage overflow
- ⚠️ **Validação de email com whitelist:** Lista hardcoded — difícil de manter, não escala

### Aplicações futuras
- 💡 **Validação de upload:** Próximas features de upload devem ter limite de tamanho desde o início
- 💡 **Whitelist dinâmica:** Mover lista de provedores para tabela no banco — admin pode adicionar novos
- 💡 **Sprints focadas:** Máximo 10 tasks por sprint — melhor controle de escopo

## Next Steps

1. Sprint 5: Implementar responsividade mobile completa
2. Sprint 5: Adicionar módulo de atividades
3. Sprint 5: Implementar pacotes de aulas
4. Sprint 5: Adicionar QR Code PIX
5. Sprint 5: Adicionar testes unitários com Vitest

## References

- Commits: 31 jan–08 fev 2026 (branch `syncclass/old-homolog`)
- Análise completa: `docs/archive/ANALISE_OLD_HOMOLOG.md`
- Validação: `docs/archive/VALIDACAO_SPRINTS_1_9.md`
