# Regras de Negócio — SyncClass

**Data:** 2026-05-20  
**Status:** ✅ Consolidado do código e migrations

Este documento mapeia todas as regras de negócio implementadas na plataforma, extraídas de migrations, RPCs, validações e lógica de aplicação.

## Índice

1. [Usuários e Autenticação](#1-usuários-e-autenticação)
2. [Professores](#2-professores)
3. [Alunos](#3-alunos)
4. [Aulas](#4-aulas)
5. [Financeiro](#5-financeiro)
6. [Atividades](#6-atividades)
7. [Segurança e Permissões](#7-segurança-e-permissões)
8. [LGPD e Privacidade](#8-lgpd-e-privacidade)
9. [Performance e Rate Limiting](#9-performance-e-rate-limiting)

---

## 1. Usuários e Autenticação

### RN-001: Roles do Sistema

- Sistema possui 3 roles: `admin`, `teacher`, `student`
- Role é obrigatória e imutável após criação
- Validação: `CHECK (role IN ('admin', 'teacher', 'student'))`
- **Fonte:** `01_structure.sql:110`, `01_structure.sql:282`

### RN-002: Vinculação de Perfis

- Cada usuário tem exatamente 1 profile em `profiles`
- Profile pode ter `student_id` OU `teacher_id` (não ambos)
- Cascade delete: deletar auth.user → deleta profile e user_roles
- **Fonte:** `01_structure.sql:112-113`, `01_structure.sql:380-395`

### RN-003: Convite de Usuários

- Apenas admin pode convidar novos usuários
- Convite envia email com link de ativação
- Usuário deve confirmar email antes de acessar
- **Fonte:** `supabase/functions/invite-user/`

### RN-004: Reset de Senha

- Usuário pode resetar própria senha (self-service)
- Professor pode resetar senha de aluno vinculado
- Admin pode resetar senha de qualquer usuário
- **Fonte:** `supabase/functions/reset-password/`

### RN-005: Invalidação de Sessões

- Desativar conta → invalida todas as sessões
- Deletar usuário → invalida todas as sessões antes de deletar
- **Fonte:** `14_invalidate_sessions_on_deactivate.sql`, `admin-delete-user.ts:155-165`

### RN-006: Unicidade de Email e Telefone

- Email único na plataforma (validado pelo Supabase Auth)
- Telefone único na plataforma (students + teachers)
- Validação normaliza telefone antes de comparar (remove máscaras)
- **Fonte:** `03_rpcs_and_triggers.sql:1146-1165`, `05_cpf_removal_and_country.sql:514-553`

---

## 2. Professores

### RN-007: Status do Professor

- Status: `ativo` ou `inativo`
- Validação: `CHECK (status IN ('ativo', 'inativo'))`
- Professor inativo não pode criar aulas/cobranças
- **Fonte:** `01_structure.sql:59`

### RN-008: Dados Obrigatórios

- Nome completo obrigatório
- Email obrigatório e único
- Telefone obrigatório e único
- País obrigatório (default: 'BR')
- **Fonte:** `01_structure.sql:56-78`

### RN-009: Dados Financeiros

- `hourly_rate`: valor por hora (NUMERIC(10,2))
- `pix_key`: chave PIX para recebimento (opcional)
- PIX key visível apenas para admin (view `teachers_with_pix_restricted`)
- **Fonte:** `01_structure.sql:58-59`, `02_logic_and_views.sql`

### RN-010: Soft Delete

- Professor pode ser arquivado (soft delete)
- `deleted_at` marca data de arquivamento
- Professor arquivado não aparece em listagens padrão
- Histórico de aulas/cobranças é preservado
- **Fonte:** `01_structure.sql:61`, `05_cpf_removal_and_country.sql`

### RN-011: Anonimização (LGPD)

- Professor pode solicitar anonimização de dados
- `anonymized_at` marca data de anonimização
- Função `anonymize_teacher_data()` remove dados pessoais
- Preserva IDs para integridade referencial
- **Fonte:** `02_logic_and_views.sql`, `05_cpf_removal_and_country.sql`

---

## 3. Alunos

### RN-012: Vinculação com Professor

- Aluno DEVE estar vinculado a exatamente 1 professor
- `teacher_id` é obrigatório (NOT NULL)
- Isolamento: aluno só vê seus próprios dados
- Professor só vê alunos vinculados a ele
- **Fonte:** `01_structure.sql:79`, RLS policies

### RN-013: Dia de Pagamento

- `pay_day`: dia do mês para vencimento (1-31)
- Validação: `CHECK (pay_day >= 1 AND pay_day <= 31)`
- Usado para calcular vencimento de cobranças
- **Fonte:** `01_structure.sql:78`

### RN-014: Valor da Hora-Aula

- `hourly_rate`: valor por hora (NUMERIC(10,2))
- Pode ser diferente do valor padrão do professor
- Usado para calcular valor de cobranças
- **Fonte:** `01_structure.sql:80`

### RN-015: Soft Delete

- Aluno pode ser arquivado (soft delete)
- `is_deleted: true` marca como arquivado
- Aluno arquivado não aparece em listagens padrão
- Histórico de aulas/cobranças é preservado
- **Fonte:** `01_structure.sql:81`

### RN-016: Suporte Internacional

- Campo `country` obrigatório (default: 'BR')
- CPF não é obrigatório (removido para suportar estrangeiros)
- Telefone aceita formatos internacionais
- **Fonte:** `05_cpf_removal_and_country.sql`

---

## 4. Aulas

### RN-017: Dados Obrigatórios

- `student_id`: aluno obrigatório
- `teacher_id`: professor obrigatório
- `class_date`: data obrigatória
- `start_at`: horário início obrigatório
- `end_at`: horário fim obrigatório
- **Fonte:** `01_structure.sql:135-143`

### RN-018: Validação de Horários

- `end_at` DEVE ser maior que `start_at`
- Validação: `CONSTRAINT class_logs_time_order CHECK (end_at > start_at)`
- **Fonte:** `01_structure.sql:143`

### RN-019: Prevenção de Conflitos

- Professor NÃO pode ter 2 aulas no mesmo horário
- Trigger `trg_check_class_overlap` valida antes de INSERT/UPDATE
- Verifica sobreposição de horários para mesmo professor
- **Fonte:** `03_rpcs_and_triggers.sql:837-878`

### RN-020: Presença e Faltas

- `attended`: boolean indica se aluno compareceu
- `attended = false` → falta registrada
- Faltas são contabilizadas em métricas do dashboard
- **Fonte:** `01_structure.sql:144`

### RN-021: Avaliação Pós-Aula

- `rating`: nota de 1 a 5 (opcional)
- `feedback`: texto livre (opcional)
- `observations`: observações do professor (opcional)
- **Fonte:** `01_structure.sql:142-143`

### RN-022: Pacotes de Aulas

- Múltiplas aulas podem ser criadas em lote via RPC `create_class_package`
- Pacote gera 1 cobrança vinculada a todas as aulas
- Tabela `financial_record_class_logs` faz vínculo N:N
- **Fonte:** `03_rpcs_and_triggers.sql:26-89`, `01_structure.sql:160-174`

---

## 5. Financeiro

### RN-023: Status de Cobrança

- Status: `pendente`, `pago`, `cancelado`, `abonado`, `extornado`
- Validação: `CHECK (status IN (...))`
- Transições de status são auditadas
- **Fonte:** `01_structure.sql:165`

### RN-024: Valor da Cobrança

- `amount`: valor em reais (NUMERIC(10,2))
- Validação: `CHECK (amount >= 0)`
- Valor não pode ser negativo
- **Fonte:** `01_structure.sql:161`

### RN-025: Vencimento

- `due_date`: data de vencimento (DATE)
- Calculado automaticamente baseado em `pay_day` do aluno
- Cobranças vencidas são destacadas na UI
- **Fonte:** `01_structure.sql:163`

### RN-026: Comprovante de Pagamento

- Aluno pode fazer upload de comprovante
- `payment_proof_status`: `pending`, `approved`, `rejected`
- Professor/admin aprova ou rejeita comprovante
- Rejeição exige `payment_proof_rejection_reason`
- **Fonte:** `01_structure.sql:170-173`, `16_fix_payment_proof_rejection.sql`

### RN-027: Confirmação de Pagamento

- Apenas professor/admin pode confirmar pagamento
- `confirmed_by_user_id`: registra quem confirmou
- `paid_at`: timestamp de confirmação
- Status muda para `pago`
- **Fonte:** `01_structure.sql:167-168`

### RN-028: Idempotência

- Operações financeiras críticas são idempotentes
- RPCs: `mark_as_paid_idempotent`, `confirm_payment_idempotent`, `undo_payment_idempotent`
- Tabela `idempotency_keys` previne duplicação
- **Fonte:** `03_rpcs_and_triggers.sql`, `01_structure.sql:253-262`

### RN-029: PIX com QR Code

- Aluno pode gerar QR Code PIX para pagamento
- QR Code contém chave PIX do professor
- Valor e descrição pré-preenchidos
- **Fonte:** Implementado no frontend

### RN-030: Auditoria Financeira

- Todas as operações financeiras são logadas em `audit_logs`
- Log inclui: user_id, action_type, table_name, old_data, new_data
- **Fonte:** `01_structure.sql:239-243`

---

## 6. Atividades

### RN-031: Status de Atividade

- Status: `pendente`, `enviada`, `entregue`, `corrigida`, `atrasada`
- Validação: `CHECK (status IN (...))`
- Status muda automaticamente baseado em prazos
- **Fonte:** `01_structure.sql:206`

### RN-032: Prazo de Entrega

- `due_date`: prazo de entrega (TIMESTAMPTZ)
- Atividade sem entrega após prazo → status `atrasada`
- **Fonte:** `01_structure.sql:206`

### RN-033: Entrega de Atividade

- Aluno faz upload de arquivo
- `delivery_date`: timestamp de entrega
- Status muda para `entregue`
- **Fonte:** `01_structure.sql:208`

### RN-034: Correção e Nota

- Professor corrige atividade entregue
- `grade`: nota de 0 a 100
- Validação: `CHECK (grade >= 0 AND grade <= 100)`
- `correction`: feedback textual
- Status muda para `corrigida`
- **Fonte:** `01_structure.sql:209-210`, `10_security_improvements.sql`

### RN-035: Vinculação com Aluno

- Atividade DEVE estar vinculada a exatamente 1 aluno
- `student_id` é obrigatório (NOT NULL)
- Cascade delete: deletar aluno → deleta atividades
- **Fonte:** `01_structure.sql:203`

---

## 7. Segurança e Permissões

### RN-036: Row Level Security (RLS)

- RLS habilitado em TODAS as tabelas
- Policies garantem isolamento de dados por tenant (professor)
- Admin tem acesso total via função `is_admin()`
- **Fonte:** `04_rls_and_permissions.sql`

### RN-037: Isolamento de Tenant

- Professor só acessa dados de seus próprios alunos
- Filtro automático por `teacher_id` em queries
- Validação no banco via RLS policies
- **Fonte:** RLS policies em todas as tabelas

### RN-038: Função is_admin()

- `is_admin()` DEVE ter `SECURITY DEFINER`
- Sem isso causa recursão infinita com RLS → HTTP 500
- **Fonte:** `21_fix_critical_bugs.sql`, `p-security.md`

### RN-039: Search Path Security

- Todas as funções DEVEM ter `SET search_path = public, pg_temp`
- Previne search_path hijacking
- **Fonte:** `09_fix_search_path_security.sql`

### RN-040: Rate Limiting

- Operações sensíveis têm rate limit
- Tabela `rate_limit_tracker` registra requisições
- Função `check_rate_limit(operation, max_requests, window_minutes)`
- Exemplo: admin_delete_user → 20 req/min
- **Fonte:** `07_add_rate_limiting.sql`, `admin-delete-user.ts:55-68`

### RN-041: Validação de Email

- Email deve ser de provedor real (whitelist)
- Função `is_valid_email()` valida formato e domínio
- **Fonte:** `12_consistency_improvements.sql`

### RN-042: Sanitização de Inputs

- Conteúdo de usuário é sanitizado com DOMPurify
- Previne XSS em campos de texto livre
- **Fonte:** `src/lib/security/errorHandler.ts`, Sprint 5

---

## 8. LGPD e Privacidade

### RN-043: Soft Delete

- Dados nunca são deletados permanentemente por padrão
- Soft delete via `deleted_at` (teachers) ou `is_deleted` (students)
- Preserva histórico para auditoria
- **Fonte:** `01_structure.sql`, `05_cpf_removal_and_country.sql`

### RN-044: Anonimização de Dados

- Usuário pode solicitar anonimização (direito LGPD)
- Funções: `anonymize_teacher_data()`, `anonymize_student_data()`
- Remove dados pessoais, preserva IDs
- **Fonte:** `02_logic_and_views.sql`, `05_cpf_removal_and_country.sql`

### RN-045: Auditoria de Operações

- Todas as operações críticas são logadas
- Tabela `audit_logs` registra: quem, quando, o quê, antes/depois
- Logs são imutáveis (INSERT only)
- **Fonte:** `01_structure.sql:239-243`

### RN-046: Retenção de Dados

- Edge function `cleanup-old-records` remove dados antigos
- Registros soft-deleted há mais de X dias são removidos
- Configurável por tipo de dado
- **Fonte:** `supabase/functions/cleanup-old-records/`

### RN-047: Limpeza de Storage

- Edge function `cleanup-storage` remove arquivos órfãos
- Arquivos sem referência no banco são deletados
- Execução periódica via cron
- **Fonte:** `supabase/functions/cleanup-storage/`

---

## 9. Performance e Rate Limiting

### RN-048: Índices Compostos

- Índices em todas as FKs usadas em WHERE/JOIN
- Índices compostos para queries frequentes
- Exemplo: `idx_class_logs_teacher_date` (teacher_id, class_date)
- **Fonte:** `01_structure.sql`, Sprint 3

### RN-049: Paginação Obrigatória

- Listagens grandes DEVEM usar paginação
- `.range(start, end)` no Supabase
- Padrão: 10 itens por página
- **Fonte:** Implementado no frontend, Sprint 5

### RN-050: Materialized Views

- Views materializadas para queries pesadas
- `activities_dashboard`, `financial_dashboard`
- Refresh periódico via cron
- **Fonte:** `15_create_materialized_views.sql`

### RN-051: Rate Limiting Global

- 10 req/min para operações sensíveis (padrão)
- 20 req/min para admin_delete_user
- Configurável por operação
- **Fonte:** `07_add_rate_limiting.sql`

### RN-052: Timeout de Queries

- Queries longas são canceladas automaticamente
- Timeout configurado no Supabase
- **Fonte:** Configuração do Supabase

---

## Regras de Validação Frontend

### RN-053: Validação com Zod

- Todos os formulários usam Zod para validação
- Schemas em `src/lib/validation/schemas.ts`
- Validação client-side antes de enviar ao servidor
- **Fonte:** `src/lib/validation/schemas.ts`

### RN-054: Máscaras de Input

- Telefone: máscara (XX) XXXXX-XXXX
- CPF: máscara XXX.XXX.XXX-XX (quando aplicável)
- Valores: máscara R$ X.XXX,XX
- **Fonte:** `src/lib/utils/format-phone.ts`, `src/lib/utils/formatters.ts`

### RN-055: Feedback de Erro

- Erros de validação em português
- Mensagens próximas ao campo com erro
- Cor semântica: `text-destructive`
- **Fonte:** `src/content/`, Sprint 20

---

## Regras de UI/UX

### RN-056: Estados de Loading

- Skeleton screens durante carregamento
- Spinner para operações rápidas
- Feedback visual em todas as ações
- **Fonte:** Sprint 3

### RN-057: Empty States

- Mensagens personalizadas quando não há dados
- CTAs contextuais por módulo
- Ilustrações SVG
- **Fonte:** Sprint 3

### RN-058: Confirmação de Ações Destrutivas

- Dialog de confirmação para deletar/arquivar
- Explicação clara do impacto
- Botão destrutivo em vermelho
- **Fonte:** Implementado em todos os CRUDs

### RN-059: Responsividade Mobile

- Mobile-first design
- Scroll horizontal em tabelas grandes
- Cards em vez de tabelas em telas pequenas
- **Fonte:** Sprint 5

---

## Mapeamento: Requisitos → Regras de Negócio

| Requisito                        | Regras Relacionadas    |
| -------------------------------- | ---------------------- |
| RF01 - CRUD alunos               | RN-012 a RN-016        |
| RF02 - CRUD professores          | RN-007 a RN-011        |
| RF03 - Registro de aulas         | RN-017 a RN-021        |
| RF04 - Pacotes de aulas          | RN-022                 |
| RF05 - Avaliação pós-aula        | RN-021                 |
| RF06 - Geração de cobranças      | RN-023 a RN-025        |
| RF07 - Status de pagamento       | RN-023, RN-027         |
| RF08 - Upload comprovante        | RN-026                 |
| RF09 - Aprovação comprovante     | RN-026                 |
| RF10 - PIX com QR Code           | RN-029                 |
| RF11 - Criação de atividades     | RN-031, RN-032, RN-035 |
| RF12 - Entrega de atividades     | RN-033                 |
| RF13 - Correção de atividades    | RN-034                 |
| RF16 - Gerenciamento de usuários | RN-001 a RN-006        |
| RF17 - Convite de usuários       | RN-003                 |
| RF18 - Reset de senha            | RN-004                 |
| RF20 - Anonimização LGPD         | RN-044                 |
| RNF01 - Isolamento RLS           | RN-036, RN-037         |
| RNF02 - Autenticação JWT         | RN-001, RN-002         |
| RNF03 - Conformidade LGPD        | RN-043 a RN-047        |
| RNF04 - Idempotência             | RN-028                 |
| RNF05 - Rate limiting            | RN-040, RN-051         |
| RNF06 - Performance              | RN-048 a RN-050        |

---

## Próximos Passos

- [ ] Adicionar regras de negócio para features não implementadas (sprints 14-18)
- [ ] Documentar regras de cálculo de métricas do dashboard
- [ ] Mapear regras de notificações (quando implementado)
- [ ] Documentar regras de exportação PDF (quando implementado)
- [ ] Adicionar regras de integração Google Calendar (quando implementado)
