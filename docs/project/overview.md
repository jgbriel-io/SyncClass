# Contexto do Projeto — SyncClass

**Última Atualização:** 23/05/2026

## O que é

SyncClass é uma plataforma SaaS web para gestão de professores autônomos de inglês. Centraliza alunos, aulas, cobranças, atividades e comunicação em um único sistema.

## Para quem

**Usuários principais:**

- **Professores autônomos** — gerenciam seus próprios alunos, aulas e cobranças
- **Alunos** — acessam histórico, pagam cobranças, entregam atividades
- **Administradores** — visão global da plataforma

**Contexto de uso:**

- Professores que trabalham sozinhos ou em pequenas escolas
- Ensino de idiomas (inglês como caso de uso principal)
- Gestão de múltiplos alunos com horários, valores e históricos distintos

## Problema

Professores autônomos dependem de ferramentas fragmentadas:

- Planilhas para controle financeiro
- WhatsApp para comunicação
- Pastas de nuvem para materiais
- Agenda física ou Google Calendar

**Consequências:**

- Retrabalho manual
- Perda de informações
- Dificuldade de acompanhamento pedagógico
- Falta de profissionalismo percebido

## Solução

Plataforma web unificada que:

- Centraliza gestão de alunos, aulas, cobranças e atividades
- Automatiza cálculos financeiros e geração de cobranças
- Fornece portal para alunos (histórico, pagamentos, atividades)
- Garante segurança de dados (RLS, LGPD)
- Funciona em qualquer dispositivo (PWA, mobile-first)

## Funcionalidades principais

### Gestão de Alunos

- CRUD completo (criar, editar, arquivar, restaurar)
- Dados: nome, email, telefone, país, dia de pagamento, valor hora-aula
- Suporte a alunos estrangeiros (sem CPF obrigatório)
- Filtros por status, professor, aniversariantes

### Gestão de Aulas

- Registro individual ou em pacote
- Controle de presença (presente/faltou)
- Avaliação pós-aula (nota, feedback, observações)
- Validação de sobreposição de horários

### Gestão Financeira

- Cobranças individuais e por pacote
- Status: pendente → pago / cancelado / abonado / extornado
- Upload e aprovação de comprovante
- QR Code PIX para pagamento
- Idempotência em operações críticas

### Gestão de Atividades

- Criação com prazo, arquivo e descrição
- Entrega pelo aluno com arquivo de resposta
- Correção com nota, feedback e arquivo de correção
- Status: pendente → enviada → entregue → corrigida / atrasada

### Portal do Aluno

- Histórico de aulas
- Extrato financeiro
- Entrega de atividades
- Pagamento via PIX

### Dashboard

- Métricas: alunos, aulas do mês, receita, pendências
- Gráfico de crescimento de alunos
- Próximos pagamentos e aniversariantes
- Aulas do dia

## Stack Tecnológica

### Frontend

- React 18 + TypeScript 5.8 + Vite 5.4
- Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- TanStack Query v5 (data fetching)
- React Hook Form + Zod (formulários e validação)
- React Router v6 (rotas)

### Backend

- Supabase (BaaS)
  - PostgreSQL 15 (banco de dados)
  - Supabase Auth (autenticação JWT)
  - Supabase Storage (arquivos)
  - Edge Functions (Deno/TypeScript)
  - PostgREST (API REST automática)
  - Realtime (subscriptions)

### Infraestrutura

- Docker (frontend containerizado)
- GitHub Actions (CI/CD)
- Vitest (testes unitários)

### Desenvolvimento

- Vitest + Testing Library (testes unitários)
- ESLint + TypeScript (qualidade de código)
- Git + Conventional Commits (versionamento)

## Arquitetura

### Modelo

Monolito modular no frontend + BaaS no backend

```
Browser (React SPA)
  ↓ HTTPS / WebSocket
Supabase
  ├── PostgreSQL (RLS + Triggers + RPCs)
  ├── Auth (JWT)
  ├── Storage (arquivos)
  └── Edge Functions (server-side)
```

### Separação de Responsabilidades

```
Components → Hooks → Supabase SDK → PostgreSQL
```

- **Components:** apenas UI
- **Hooks:** TanStack Query + mutations
- **Services:** lógica de domínio
- **Supabase SDK:** chamadas ao banco

### Segurança

- **RLS (Row Level Security):** isolamento de dados por professor
- **JWT:** autenticação via Supabase Auth
- **Rate limiting:** 10 req/min em operações sensíveis
- **Validação:** Zod no frontend + constraints no banco
- **LGPD:** soft delete, anonimização, sem CPF obrigatório

## Roles e Permissões

### Admin

- Acesso total ao sistema
- Gerencia professores e usuários
- Visão consolidada de todos os dados
- Hard delete de usuários inativos

### Teacher (Professor)

- Gerencia seus próprios alunos
- Registra aulas e cria cobranças
- Cria e corrige atividades
- Aprova comprovantes de pagamento
- Convida alunos para o portal

### Student (Aluno)

- Acessa seu histórico de aulas
- Visualiza cobranças pendentes
- Envia comprovantes de pagamento
- Entrega atividades
- Gera QR Code PIX

## Status do Projeto

### Desenvolvimento

- **Período:** Janeiro–Maio 2026 (~4 meses)
- **Desenvolvedor:** 1 (solo)
- **Commits:** ~218
- **Sprints:** 20 documentadas (19 implementadas + 1 em andamento)

### Implementação

- **Requisitos Funcionais:** 30/35 (85%)
- **Requisitos Não Funcionais:** 36/36 (100%)
- **Regras de Negócio:** 59/59 (100%)
- **Migrations:** 25
- **Edge Functions:** 5
- **Testes:** 161 (32 unitários + 129 design tokens)
- **RLS Policies:** 40+

### Documentação

- **Arquivos de docs:** 53
- **Capítulos TCC:** 10
- **Sprints documentadas:** 16
- **Strings UI centralizadas:** 900+

## Contexto Acadêmico

### TCC

- **Autor:** João Gabriel Silva Caetano
- **Orientador:** Adriano Malerba
- **Instituição:** FEPI — Engenharia de Software, 8º Período
- **Tipo:** Trabalho de Conclusão de Curso

### Hipóteses

- **H1:** Desenvolver SaaS funcional e seguro solo em ~3 meses com IA → ✅ Confirmada
- **H2:** BaaS (Supabase) reduz 60-70% esforço de backend → ✅ Confirmada
- **H3:** IA aumenta produtividade 3-10x em tarefas específicas → ✅ Confirmada

### Objetivos

- Desenvolver MVP funcional
- Implementar segurança (RLS, LGPD)
- Documentar impacto da IA no desenvolvimento
- Validar hipóteses com métricas reais

## Próximos Passos

### Trabalhos Futuros

- Deploy automatizado (CD)
- Testes de carga
- Auditoria WCAG AA
- App mobile nativo
- Integração com Google Calendar
- Relatórios exportáveis (PDF)
- Sistema de notificações
- Gateway de pagamento real (Stripe/Mercado Pago)
- Multi-tenancy com planos (Freemium/Pro)

### Melhorias Planejadas

- Internacionalização (i18n) — estrutura já preparada
- Gamificação (badges, conquistas)
- Exportação de relatórios
- Notificações push

## Referências

- **Documentação Técnica:** [docs/](./README.md)
- **TCC:** [docs/tcc/](./tcc/README.md)
- **Sprints:** [docs/sprints/](./sprints/README.md)
- **Arquitetura:** [docs/architecture/](./architecture/overview.md)
- **Código:** `src/`, `supabase/`

## Contato

- **Repositório:** (privado)
- **Autor:** João Gabriel Silva Caetano
- **Email:** (via FEPI)
