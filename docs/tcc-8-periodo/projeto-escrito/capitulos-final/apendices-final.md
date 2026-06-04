# APÊNDICES

Os apêndices reúnem o material detalhado de requisitos, modelagem e rastreabilidade do SyncClass, produzido pelo autor. O corpo do trabalho apresenta a síntese e remete a estes apêndices para as tabelas completas.

---

## APÊNDICE A — Formulário de Avaliação Exploratória

> **[PLACEHOLDER — pendente de execução]**
>
> A avaliação exploratória de satisfação e impacto será conduzida com
> professores e alunos voluntários, utilizando o instrumento descrito a
> seguir. O formulário ainda não foi aplicado; os resultados serão
> incorporados quando a coleta for executada.
>
> **Nota de consentimento (a constar no cabeçalho do formulário):**
> "Ao responder, você concorda que os dados anonimizados serão utilizados em
> pesquisa acadêmica."

### A.1 Perfil do Respondente

| Campo                                | Tipo                                              |
| ------------------------------------ | ------------------------------------------------- |
| Perfil de uso                        | Professor autônomo / Aluno                        |
| Tempo de uso da plataforma           | Menos de 1 semana / 1 a 4 semanas / Mais de 1 mês |
| Ferramentas utilizadas anteriormente | Campo aberto                                      |

### A.2 Bloco de Avaliação (escala Likert de 1 a 5)

> **[PLACEHOLDER — itens sujeitos a refinamento antes da aplicação]**

| Item | Dimensão avaliada                                                       |
| ---- | ----------------------------------------------------------------------- |
| 1    | Facilidade de cadastro de alunos e aulas                                |
| 2    | Clareza da visualização financeira (cobranças e status)                 |
| 3    | Utilidade do fluxo de atividades (criação, entrega, correção)           |
| 4    | Percepção de redução de tarefas manuais em relação ao processo anterior |
| 5    | Confiança na privacidade e na segurança dos dados                       |
| 6    | Satisfação geral com a plataforma                                       |

### A.3 Questões Abertas

> **[PLACEHOLDER]**

- Quais tarefas manuais a plataforma eliminou ou reduziu no seu dia a dia?
- Que funcionalidade ausente faria mais diferença para você?
- Algum problema ou dificuldade encontrada durante o uso?

---

---

## APÊNDICE B — Requisitos Funcionais

Os requisitos funcionais descrevem as funcionalidades que o sistema oferece aos
seus usuários. Trinta requisitos funcionais foram implementados ao longo
das iterações de desenvolvimento, divididos em requisitos principais
(RF01 a RF20) e requisitos adicionais (RF21 a RF31, à exceção do RF27). Sete
requisitos foram identificados como desejáveis, porém mantidos fora do escopo do
MVP e registrados como trabalhos futuros (RF27 e RF32 a RF37).

### B.1 Requisitos Funcionais Implementados

Os 30 requisitos funcionais implementados (20 principais e 10 adicionais, com lacuna no RF27, transferido para os trabalhos futuros) constam da Tabela B.1.

**Tabela B.1 — Requisitos funcionais implementados (RF01 a RF31, exceto RF27)**

| ID   | Requisito                                                                   | Módulo      | Prioridade | Iteração |
| ---- | --------------------------------------------------------------------------- | ----------- | ---------- | -------- |
| RF01 | Cadastro e gerenciamento de alunos (CRUD)                                   | Alunos      | Alta       | 1–2      |
| RF02 | Cadastro e gerenciamento de professores (CRUD)                              | Professores | Alta       | 1–2      |
| RF03 | Registro de aulas com data, horário, duração e presença                     | Aulas       | Alta       | 1        |
| RF04 | Criação de pacotes de aulas com cobrança vinculada                          | Aulas       | Alta       | 5        |
| RF05 | Avaliação pós-aula (nota, feedback, observações)                            | Aulas       | Média      | 1        |
| RF06 | Geração de cobranças individuais e por pacote                               | Financeiro  | Alta       | 1        |
| RF07 | Controle de status de pagamento (pendente/pago/cancelado/abonado/extornado) | Financeiro  | Alta       | 1        |
| RF08 | Upload de comprovante de pagamento pelo aluno                               | Financeiro  | Média      | 4        |
| RF09 | Aprovação/rejeição de comprovante pelo professor                            | Financeiro  | Média      | 4        |
| RF10 | Pagamento via PIX com QR Code                                               | Financeiro  | Média      | 5        |
| RF11 | Criação e atribuição de atividades para alunos                              | Atividades  | Alta       | 5        |
| RF12 | Entrega de atividades com arquivo pelo aluno                                | Atividades  | Alta       | 5        |
| RF13 | Correção de atividades com nota e feedback                                  | Atividades  | Alta       | 5        |
| RF14 | Dashboard com métricas (alunos, aulas, cobranças, aniversários)             | Dashboard   | Média      | 4        |
| RF15 | Visão geral consolidada (admin vê todos os professores)                     | Admin       | Média      | 4        |
| RF16 | Gerenciamento de usuários e perfis (admin/teacher/student)                  | Admin       | Alta       | 2        |
| RF17 | Convite de usuários por e-mail                                              | Auth        | Alta       | 3        |
| RF18 | Redefinição de senha (self-service e por admin)                             | Auth        | Alta       | 4        |
| RF19 | Portal do aluno (histórico de aulas, financeiro, atividades)                | Aluno       | Alta       | 3        |
| RF20 | Anonimização de dados pessoais (LGPD)                                       | LGPD        | Alta       | 7        |
| RF21 | Soft delete e restauração de alunos e professores                           | Gestão      | Alta       | 3        |
| RF22 | Hard delete com validação de segurança (admin)                              | Admin       | Média      | 4        |
| RF23 | Gestão de faltas em aulas                                                   | Aulas       | Média      | 6        |
| RF24 | Suporte a alunos estrangeiros (sem CPF obrigatório)                         | Alunos      | Alta       | 6        |
| RF25 | Upload de foto de perfil                                                    | Usuários    | Baixa      | 4        |
| RF26 | Histórico completo de aulas e pagamentos                                    | Aluno       | Média      | 4        |
| RF28 | Timeline de transações financeiras                                          | Financeiro  | Média      | 4        |
| RF29 | Invalidação de sessões ao desativar/deletar conta                           | Auth        | Alta       | 7        |
| RF30 | Limpeza automática de dados antigos (LGPD)                                  | LGPD        | Média      | 9        |
| RF31 | Gateway de pagamento real via PIX (AbacatePay)                              | Financeiro  | Média      | 30       |

> **Nota sobre RF18:** o requisito incluiu, em versão inicial, a troca obrigatória de senha no primeiro acesso, recurso posteriormente removido para simplificar o _onboarding_. Mantiveram-se o reset _self-service_ e o reset realizado pelo administrador.
>
> **Nota sobre RF31:** a integração com o gateway de pagamento real via PIX (AbacatePay) foi implementada na iteração 30, integrando o escopo entregue do MVP. Esse requisito não consta entre os trabalhos futuros.

### B.2 Requisitos Funcionais Planejados (Trabalhos Futuros)

Os requisitos a seguir foram identificados durante a elicitação e a análise comparativa, porém não integram o escopo do MVP. Permanecem registrados para orientar a evolução futura da plataforma.

**Tabela B.2 — Requisitos funcionais planejados (RF27 e RF32 a RF37)**

| ID   | Requisito                                                           | Módulo       | Prioridade | Justificativa                                                                      |
| ---- | ------------------------------------------------------------------- | ------------ | ---------- | ---------------------------------------------------------------------------------- |
| RF27 | Integração com API de CEP para preenchimento automático de endereço | Alunos       | Baixa      | Não implementada no MVP; o preenchimento de endereço permaneceu manual             |
| RF32 | Sistema de notificações (email, push, in-app)                       | Notificações | Média      | Requer infraestrutura de mensageria não prevista                                   |
| RF33 | Exportação de relatórios em PDF                                     | Relatórios   | Média      | Geração server-side fora do escopo do MVP                                          |
| RF34 | Integração com Google Calendar                                      | Integrações  | Baixa      | Dependência de OAuth externo; baixa prioridade                                     |
| RF35 | Sistema de gamificação (badges, conquistas)                         | Gamificação  | Baixa      | Escopo expansivo; planejado para versão futura                                     |
| RF36 | Exportação de dados pessoais (portabilidade LGPD)                   | LGPD         | Média      | _Edge Function_ implementada, porém ainda não implantada em produção               |
| RF37 | Reembolso de pagamento PIX (AbacatePay)                             | Financeiro   | Baixa      | Interface prevista no frontend; funcionalidade de reembolso ainda não implementada |

---

## APÊNDICE C — Requisitos Não Funcionais e Regras de Negócio

### C.1 Requisitos Não Funcionais

Os requisitos não funcionais definem critérios de qualidade, restrições técnicas
e atributos de desempenho do sistema. Os trinta e seis requisitos não funcionais
documentados foram implementados ao longo das iterações.

**Tabela C.1 — Requisitos não funcionais (RNF01 a RNF36)**

| ID    | Requisito                                                   | Categoria       | Prioridade | Iteração |
| ----- | ----------------------------------------------------------- | --------------- | ---------- | -------- |
| RNF01 | Isolamento de dados por professor (RLS no PostgreSQL)       | Segurança       | Alta       | 1–7      |
| RNF02 | Autenticação via Supabase Auth (JWT)                        | Segurança       | Alta       | 1        |
| RNF03 | Conformidade com LGPD (anonimização, soft delete)           | Legal           | Alta       | 3, 7     |
| RNF04 | Idempotência em operações financeiras críticas              | Confiabilidade  | Alta       | 6        |
| RNF05 | Rate limiting em operações sensíveis                        | Segurança       | Média      | 7        |
| RNF06 | Tempo de resposta inferior a 2s em listagens paginadas      | Performance     | Média      | 3, 5     |
| RNF07 | PWA instalável (offline-ready)                              | Usabilidade     | Baixa      | 3        |
| RNF08 | Interface responsiva (mobile-first)                         | Usabilidade     | Alta       | 5        |
| RNF09 | Logs de auditoria para todas as operações críticas          | Rastreabilidade | Média      | 7        |
| RNF10 | Logging de erros via `logger.ts` (dev) e `audit_logs`       | Observabilidade | Média      | 3        |
| RNF11 | Sanitização de inputs contra XSS (DOMPurify)                | Segurança       | Alta       | 5        |
| RNF12 | Validação de e-mail com whitelist de provedores             | Segurança       | Média      | 4        |
| RNF13 | Encriptação de dados sensíveis (chaves PIX)                 | Segurança       | Alta       | 7        |
| RNF14 | Search path security em funções SQL                         | Segurança       | Alta       | 7        |
| RNF15 | Invalidação automática de sessões                           | Segurança       | Alta       | 7        |
| RNF16 | SECURITY DEFINER em funções críticas                        | Segurança       | Alta       | 7        |
| RNF17 | Índices compostos para queries frequentes                   | Performance     | Alta       | 3        |
| RNF18 | Materialized views para dashboards                          | Performance     | Média      | 7        |
| RNF19 | Paginação obrigatória em listagens grandes                  | Performance     | Alta       | 5        |
| RNF20 | Code splitting e lazy loading por rota                      | Performance     | Média      | 1        |
| RNF21 | Query optimization (seleção apenas das colunas necessárias) | Performance     | Média      | Contínuo |
| RNF22 | Design tokens centralizados                                 | Usabilidade     | Média      | 5        |
| RNF23 | Skeleton screens para estados de carregamento               | Usabilidade     | Média      | 3        |
| RNF24 | Empty states personalizados por módulo                      | Usabilidade     | Baixa      | 3        |
| RNF25 | Formatadores centralizados (moeda, data, telefone)          | Usabilidade     | Média      | 3        |
| RNF26 | Sistema de toasts para feedback visual                      | Usabilidade     | Média      | 2        |
| RNF27 | Dialogs padronizados e acessíveis                           | Usabilidade     | Baixa      | 2        |
| RNF28 | Audit logs automáticos via triggers                         | Rastreabilidade | Alta       | 7        |
| RNF29 | Performance logs para queries lentas                        | Observabilidade | Baixa      | 7        |
| RNF30 | Histórico completo de operações financeiras                 | Rastreabilidade | Média      | 4        |
| RNF31 | Rastreamento de quem confirmou pagamentos                   | Rastreabilidade | Média      | 1        |
| RNF32 | Logs estruturados para análise                              | Observabilidade | Baixa      | Contínuo |
| RNF33 | Cleanup automático de registros antigos                     | Manutenção      | Média      | 9        |
| RNF34 | Cleanup automático de arquivos órfãos                       | Manutenção      | Média      | 9        |
| RNF35 | Migrations versionadas e rastreáveis                        | Manutenção      | Alta       | 1–9      |
| RNF36 | Edge Functions para operações assíncronas                   | Arquitetura     | Média      | 3–9      |

> **Nota de classificação:** três políticas de qualidade técnica registradas na elicitação inicial como regras de negócio são, por natureza, atributos de qualidade do sistema e foram reclassificadas como requisitos não funcionais. A paginação obrigatória em listagens grandes corresponde ao RNF19; a validação de formulários com Zod relaciona-se ao RNF01 e ao RNF11; os estados de carregamento com skeleton screens correspondem ao RNF23. Por isso não integram a tabela de regras de negócio.

### C.2 Regras de Negócio

As regras de negócio definem as políticas, restrições e validações que governam
o comportamento do sistema. Cada regra é implementada por um mecanismo concreto:
constraint no banco de dados, RLS policy, trigger ou validação no frontend.

**Tabela C.2 — Regras de negócio (RN-001 a RN-059)**

| ID     | Domínio     | Regra                                                     | Mecanismo de implementação                        |
| ------ | ----------- | --------------------------------------------------------- | ------------------------------------------------- |
| RN-001 | Usuários    | Sistema possui 3 perfis: admin, teacher, student          | `CHECK (role IN ('admin', 'teacher', 'student'))` |
| RN-002 | Usuários    | Cada usuário tem exatamente 1 profile                     | FK `profiles.user_id → auth.users.id`             |
| RN-003 | Usuários    | E-mail único na plataforma                                | Validado pelo Supabase Auth                       |
| RN-004 | Usuários    | Telefone único na plataforma                              | `check_phone_exists_platform()`                   |
| RN-005 | Usuários    | Deletar usuário invalida todas as sessões                 | Trigger `invalidate_sessions_before_delete`       |
| RN-006 | Usuários    | Desativar conta invalida todas as sessões                 | Trigger em `profiles.active`                      |
| RN-007 | Professores | Status: ativo ou inativo                                  | `CHECK (status IN ('ativo', 'inativo'))`          |
| RN-008 | Professores | Nome, e-mail, telefone e país obrigatórios                | `NOT NULL` constraints                            |
| RN-009 | Professores | Chave PIX visível apenas para admin                       | View `teachers_with_pix_restricted`               |
| RN-010 | Professores | Soft delete preserva histórico                            | `deleted_at TIMESTAMPTZ`                          |
| RN-011 | Professores | Anonimização remove dados pessoais                        | `anonymize_teacher_data()`                        |
| RN-012 | Alunos      | Aluno vinculado a exatamente 1 professor                  | `teacher_id NOT NULL`                             |
| RN-013 | Alunos      | Dia de pagamento entre 1 e 31                             | `CHECK (pay_day >= 1 AND pay_day <= 31)`          |
| RN-014 | Alunos      | Valor hora-aula pode diferir do professor                 | Campo `hourly_rate` em students                   |
| RN-015 | Alunos      | Soft delete preserva histórico                            | `is_deleted BOOLEAN`                              |
| RN-016 | Alunos      | CPF não obrigatório (suporte internacional)               | Campo `country`; CPF opcional                     |
| RN-017 | Aulas       | Aluno, professor, data e horários obrigatórios            | `NOT NULL` constraints                            |
| RN-018 | Aulas       | Horário fim maior que horário início                      | `CHECK (end_at > start_at)`                       |
| RN-019 | Aulas       | Professor não pode ter 2 aulas no mesmo horário           | Trigger `trg_check_class_overlap`                 |
| RN-020 | Aulas       | Falta registrada quando `attended = false`                | Campo booleano `attended`                         |
| RN-021 | Aulas       | Avaliação opcional (nota 1–5, feedback)                   | Campos nullable                                   |
| RN-022 | Aulas       | Pacote cria múltiplas aulas e 1 cobrança                  | RPC `create_class_package`                        |
| RN-023 | Financeiro  | Status: pendente/pago/cancelado/abonado/extornado         | `CHECK (status IN (...))`                         |
| RN-024 | Financeiro  | Valor não pode ser negativo                               | `CHECK (amount >= 0)`                             |
| RN-025 | Financeiro  | Vencimento calculado por `pay_day` do aluno               | Lógica no frontend (ver trade-off C.3)            |
| RN-026 | Financeiro  | Comprovante: pending/approved/rejected                    | `CHECK (payment_proof_status IN (...))`           |
| RN-027 | Financeiro  | Apenas professor/admin confirma pagamento                 | RLS policy                                        |
| RN-028 | Financeiro  | Operações financeiras são idempotentes                    | Tabela `idempotency_keys`                         |
| RN-029 | Financeiro  | QR Code PIX contém chave do professor                     | Gerado no frontend                                |
| RN-030 | Financeiro  | Todas as operações financeiras são auditadas              | Trigger em `financial_records`                    |
| RN-031 | Atividades  | Status: pendente/enviada/entregue/corrigida/atrasada      | `CHECK (status IN (...))`                         |
| RN-032 | Atividades  | Atividade sem entrega após o prazo recebe status atrasada | Lógica no frontend (ver trade-off C.3)            |
| RN-033 | Atividades  | Entrega registra timestamp                                | `delivery_date TIMESTAMPTZ`                       |
| RN-034 | Atividades  | Nota entre 0 e 100                                        | `CHECK (grade >= 0 AND grade <= 100)`             |
| RN-035 | Atividades  | Atividade vinculada a exatamente 1 aluno                  | `student_id NOT NULL`                             |
| RN-036 | Segurança   | RLS habilitado em todas as tabelas                        | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`       |
| RN-037 | Segurança   | Professor só acessa seus próprios alunos                  | RLS policies com filtro `teacher_id`              |
| RN-038 | Segurança   | `is_admin()` deve ter SECURITY DEFINER                    | Previne recursão infinita em RLS                  |
| RN-039 | Segurança   | Funções SQL devem ter search path seguro                  | `SET search_path = public, pg_temp`               |
| RN-040 | Segurança   | Operações sensíveis têm rate limit                        | `check_rate_limit()`                              |
| RN-041 | Segurança   | E-mail validado com whitelist de provedores               | `is_valid_email()`                                |
| RN-042 | Segurança   | Inputs sanitizados contra XSS                             | DOMPurify no frontend                             |
| RN-043 | LGPD        | Dados nunca deletados permanentemente (padrão)            | Soft delete em todas as tabelas                   |
| RN-044 | LGPD        | Usuário pode solicitar anonimização                       | Funções `anonymize_*_data()`                      |
| RN-045 | LGPD        | Operações críticas são logadas                            | Tabela `audit_logs`                               |
| RN-046 | LGPD        | Dados antigos são removidos periodicamente                | Edge function `cleanup-old-records`               |
| RN-047 | LGPD        | Arquivos órfãos são removidos                             | Edge function `cleanup-storage`                   |
| RN-048 | Operacional | Índices em todas as FKs usadas em WHERE/JOIN              | Índices compostos                                 |
| RN-050 | Operacional | Queries pesadas usam materialized views                   | `activities_dashboard`, `financial_dashboard`     |
| RN-051 | Operacional | Rate limit padrão de 10 requisições por minuto            | Configurável por operação                         |
| RN-053 | Operacional | Telefone com máscara (XX) XXXXX-XXXX                      | `format-phone.ts`                                 |
| RN-054 | Operacional | Valores com máscara R$ X.XXX,XX                           | `formatters.ts`                                   |
| RN-055 | Operacional | Erros exibidos em português próximos ao campo             | `src/content/`                                    |
| RN-057 | Operacional | Empty states personalizados por módulo                    | Componente `EmptyState.tsx`                       |
| RN-058 | Operacional | Confirmação de ações destrutivas                          | Dialogs de confirmação em CRUDs                   |
| RN-059 | Operacional | Responsividade mobile-first                               | Breakpoints Tailwind                              |

> **Nota:** as regras RN-049 (paginação em listagens grandes), RN-052
> (validação de formulários com Zod) e RN-056 (estados de carregamento com
> skeleton screens) foram reclassificadas como requisitos não funcionais
> (RNF19, RNF01/RNF11 e RNF23, respectivamente) e constam na Seção C.1. Por essa
> razão, a numeração das regras de negócio apresenta lacunas nesses três
> identificadores.

### C.3 Trade-offs Declarados

Duas regras de negócio são implementadas no frontend, e não no banco de dados.
Trata-se de decisões de projeto cujos riscos são declarados como limitações
conhecidas.

| ID     | Decisão                                                                 | Risco declarado                                                                                          |
| ------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| RN-025 | Data de vencimento calculada no frontend a partir do `pay_day` do aluno | Não há constraint equivalente no banco; o acesso direto à API pode produzir inconsistência de vencimento |
| RN-032 | Status "atrasada" calculado no cliente via JavaScript                   | Possível divergência por fuso horário ou momento de acesso, dado que o cálculo ocorre no navegador       |

---

## APÊNDICE D — Casos de Uso

### D.1 Atores

- **Administrador:** acesso total ao sistema.
- **Professor:** acesso restrito aos próprios dados e alunos.
- **Aluno:** acesso de leitura, com permissão de entrega de atividades e de pagamento.

### D.2 Casos de Uso Detalhados

#### UC01 — Cadastrar Aluno

- **Ator principal:** Professor.
- **Pré-condição:** usuário autenticado com perfil `teacher`; aluno ainda não cadastrado na plataforma.

**Fluxo principal:**

1. O professor acessa o módulo de Alunos.
2. Aciona a criação de um novo aluno.
3. Preenche nome, e-mail, telefone, dia de pagamento e valor hora-aula.
4. O sistema valida os dados (RN-008, RN-013, RN-014) e verifica a unicidade de e-mail e telefone (RN-003, RN-004).
5. O sistema persiste o registro com o `teacher_id` do professor autenticado (RN-012).
6. O aluno passa a constar na listagem do professor.

**Fluxo alternativo (e-mail já cadastrado):**

- 4a. O sistema detecta o e-mail duplicado e exibe mensagem de validação.
- 4b. O professor corrige o dado e ressubmete o formulário.

- **Pós-condição:** aluno cadastrado e vinculado ao professor, visível apenas para o professor responsável e para o administrador, por força da RLS.

#### UC02 — Registrar Aula

- **Ator principal:** Professor.
- **Pré-condição:** usuário autenticado com perfil `teacher`; ao menos um aluno ativo vinculado.

**Fluxo principal:**

1. O professor acessa o módulo de Aulas.
2. Aciona o registro de uma nova aula.
3. Seleciona o aluno e define data, horário de início e horário de fim.
4. O sistema valida horário de fim maior que horário de início (RN-018) e verifica conflito de horário (RN-019).
5. O sistema persiste o registro em `class_logs`.
6. A aula passa a constar no histórico do professor e do aluno.

**Fluxo alternativo (conflito de horário):**

- 4a. O sistema detecta sobreposição com outra aula do professor.
- 4b. Exibe mensagem informando o conflito; o professor ajusta os horários.

- **Pós-condição:** aula registrada; o aluno pode visualizá-la no portal (RF19).

#### UC06 — Confirmar Pagamento

- **Ator principal:** Professor (ou Administrador).
- **Pré-condição:** cobrança com status `pendente` existente; usuário autenticado com perfil `teacher` ou `admin`.

**Fluxo principal:**

1. O professor acessa o módulo Financeiro.
2. Localiza a cobrança pendente do aluno.
3. Aciona a confirmação de pagamento.
4. O sistema altera o status para `pago`, registra `paid_at = NOW()` e grava log de auditoria (RN-030, RNF28).
5. O aluno passa a visualizar a cobrança como paga no portal.

**Fluxo alternativo (confirmação via comprovante):**

- 2a. O aluno enviou comprovante (RF08); o professor visualiza o arquivo antes de confirmar.
- 2b. O professor aprova ou rejeita o comprovante (RF09).
- 2c. Em caso de rejeição, o professor registra o motivo; o aluno pode reenviar.

- **Pós-condição:** cobrança com status `pago`; operação registrada na tabela `audit_logs`; idempotência garantida via `idempotency_keys` (RN-028).

### D.3 Demais Casos de Uso

**Tabela D.1 — Demais casos de uso por ator (UC03 a UC26)**

| ID   | Ator          | Caso de uso                                       |
| ---- | ------------- | ------------------------------------------------- |
| UC03 | Professor     | Criar pacote de aulas                             |
| UC04 | Professor     | Avaliar aula (nota e feedback)                    |
| UC05 | Professor     | Criar cobrança                                    |
| UC07 | Professor     | Criar atividade                                   |
| UC08 | Professor     | Corrigir atividade entregue                       |
| UC09 | Professor     | Convidar aluno para o portal                      |
| UC10 | Professor     | Arquivar e restaurar aluno                        |
| UC11 | Professor     | Redefinir senha de aluno vinculado                |
| UC12 | Professor     | Registrar falta em aula                           |
| UC13 | Professor     | Aprovar ou rejeitar comprovante                   |
| UC14 | Aluno         | Visualizar histórico de aulas                     |
| UC15 | Aluno         | Visualizar cobranças pendentes                    |
| UC16 | Aluno         | Enviar comprovante de pagamento                   |
| UC17 | Aluno         | Visualizar e entregar atividades                  |
| UC18 | Aluno         | Gerar QR Code PIX para pagamento                  |
| UC19 | Aluno         | Visualizar timeline de transações                 |
| UC20 | Aluno         | Redefinir a própria senha                         |
| UC21 | Administrador | Gerenciar professores                             |
| UC22 | Administrador | Gerenciar usuários e perfis                       |
| UC23 | Administrador | Visualizar visão geral consolidada                |
| UC24 | Administrador | Hard delete de usuários inativos                  |
| UC25 | Administrador | Acessar dados financeiros de todos os professores |
| UC26 | Administrador | Visualizar logs de auditoria                      |

A interação dos três atores com o conjunto dos casos de uso é sintetizada no diagrama da Figura D.1.

**Figura D.1 – Diagrama de Casos de Uso (UML)**

[Figura pendente de geração e inserção no documento final]

Fonte: O autor (2026).

---

## APÊNDICE E — Matriz de Rastreabilidade

A matriz a seguir mapeia os 30 requisitos funcionais implementados aos
respectivos arquivos de implementação, migrations SQL, iteração de entrega e
situação de teste. A cobertura abrange a totalidade dos requisitos funcionais
implementados, resolvendo o gap de rastreabilidade identificado em revisões
anteriores.

**Tabela E.1 — Matriz de rastreabilidade dos requisitos funcionais implementados**

| Requisito | Arquivo principal                         | Migration                                  | Iteração | Situação de teste |
| --------- | ----------------------------------------- | ------------------------------------------ | -------- | ----------------- |
| RF01      | `TeacherStudents.tsx`                     | `01_structure.sql`                         | 1–2      | Automatizado      |
| RF02      | `Teachers.tsx`                            | `01_structure.sql`                         | 1–2      | Automatizado      |
| RF03      | `TeacherClasses.tsx`                      | `01_structure.sql`                         | 1        | Automatizado      |
| RF04      | `create_class_package` (RPC)              | `03_rpcs_and_triggers.sql`                 | 5        | Automatizado      |
| RF05      | `PostClassDialog.tsx`                     | `01_structure.sql`                         | 1        | Automatizado      |
| RF06      | `useFinancialRecords.ts`                  | `01_structure.sql`                         | 1        | Automatizado      |
| RF07      | `useFinancialRecords.ts`                  | `01_structure.sql`                         | 1        | Automatizado      |
| RF08      | `StudentFinancial.tsx`                    | `01_structure.sql`                         | 4        | Manual            |
| RF09      | `FinancialView.tsx`                       | `01_structure.sql`                         | 4        | Manual            |
| RF10      | `StudentCheckout.tsx`                     | —                                          | 5        | Manual            |
| RF11      | `TeacherActivities.tsx`                   | `01_structure.sql`                         | 5        | Automatizado      |
| RF12      | `DeliverActivityDialog.tsx`               | `01_structure.sql`                         | 5        | Automatizado      |
| RF13      | `AddCorrectionDialog.tsx`                 | `01_structure.sql`                         | 5        | Automatizado      |
| RF14      | `DashboardView.tsx`                       | `02_logic_and_views.sql`                   | 4        | Automatizado      |
| RF15      | `Overview.tsx`                            | `02_logic_and_views.sql`                   | 4        | Automatizado      |
| RF16      | `Users.tsx`                               | `04_rls_and_permissions.sql`               | 2        | Automatizado      |
| RF17      | `invite-user` (Edge Function)             | —                                          | 3        | Manual            |
| RF18      | `ResetPassword.tsx`                       | —                                          | 4        | Manual            |
| RF19      | `StudentPanel.tsx`                        | `01_structure.sql`                         | 3        | Automatizado      |
| RF20      | `anonymize_student` / `anonymize_teacher` | `02_logic_and_views.sql`                   | 7        | Via migration     |
| RF21      | `useStudents.ts`                          | `05_cpf_removal_and_country.sql`           | 3        | Automatizado      |
| RF22      | `useUserProfileMutations.ts`              | `04_rls_and_permissions.sql`               | 4        | Manual            |
| RF23      | `PostClassAbsenceSection.tsx`             | `01_structure.sql`                         | 6        | Automatizado      |
| RF24      | `StudentFormDialog.tsx`                   | `05_cpf_removal_and_country.sql`           | 6        | Automatizado      |
| RF25      | `avatarUpload.ts`                         | —                                          | 4        | Manual            |
| RF26      | `StudentHistory.tsx`                      | `01_structure.sql`                         | 4        | Automatizado      |
| RF28      | `StudentStatementTab.tsx`                 | `01_structure.sql`                         | 4        | Automatizado      |
| RF29      | `invalidate_sessions` (trigger)           | `14_invalidate_sessions_on_deactivate.sql` | 7        | Via migration     |
| RF30      | `cleanup-old-records` (Edge Function)     | —                                          | 9        | Manual            |
| RF31      | `create-abacate-payment` (Edge Function)  | —                                          | 30       | Manual            |

**Legenda da situação de teste:**

- **Automatizado** — coberto por testes unitários automatizados.
- **Manual** — validado manualmente (Edge Functions, QR Code, uploads).
- **Via migration** — exercido por meio da execução de migration SQL.

**Cobertura geral:** 30 de 30 requisitos funcionais implementados constam na
matriz (100% de cobertura de rastreabilidade). Aproximadamente 63% dos
requisitos (19 dos 30) contam com testes automatizados; os 11 restantes são
validados por execução manual (9) ou por execução de migration (2).
