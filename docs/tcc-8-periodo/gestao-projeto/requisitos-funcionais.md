# Requisitos Funcionais — SyncClass

**Data:** 2026-05-20 (atualizado: 2026-06-03)
**Total:** 35 requisitos funcionais (31 implementados + 4 planejados)

## Resumo

Este documento detalha os **35 requisitos funcionais** do SyncClass. RF01-RF30 implementados nas sprints 1-9. RF34 (AbacatePay) implementado na Sprint 30. RF31, RF32, RF33 e RF35 são trabalhos futuros.

---

## RF01-RF20: Requisitos Principais

### RF01: CRUD de Alunos

**Descrição:** Cadastro e gerenciamento completo de alunos (Create, Read, Update, Delete)

**Módulo:** Alunos  
**Prioridade:** Alta  
**Sprint:** 1-2

**Implementação:**

- Formulário completo com validação Zod
- Campos: nome, email, telefone, endereço, país, pay_day, hourly_rate
- Soft delete (flag `is_deleted`)
- Filtros: status (ativo/inativo), busca por nome/email

**Arquivos:**

- `src/pages/teacher/TeacherStudents.tsx`
- `src/components/students/StudentFormDialog.tsx`
- `src/components/students/StudentsTableRow.tsx`
- `src/hooks/useStudents.ts`

**Migration:** `01_structure.sql` (tabela `students`)

**Testes:** ✅ Unitários em `useStudents.test.ts`

---

### RF02: CRUD de Professores

**Descrição:** Cadastro e gerenciamento completo de professores (admin only)

**Módulo:** Professores  
**Prioridade:** Alta  
**Sprint:** 1-2

**Implementação:**

- Formulário completo com validação Zod
- Campos: nome, email, telefone, endereço, país, hourly_rate, pix_key, status
- Soft delete (timestamp `deleted_at`)
- Apenas admin pode criar/editar/deletar

**Arquivos:**

- `src/pages/admin/Teachers.tsx`
- `src/components/teachers/TeacherFormDialog.tsx`
- `src/components/teachers/TeachersTableRow.tsx`
- `src/hooks/useTeachers.ts`

**Migration:** `01_structure.sql` (tabela `teachers`)

**Testes:** ✅ Unitários em `useTeachers.test.ts`

---

### RF03: Registro de Aulas

**Descrição:** Registro de aulas com data, horário, duração e presença

**Módulo:** Aulas  
**Prioridade:** Alta  
**Sprint:** 1

**Implementação:**

- Formulário com data, horário início/fim, aluno
- Validação: horário fim > horário início
- Prevenção de conflitos (professor não pode ter 2 aulas no mesmo horário)
- Campo `attended` para registrar presença/falta

**Arquivos:**

- `src/pages/teacher/TeacherClasses.tsx`
- `src/components/classes/ClassFormDialog.tsx`
- `src/components/classes/ClassesTableRow.tsx`
- `src/hooks/useClassLogs.ts`

**Migration:** `01_structure.sql` (tabela `class_logs`)

**Trigger:** `trg_check_class_overlap` (previne conflitos)

**Testes:** ✅ Unitários em `useClassLogs.test.ts`

---

### RF04: Pacotes de Aulas

**Descrição:** Criação de pacotes de aulas com cobrança vinculada

**Módulo:** Aulas  
**Prioridade:** Alta  
**Sprint:** 5

**Implementação:**

- Formulário para criar múltiplas aulas de uma vez
- Gera 1 cobrança vinculada a todas as aulas do pacote
- Tabela `financial_record_class_logs` faz vínculo N:N
- RPC `create_class_package` garante atomicidade

**Arquivos:**

- `src/components/classes/ClassPackageDialog.tsx`
- `src/hooks/useClassPackage.ts`

**Migration:** `03_rpcs_and_triggers.sql` (RPC `create_class_package`)

**Testes:** ✅ Unitários em `useClassPackage.test.ts`

---

### RF05: Avaliação Pós-Aula

**Descrição:** Avaliação de aula com nota (1-5), feedback e observações

**Módulo:** Aulas  
**Prioridade:** Média  
**Sprint:** 1

**Implementação:**

- Dialog de avaliação após registrar aula
- Campos opcionais: rating (1-5), feedback (texto), observations (texto)
- Sanitização XSS em campos de texto

**Arquivos:**

- `src/components/classes/ClassEvaluationDialog.tsx`
- `src/hooks/useClassLogs.ts`

**Migration:** `01_structure.sql` (campos `rating`, `feedback`, `observations`)

**Testes:** ✅ Unitários

---

### RF06: Geração de Cobranças

**Descrição:** Geração de cobranças individuais e por pacote

**Módulo:** Financeiro  
**Prioridade:** Alta  
**Sprint:** 1

**Implementação:**

- Cobrança individual: 1 aula → 1 cobrança
- Cobrança por pacote: N aulas → 1 cobrança
- Cálculo automático: valor = hourly_rate × duração
- Vencimento baseado em `pay_day` do aluno

**Arquivos:**

- `src/components/financial/FinancialRecordFormDialog.tsx`
- `src/hooks/useFinancialRecords.ts`

**Migration:** `01_structure.sql` (tabela `financial_records`)

**Testes:** ✅ Unitários em `useFinancialRecords.test.ts`

---

### RF07: Status de Pagamento

**Descrição:** Controle de status de pagamento (5 status)

**Módulo:** Financeiro  
**Prioridade:** Alta  
**Sprint:** 1

**Implementação:**

- Status: `pendente`, `pago`, `cancelado`, `abonado`, `extornado`
- Transições de status auditadas
- Apenas professor/admin pode alterar status
- Campo `paid_at` registra timestamp de pagamento

**Arquivos:**

- `src/components/financial/FinancialStatusBadge.tsx`
- `src/hooks/useFinancialRecords.ts`

**Migration:** `01_structure.sql` (campo `status` com CHECK constraint)

**Testes:** ✅ Unitários

---

### RF08: Upload de Comprovante

**Descrição:** Upload de comprovante de pagamento pelo aluno

**Módulo:** Financeiro  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- Upload de imagem/PDF
- Storage bucket `payment-proofs`
- Status do comprovante: `pending`, `approved`, `rejected`
- Aluno pode reenviar se rejeitado

**Arquivos:**

- `src/components/financial/PaymentProofUpload.tsx`
- `src/hooks/usePaymentProof.ts`

**Migration:** `01_structure.sql` (campos `payment_proof_*`)

**Storage Policy:** `04_rls_and_permissions.sql`

**Testes:** ⚠️ Manual (upload de arquivo)

---

### RF09: Aprovação de Comprovante

**Descrição:** Aprovação/rejeição de comprovante pelo professor

**Módulo:** Financeiro  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- Professor visualiza comprovante
- Pode aprovar ou rejeitar
- Rejeição exige motivo (`payment_proof_rejection_reason`)
- Aprovação muda status da cobrança para `pago`

**Arquivos:**

- `src/components/financial/PaymentProofReview.tsx`
- `src/hooks/usePaymentProof.ts`

**Migration:** `16_fix_payment_proof_rejection.sql`

**Testes:** ⚠️ Manual

---

### RF10: PIX com QR Code

**Descrição:** Pagamento via PIX com QR Code

**Módulo:** Financeiro  
**Prioridade:** Média  
**Sprint:** 5

**Implementação:**

- Aluno gera QR Code PIX para pagamento
- QR Code contém: chave PIX do professor, valor, descrição
- Gerado no frontend (biblioteca `qrcode.react`)
- Não processa pagamento real (apenas QR Code)

**Arquivos:**

- `src/components/financial/QRCodePix.tsx`
- `src/hooks/useQRCodePix.ts`

**Migration:** Não requer (usa PIX key já armazenada)

**Testes:** ⚠️ Manual (geração de QR Code)

---

### RF11: Criação de Atividades

**Descrição:** Criação e atribuição de atividades para alunos

**Módulo:** Atividades  
**Prioridade:** Alta  
**Sprint:** 5

**Implementação:**

- Formulário: título, descrição, prazo, aluno
- Status inicial: `pendente`
- Professor pode anexar arquivo de referência
- Notificação ao aluno (futuro)

**Arquivos:**

- `src/pages/teacher/TeacherActivities.tsx`
- `src/components/activities/ActivityFormDialog.tsx`
- `src/hooks/useActivities.ts`

**Migration:** `01_structure.sql` (tabela `activities`)

**Testes:** ✅ Unitários em `useActivities.test.ts`

---

### RF12: Entrega de Atividades

**Descrição:** Entrega de atividades com arquivo pelo aluno

**Módulo:** Atividades  
**Prioridade:** Alta  
**Sprint:** 5

**Implementação:**

- Aluno faz upload de arquivo
- Storage bucket `activity-submissions`
- Status muda para `entregue`
- Campo `delivery_date` registra timestamp

**Arquivos:**

- `src/pages/student/StudentActivities.tsx`
- `src/components/activities/ActivitySubmissionDialog.tsx`
- `src/hooks/useActivities.ts`

**Migration:** `01_structure.sql` (campos `delivery_*`)

**Storage Policy:** `04_rls_and_permissions.sql`

**Testes:** ⚠️ Manual (upload de arquivo)

---

### RF13: Correção de Atividades

**Descrição:** Correção de atividades com nota e feedback

**Módulo:** Atividades  
**Prioridade:** Alta  
**Sprint:** 5

**Implementação:**

- Professor corrige atividade entregue
- Campos: nota (0-100), feedback (texto)
- Status muda para `corrigida`
- Aluno visualiza correção

**Arquivos:**

- `src/components/activities/ActivityCorrectionDialog.tsx`
- `src/hooks/useActivities.ts`

**Migration:** `10_security_improvements.sql` (CHECK constraint em `grade`)

**Testes:** ✅ Unitários

---

### RF14: Dashboard com Métricas

**Descrição:** Dashboard com métricas (alunos, aulas, cobranças, aniversários)

**Módulo:** Dashboard  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- Cards: total de alunos, aulas do mês, cobranças pendentes, aniversariantes
- Gráfico de crescimento de alunos
- Filtros por período
- Atualização em tempo real (Supabase realtime)

**Arquivos:**

- `src/pages/teacher/TeacherHome.tsx`
- `src/components/dashboard/MetricCard.tsx`
- `src/components/dashboard/GrowthChart.tsx`
- `src/hooks/useDashboardMetrics.ts`

**Migration:** `15_create_materialized_views.sql` (views otimizadas)

**Testes:** ✅ Unitários em `MetricCard.test.ts`

---

### RF15: Visão Admin Consolidada

**Descrição:** Visão geral consolidada (admin vê todos os professores)

**Módulo:** Admin  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- Dashboard admin com métricas globais
- Lista de todos os professores
- Métricas por professor
- Filtros e busca

**Arquivos:**

- `src/pages/admin/Dashboard.tsx`
- `src/components/admin/AdminMetrics.tsx`
- `src/hooks/useAdminMetrics.ts`

**Migration:** Não requer (usa views existentes)

**Testes:** ✅ Unitários

---

### RF16: Gerenciamento de Usuários

**Descrição:** Gerenciamento de usuários e roles (admin/teacher/student)

**Módulo:** Admin  
**Prioridade:** Alta  
**Sprint:** 2

**Implementação:**

- CRUD de usuários (admin only)
- Atribuição de roles
- Ativação/desativação de contas
- Vinculação com aluno ou professor

**Arquivos:**

- `src/pages/admin/Users.tsx`
- `src/components/users/UserFormDialog.tsx`
- `src/hooks/useUsers.ts`

**Migration:** `01_structure.sql` (tabela `profiles`) — `user_roles` removida na migration 45, role consolidado em `profiles.role`

**Testes:** ✅ Unitários em `useUsers.test.ts`

---

### RF17: Convite por Email

**Descrição:** Convite de usuários por email

**Módulo:** Auth  
**Prioridade:** Alta  
**Sprint:** 3

**Implementação:**

- Admin cria novo usuário via edge function `invite-user`
- Senha gerada automaticamente; exibida em modal (email + senha com toggle de visibilidade)
- Conta criada com `email_confirmed_at` setado — usuário pode logar imediatamente sem confirmação por email
- Envio de email de ativação removido (Sprint 29 — interferia nos testes e gerava dependência de SMTP)

**Arquivos:**

- `supabase/functions/invite-user/invite-user.ts`
- `src/hooks/inviteUserService.ts`
- `src/hooks/useUserInviteMutations.ts`
- `src/components/users/PasswordDisplayDialog.tsx`

**Migration:** Não requer (usa Supabase Auth Admin API)

**Testes:** ✅ Unitários em `useUserMutations.test.tsx`

---

### RF18: Reset de Senha

**Descrição:** Redefinição de senha (self-service e admin)

**Módulo:** Auth  
**Prioridade:** Alta  
**Sprint:** 4

**Implementação:**

- Self-service: usuário solicita reset via email
- Admin: pode resetar senha de qualquer usuário
- Professor: pode resetar senha de aluno vinculado
- Edge function `reset-password`

**Arquivos:**

- `supabase/functions/reset-password/index.ts`
- `src/components/auth/ChangePasswordDialog.tsx`
- `src/hooks/useResetPassword.ts`

**Migration:** Não requer (usa Supabase Auth)

**Nota:** Reset obrigatório no primeiro acesso foi implementado (Sprint 7) e depois removido (Sprint 8) para simplificar onboarding.

**Testes:** ⚠️ Manual (envio de email)

---

### RF19: Portal do Aluno

**Descrição:** Portal do aluno (histórico de aulas, financeiro, atividades)

**Módulo:** Aluno  
**Prioridade:** Alta  
**Sprint:** 3

**Implementação:**

- Dashboard do aluno
- Histórico de aulas
- Cobranças pendentes e pagas
- Atividades pendentes e entregues
- Upload de comprovantes
- Geração de QR Code PIX

**Arquivos:**

- `src/pages/student/StudentHome.tsx`
- `src/pages/student/StudentFinancial.tsx`
- `src/pages/student/StudentActivities.tsx`
- `src/pages/student/StudentHistory.tsx`

**Migration:** Não requer (usa tabelas existentes)

**Testes:** ✅ Unitários

---

### RF20: Anonimização LGPD

**Descrição:** Anonimização de dados pessoais (LGPD)

**Módulo:** LGPD  
**Prioridade:** Alta  
**Sprint:** 7

**Implementação:**

- Hard delete via admin → anonimiza dados pessoais (nome, email, telefone, endereço, cidade, estado, país, data de nascimento)
- Preserva IDs e histórico (class_logs, activities, financial_records) para integridade referencial e auditoria
- Campo `is_deleted = true` + `anonymized_at` marcam o registro como anonimizado
- Nome anonimizado segue padrão `"Aluno XXXXXXXX"` / `"Professor XXXXXXXX"` onde `XXXXXXXX` é sempre alfanumérico (letras hex `a-f` + dígitos) — primeiros 8 chars do UUID com garantia de mix
- Implementado em `useHardDeleteStudent` / `useHardDeleteTeacher` (não funções SQL)

**Arquivos:**

- `src/hooks/useStudents.ts` — `useHardDeleteStudent`
- `src/hooks/useTeachers.ts` — `useHardDeleteTeacher`
- `supabase/migrations/55_fix_anonymized_names_alphanumeric.sql` — backfill de registros existentes

**Migration:** `55_fix_anonymized_names_alphanumeric.sql`

**Testes:** ⚠️ Manual (verificar campos após hard delete)

---

## RF21-RF30: Requisitos Adicionais

### RF21: Soft Delete e Restauração

**Descrição:** Soft delete e restauração de alunos e professores

**Módulo:** Gestão  
**Prioridade:** Alta  
**Sprint:** 3

**Implementação:**

- Alunos: flag `is_deleted` (boolean)
- Professores: timestamp `deleted_at`
- Hook `useRestoreStudent()` para restauração
- Preserva histórico de aulas e cobranças
- Filtros: mostrar/ocultar deletados

**Arquivos:**

- `src/hooks/useStudents.ts` (soft delete + restore)
- `src/hooks/useTeachers.ts` (soft delete + restore)
- `src/components/students/RestoreStudentButton.tsx`

**Migration:** `05_cpf_removal_and_country.sql`

**Testes:** ✅ Unitários

---

### RF22: Hard Delete com Validação

**Descrição:** Hard delete com validação de segurança (admin only)

**Módulo:** Admin  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- Edge function `admin-delete-user`
- Validações: usuário inativo, sem dados vinculados críticos
- Rate limiting: 20 req/min
- Invalidação de sessões antes de deletar
- Logs de auditoria

**Arquivos:**

- `supabase/functions/admin-delete-user/index.ts`
- `src/hooks/useDeleteUser.ts`

**Migration:** Não requer (usa Supabase Auth)

**Testes:** ⚠️ Manual (operação destrutiva)

---

### RF23: Gestão de Faltas

**Descrição:** Gestão de faltas em aulas

**Módulo:** Aulas  
**Prioridade:** Média  
**Sprint:** 6

**Implementação:**

- Campo `attended` (boolean) em `class_logs`
- `attended = false` → falta registrada
- Contabilização em métricas do dashboard
- Filtros por presença/falta
- Relatório de frequência

**Arquivos:**

- `src/pages/teacher/TeacherClasses.tsx`
- `src/components/classes/AttendanceToggle.tsx`
- `src/hooks/useClassLogs.ts`

**Migration:** `01_structure.sql` (campo `attended`)

**Testes:** ✅ Unitários

---

### RF24: Suporte a Estrangeiros

**Descrição:** Suporte a alunos estrangeiros (sem CPF obrigatório)

**Módulo:** Alunos  
**Prioridade:** Alta  
**Sprint:** 6

**Implementação:**

- Campo `country` obrigatório (default: 'BR')
- CPF não obrigatório (removido constraint)
- Telefone aceita formatos internacionais
- Validações adaptadas por país
- Formatação de telefone por país

**Arquivos:**

- `supabase/migrations/05_cpf_removal_and_country.sql`
- `src/lib/utils/format-phone.ts`
- `src/components/students/StudentFormDialog.tsx`

**Migration:** `05_cpf_removal_and_country.sql`

**Testes:** ✅ Unitários em `format-phone.test.ts`

---

### RF25: Upload de Foto de Perfil

**Descrição:** Upload de foto de perfil

**Módulo:** Usuários  
**Prioridade:** Baixa  
**Sprint:** 4

**Implementação:**

- Storage bucket `avatars`
- Upload via componente `AvatarUpload`
- Resize automático (200x200px)
- Fallback para iniciais do nome
- Crop de imagem antes de upload

**Arquivos:**

- `src/components/users/AvatarUpload.tsx`
- `src/hooks/useAvatarUpload.ts`

**Migration:** `04_rls_and_permissions.sql` (storage policy)

**Testes:** ⚠️ Manual (upload de arquivo)

---

### RF26: Histórico Completo

**Descrição:** Histórico completo de aulas e pagamentos

**Módulo:** Aluno  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- View `StudentHistory` (aulas + pagamentos)
- Timeline de transações financeiras
- Filtros por período
- Ordenação cronológica
- Exportação (futuro)

**Arquivos:**

- `src/pages/student/StudentHistory.tsx`
- `src/components/financial/Timeline.tsx`
- `src/hooks/useStudentHistory.ts`

**Migration:** Não requer (usa views existentes)

**Testes:** ✅ Unitários

---

### RF27: API de CEP

**Descrição:** Integração com API de CEP para preenchimento automático

**Módulo:** Alunos  
**Prioridade:** Baixa  
**Sprint:** 1

**Implementação:**

- Integração com API IBGE
- Preenchimento automático: rua, bairro, cidade, estado
- Fallback para input manual se API falhar
- Cache de CEPs consultados (localStorage)
- Debounce de 500ms

**Arquivos:**

- `src/hooks/useCepLookup.ts`
- `src/components/students/AddressFields.tsx`

**Migration:** Não requer (API externa)

**Testes:** ⚠️ Manual (chamada de API)

---

### RF28: Timeline de Transações

**Descrição:** Timeline de transações financeiras

**Módulo:** Financeiro  
**Prioridade:** Média  
**Sprint:** 4

**Implementação:**

- Componente Timeline visual
- Ordenação cronológica reversa
- Ícones por tipo de transação
- Filtros por status e período
- Animações suaves

**Arquivos:**

- `src/components/financial/Timeline.tsx`
- `src/pages/student/StudentFinancial.tsx`
- `src/hooks/useFinancialTimeline.ts`

**Migration:** Não requer (usa tabela `financial_records`)

**Testes:** ✅ Unitários

---

### RF29: Invalidação de Sessões

**Descrição:** Invalidação de sessões ao desativar/deletar conta

**Módulo:** Auth  
**Prioridade:** Alta  
**Sprint:** 7

**Implementação:**

- Trigger ao desativar conta (`profiles.active = false`)
- Trigger ao deletar usuário
- Limpa tokens JWT do Supabase Auth
- Força logout em todos os dispositivos
- Função `invalidate_user_sessions()`

**Arquivos:**

- `supabase/migrations/14_invalidate_sessions_on_deactivate.sql`
- `supabase/functions/admin-delete-user/index.ts`

**Migration:** `14_invalidate_sessions_on_deactivate.sql`

**Testes:** ⚠️ Via migration (executar trigger e verificar sessões)

---

### RF30: Limpeza Automática (LGPD)

**Descrição:** Limpeza automática de dados antigos (LGPD)

**Módulo:** LGPD  
**Prioridade:** Média  
**Sprint:** 9

**Implementação:**

- Edge function `cleanup-old-records` (registros soft-deleted há 90+ dias)
- Edge function `cleanup-storage` (arquivos órfãos)
- Execução via cron (semanal)
- Logs de auditoria
- Notificação ao admin (futuro)

**Arquivos:**

- `supabase/functions/cleanup-old-records/index.ts`
- `supabase/functions/cleanup-storage/index.ts`

**Migration:** Não requer (Edge Functions)

**Testes:** ⚠️ Manual (executar functions e verificar resultado)

---

## RF31-RF35: Futuros e Adicionais

### RF31: Sistema de Notificações _(Trabalho Futuro)_

**Descrição:** Notificações por email, push e in-app  
**Módulo:** Notificações | **Prioridade:** Média | **Status:** Trabalho futuro — fora do escopo do TCC

---

### RF32: Exportação de Relatórios em PDF _(Trabalho Futuro)_

**Descrição:** Geração de relatórios financeiros e pedagógicos em PDF  
**Módulo:** Relatórios | **Prioridade:** Média | **Status:** Trabalho futuro — fora do escopo do TCC

---

### RF33: Integração com Google Calendar _(Trabalho Futuro)_

**Descrição:** Sincronização de aulas com Google Calendar  
**Módulo:** Integrações | **Prioridade:** Baixa | **Status:** Trabalho futuro — fora do escopo do TCC

---

### RF34: Gateway de Pagamento Real — AbacatePay ✅

**Descrição:** Pagamento automático via PIX com confirmação por webhook

**Módulo:** Financeiro  
**Prioridade:** Média  
**Sprint:** 30

**Implementação:**

- Aluno acessa `/student/checkout/:recordId` e vê QR Code PIX gerado via AbacatePay
- Webhook `billing.paid` / `pixQrCode.paid` confirma pagamento automaticamente → status `pago`
- Professor configura chave AbacatePay em Configurações → Pagamentos
- Reembolso automático via API (`refund-abacate-payment`) para `payment_provider = 'abacate_pay'`
- Campo `payment_provider` distingue fluxo manual (legado) do automatizado

**Arquivos:**

- `supabase/functions/create-abacate-payment/index.ts`
- `supabase/functions/refund-abacate-payment/index.ts`
- `supabase/functions/abacate-webhook/index.ts`
- `src/pages/student/StudentCheckout.tsx`

**Migration:** Migration de AbacatePay (Sprint 30)

**Testes:** ⚠️ Manual

---

### RF35: Sistema de Gamificação _(Trabalho Futuro)_

**Descrição:** Badges e conquistas para engajamento de alunos  
**Módulo:** Gamificação | **Prioridade:** Baixa | **Status:** Trabalho futuro — fora do escopo do TCC

---

## Resumo Quantitativo

### Por Módulo

| Módulo      | Requisitos | IDs                                              |
| ----------- | ---------- | ------------------------------------------------ |
| Alunos      | 5          | RF01, RF24, RF27, RF21 (parcial), RF26 (parcial) |
| Professores | 1          | RF02                                             |
| Aulas       | 4          | RF03, RF04, RF05, RF23                           |
| Financeiro  | 6          | RF06, RF07, RF08, RF09, RF10, RF28               |
| Atividades  | 3          | RF11, RF12, RF13                                 |
| Dashboard   | 2          | RF14, RF15                                       |
| Admin       | 2          | RF16, RF22                                       |
| Auth        | 3          | RF17, RF18, RF29                                 |
| Aluno       | 2          | RF19, RF26                                       |
| LGPD        | 2          | RF20, RF30                                       |
| Usuários    | 1          | RF25                                             |
| Gestão      | 1          | RF21                                             |

### Por Prioridade

| Prioridade | Quantidade |
| ---------- | ---------- |
| Alta       | 18         |
| Média      | 10         |
| Baixa      | 2          |

### Por Sprint

| Sprint    | Requisitos                                     |
| --------- | ---------------------------------------------- |
| Sprint 1  | RF01, RF03, RF05, RF06, RF07, RF27             |
| Sprint 2  | RF01, RF02, RF16                               |
| Sprint 3  | RF17, RF19, RF21                               |
| Sprint 4  | RF08, RF09, RF14, RF18, RF22, RF25, RF26, RF28 |
| Sprint 5  | RF04, RF10, RF11, RF12, RF13                   |
| Sprint 6  | RF23, RF24                                     |
| Sprint 7  | RF20, RF29                                     |
| Sprint 9  | RF30                                           |
| Sprint 30 | RF34                                           |

### Por Status de Teste

| Status           | Quantidade |
| ---------------- | ---------- |
| ✅ Unitários     | 20         |
| ⚠️ Manual        | 8          |
| ⚠️ Via migration | 2          |

---

## Mapeamento: Requisitos → Código

| Requisito | Arquivo Principal                  | Migration                            | Teste            |
| --------- | ---------------------------------- | ------------------------------------ | ---------------- |
| RF01      | `TeacherStudents.tsx`              | `01_structure.sql`                   | ✅               |
| RF02      | `Teachers.tsx`                     | `01_structure.sql`                   | ✅               |
| RF03      | `TeacherClasses.tsx`               | `01_structure.sql`                   | ✅               |
| RF04      | `ClassPackageDialog.tsx`           | `03_rpcs_and_triggers.sql`           | ✅               |
| RF05      | `ClassEvaluationDialog.tsx`        | `01_structure.sql`                   | ✅               |
| RF06      | `FinancialRecordFormDialog.tsx`    | `01_structure.sql`                   | ✅               |
| RF07      | `FinancialStatusBadge.tsx`         | `01_structure.sql`                   | ✅               |
| RF08      | `PaymentProofUpload.tsx`           | `01_structure.sql`                   | ⚠️ Manual        |
| RF09      | `PaymentProofReview.tsx`           | `16_fix_payment_proof_rejection.sql` | ⚠️ Manual        |
| RF10      | `QRCodePix.tsx`                    | —                                    | ⚠️ Manual        |
| RF11      | `TeacherActivities.tsx`            | `01_structure.sql`                   | ✅               |
| RF12      | `StudentActivities.tsx`            | `01_structure.sql`                   | ⚠️ Manual        |
| RF13      | `ActivityCorrectionDialog.tsx`     | `10_security_improvements.sql`       | ✅               |
| RF14      | `TeacherHome.tsx`                  | `15_create_materialized_views.sql`   | ✅               |
| RF15      | `Dashboard.tsx` (admin)            | —                                    | ✅               |
| RF16      | `Users.tsx`                        | `01_structure.sql`                   | ✅               |
| RF17      | `invite-user/index.ts`             | —                                    | ⚠️ Manual        |
| RF18      | `reset-password/index.ts`          | —                                    | ⚠️ Manual        |
| RF19      | `student/*.tsx`                    | —                                    | ✅               |
| RF20      | —                                  | `02_logic_and_views.sql`             | ⚠️ Via migration |
| RF21      | `useStudents.ts`, `useTeachers.ts` | `05_cpf_removal.sql`                 | ✅               |
| RF22      | `admin-delete-user/index.ts`       | —                                    | ⚠️ Manual        |
| RF23      | `TeacherClasses.tsx`               | `01_structure.sql`                   | ✅               |
| RF24      | `format-phone.ts`                  | `05_cpf_removal.sql`                 | ✅               |
| RF25      | `AvatarUpload.tsx`                 | `04_rls_and_permissions.sql`         | ⚠️ Manual        |
| RF26      | `StudentHistory.tsx`               | —                                    | ✅               |
| RF27      | `useCepLookup.ts`                  | —                                    | ⚠️ Manual        |
| RF28      | `Timeline.tsx`                     | —                                    | ✅               |
| RF29      | —                                  | `14_invalidate_sessions.sql`         | ⚠️ Via migration |
| RF30      | `cleanup-*/index.ts`               | —                                    | ⚠️ Manual        |
| RF34      | `StudentCheckout.tsx`, `abacate-*` | migration AbacatePay (Sprint 30)     | ⚠️ Manual        |

---

## Referências

- **Cap4:** `docs/tcc-8-periodo/projeto-escrito/capitulos-guia/cap4-requisitos.md` (seções 4.2.1-4.2.3)
- **Sprints:** `docs/sprints/sprint-01-*.md` até `sprint-31-*.md`
- **Código:** `src/`, `supabase/migrations/`, `supabase/functions/`
- **Testes:** `src/**/*.test.ts`
