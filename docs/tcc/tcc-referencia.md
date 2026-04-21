# TCC — Referência Extraída do Projeto

> Informações extraídas automaticamente do código-fonte em 21/04/2026.
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
| Monitoramento | Sentry | 10.38.0 |
| Testes unitários | Vitest + Testing Library | 3.2.4 |
| Testes E2E | Playwright | 1.59.1 |
| IA utilizada | Claude (Anthropic), GitHub Copilot | — |

---

## Cap. 4 — Requisitos

### Funcionais

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
| RF18 | Redefinição de senha obrigatória no primeiro acesso | Auth |
| RF19 | Portal do aluno (histórico de aulas, financeiro, atividades) | Aluno |
| RF20 | Anonimização de dados pessoais (LGPD) | LGPD |

### Não Funcionais

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
| RNF10 | Monitoramento de erros em produção (Sentry) | Observabilidade |

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
| Migrations SQL | 23 |
| Edge Functions | 5 |

---

## Cap. 7 — Qualidade

### Cobertura de Testes

| Tipo | Quantidade | Ferramenta |
|---|---|---|
| Testes unitários | 18 arquivos | Vitest + Testing Library |
| Testes E2E | 6 suites | Playwright |

### Suites E2E

| Arquivo | Cobertura |
|---|---|
| `complete-students` | CRUD completo de alunos |
| `complete-financial` | Fluxo financeiro completo |
| `complete-all-features` | Smoke test geral |
| `complete-edge-cases` | Casos extremos |
| `security-audit-sprint1` | Auditoria de segurança (RLS, isolamento) |
| `security-audit-sprint3-4` | Auditoria de segurança avançada |

### Hooks com Testes Unitários

- `useStudents`
- `useTeachers`
- `useClassLogs`
- `useUserMutations`
- `useOptimisticMutation`
- `useDebouncedValue`

---

## Pendências (requer trabalho manual)

- [ ] DER (Diagrama Entidade-Relacionamento) — gerar a partir do schema acima
- [ ] Wireframes / prints de tela — capturar da aplicação rodando
- [ ] Diagrama de infraestrutura — documentar ambiente de deploy
- [ ] Gantt retroativo — reconstruir cronograma real do projeto
- [ ] Tabela ISO 25010 — avaliar cada característica de qualidade
- [ ] Diagrama de Casos de Uso — baseado nos RF acima
