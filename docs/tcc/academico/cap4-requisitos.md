> **Status:** 🟡 Versão Acadêmica
>
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

As tabelas completas de RNF (RNF01-RNF36) foram preservadas do capítulo técnico
por conterem dados tabulares sem texto narrativo extenso.

Consultar `docs/tcc/tecnico/cap4-requisitos.md` seções 4.3.1 a 4.3.6 para
tabelas completas.

## 4.4 Regras de Negócio

As regras de negócio definem as políticas, restrições e validações que governam
o comportamento do sistema.

Estas regras são implementadas através de constraints no banco de dados,
validações no frontend e lógica em RPCs.

As 59 regras de negócio (RN-001 a RN-059) estão documentadas em
`docs/archive/regras-de-negocio/regras-de-negocio.md`.

Resumo por categoria:

- Usuários e Autenticação: 6 regras
- Professores: 5 regras
- Alunos: 5 regras
- Aulas: 6 regras
- Financeiro: 8 regras
- Atividades: 5 regras
- Segurança e Permissões: 7 regras
- LGPD e Privacidade: 5 regras
- Performance: 4 regras
- Validação Frontend: 4 regras
- UI/UX: 4 regras

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

## 4.6 Matriz de Rastreabilidade

A matriz completa de rastreabilidade (Requisitos → Implementação) está
documentada em `docs/tcc/tecnico/cap4-requisitos.md` seção 4.6.

Cobertura geral:

- **Requisitos documentados:** 66 (35 RF + 31 RNF)
- **Requisitos implementados:** 66 (30 RF + 36 RNF)
- **Taxa de implementação:** 100% dos requisitos documentados
- **Cobertura de testes:** ~75% (testes unitários automatizados)

## 4.7 Resumo Quantitativo

### Requisitos Funcionais

- **Principais (RF01-RF20):** 20 requisitos → 100% implementados
- **Adicionais (RF21-RF30):** 10 requisitos → 100% implementados
- **Futuros (RF31-RF35):** 5 requisitos → 0% implementados
- **Total:** 35 requisitos (30 implementados, 5 planejados)

### Requisitos Não Funcionais

- **Total:** 36 requisitos → 100% implementados

### Regras de Negócio

- **Total:** 59 regras implementadas

---

## Assets Necessários

- [ ] 🖼️ Figura: Tabela RF/RNF formatada
- [ ] 🖼️ Figura: Diagrama de Casos de Uso (UML)
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
