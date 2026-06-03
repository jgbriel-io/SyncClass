# Fluxos

Fluxos de requisição, autenticação e comunicação entre módulos do SyncClass.

## Índice

- [Fluxo de requisição](#fluxo-de-requisição)
- [Fluxo de autenticação](#fluxo-de-autenticação)
- [Módulos e conexões](#módulos-e-conexões)
- [Rotas e proteção](#rotas-e-proteção)

## Fluxo de requisição

Exemplo: Professor cria uma cobrança

**Arquivo inicial:** `src/components/financial/FinancialFormDialog.tsx:87`

```
1. USUÁRIO
   Clica em "Nova Cobrança" no FinancialView

2. COMPONENT (src/components/financial/FinancialFormDialog.tsx)
   Valida formulário via React Hook Form + Zod
   Chama: useCreateFinancialRecord().mutate(data)

3. HOOK (src/hooks/useFinancialRecords.ts:142 → useCreateFinancialRecord)
   Verifica rate limit (3 req/min)
   Chama: supabase.from("financial_records").insert(record)

4. SUPABASE JS CLIENT (src/integrations/supabase/client.ts)
   Adiciona JWT do usuário no header Authorization
   Envia POST para PostgREST: /rest/v1/financial_records

5. POSTGREST
   Extrai user_id do JWT
   Aplica RLS policy "financial_records_insert_policy"
   Verifica: is_teacher() AND student_id IN (SELECT id FROM students WHERE teacher_id = get_teacher_id())

6. POSTGRESQL
   Executa INSERT
   Trigger validate_financial_logic() valida amount e status
   Retorna registro criado

7. HOOK (onSuccess callback)
   Invalida queries: financial_records, financial_summary, students_paginated...
   toast.success("Cobrança criada com sucesso!")

8. TANSTACK QUERY
   Refetch automático das queries invalidadas
   UI atualiza com novo dado
```

## Fluxo de pagamento AbacatePay

Exemplo: Aluno paga cobrança via PIX automático

```
1. PROFESSOR
   Cria cobrança → financial_records (status='pendente')

2. ALUNO
   Acessa /student/checkout/:recordId

3. COMPONENT (src/pages/student/StudentCheckout.tsx)
   Aluno informa CPF → clica "Gerar QR Code"
   Chama: useCreateAbacatePayment().mutate({ financialRecordId: record.id, cpf })

4. EDGE FUNCTION (create-abacate-payment)
   Auth: JWT do aluno via Authorization header
   Valida ownership: record.student_id === profile.student_id
   Cache idempotente: retorna pix_code existente se pix_expires_at ainda válido
   Resolve teacher → descriptografa abacate_pay_api_key
   POST https://api.abacatepay.com/v1/pixQrCode/create
   Salva brCode + external_payment_id + pix_expires_at
   Retorna { brCode, expiresAt }

5. COMPONENT
   Renderiza QR Code (qrcode.react)
   useCheckoutPaymentStatus: realtime subscription em financial_records WHERE id = recordId

6. ALUNO
   Escaneia QR Code no app bancário → realiza pagamento

7. ABACATEPAY → WEBHOOK
   POST /functions/v1/abacate-webhook?webhookSecret=<teacher-secret>
   Edge Function: valida secret → idempotência (webhook_processing_log) → UPDATE status='pago'

8. REALTIME (Supabase Realtime)
   Subscription detecta UPDATE em financial_records
   useCheckoutPaymentStatus dispara onPaid callback → setPaid(true)
   UI exibe tela "Pagamento confirmado!"
```

## Fluxo de autenticação

**Arquivo principal:** `src/contexts/AuthContext.tsx:45`

```
1. Login → supabase.auth.signInWithPassword()
2. JWT retornado → armazenado em localStorage (sb-* keys)
3. AuthContext.fetchUserRole() → busca role em profiles (user_roles removida na migration 45)
4. Verifica active/deleted_at → logout se inativo
5. Redireciona para /admin, /teacher ou /student
6. Verificação periódica a cada 30s (checkAccountStatus)
7. onAuthStateChange listener → atualiza estado em tempo real
```

**Componentes envolvidos:**

- `src/contexts/AuthContext.tsx` — Gerencia estado de autenticação
- `src/components/auth/ProtectedRoute.tsx` — Protege rotas por role
- `src/components/auth/AuthRedirect.tsx` — Redireciona após login
- `src/components/auth/ChangePasswordDialog.tsx` — Troca obrigatória de senha

## Módulos e conexões

```
AuthContext ──────────────────────────────────────────┐
     │                                                 │
     ├── AuthRedirect (redireciona por role)           │
     └── ChangePasswordDialog (must_change_password)   │
                                                       │
Pages (admin/teacher/student)                          │
     │                                                 │
     └── Views (StudentsListView, FinancialView...)    │
          │                                            │
          ├── Hooks (useStudents, useFinancial...)  ───┘
          │    └── supabase client → PostgREST/RPC
          │
          └── Components (Forms, Tables, Dialogs)
               └── Hooks (mutations)
```

## Rotas e proteção

| Rota                                    | Proteção | Role    | Arquivo                                      |
| --------------------------------------- | -------- | ------- | -------------------------------------------- |
| `/login`                                | Pública  | —       | `src/pages/Login.tsx`                        |
| `/esqueci-senha`                        | Pública  | —       | `src/pages/ForgotPassword.tsx`               |
| `/redefinir-senha`                      | Pública  | —       | `src/pages/ResetPassword.tsx`                |
| `/policies`                             | Pública  | —       | `src/pages/Policies.tsx`                     |
| `/admin`                                | Privada  | admin   | `src/pages/admin/Dashboard.tsx`              |
| `/admin/students`                       | Privada  | admin   | `src/pages/admin/Students.tsx`               |
| `/admin/teachers`                       | Privada  | admin   | `src/pages/admin/Teachers.tsx`               |
| `/admin/financial`                      | Privada  | admin   | `src/pages/admin/Financial.tsx`              |
| `/admin/classes`                        | Privada  | admin   | `src/pages/admin/Classes.tsx`                |
| `/admin/activities`                     | Privada  | admin   | `src/pages/admin/Activities.tsx`             |
| `/admin/users`                          | Privada  | admin   | `src/pages/admin/Users.tsx`                  |
| `/admin/overview`                       | Privada  | admin   | `src/pages/admin/Overview.tsx`               |
| `/admin/rate-limit`                     | Privada  | admin   | `src/pages/admin/RateLimitDashboardPage.tsx` |
| `/teacher`                              | Privada  | teacher | `src/pages/teacher/TeacherHome.tsx`          |
| `/teacher/students`                     | Privada  | teacher | `src/pages/teacher/TeacherStudents.tsx`      |
| `/teacher/financial`                    | Privada  | teacher | `src/pages/teacher/TeacherFinancial.tsx`     |
| `/teacher/classes`                      | Privada  | teacher | `src/pages/teacher/TeacherClasses.tsx`       |
| `/teacher/activities`                   | Privada  | teacher | `src/pages/teacher/TeacherActivities.tsx`    |
| `/teacher/overview`                     | Privada  | teacher | `src/pages/teacher/TeacherOverview.tsx`      |
| `/student`                              | Privada  | student | `src/pages/student/StudentHome.tsx`          |
| `/student/financial`                    | Privada  | student | `src/pages/student/StudentFinancial.tsx`     |
| `/student/activities`                   | Privada  | student | `src/pages/student/StudentActivities.tsx`    |
| `/student/history`                      | Privada  | student | `src/pages/student/StudentHistory.tsx`       |
| `/student/financial/checkout/:recordId` | Privada  | student | `src/pages/student/StudentCheckout.tsx`      |

**Proteção implementada em:** `src/components/auth/ProtectedRoute.tsx:12`

## Ver também

- [Architecture Overview](./overview.md) — Visão geral da arquitetura
- [Design Patterns](./patterns.md) — Padrões aplicados
- [Troubleshooting](./troubleshooting.md) — Erros comuns em fluxos
