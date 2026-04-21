> **Status:** 🟠 Rascunho — adicionar diagrama de casos de uso
> **Última Atualização:** 21/04/2026

## 4.1 Público-Alvo

|**Perfil**|**Descrição**|
|---|---|
|Professor autônomo|Gerencia seus próprios alunos, aulas, cobranças e atividades|
|Aluno|Acessa seu histórico, paga cobranças e entrega atividades|
|Administrador|Visão global da plataforma, gerencia professores e usuários|

## 4.2 Requisitos Funcionais

|**ID**|**Requisito**|**Módulo**|**Prioridade**|
|---|---|---|---|
|RF01|Cadastro e gerenciamento de alunos (CRUD)|Alunos|Alta|
|RF02|Cadastro e gerenciamento de professores (CRUD)|Professores|Alta|
|RF03|Registro de aulas com data, horário, duração e presença|Aulas|Alta|
|RF04|Criação de pacotes de aulas com cobrança vinculada|Aulas|Alta|
|RF05|Avaliação pós-aula (nota, feedback, observações)|Aulas|Média|
|RF06|Geração de cobranças individuais e por pacote|Financeiro|Alta|
|RF07|Controle de status de pagamento (pendente/pago/cancelado/abonado/extornado)|Financeiro|Alta|
|RF08|Upload de comprovante de pagamento pelo aluno|Financeiro|Média|
|RF09|Aprovação/rejeição de comprovante pelo professor|Financeiro|Média|
|RF10|Pagamento via PIX com QR Code|Financeiro|Média|
|RF11|Criação e atribuição de atividades para alunos|Atividades|Alta|
|RF12|Entrega de atividades com arquivo pelo aluno|Atividades|Alta|
|RF13|Correção de atividades com nota e feedback|Atividades|Alta|
|RF14|Dashboard com métricas (alunos, aulas, cobranças, aniversários)|Dashboard|Média|
|RF15|Visão geral consolidada (admin vê todos os professores)|Admin|Média|
|RF16|Gerenciamento de usuários e _roles_ (admin/teacher/student)|Admin|Alta|
|RF17|Convite de usuários por e-mail|Auth|Alta|
|RF18|Redefinição de senha obrigatória no primeiro acesso|Auth|Alta|
|RF19|Portal do aluno (histórico de aulas, financeiro, atividades)|Aluno|Alta|
|RF20|Anonimização de dados pessoais (LGPD)|LGPD|Alta|

> 🖼️ **Figura:** Tabela RF formatada para impressão

## 4.3 Requisitos Não Funcionais

|**ID**|**Requisito**|**Categoria**|**Prioridade**|
|---|---|---|---|
|RNF01|Isolamento de dados por professor (RLS no PostgreSQL)|Segurança|Alta|
|RNF02|Autenticação via Supabase Auth (JWT)|Segurança|Alta|
|RNF03|Conformidade com LGPD (anonimização, _soft delete_)|Legal|Alta|
|RNF04|Idempotência em operações financeiras críticas|Confiabilidade|Alta|
|RNF05|_Rate limiting_ em operações sensíveis|Segurança|Média|
|RNF06|Tempo de resposta < 2s para listagens paginadas|Performance|Média|
|RNF07|PWA instalável (_offline-ready_)|Usabilidade|Baixa|
|RNF08|Interface responsiva (_mobile-first_)|Usabilidade|Alta|
|RNF09|Logs de auditoria para todas as operações críticas|Rastreabilidade|Média|
|RNF10|Monitoramento de erros em produção (Sentry)|Observabilidade|Média|

> 🖼️ **Figura:** Tabela RNF formatada para impressão

## 4.4 Casos de Uso

### 4.4.1 Atores

- **Admin:** Acesso total ao sistema.
- **Professor:** Acesso aos seus próprios dados.
- **Aluno:** Acesso somente leitura + entrega de atividades e pagamentos.

### 4.4.2 Casos de Uso Principais

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

**Aluno:**

- UC10: Visualizar histórico de aulas
- UC11: Visualizar cobranças pendentes
- UC12: Enviar comprovante de pagamento
- UC13: Visualizar e entregar atividades

**Admin:**

- UC14: Gerenciar professores
- UC15: Gerenciar usuários e _roles_
- UC16: Visualizar visão geral consolidada

> 🖼️ **Figura:** Diagrama de Casos de Uso (UML)

---

## Assets Necessários

- [ ] 🖼️ Figura: Tabela RF/RNF formatada
- [ ] 🖼️ Figura: Diagrama de Casos de Uso (UML) — gerar no draw.io ou Lucidchart
