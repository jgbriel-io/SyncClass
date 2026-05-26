> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo detalha os 35 requisitos funcionais (30
implementados), 36 requisitos não funcionais (100% implementados), 59 regras de
negócio, casos de uso principais e matriz de rastreabilidade.
Documenta-se o escopo completo do MVP e requisitos futuros planejados.

## 4.1 Público-Alvo

| **Perfil**         | **Descrição**                                                |
| ------------------ | ------------------------------------------------------------ |
| Professor autônomo | Gerencia seus próprios alunos, aulas, cobranças e atividades |
| Aluno              | Acessa seu histórico, paga cobranças e entrega atividades    |
| Administrador      | Visão global da plataforma, gerencia professores e usuários  |

## 4.2 Requisitos Funcionais

### 4.2.1 Requisitos Principais (Implementados)

| **ID** | **Requisito**                                                               | **Módulo**  | **Prioridade** | **Sprint** |
| ------ | --------------------------------------------------------------------------- | ----------- | -------------- | ---------- |
| RF01   | Cadastro e gerenciamento de alunos (CRUD)                                   | Alunos      | Alta           | 1-2        |
| RF02   | Cadastro e gerenciamento de professores (CRUD)                              | Professores | Alta           | 1-2        |
| RF03   | Registro de aulas com data, horário, duração e presença                     | Aulas       | Alta           | 1          |
| RF04   | Criação de pacotes de aulas com cobrança vinculada                          | Aulas       | Alta           | 5          |
| RF05   | Avaliação pós-aula (nota, feedback, observações)                            | Aulas       | Média          | 1          |
| RF06   | Geração de cobranças individuais e por pacote                               | Financeiro  | Alta           | 1          |
| RF07   | Controle de status de pagamento (pendente/pago/cancelado/abonado/extornado) | Financeiro  | Alta           | 1          |
| RF08   | Upload de comprovante de pagamento pelo aluno                               | Financeiro  | Média          | 4          |
| RF09   | Aprovação/rejeição de comprovante pelo professor                            | Financeiro  | Média          | 4          |
| RF10   | Pagamento via PIX com QR Code                                               | Financeiro  | Média          | 5          |
| RF11   | Criação e atribuição de atividades para alunos                              | Atividades  | Alta           | 5          |
| RF12   | Entrega de atividades com arquivo pelo aluno                                | Atividades  | Alta           | 5          |
| RF13   | Correção de atividades com nota e feedback                                  | Atividades  | Alta           | 5          |
| RF14   | Dashboard com métricas (alunos, aulas, cobranças, aniversários)             | Dashboard   | Média          | 4          |
| RF15   | Visão geral consolidada (admin vê todos os professores)                     | Admin       | Média          | 4          |
| RF16   | Gerenciamento de usuários e _roles_ (admin/teacher/student)                 | Admin       | Alta           | 2          |
| RF17   | Convite de usuários por e-mail                                              | Auth        | Alta           | 3          |
| RF18   | Redefinição de senha (self-service e admin)                                 | Auth        | Alta           | 4          |
| RF19   | Portal do aluno (histórico de aulas, financeiro, atividades)                | Aluno       | Alta           | 3          |
| RF20   | Anonimização de dados pessoais (LGPD)                                       | LGPD        | Alta           | 7          |

> **Nota sobre RF18:** Implementado inicialmente com troca obrigatória no
> primeiro acesso (Sprint 7), mas removido em Sprint 8 para simplificar
> onboarding. Mantido apenas reset self-service e por admin.

### 4.2.2 Requisitos Adicionais (Implementados)

| **ID** | **Requisito**                                           | **Módulo** | **Prioridade** | **Sprint** |
| ------ | ------------------------------------------------------- | ---------- | -------------- | ---------- |
| RF21   | Soft delete e restauração de alunos e professores       | Gestão     | Alta           | 3          |
| RF22   | Hard delete com validação de segurança (admin)          | Admin      | Média          | 4          |
| RF23   | Gestão de faltas em aulas                               | Aulas      | Média          | 6          |
| RF24   | Suporte a alunos estrangeiros (sem CPF obrigatório)     | Alunos     | Alta           | 6          |
| RF25   | Upload de foto de perfil                                | Usuários   | Baixa          | 4          |
| RF26   | Histórico completo de aulas e pagamentos                | Aluno      | Média          | 4          |
| RF27   | Integração com API de CEP para preenchimento automático | Alunos     | Baixa          | 1          |
| RF28   | Timeline de transações financeiras                      | Financeiro | Média          | 4          |
| RF29   | Invalidação de sessões ao desativar/deletar conta       | Auth       | Alta           | 7          |
| RF30   | Limpeza automática de dados antigos (LGPD)              | LGPD       | Média          | 9          |

### 4.2.3 Requisitos Futuros (Não Implementados)

| **ID** | **Requisito**                                   | **Módulo**   | **Prioridade** | **Status**            |
| ------ | ----------------------------------------------- | ------------ | -------------- | --------------------- |
| RF31   | Sistema de notificações (email, push, in-app)   | Notificações | Média          | Planejado (Sprint 14) |
| RF32   | Exportação de relatórios em PDF                 | Relatórios   | Média          | Planejado (Sprint 15) |
| RF33   | Integração com Google Calendar                  | Integrações  | Baixa          | Planejado (Sprint 16) |
| RF34   | Gateway de pagamento real (Stripe/Mercado Pago) | Financeiro   | Média          | Planejado (Sprint 17) |
| RF35   | Sistema de gamificação (badges, conquistas)     | Gamificação  | Baixa          | Planejado (Sprint 18) |

> 🖼️ **Figura:** Tabela RF formatada para impressão

## 4.3 Requisitos Não Funcionais

### 4.3.1 Requisitos Principais (Implementados)

| **ID** | **Requisito**                                         | **Categoria**   | **Prioridade** | **Sprint** |
| ------ | ----------------------------------------------------- | --------------- | -------------- | ---------- |
| RNF01  | Isolamento de dados por professor (RLS no PostgreSQL) | Segurança       | Alta           | 1-7        |
| RNF02  | Autenticação via Supabase Auth (JWT)                  | Segurança       | Alta           | 1          |
| RNF03  | Conformidade com LGPD (anonimização, _soft delete_)   | Legal           | Alta           | 3,7        |
| RNF04  | Idempotência em operações financeiras críticas        | Confiabilidade  | Alta           | 6          |
| RNF05  | _Rate limiting_ em operações sensíveis                | Segurança       | Média          | 7          |
| RNF06  | Tempo de resposta < 2s para listagens paginadas       | Performance     | Média          | 3,5        |
| RNF07  | PWA instalável (_offline-ready_)                      | Usabilidade     | Baixa          | 3          |
| RNF08  | Interface responsiva (_mobile-first_)                 | Usabilidade     | Alta           | 5          |
| RNF09  | Logs de auditoria para todas as operações críticas    | Rastreabilidade | Média          | 7          |
| RNF10  | Logging de erros via `logger.ts` (dev) + `audit_logs` | Observabilidade | Média          | 3          |

### 4.3.2 Segurança Avançada (Implementados)

| **ID** | **Requisito**                                  | **Categoria** | **Prioridade** | **Sprint** |
| ------ | ---------------------------------------------- | ------------- | -------------- | ---------- |
| RNF11  | Sanitização de inputs contra XSS (DOMPurify)   | Segurança     | Alta           | 5          |
| RNF12  | Validação de email com whitelist de provedores | Segurança     | Média          | 4          |
| RNF13  | Encriptação de dados sensíveis (PIX keys)      | Segurança     | Alta           | 7          |
| RNF14  | Search path security em funções SQL            | Segurança     | Alta           | 7          |
| RNF15  | Invalidação automática de sessões              | Segurança     | Alta           | 7          |
| RNF16  | SECURITY DEFINER em funções críticas           | Segurança     | Alta           | 7          |

### 4.3.3 Performance e Otimização (Implementados)

| **ID** | **Requisito**                                          | **Categoria** | **Prioridade** | **Sprint** |
| ------ | ------------------------------------------------------ | ------------- | -------------- | ---------- |
| RNF17  | Índices compostos para queries frequentes              | Performance   | Alta           | 3          |
| RNF18  | Materialized views para dashboards                     | Performance   | Média          | 7          |
| RNF19  | Paginação obrigatória em listagens grandes             | Performance   | Alta           | 5          |
| RNF20  | Code splitting e lazy loading por rota                 | Performance   | Média          | 1          |
| RNF21  | Query optimization (select apenas colunas necessárias) | Performance   | Média          | Contínuo   |

### 4.3.4 Usabilidade e Design (Implementados)

| **ID** | **Requisito**                                    | **Categoria** | **Prioridade** | **Sprint** |
| ------ | ------------------------------------------------ | ------------- | -------------- | ---------- |
| RNF22  | Design tokens centralizados (129 testes)         | Usabilidade   | Média          | 5          |
| RNF23  | Skeleton screens para estados de loading         | Usabilidade   | Média          | 3          |
| RNF24  | Empty states personalizados por módulo           | Usabilidade   | Baixa          | 3          |
| RNF25  | Formatters centralizados (currency, date, phone) | Usabilidade   | Média          | 3          |
| RNF26  | Sistema de toasts para feedback visual           | Usabilidade   | Média          | 2          |
| RNF27  | Dialogs padronizados e acessíveis                | Usabilidade   | Baixa          | 2          |

### 4.3.5 Rastreabilidade e Observabilidade (Implementados)

| **ID** | **Requisito**                               | **Categoria**   | **Prioridade** | **Sprint** |
| ------ | ------------------------------------------- | --------------- | -------------- | ---------- |
| RNF28  | Audit logs automáticos via triggers         | Rastreabilidade | Alta           | 7          |
| RNF29  | Performance logs para queries lentas        | Observabilidade | Baixa          | 7          |
| RNF30  | Histórico completo de operações financeiras | Rastreabilidade | Média          | 4          |
| RNF31  | Rastreamento de quem confirmou pagamentos   | Rastreabilidade | Média          | 1          |
| RNF32  | Logs estruturados para análise              | Observabilidade | Baixa          | Contínuo   |

### 4.3.6 Manutenção e Operações (Implementados)

| **ID** | **Requisito**                             | **Categoria** | **Prioridade** | **Sprint** |
| ------ | ----------------------------------------- | ------------- | -------------- | ---------- |
| RNF33  | Cleanup automático de registros antigos   | Manutenção    | Média          | 9          |
| RNF34  | Cleanup automático de arquivos órfãos     | Manutenção    | Média          | 9          |
| RNF35  | Migrations versionadas e rastreáveis      | Manutenção    | Alta           | 1-9        |
| RNF36  | Edge Functions para operações assíncronas | Arquitetura   | Média          | 3-9        |

> 🖼️ **Figura:** Tabela RNF formatada para impressão

## 4.4 Regras de Negócio

As regras de negócio definem as políticas, restrições e validações que governam
o comportamento do sistema.
Estas regras são implementadas através de constraints no banco de dados,
validações no frontend e lógica em RPCs.

### 4.4.1 Usuários e Autenticação

| ID     | Regra                                           | Implementação                                     |
| ------ | ----------------------------------------------- | ------------------------------------------------- |
| RN-001 | Sistema possui 3 roles: admin, teacher, student | `CHECK (role IN ('admin', 'teacher', 'student'))` |
| RN-002 | Cada usuário tem exatamente 1 profile           | FK `profiles.user_id → auth.users.id`             |
| RN-003 | Email único na plataforma                       | Validado pelo Supabase Auth                       |
| RN-004 | Telefone único na plataforma                    | `check_phone_exists_platform()`                   |
| RN-005 | Deletar usuário invalida todas as sessões       | Trigger `invalidate_sessions_before_delete`       |
| RN-006 | Desativar conta invalida todas as sessões       | Trigger em `profiles.active`                      |

### 4.4.2 Professores

| ID     | Regra                                     | Implementação                            |
| ------ | ----------------------------------------- | ---------------------------------------- |
| RN-007 | Status: ativo ou inativo                  | `CHECK (status IN ('ativo', 'inativo'))` |
| RN-008 | Nome, email, telefone e país obrigatórios | `NOT NULL` constraints                   |
| RN-009 | PIX key visível apenas para admin         | View `teachers_with_pix_restricted`      |
| RN-010 | Soft delete preserva histórico            | `deleted_at TIMESTAMPTZ`                 |
| RN-011 | Anonimização remove dados pessoais        | `anonymize_teacher_data()`               |

### 4.4.3 Alunos

| ID     | Regra                                       | Implementação                            |
| ------ | ------------------------------------------- | ---------------------------------------- |
| RN-012 | Aluno vinculado a exatamente 1 professor    | `teacher_id NOT NULL`                    |
| RN-013 | Dia de pagamento entre 1 e 31               | `CHECK (pay_day >= 1 AND pay_day <= 31)` |
| RN-014 | Valor hora-aula pode diferir do professor   | Campo `hourly_rate` em students          |
| RN-015 | Soft delete preserva histórico              | `is_deleted BOOLEAN`                     |
| RN-016 | CPF não obrigatório (suporte internacional) | Campo `country`, CPF opcional            |

### 4.4.4 Aulas

| ID     | Regra                                           | Implementação                     |
| ------ | ----------------------------------------------- | --------------------------------- |
| RN-017 | Aluno, professor, data e horários obrigatórios  | `NOT NULL` constraints            |
| RN-018 | Horário fim > horário início                    | `CHECK (end_at > start_at)`       |
| RN-019 | Professor não pode ter 2 aulas no mesmo horário | Trigger `trg_check_class_overlap` |
| RN-020 | Falta registrada quando `attended = false`      | Campo boolean `attended`          |
| RN-021 | Avaliação opcional (nota 1-5, feedback)         | Campos nullable                   |
| RN-022 | Pacote cria múltiplas aulas + 1 cobrança        | RPC `create_class_package`        |

### 4.4.5 Financeiro

| ID     | Regra                                             | Implementação                           |
| ------ | ------------------------------------------------- | --------------------------------------- |
| RN-023 | Status: pendente/pago/cancelado/abonado/extornado | `CHECK (status IN (...))`               |
| RN-024 | Valor não pode ser negativo                       | `CHECK (amount >= 0)`                   |
| RN-025 | Vencimento calculado por `pay_day` do aluno       | Lógica no frontend                      |
| RN-026 | Comprovante: pending/approved/rejected            | `CHECK (payment_proof_status IN (...))` |
| RN-027 | Apenas professor/admin confirma pagamento         | RLS policy                              |
| RN-028 | Operações financeiras são idempotentes            | Tabela `idempotency_keys`               |
| RN-029 | QR Code PIX contém chave do professor             | Gerado no frontend                      |
| RN-030 | Todas operações financeiras são auditadas         | Trigger em `financial_records`          |

### 4.4.6 Atividades

| ID     | Regra                                                | Implementação                         |
| ------ | ---------------------------------------------------- | ------------------------------------- |
| RN-031 | Status: pendente/enviada/entregue/corrigida/atrasada | `CHECK (status IN (...))`             |
| RN-032 | Atividade sem entrega após prazo → atrasada          | Lógica no frontend                    |
| RN-033 | Entrega registra timestamp                           | `delivery_date TIMESTAMPTZ`           |
| RN-034 | Nota entre 0 e 100                                   | `CHECK (grade >= 0 AND grade <= 100)` |
| RN-035 | Atividade vinculada a exatamente 1 aluno             | `student_id NOT NULL`                 |

### 4.4.7 Segurança e Permissões

| ID     | Regra                                      | Implementação                               |
| ------ | ------------------------------------------ | ------------------------------------------- |
| RN-036 | RLS habilitado em todas as tabelas         | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| RN-037 | Professor só acessa seus próprios alunos   | RLS policies com filtro `teacher_id`        |
| RN-038 | `is_admin()` deve ter SECURITY DEFINER     | Previne recursão infinita                   |
| RN-039 | Funções SQL devem ter search_path seguro   | `SET search_path = public, pg_temp`         |
| RN-040 | Operações sensíveis têm rate limit         | `check_rate_limit()`                        |
| RN-041 | Email validado com whitelist de provedores | `is_valid_email()`                          |
| RN-042 | Inputs sanitizados contra XSS              | DOMPurify no frontend                       |

### 4.4.8 LGPD e Privacidade

| ID     | Regra                                          | Implementação                       |
| ------ | ---------------------------------------------- | ----------------------------------- |
| RN-043 | Dados nunca deletados permanentemente (padrão) | Soft delete em todas as tabelas     |
| RN-044 | Usuário pode solicitar anonimização            | Funções `anonymize_*_data()`        |
| RN-045 | Operações críticas são logadas                 | Tabela `audit_logs`                 |
| RN-046 | Dados antigos são removidos periodicamente     | Edge function `cleanup-old-records` |
| RN-047 | Arquivos órfãos são removidos                  | Edge function `cleanup-storage`     |

### 4.4.9 Performance

| ID     | Regra                                        | Implementação                                 |
| ------ | -------------------------------------------- | --------------------------------------------- |
| RN-048 | Índices em todas as FKs usadas em WHERE/JOIN | Índices compostos                             |
| RN-049 | Listagens grandes devem usar paginação       | `.range(start, end)`                          |
| RN-050 | Queries pesadas usam materialized views      | `activities_dashboard`, `financial_dashboard` |
| RN-051 | Rate limit: 10 req/min (padrão)              | Configurável por operação                     |

### 4.4.10 Validação Frontend

| ID     | Regra                                | Implementação                    |
| ------ | ------------------------------------ | -------------------------------- |
| RN-052 | Formulários validados com Zod        | Schemas em `src/lib/validation/` |
| RN-053 | Telefone com máscara (XX) XXXXX-XXXX | `format-phone.ts`                |
| RN-054 | Valores com máscara R$ X.XXX,XX      | `formatters.ts`                  |
| RN-055 | Erros em português próximos ao campo | `src/content/`                   |

### 4.4.11 UI/UX

| ID     | Regra                                   | Implementação                   |
| ------ | --------------------------------------- | ------------------------------- |
| RN-056 | Estados de loading com skeleton screens | Componentes `*Skeleton.tsx`     |
| RN-057 | Empty states personalizados por módulo  | Componente `EmptyState.tsx`     |
| RN-058 | Confirmação de ações destrutivas        | Dialogs de confirmação em CRUDs |
| RN-059 | Responsividade mobile-first             | Breakpoints Tailwind            |

> **Nota:** Documentação completa de todas as 59 regras de negócio disponível em
> `docs/archive/regras-de-negocio/regras-de-negocio.md`

## 4.5 Casos de Uso

### 4.5.1 Atores

- **Admin:** Acesso total ao sistema.
- **Professor:** Acesso aos seus próprios dados.
- **Aluno:** Acesso somente leitura + entrega de atividades e pagamentos.

### 4.5.2 Casos de Uso Principais

**Professor:**

- UC01: Cadastrar aluno
- UC02: Registrar aula
- UC03: Criar pacote de aulas
- UC04: Avaliar aula (nota + feedback)
- UC05: Criar cobrança
- UC06: Confirmar pagamento
- UC07: Criar atividade
- UC08: Corrigir atividade entregue
- UC09: Convidar aluno para o portal
- UC10: Arquivar/restaurar aluno
- UC11: Resetar senha de aluno vinculado
- UC12: Registrar falta em aula
- UC13: Aprovar/rejeitar comprovante de pagamento

**Aluno:**

- UC14: Visualizar histórico de aulas
- UC15: Visualizar cobranças pendentes
- UC16: Enviar comprovante de pagamento
- UC17: Visualizar e entregar atividades
- UC18: Gerar QR Code PIX para pagamento
- UC19: Visualizar timeline de transações
- UC20: Resetar própria senha

**Admin:**

- UC21: Gerenciar professores
- UC22: Gerenciar usuários e _roles_
- UC23: Visualizar visão geral consolidada
- UC24: Hard delete de usuários inativos
- UC25: Acessar dados financeiros de todos os professores
- UC26: Visualizar logs de auditoria

> 🖼️ **Figura:** Diagrama de Casos de Uso (UML)

### 4.5.3 Fluxos Principais

#### Fluxo 1: Criação de Pacote de Aulas

1. Professor acessa módulo de Aulas
2. Clica em "Criar Pacote"
3. Seleciona aluno
4. Define quantidade de aulas e datas
5. Sistema calcula valor total baseado em `hourly_rate`
6. Professor confirma criação
7. Sistema cria N registros em `class_logs`
8. Sistema cria 1 registro em `financial_records` vinculado às aulas
9. Sistema vincula aulas e cobrança via `financial_record_class_logs`
10. Aluno recebe notificação (futuro)

**Regras de Negócio:** RN-022, RN-023, RN-024, RN-025

#### Fluxo 2: Pagamento com Comprovante

1. Aluno acessa módulo Financeiro
2. Visualiza cobrança pendente
3. Clica em "Enviar Comprovante"
4. Faz upload de imagem/PDF
5. Sistema armazena em bucket `payment-proofs`
6. Status do comprovante → `pending`
7. Professor recebe notificação (futuro)
8. Professor acessa cobrança
9. Visualiza comprovante
10. Aprova ou rejeita (com motivo se rejeitar)
11. Se aprovado: status cobrança → `pago`, `paid_at` → NOW()
12. Se rejeitado: aluno pode reenviar

**Regras de Negócio:** RN-026, RN-027

#### Fluxo 3: Entrega e Correção de Atividade

1. Professor cria atividade com prazo
2. Sistema notifica aluno (futuro)
3. Aluno acessa módulo Atividades
4. Visualiza atividade pendente
5. Faz upload de arquivo
6. Status → `entregue`, `delivery_date` → NOW()
7. Professor acessa atividade entregue
8. Baixa arquivo do aluno
9. Adiciona nota (0-100) e feedback
10. Status → `corrigida`
11. Aluno visualiza correção

**Regras de Negócio:** RN-031, RN-032, RN-033, RN-034

## 4.6 Matriz de Rastreabilidade

### Requisitos → Implementação

| Requisito | Arquivo Principal           | Migration                    | Teste                      |
| --------- | --------------------------- | ---------------------------- | -------------------------- |
| RF01      | `TeacherStudents.tsx`       | `01_structure.sql`           | ✅                         |
| RF02      | `Teachers.tsx`              | `01_structure.sql`           | ✅                         |
| RF03      | `TeacherClasses.tsx`        | `01_structure.sql`           | ✅                         |
| RF04      | `create_class_package` RPC  | `03_rpcs_and_triggers.sql`   | ✅                         |
| RF06      | `useFinancialRecords.ts`    | `01_structure.sql`           | ✅                         |
| RF10      | `QRCodePix.tsx`             | —                            | ⚠️ Manual                  |
| RF11-13   | `TeacherActivities.tsx`     | `01_structure.sql`           | ✅                         |
| RF17      | `invite-user` Edge Function | —                            | ⚠️ Manual                  |
| RF20      | `anonymize_*_data()`        | `02_logic_and_views.sql`     | ⚠️ Via migration           |
| RF21      | `useSoftDeleteStudent()`    | `05_cpf_removal.sql`         | ✅                         |
| RF29      | `invalidate_sessions_*`     | `14_invalidate_sessions.sql` | ⚠️ Via migration           |
| RNF01     | RLS Policies                | `04_rls_and_permissions.sql` | ✅ `errorMessages.test.ts` |
| RNF04     | `idempotency_keys`          | `01_structure.sql`           | ✅                         |
| RNF05     | `check_rate_limit()`        | `07_add_rate_limiting.sql`   | ✅ `rateLimit.test.ts`     |
| RNF11     | `errorHandler.ts`           | —                            | ✅ `errorMessages.test.ts` |
| RNF17     | Índices compostos           | `01_structure.sql`           | — N/A                      |
| RNF22     | `design-tokens/`            | —                            | ✅ (129 testes)            |

**Legenda:**

- ✅ Testado (testes unitários automatizados)
- ⚠️ Manual — Validado manualmente (Edge Functions, QR Code)
- ⚠️ Via migration — Testado através de migrations SQL
- — N/A — Não aplicável (infraestrutura, não requer teste unitário)

## 4.7 Resumo Quantitativo

### Requisitos Funcionais

- **Principais (RF01-RF20):** 20 requisitos → 100% implementados
- **Adicionais (RF21-RF30):** 10 requisitos → 100% implementados
- **Futuros (RF31-RF35):** 5 requisitos → 0% implementados
- **Total:** 35 requisitos (30 implementados, 5 planejados)

### Requisitos Não Funcionais

- **Principais (RNF01-RNF10):** 10 requisitos → 100% implementados
- **Segurança (RNF11-RNF16):** 6 requisitos → 100% implementados
- **Performance (RNF17-RNF21):** 5 requisitos → 100% implementados
- **Usabilidade (RNF22-RNF27):** 6 requisitos → 100% implementados
- **Rastreabilidade (RNF28-RNF32):** 5 requisitos → 100% implementados
- **Manutenção (RNF33-RNF36):** 4 requisitos → 100% implementados
- **Total:** 36 requisitos → 100% implementados

### Regras de Negócio

- **Total:** 59 regras implementadas

### Cobertura Geral

- **Requisitos documentados:** 66 (35 RF + 31 RNF)
- **Requisitos implementados:** 66 (30 RF + 36 RNF)
- **Taxa de implementação:** 100% dos requisitos documentados
- **Cobertura de testes:** ~75% (testes unitários automatizados)

---

## Assets Necessários

- [ ] 🖼️ Figura: Tabela RF/RNF formatada
- [ ] 🖼️ Figura: Diagrama de Casos de Uso (UML) — gerar no draw.io ou Lucidchart
- [ ] 🖼️ Figura: Diagrama de Regras de Negócio por módulo
- [ ] 🖼️ Figura: Matriz de Rastreabilidade visual

---

## Referências cruzadas

- **Requisitos Detalhados:** Ver [docs/archive/requisitos/](../archive/requisitos/)
  para RF01-RF30 e RNF01-RNF36 expandidos
- **Regras de Negócio:** Ver
  [docs/archive/regras-de-negocio/regras-de-negocio.md](../archive/regras-de-negocio/regras-de-negocio.md)
  para todas as 59 regras
- **Implementação:** Ver [Cap. 6 — Desenvolvimento](./cap6-desenvolvimento.md)
  para detalhes técnicos da implementação
- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md)
  para como requisitos foram implementados
- **Database:** Ver [docs/database/schema.md](../database/schema.md) para
  constraints e validações de RNs
- **Security:** Ver [docs/security/overview.md](../security/overview.md) para
  implementação de RNF01-RNF16
- **Testes:** Ver [Cap. 7 — Qualidade e Testes](./cap7-qualidade.md) para
  cobertura de testes dos requisitos
