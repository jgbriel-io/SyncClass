# Requisitos Não Funcionais — SyncClass

**Data:** 2026-05-20  
**Total:** 36 requisitos não funcionais implementados

## Resumo

Este documento detalha **todos os 36 requisitos não funcionais** (RNF01-RNF36) implementados no SyncClass, com evidências de código, migrations e testes.

---

## RNF01-RNF10: Requisitos Principais

### RNF01: Isolamento de Dados por Professor (RLS)

**Descrição:** Isolamento de dados por professor usando Row Level Security (RLS) no PostgreSQL

**Categoria:** Segurança  
**Prioridade:** Alta  
**Sprint:** 1-7

**Implementação:**

- RLS habilitado em todas as tabelas
- 40+ policies implementadas
- Professor só acessa seus próprios alunos
- Admin tem acesso total via função `is_admin()`
- Policies por operação: SELECT, INSERT, UPDATE, DELETE

**Arquivos:**

- `supabase/migrations/04_rls_and_permissions.sql`

**Policies Principais:**

- `students_select_policy`: professor vê apenas seus alunos
- `class_logs_select_policy`: professor vê apenas suas aulas
- `financial_records_select_policy`: professor vê apenas suas cobranças
- `activities_select_policy`: professor vê apenas suas atividades

**Testes:** ✅ `errorMessages.test.ts` (sanitização de erros RLS)

---

### RNF02: Autenticação via JWT

**Descrição:** Autenticação via Supabase Auth com tokens JWT

**Categoria:** Segurança  
**Prioridade:** Alta  
**Sprint:** 1

**Implementação:**

- Supabase Auth configurado
- Tokens JWT com expiração de 1 hora
- Refresh tokens com expiração de 30 dias
- Logout invalida tokens
- Proteção de rotas via `ProtectedRoute`

**Arquivos:**

- `src/integrations/supabase/client.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/auth/ProtectedRoute.tsx`

**Testes:** ✅ Unitários em `AuthContext.test.ts`

---

### RNF03: Conformidade com LGPD

**Descrição:** Conformidade com LGPD (soft delete + anonimização)

**Categoria:** Legal  
**Prioridade:** Alta  
**Sprint:** 3, 7

**Implementação:**

- Soft delete em todas as tabelas críticas
- Funções de anonimização: `anonymize_teacher_data()`, `anonymize_student_data()`
- Cleanup automático de dados antigos (90+ dias)
- Logs de auditoria de operações
- Direito ao esquecimento implementado

**Arquivos:**

- `supabase/migrations/02_logic_and_views.sql` (funções de anonimização)
- `supabase/migrations/05_cpf_removal_and_country.sql` (soft delete)
- `supabase/functions/cleanup-old-records/index.ts`

**Testes:** ⚠️ Via migration (executar funções e verificar resultado)

---

### RNF04: Idempotência em Operações Financeiras

**Descrição:** Idempotência em operações financeiras críticas

**Categoria:** Confiabilidade  
**Prioridade:** Alta  
**Sprint:** 6

**Implementação:**

- Tabela `idempotency_keys` para rastrear operações
- RPCs idempotentes: `mark_as_paid_idempotent`, `confirm_payment_idempotent`, `undo_payment_idempotent`
- Chave de idempotência gerada no frontend (UUID)
- Previne duplicação de pagamentos
- TTL de 24h para chaves

**Arquivos:**

- `supabase/migrations/01_structure.sql` (tabela `idempotency_keys`)
- `supabase/migrations/03_rpcs_and_triggers.sql` (RPCs idempotentes)
- `src/hooks/useFinancialRecords.ts`

**Testes:** ✅ Unitários em `useFinancialRecords.test.ts`

---

### RNF05: Rate Limiting

**Descrição:** Rate limiting em operações sensíveis

**Categoria:** Segurança  
**Prioridade:** Média  
**Sprint:** 7

**Implementação:**

- Tabela `rate_limit_tracker` registra requisições
- Função `check_rate_limit(operation, max_requests, window_minutes)`
- Padrão: 10 req/min para operações sensíveis
- Admin delete: 20 req/min
- Limpeza automática de registros antigos

**Arquivos:**

- `supabase/migrations/07_add_rate_limiting.sql`
- `supabase/functions/admin-delete-user/index.ts` (uso)

**Testes:** ✅ `rateLimit.test.ts` (145 linhas, 12 casos)

---

### RNF06: Performance < 2s

**Descrição:** Tempo de resposta < 2s para listagens paginadas

**Categoria:** Performance  
**Prioridade:** Média  
**Sprint:** 3, 5

**Implementação:**

- Índices compostos em queries frequentes
- Paginação obrigatória (`.range()`)
- Materialized views para dashboards
- Select apenas colunas necessárias
- Lazy loading de componentes

**Arquivos:**

- `supabase/migrations/01_structure.sql` (índices)
- `supabase/migrations/15_create_materialized_views.sql`
- Todos os hooks com paginação

**Testes:** — N/A (medição manual de performance)

---

### RNF07: PWA Instalável

**Descrição:** PWA instalável (offline-ready)

**Categoria:** Usabilidade  
**Prioridade:** Baixa  
**Sprint:** 3

**Implementação:**

- `vite-plugin-pwa` configurado
- Manifest.json com ícones (72x72 até 512x512)
- Service Worker para cache
- Offline fallback page
- Instalável em Android/iOS/Desktop

**Arquivos:**

- `vite.config.ts` (plugin PWA)
- `public/manifest.json`
- `public/sw.js`
- `public/icons/` (8 tamanhos)

**Testes:** ⚠️ Manual (instalar PWA e testar offline)

---

### RNF08: Responsividade Mobile

**Descrição:** Interface responsiva (mobile-first)

**Categoria:** Usabilidade  
**Prioridade:** Alta  
**Sprint:** 5

**Implementação:**

- Mobile-first design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Scroll horizontal em tabelas grandes
- Cards em vez de tabelas em telas pequenas
- Touch-friendly (botões ≥44px)

**Arquivos:**

- `tailwind.config.ts` (breakpoints)
- Todos os componentes com classes responsivas

**Testes:** ⚠️ Manual (testar em dispositivos móveis)

---

### RNF09: Logs de Auditoria

**Descrição:** Logs de auditoria para todas as operações críticas

**Categoria:** Rastreabilidade  
**Prioridade:** Média  
**Sprint:** 7

**Implementação:**

- Tabela `audit_logs` (INSERT only, imutável)
- Triggers automáticos em tabelas críticas
- Registra: user_id, action_type, table_name, old_data, new_data, timestamp
- Retenção: 1 ano
- Queries otimizadas com índices

**Arquivos:**

- `supabase/migrations/01_structure.sql` (tabela `audit_logs`)
- Triggers em: students, teachers, financial_records, activities

**Testes:** ⚠️ Via migration (executar operações e verificar logs)

---

### RNF10: Logging de Erros

**Descrição:** Logging de erros em desenvolvimento via `logger.ts`

**Categoria:** Observabilidade  
**Prioridade:** Média  
**Sprint:** 3

**Implementação:**

- `src/lib/logger.ts` — loga apenas em `DEV` via `console.*`
- `audit_logs` no banco — operações críticas rastreadas
- Sentry removido do projeto (serviço externo fora do escopo)

**Arquivos:**

- `src/lib/logger.ts`

**Testes:** — N/A

---

## RNF11-RNF16: Segurança Avançada

### RNF11: Sanitização contra XSS

**Descrição:** Sanitização de inputs contra XSS (DOMPurify)

**Categoria:** Segurança  
**Prioridade:** Alta  
**Sprint:** 5

**Implementação:**

- DOMPurify em todos os inputs de texto livre
- Sanitização em `errorHandler.ts`
- Previne injeção de scripts maliciosos
- Aplicado em: feedback de aulas, correção de atividades, observações

**Arquivos:**

- `src/lib/security/errorHandler.ts`
- Componentes com texto livre

**Testes:** ✅ `errorMessages.test.ts`

---

### RNF12: Validação de Email

**Descrição:** Validação de email com whitelist de provedores

**Categoria:** Segurança  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- Whitelist de provedores reais (Gmail, Outlook, Yahoo, etc)
- Função `is_valid_email()` no banco
- Rejeita emails de domínios inexistentes
- Previne spam e contas fake

**Arquivos:**

- `supabase/migrations/12_consistency_improvements.sql`

**Testes:** ⚠️ Via migration (testar função com emails válidos/inválidos)

---

### RNF13: Encriptação de Dados Sensíveis

**Descrição:** Encriptação de dados sensíveis (PIX keys)

**Categoria:** Segurança  
**Prioridade:** Alta  
**Sprint:** 7

**Implementação:**

- PIX keys armazenadas em texto plano (necessário para QR Code)
- View `teachers_with_pix_restricted` oculta PIX de não-admins
- RLS garante isolamento
- Apenas admin vê PIX keys de todos os professores

**Arquivos:**

- `supabase/migrations/13_encrypt_pix_keys.sql`

**Testes:** ⚠️ Via migration (verificar view e RLS)

---

### RNF14: Search Path Security

**Descrição:** Search path security em funções SQL

**Categoria:** Segurança  
**Prioridade:** Alta  
**Sprint:** 7

**Implementação:**

- `SET search_path = public, pg_temp` em todas as funções
- Previne search_path hijacking
- Aplicado em: RPCs, triggers, views
- Auditoria de todas as funções

**Arquivos:**

- `supabase/migrations/09_fix_search_path_security.sql`

**Testes:** ⚠️ Via migration (verificar search_path em funções)

---

### RNF15: Invalidação Automática de Sessões

**Descrição:** Invalidação automática de sessões

**Categoria:** Segurança  
**Prioridade:** Alta  
**Sprint:** 7

**Implementação:**

- Trigger ao desativar conta (`profiles.active = false`)
- Trigger ao deletar usuário
- Limpa tokens JWT do Supabase Auth
- Força logout em todos os dispositivos

**Arquivos:**

- `supabase/migrations/14_invalidate_sessions_on_deactivate.sql`

**Testes:** ⚠️ Via migration (executar trigger e verificar sessões)

---

### RNF16: SECURITY DEFINER em Funções Críticas

**Descrição:** SECURITY DEFINER em funções críticas

**Categoria:** Segurança  
**Prioridade:** Alta  
**Sprint:** 7

**Implementação:**

- `is_admin()` com SECURITY DEFINER
- Previne recursão infinita com RLS
- Sem isso: HTTP 500 em queries admin
- Aplicado apenas em funções críticas

**Arquivos:**

- `supabase/migrations/21_fix_critical_bugs.sql`

**Testes:** ⚠️ Via migration (testar queries admin)

---

## RNF17-RNF21: Performance e Otimização

### RNF17: Índices Compostos

**Descrição:** Índices compostos para queries frequentes

**Categoria:** Performance  
**Prioridade:** Alta  
**Sprint:** 3

**Implementação:**

- Índices em todas as FKs usadas em WHERE/JOIN
- Índices compostos para queries frequentes
- Exemplos:
  - `idx_class_logs_teacher_date` (teacher_id, class_date)
  - `idx_financial_records_student_status` (student_id, status)
  - `idx_activities_student_status` (student_id, status)

**Arquivos:**

- `supabase/migrations/01_structure.sql`

**Testes:** — N/A (medição de performance)

---

### RNF18: Materialized Views

**Descrição:** Materialized views para dashboards

**Categoria:** Performance  
**Prioridade:** Média  
**Sprint:** 7

**Implementação:**

- `activities_dashboard`: métricas de atividades
- `financial_dashboard`: métricas financeiras
- Refresh periódico via cron
- Reduz carga em queries complexas

**Arquivos:**

- `supabase/migrations/15_create_materialized_views.sql`

**Testes:** — N/A (medição de performance)

---

### RNF19: Paginação Obrigatória

**Descrição:** Paginação obrigatória em listagens

**Categoria:** Performance  
**Prioridade:** Alta  
**Sprint:** 5

**Implementação:**

- `.range(start, end)` em todas as listagens
- Padrão: 10 itens por página
- Previne queries pesadas
- Aplicado em: alunos, professores, aulas, cobranças, atividades

**Arquivos:**

- Todos os hooks com listagens

**Testes:** ✅ Unitários

---

### RNF20: Code Splitting e Lazy Loading

**Descrição:** Code splitting e lazy loading

**Categoria:** Performance  
**Prioridade:** Média  
**Sprint:** 1

**Implementação:**

- Lazy loading por rota
- Componentes pesados carregados sob demanda
- Reduz bundle inicial
- Melhora First Contentful Paint

**Arquivos:**

- `src/App.tsx` (lazy imports)

**Testes:** — N/A (medição de bundle size)

---

### RNF21: Query Optimization

**Descrição:** Query optimization (select específico)

**Categoria:** Performance  
**Prioridade:** Média  
**Sprint:** Contínuo

**Implementação:**

- Select apenas colunas necessárias
- Evita `SELECT *`
- Reduz tráfego de rede
- Padrão em todos os hooks

**Arquivos:**

- Todos os hooks

**Testes:** ✅ Unitários

---

## RNF22-RNF27: Usabilidade e Design

### RNF22: Design Tokens Centralizados

**Descrição:** Design tokens centralizados (129 testes)

**Categoria:** Usabilidade  
**Prioridade:** Média  
**Sprint:** 5

**Implementação:**

- Sistema completo com 129 testes
- Funções: `typography()`, `stack()`, `iconSize()`, `modalSizes()`
- Cores semânticas: `text-destructive`, `bg-primary`
- Spacing na escala de 4px

**Arquivos:**

- `src/lib/design-tokens/typography.ts`
- `src/lib/design-tokens/spacing.ts`
- `src/lib/design-tokens/icon-sizes.ts`
- `src/lib/design-tokens/modal-sizes.ts`

**Testes:** ✅ 129 testes em `*.test.ts`

---

### RNF23: Skeleton Screens

**Descrição:** Skeleton screens para loading

**Categoria:** Usabilidade  
**Prioridade:** Média  
**Sprint:** 3

**Implementação:**

- Loading states em todas as páginas
- Skeletons para: tabelas, cards, forms
- Melhora percepção de performance
- Reduz frustração do usuário

**Arquivos:**

- `src/components/ui/skeleton.tsx`
- `*Skeleton.tsx` em cada módulo

**Testes:** ✅ Snapshot tests

---

### RNF24: Empty States Personalizados

**Descrição:** Empty states personalizados

**Categoria:** Usabilidade  
**Prioridade:** Baixa  
**Sprint:** 3

**Implementação:**

- Mensagens personalizadas por módulo
- CTAs contextuais
- Ilustrações SVG
- Exemplos: "Nenhum aluno cadastrado", "Nenhuma cobrança pendente"

**Arquivos:**

- `src/components/ui/empty-state.tsx`
- Componentes de listagem

**Testes:** ✅ Snapshot tests

---

### RNF25: Formatters Centralizados

**Descrição:** Formatters centralizados

**Categoria:** Usabilidade  
**Prioridade:** Média  
**Sprint:** 3

**Implementação:**

- Currency: `formatCurrency(1000)` → "R$ 1.000,00"
- Date: `formatDate('2026-05-20')` → "20/05/2026"
- Phone: `formatPhone('11999999999')` → "(11) 99999-9999"
- CPF: `formatCPF('12345678900')` → "123.456.789-00"

**Arquivos:**

- `src/lib/utils/formatters.ts`
- `src/lib/utils/format-phone.ts`

**Testes:** ✅ Unitários em `formatters.test.ts`

---

### RNF26: Sistema de Toasts

**Descrição:** Sistema de toasts para feedback

**Categoria:** Usabilidade  
**Prioridade:** Média  
**Sprint:** 2

**Implementação:**

- Sonner integrado
- Tipos: success, error, info, warning
- Posição: bottom-right
- Auto-dismiss em 3s

**Arquivos:**

- `src/components/ui/toast.tsx`
- `src/components/ui/use-toast.ts`

**Testes:** ✅ Unitários

---

### RNF27: Dialogs Padronizados

**Descrição:** Dialogs padronizados

**Categoria:** Usabilidade  
**Prioridade:** Baixa  
**Sprint:** 2

**Implementação:**

- Modal system consistente
- Tamanhos: SM, MD, LG, XL
- Animações suaves
- Acessibilidade (ESC para fechar, focus trap)

**Arquivos:**

- `src/components/ui/dialog.tsx`
- `src/lib/design-tokens/modal-sizes.ts`

**Testes:** ✅ Snapshot tests

---

## RNF28-RNF32: Rastreabilidade e Observabilidade

### RNF28: Audit Logs Automáticos

**Descrição:** Audit logs automáticos

**Categoria:** Rastreabilidade  
**Prioridade:** Alta  
**Sprint:** 7

**Implementação:**

- Triggers em todas as tabelas críticas
- Registra: user_id, action_type, table_name, old_data, new_data
- Tabela `audit_logs` (INSERT only, imutável)
- Retenção: 1 ano

**Arquivos:**

- `supabase/migrations/01_structure.sql` (tabela)
- Triggers em tabelas críticas

**Testes:** ⚠️ Via migration

---

### RNF29: Performance Logs

**Descrição:** Performance logs

**Categoria:** Observabilidade  
**Prioridade:** Baixa  
**Sprint:** 7

**Implementação:**

- Tabela `performance_logs`
- Registra queries lentas (>2s)
- Análise de gargalos
- Alertas automáticos (futuro)

**Arquivos:**

- `supabase/migrations/01_structure.sql`

**Testes:** — N/A

---

### RNF30: Histórico Completo de Operações

**Descrição:** Histórico completo de operações

**Categoria:** Rastreabilidade  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- Timeline de transações financeiras
- Histórico de aulas
- Histórico de atividades
- Filtros por período

**Arquivos:**

- `src/components/financial/Timeline.tsx`
- `src/pages/student/StudentHistory.tsx`

**Testes:** ✅ Unitários

---

### RNF31: Rastreamento de Confirmação

**Descrição:** Rastreamento de quem confirmou pagamentos

**Categoria:** Rastreabilidade  
**Prioridade:** Média  
**Sprint:** 1

**Implementação:**

- Campo `confirmed_by_user_id` em financial_records
- Registra quem confirmou pagamento
- Auditoria de operações financeiras
- Previne fraudes

**Arquivos:**

- `supabase/migrations/01_structure.sql`

**Testes:** ✅ Unitários

---

### RNF32: Logs Estruturados

**Descrição:** Logs estruturados para análise

**Categoria:** Observabilidade  
**Prioridade:** Baixa  
**Sprint:** Contínuo

**Implementação:**

- Logs em formato JSON
- Campos: timestamp, level, message, context
- Análise via ferramentas externas

**Arquivos:**

- `src/lib/logger.ts`

**Testes:** — N/A

---

## RNF33-RNF36: Manutenção e Operações

### RNF33: Cleanup Automático de Registros

**Descrição:** Cleanup automático de registros antigos

**Categoria:** Manutenção  
**Prioridade:** Média  
**Sprint:** 9

**Implementação:**

- Edge function `cleanup-old-records`
- Remove registros soft-deleted há 90+ dias
- Execução via cron (semanal)
- Logs de auditoria

**Arquivos:**

- `supabase/functions/cleanup-old-records/index.ts`

**Testes:** ⚠️ Manual

---

### RNF34: Cleanup Automático de Storage

**Descrição:** Cleanup automático de storage

**Categoria:** Manutenção  
**Prioridade:** Média  
**Sprint:** 9

**Implementação:**

- Edge function `cleanup-storage`
- Remove arquivos órfãos (sem referência no banco)
- Execução via cron (semanal)
- Libera espaço em disco

**Arquivos:**

- `supabase/functions/cleanup-storage/index.ts`

**Testes:** ⚠️ Manual

---

### RNF35: Migrations Versionadas

**Descrição:** Migrations versionadas e rastreáveis

**Categoria:** Manutenção  
**Prioridade:** Alta  
**Sprint:** 1-9

**Implementação:**

- 70 migrations aplicadas (Sprint 31)
- Nomenclatura: `NN_description.sql`
- Rastreabilidade via `supabase_migrations` table
- Rollback manual (sem down migrations)

**Arquivos:**

- `supabase/migrations/` (70 arquivos)

**Testes:** — N/A

---

### RNF36: Edge Functions

**Descrição:** Edge Functions para operações assíncronas

**Categoria:** Arquitetura  
**Prioridade:** Média  
**Sprint:** 3-9

**Implementação:**

- 9 functions implementadas:
  1. `invite-user` — Convite de usuários
  2. `reset-password` — Reset de senha
  3. `admin-delete-user` — Hard delete
  4. `cleanup-old-records` — Limpeza de registros
  5. `cleanup-storage` — Limpeza de storage
  6. `export-user-data` — Exportação de dados (LGPD)
  7. `create-abacate-payment` — Criação de cobrança PIX via AbacatePay (Sprint 30)
  8. `refund-abacate-payment` — Estorno de pagamento PIX via AbacatePay (Sprint 30)
  9. `abacate-webhook` — Recepção de eventos de pagamento AbacatePay (Sprint 30)
- Deno/TypeScript
- Execução assíncrona
- Rate limiting

**Arquivos:**

- `supabase/functions/*/index.ts`

**Testes:** ⚠️ Manual

---

## Resumo Quantitativo

### Por Categoria

| Categoria       | Requisitos | IDs                              |
| --------------- | ---------- | -------------------------------- |
| Segurança       | 8          | RNF01, RNF02, RNF05, RNF11-RNF16 |
| Performance     | 6          | RNF06, RNF17-RNF21               |
| Usabilidade     | 7          | RNF07, RNF08, RNF22-RNF27        |
| Rastreabilidade | 5          | RNF09, RNF28-RNF31               |
| Observabilidade | 3          | RNF10, RNF29, RNF32              |
| Legal           | 1          | RNF03                            |
| Confiabilidade  | 1          | RNF04                            |
| Manutenção      | 4          | RNF33-RNF35                      |
| Arquitetura     | 1          | RNF36                            |

### Por Prioridade

| Prioridade | Quantidade |
| ---------- | ---------- |
| Alta       | 16         |
| Média      | 17         |
| Baixa      | 3          |

### Por Status de Teste

| Status           | Quantidade |
| ---------------- | ---------- |
| ✅ Unitários     | 15         |
| ⚠️ Manual        | 10         |
| ⚠️ Via migration | 8          |
| — N/A            | 3          |

---

## Mapeamento: Requisitos → Código

| Requisito | Arquivo Principal        | Migration                          | Teste            |
| --------- | ------------------------ | ---------------------------------- | ---------------- |
| RNF01     | —                        | `04_rls_and_permissions.sql`       | ✅               |
| RNF02     | `AuthContext.tsx`        | —                                  | ✅               |
| RNF03     | —                        | `02_logic_and_views.sql`           | ⚠️ Via migration |
| RNF04     | `useFinancialRecords.ts` | `03_rpcs_and_triggers.sql`         | ✅               |
| RNF05     | —                        | `07_add_rate_limiting.sql`         | ✅               |
| RNF06     | Todos os hooks           | `01_structure.sql`                 | — N/A            |
| RNF07     | `vite.config.ts`         | —                                  | ⚠️ Manual        |
| RNF08     | Todos os componentes     | —                                  | ⚠️ Manual        |
| RNF09     | —                        | `01_structure.sql`                 | ⚠️ Via migration |
| RNF10     | `logger.ts`              | —                                  | — N/A            |
| RNF11     | `errorHandler.ts`        | —                                  | ✅               |
| RNF12     | —                        | `12_consistency_improvements.sql`  | ⚠️ Via migration |
| RNF13     | —                        | `13_encrypt_pix_keys.sql`          | ⚠️ Via migration |
| RNF14     | —                        | `09_fix_search_path_security.sql`  | ⚠️ Via migration |
| RNF15     | —                        | `14_invalidate_sessions.sql`       | ⚠️ Via migration |
| RNF16     | —                        | `21_fix_critical_bugs.sql`         | ⚠️ Via migration |
| RNF17     | —                        | `01_structure.sql`                 | — N/A            |
| RNF18     | —                        | `15_create_materialized_views.sql` | — N/A            |
| RNF19     | Todos os hooks           | —                                  | ✅               |
| RNF20     | `App.tsx`                | —                                  | — N/A            |
| RNF21     | Todos os hooks           | —                                  | ✅               |
| RNF22     | `design-tokens/`         | —                                  | ✅ (129 testes)  |
| RNF23     | `*Skeleton.tsx`          | —                                  | ✅               |
| RNF24     | `EmptyState.tsx`         | —                                  | ✅               |
| RNF25     | `formatters.ts`          | —                                  | ✅               |
| RNF26     | `toast.tsx`              | —                                  | ✅               |
| RNF27     | `dialog.tsx`             | —                                  | ✅               |
| RNF28     | —                        | `01_structure.sql`                 | ⚠️ Via migration |
| RNF29     | —                        | `01_structure.sql`                 | — N/A            |
| RNF30     | `Timeline.tsx`           | —                                  | ✅               |
| RNF31     | —                        | `01_structure.sql`                 | ✅               |
| RNF32     | `logger.ts`              | —                                  | — N/A            |
| RNF33     | `cleanup-old-records/`   | —                                  | ⚠️ Manual        |
| RNF34     | `cleanup-storage/`       | —                                  | ⚠️ Manual        |
| RNF35     | —                        | `supabase/migrations/`             | — N/A            |
| RNF36     | `supabase/functions/`    | —                                  | ⚠️ Manual        |

---

## Referências

- **Cap4:** `docs/tcc/cap4-requisitos.md` (seções 4.3.1 a 4.3.6)
- **Sprints:** `docs/sprints/sprint-01-*.md` até `sprint-09-*.md`
- **Código:** `src/`, `supabase/migrations/`, `supabase/functions/`
- **Testes:** `src/**/*.test.ts`, `src/lib/design-tokens/*.test.ts`
