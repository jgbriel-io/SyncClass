---
capitulo: 4
titulo: Engenharia de Requisitos
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - status/rascunho
  - tcc/escrita
---

> [!INFO] Resumo do Capítulo
> Definição do público-alvo, levantamento detalhado de requisitos funcionais e não funcionais e mapeamento dos casos de uso.

---

## 4.1 Público-Alvo

O levantamento de necessidades **identifica** três perfis principais de usuários:

| Perfil                 | Descrição                                                                 |
| :--------------------- | :------------------------------------------------------------------------ |
| **Professor autônomo** | Gestor da operação: gerencia alunos, aulas, cobranças e atividades.       |
| **Aluno**              | Usuário final: acessa histórico, realiza pagamentos e entrega atividades. |
| **Administrador**      | Gestor global: visão de métricas, gerencia professores e usuários.        |

## 4.2 Requisitos Funcionais

Os requisitos abaixo **estão em fase de implementação e validação**:

| ID   | Requisito                                                       | Módulo      | Prioridade |
| :--- | :-------------------------------------------------------------- | :---------- | :--------- |
| RF01 | Cadastro e gerenciamento de alunos (CRUD)                       | Alunos      | Alta       |
| RF02 | Cadastro e gerenciamento de professores (CRUD)                  | Professores | Alta       |
| RF03 | Registro de aulas com data, horário, duração e presença         | Aulas       | Alta       |
| RF04 | Criação de pacotes de aulas com cobrança vinculada              | Aulas       | Alta       |
| RF05 | Avaliação pós-aula (nota, feedback, observações)                | Aulas       | Média      |
| RF06 | Geração de cobranças individuais e por pacote                   | Financeiro  | Alta       |
| RF07 | Controle de status de pagamento (pendente/pago/cancelado/etc)   | Financeiro  | Alta       |
| RF08 | Upload de comprovante de pagamento pelo aluno                   | Financeiro  | Média      |
| RF09 | Aprovação/rejeição de comprovante pelo professor                | Financeiro  | Média      |
| RF10 | Pagamento via PIX com QR Code                                   | Financeiro  | Média      |
| RF11 | Criação e atribuição de atividades para alunos                  | Atividades  | Alta       |
| RF12 | Entrega de atividades com arquivo pelo aluno                    | Atividades  | Alta       |
| RF13 | Correção de atividades com nota e feedback                      | Atividades  | Alta       |
| RF14 | Dashboard com métricas (alunos, aulas, cobranças, aniversários) | Dashboard   | Média      |
| RF15 | Visão geral consolidada (admin vê todos os professores)         | Admin       | Média      |
| RF16 | Gerenciamento de usuários e roles (admin/teacher/student)       | Admin       | Alta       |
| RF17 | Convite de usuários por e-mail                                  | Auth        | Alta       |
| RF18 | Redefinição de senha obrigatória no primeiro acesso             | Auth        | Alta       |
| RF19 | Portal do aluno (histórico de aulas, financeiro, atividades)    | Aluno       | Alta       |
| RF20 | Anonimização de dados pessoais (LGPD)                           | LGPD        | Alta       |

## 4.3 Requisitos Não Funcionais

As restrições técnicas que **norteiam** o desenvolvimento são:

| ID    | Requisito                                             | Categoria       | Prioridade |
| :---- | :---------------------------------------------------- | :-------------- | :--------- |
| RNF01 | Isolamento de dados por professor (RLS no PostgreSQL) | Segurança       | Alta       |
| RNF02 | Autenticação via Supabase Auth (JWT)                  | Segurança       | Alta       |
| RNF03 | Conformidade com LGPD (anonimização, soft delete)     | Legal           | Alta       |
| RNF04 | Idempotência em operações financeiras críticas        | Confiabilidade  | Alta       |
| RNF05 | Rate limiting em operações sensíveis                  | Segurança       | Média      |
| RNF06 | Tempo de resposta < 2s para listagens paginadas       | Performance     | Média      |
| RNF07 | PWA instalável (offline-ready)                        | Usabilidade     | Baixa      |
| RNF08 | Interface responsiva (mobile-first)                   | Usabilidade     | Alta       |
| RNF09 | Logs de auditoria para todas as operações críticas    | Rastreabilidade | Média      |
| RNF10 | Monitoramento de erros em produção (`logger.ts`)      | Observabilidade | Média      |

## 4.4 Casos de Uso

O mapeamento de ações **está estruturado** por ator:

**Professor:**

- UC01: Cadastrar aluno | UC02: Registrar aula | UC03: Criar pacote de aulas
- UC04: Avaliar aula | UC05: Criar cobrança | UC06: Confirmar pagamento
- UC07: Criar atividade | UC08: Corrigir atividade | UC09: Convidar aluno

**Aluno:**

- UC10: Visualizar histórico | UC11: Visualizar cobranças
- UC12: Enviar comprovante | UC13: Visualizar e entregar atividades

**Admin:**

- UC14: Gerenciar professores | UC15: Gerenciar usuários | UC16: Visão consolidada

---

## Assets Necessários

- [ ] 🖼️ **Figura:** Tabela de Requisitos Funcionais formatada.
- [ ] 🖼️ **Figura:** Tabela de Requisitos Não Funcionais formatada.
- [ ] 🖼️ **Figura:** Diagrama de Casos de Uso (UML).
