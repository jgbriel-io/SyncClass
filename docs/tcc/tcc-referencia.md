# TCC — Referência Extraída do Projeto

> Informações extraídas automaticamente do código-fonte.  
> **Última Atualização:** 20/05/2026  
> Usar como base para os capítulos 3 a 7.

---

## Cap. 3 — Metodologia (Ferramentas)

| Categoria | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 18.3.1 |
| Linguagem | TypeScript | 5.8.3 |
| Build tool | Vite | 5.4.19 |
| Estilização | Tailwind CSS | 3.4.17 |
| Componentes UI | shadcn/ui (Radix UI) | — |
| Roteamento | React Router DOM | 6.30.1 |
| Backend/BaaS | Supabase (PostgreSQL + Auth + Storage) | 2.90.1 |
| Data fetching | TanStack Query | 5.83.0 |
| Formulários | React Hook Form + Zod | 7.61.1 / 3.25.76 |
| Ícones | Lucide React | 0.462.0 |
| Notificações | Sonner | 1.7.4 |
| Testes unitários | Vitest + Testing Library | 3.2.4 |
| IA utilizada | Claude (Anthropic), GitHub Copilot | — |

---

## Cap. 4 — Requisitos

> **Nota:** Documentação completa em `docs/tcc/cap4-requisitos.md`

### Resumo Quantitativo

- **Requisitos Funcionais:** 35 (30 implementados + 5 futuros)
  - RF01-RF20: Principais (100% implementados)
  - RF21-RF30: Adicionais (100% implementados)
  - RF31-RF35: Futuros (planejados para sprints 14-18)
- **Requisitos Não Funcionais:** 35 (100% implementados)
  - RNF01-RNF09: Principais
  - RNF10-RNF15: Segurança avançada
  - RNF16-RNF20: Performance
  - RNF21-RNF26: Usabilidade
  - RNF27-RNF31: Rastreabilidade
  - RNF32-RNF35: Manutenção
- **Regras de Negócio:** 55 principais (59 completas)
- **Casos de Uso:** 26
- **Taxa de Implementação:** 100% dos requisitos documentados

### Requisitos Funcionais Principais (RF01-RF20)

| ID | Requisito | Módulo |
|---|---|---|
| RF01 | Cadastro e gerenciamento de alunos (CRUD) | Alunos |
| RF02 | Cadastro e gerenciamento de professores (CRUD) | Professores |
| RF03 | Registro de aulas com data, horário, duração e presença | Aulas |
| RF04 | Criação de pacotes de aulas com cobrança vinculada | Aulas |
| RF05 | Avaliação pós-aula (nota, feedback, observações) | Aulas |
| RF06 | Geração de cobranças individuais e por pacote | Financeiro |
| RF07 | Controle de status de pagamento (pendente/pago/cancelado/abonado/extornado) | Financeiro |
| RF08 | Upload de comprovante de pagamento pelo aluno | Financeiro |
| RF09 | Aprovação/rejeição de comprovante pelo professor | Financeiro |
| RF10 | Pagamento via PIX com QR Code | Financeiro |
| RF11 | Criação e atribuição de atividades para alunos | Atividades |
| RF12 | Entrega de atividades com arquivo pelo aluno | Atividades |
| RF13 | Correção de atividades com nota e feedback | Atividades |
| RF14 | Dashboard com métricas (alunos, aulas, cobranças, aniversários) | Dashboard |
| RF15 | Visão geral consolidada (admin vê todos os professores) | Admin |
| RF16 | Gerenciamento de usuários e roles (admin/teacher/student) | Admin |
| RF17 | Convite de usuários por e-mail | Auth |
| RF18 | Redefinição de senha (self-service e admin) | Auth |
| RF19 | Portal do aluno (histórico de aulas, financeiro, atividades) | Aluno |
| RF20 | Anonimização de dados pessoais (LGPD) | LGPD |

### Requisitos Funcionais Adicionais (RF21-RF30)

| ID | Requisito | Módulo |
|---|---|---|
| RF21 | Soft delete e restauração de alunos e professores | Gestão |
| RF22 | Hard delete com validação de segurança (admin) | Admin |
| RF23 | Gestão de faltas em aulas | Aulas |
| RF24 | Suporte a alunos estrangeiros (sem CPF obrigatório) | Alunos |
| RF25 | Upload de foto de perfil | Usuários |
| RF26 | Histórico completo de aulas e pagamentos | Aluno |
| RF27 | Integração com API de CEP para preenchimento automático | Alunos |
| RF28 | Timeline de transações financeiras | Financeiro |
| RF29 | Invalidação de sessões ao desativar/deletar conta | Auth |
| RF30 | Limpeza automática de dados antigos (LGPD) | LGPD |

### Requisitos Futuros (RF31-RF35)

| ID | Requisito | Módulo | Status |
|---|---|---|---|
| RF31 | Sistema de notificações (email, push, in-app) | Notificações | Sprint 14 |
| RF32 | Exportação de relatórios em PDF | Relatórios | Sprint 15 |
| RF33 | Integração com Google Calendar | Integrações | Sprint 16 |
| RF34 | Gateway de pagamento real (Stripe/Mercado Pago) | Financeiro | Sprint 17 |
| RF35 | Sistema de gamificação (badges, conquistas) | Gamificação | Sprint 18 |

### Requisitos Não Funcionais Principais (RNF01-RNF10)

| ID | Requisito | Categoria |
|---|---|---|
| RNF01 | Isolamento de dados por professor (RLS no PostgreSQL) | Segurança |
| RNF02 | Autenticação via Supabase Auth (JWT) | Segurança |
| RNF03 | Conformidade com LGPD (anonimização, soft delete) | Legal |
| RNF04 | Idempotência em operações financeiras críticas | Confiabilidade |
| RNF05 | Rate limiting em operações sensíveis | Segurança |
| RNF06 | Tempo de resposta < 2s para listagens paginadas | Performance |
| RNF07 | PWA instalável (offline-ready) | Usabilidade |
| RNF08 | Interface responsiva (mobile-first) | Usabilidade |
| RNF09 | Logs de auditoria para todas as operações | Rastreabilidade |

### Segurança Avançada (RNF10-RNF15)

| ID | Requisito | Categoria |
|---|---|---|
| RNF10 | Sanitização de inputs contra XSS (DOMPurify) | Segurança |
| RNF11 | Validação de email com whitelist de provedores | Segurança |
| RNF12 | Encriptação de dados sensíveis (PIX keys) | Segurança |
| RNF13 | Search path security em funções SQL | Segurança |
| RNF14 | Invalidação automática de sessões | Segurança |
| RNF15 | SECURITY DEFINER em funções críticas | Segurança |

### Performance e Otimização (RNF16-RNF20)

| ID | Requisito | Categoria |
|---|---|---|
| RNF16 | Índices compostos para queries frequentes | Performance |
| RNF17 | Materialized views para dashboards | Performance |
| RNF18 | Paginação obrigatória em listagens grandes | Performance |
| RNF19 | Code splitting e lazy loading por rota | Performance |
| RNF20 | Query optimization (select apenas colunas necessárias) | Performance |

### Usabilidade e Design (RNF21-RNF26)

| ID | Requisito | Categoria |
|---|---|---|
| RNF21 | Design tokens centralizados (129 testes) | Usabilidade |
| RNF22 | Skeleton screens para estados de loading | Usabilidade |
| RNF23 | Empty states personalizados por módulo | Usabilidade |
| RNF24 | Formatters centralizados (currency, date, phone) | Usabilidade |
| RNF25 | Sistema de toasts para feedback visual | Usabilidade |
| RNF26 | Dialogs padronizados e acessíveis | Usabilidade |

### Rastreabilidade e Observabilidade (RNF27-RNF31)

| ID | Requisito | Categoria |
|---|---|---|
| RNF28 | Audit logs automáticos via triggers | Rastreabilidade |
| RNF29 | Performance logs para queries lentas | Observabilidade |
| RNF30 | Histórico completo de operações financeiras | Rastreabilidade |
| RNF31 | Rastreamento de quem confirmou pagamentos | Rastreabilidade |
| RNF32 | Logs estruturados para análise | Observabilidade |

### Manutenção e Operações (RNF33-RNF36)

| ID | Requisito | Categoria |
|---|---|---|
| RNF33 | Cleanup automático de registros antigos | Manutenção |
| RNF34 | Cleanup automático de arquivos órfãos | Manutenção |
| RNF35 | Migrations versionadas e rastreáveis | Manutenção |
| RNF36 | Edge Functions para operações assíncronas | Arquitetura |

### Regras de Negócio

> **Nota:** Documentação completa em `docs/REGRAS_DE_NEGOCIO.md` (59 regras)

**Resumo por Categoria:**

| Categoria | Quantidade | IDs |
|-----------|------------|-----|
| Usuários e Autenticação | 6 | RN-001 a RN-006 |
| Professores | 5 | RN-007 a RN-011 |
| Alunos | 5 | RN-012 a RN-016 |
| Aulas | 6 | RN-017 a RN-022 |
| Financeiro | 8 | RN-023 a RN-030 |
| Atividades | 5 | RN-031 a RN-035 |
| Segurança e Permissões | 7 | RN-036 a RN-042 |
| LGPD e Privacidade | 5 | RN-043 a RN-047 |
| Performance | 4 | RN-048 a RN-051 |
| Validação Frontend | 4 | RN-052 a RN-055 |

**Exemplos de Regras Principais:**

- **RN-001:** Sistema possui 3 roles: admin, teacher, student
- **RN-012:** Aluno vinculado a exatamente 1 professor
- **RN-013:** Dia de pagamento entre 1 e 31
- **RN-022:** Pacote cria múltiplas aulas + 1 cobrança
- **RN-028:** Operações financeiras são idempotentes
- **RN-036:** RLS habilitado em todas as tabelas
- **RN-037:** Professor só acessa seus próprios alunos
- **RN-044:** Usuário pode solicitar anonimização

---

## Cap. 5 — Modelagem e Arquitetura

### Tabelas do Banco de Dados

| Tabela | Descrição | Colunas principais |
|---|---|---|
| `teachers` | Professores | id, name, email, phone, hourly_rate, pix_key, status, anonymized_at |
| `students` | Alunos | id, name, email, phone, pay_day, hourly_rate, status, teacher_id, birth_date, origin, anonymized_at |
| `profiles` | Usuários do sistema | id, user_id, full_name, role, student_id, teacher_id, active, deleted_at |
| `user_roles` | Controle de acesso | id, user_id, role, email |
| `class_logs` | Registro de aulas | id, student_id, teacher_id, class_date, start_at, end_at, duration_minutes, attendance, title, grade, feedback |
| `financial_records` | Cobranças | id, student_id, class_log_id, amount, due_date, status, paid_at, payment_proof_url, payment_proof_status |
| `financial_record_class_logs` | Relação N:N aulas-cobranças (pacotes) | financial_record_id, class_log_id |
| `activities` | Atividades | id, student_id, teacher_id, title, due_date, status, file_url, response_file_url, correction_file_url, grade |
| `audit_logs` | Auditoria | id, user_id, action_type, table_name, record_id, metadata |
| `idempotency_keys` | Controle de idempotência | id, idempotency_key, operation, status |
| `performance_logs` | Logs de performance | id, user_id, operation, duration_ms, metadata |

### Rotas da Aplicação

| Prefixo | Role | Páginas |
|---|---|---|
| `/admin` | Admin | Dashboard, Students, Teachers, Users, Financial, Classes, Activities, Overview |
| `/teacher` | Professor | Home, Students, Financial, Classes, Activities, Overview |
| `/student` | Aluno | Home, History, Financial, Checkout, Activities |
| `/` | Público | Login, Esqueci senha, Redefinir senha, Policies |

### Edge Functions (Supabase)

| Função | Descrição |
|---|---|
| `invite-user` | Convite de novos usuários por e-mail |
| `reset-password` | Redefinição de senha |
| `admin-delete-user` | Exclusão de usuário pelo admin |
| `cleanup-storage` | Limpeza de arquivos órfãos no storage |
| `cleanup-old-records` | Limpeza de registros antigos |

---

## Cap. 6 — Desenvolvimento

### Estrutura de Pastas

```
src/
├── components/        # 126 componentes
│   ├── ui/            # shadcn/ui + componentes base customizados
│   ├── students/      # Componentes do domínio alunos
│   ├── classes/       # Componentes do domínio aulas
│   ├── financial/     # Componentes do domínio financeiro
│   ├── activities/    # Componentes do domínio atividades
│   ├── admin/         # Componentes exclusivos do admin
│   ├── layout/        # Shells por role (AdminShell, TeacherShell, StudentShell)
│   ├── filters/       # Componentes de filtro por módulo
│   └── auth/          # AuthRedirect, ProtectedRoute, ChangePasswordDialog
├── hooks/             # 23 hooks (TanStack Query + mutations)
├── pages/             # Páginas por role (admin/, teacher/, student/)
├── contexts/          # AuthContext
├── integrations/
│   └── supabase/      # client.ts, types gerados, env.ts
└── lib/
    ├── design-tokens/ # typography(), stack(), iconSize()
    ├── utils/         # formatters, patterns, errorMapper, sanitize
    ├── validation/    # schemas Zod
    └── security/      # errorHandler
supabase/
├── migrations/        # 23 migrations SQL
└── functions/         # 5 Edge Functions (Deno/TypeScript)
```

### Números do Projeto

| Métrica | Valor |
|---|---|
| Total de arquivos | 391 |
| Linhas de código | ~46.400 |
| Componentes React | 126 |
| Hooks customizados | 23 |
| Migrations SQL | 25 |
| Edge Functions | 5 |

---

## Cap. 7 — Qualidade

### Cobertura de Testes

| Tipo | Quantidade | Ferramenta | Detalhes |
|---|---|---|---|
| Testes unitários | 18 arquivos | Vitest + Testing Library | 32 testes principais |
| Testes design tokens | 129 testes | Vitest | typography, spacing, icons |
| Testes rate limiting | 12 casos | Vitest | 145 linhas |

**Cobertura Total:** ~75% dos requisitos com testes automatizados

**Detalhamento:**
- **32 testes Vitest:** hooks, services, utils, validação
- **129 testes design tokens:** cobertura completa do sistema de design
- **12 testes rate limiting:** validação de segurança

**Nota:** Testes E2E não foram implementados no escopo do MVP. Validação de fluxos críticos foi feita manualmente.

### Hooks com Testes Unitários

- `useStudents`
- `useTeachers`
- `useClassLogs`
- `useUserMutations`
- `useOptimisticMutation`
- `useDebouncedValue`

**Nota:** Testes E2E (end-to-end) não foram implementados. A validação de fluxos completos foi realizada através de testes manuais estruturados durante o desenvolvimento.

---

## Pendências (requer trabalho manual)

- [ ] DER (Diagrama Entidade-Relacionamento) — gerar a partir do schema acima
- [ ] Wireframes / prints de tela — capturar da aplicação rodando
- [ ] Diagrama de infraestrutura — documentar ambiente de deploy
- [ ] Gantt retroativo — reconstruir cronograma real do projeto
- [ ] Tabela ISO 25010 — avaliar cada característica de qualidade
- [ ] Diagrama de Casos de Uso — baseado nos RF acima
