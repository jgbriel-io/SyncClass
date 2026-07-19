# SyncClass

Plataforma SaaS para gestão de professores autônomos de inglês.  
Desenvolvida como TCC de Sistemas de Informação — FEPI, 8º período (jan–mai 2026).

## Sobre

SyncClass unifica cadastro de alunos, registro de aulas, controle financeiro, envio de atividades e portal do aluno em uma única plataforma multi-role:

- **Admin** — visão global de todos os professores, usuários e cobranças
- **Professor** — gerencia seus próprios alunos, aulas, cobranças e atividades
- **Aluno** — portal mobile-first com histórico, financeiro e atividades

## Stack

| Camada  | Tecnologia                                  |
| ------- | ------------------------------------------- |
| UI      | React 18.3 + TypeScript 5.8 + Vite 5.4      |
| Estilo  | Tailwind 3.4 + shadcn/ui (Radix UI)         |
| Estado  | TanStack Query v5 + React Context           |
| Forms   | React Hook Form 7 + Zod 3                   |
| Backend | Supabase 2.90 (Auth, DB, Realtime, Storage) |
| Deploy  | Cloudflare Pages via GitHub Actions (CI/CD) |

## Métricas

| Métrica                    | Valor                              |
| -------------------------- | ---------------------------------- |
| Período de desenvolvimento | 19 jan – 26 mai 2026 (~18 semanas) |
| Sprints implementadas      | 32                                 |
| Commits                    | 181                                |
| Arquivos TypeScript        | 360                                |
| Linhas de código (src)     | ~49.159                            |
| Migrations SQL             | 78                                 |
| Testes automatizados       | 301 (28 suites)                    |
| Strings UI centralizadas   | 860+                               |

## Comandos

```bash
npm install
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run test         # 301 testes (vitest)
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run check        # lint + type-check
```

## Qualidade

```
npm run lint       → 0 erros, 0 warnings
npm run type-check → limpo
npm run test       → 301/301 passando (28 suites)
npm run build      → sucesso (Vite 5.4)
```

## Funcionalidades

**Gestão de alunos**

- CRUD completo com validação de CPF/telefone
- Suporte a alunos estrangeiros (sem CPF)
- Upload de foto de perfil
- Soft delete + restauração
- API de CEP com autopreenchimento de endereço

**Aulas**

- Registro individual e pacotes (múltiplas aulas + cobrança vinculada)
- Controle de presença e faltas
- Notas e feedback por aula
- Realtime: lista atualiza em outra aba sem refresh

**Financeiro**

- Cobranças individuais e por pacote
- Upload de comprovante pelo aluno
- QR Code PIX via AbacatePay (geração automática + confirmação via webhook)
- Portal de checkout do aluno (mobile-first)
- Timeline de transações
- Fluxo: pendente → aguardando confirmação → pago / cancelado / abonado

**Atividades**

- Atribuição com prazo por aluno
- Upload de arquivo pelo aluno
- Correção com nota, feedback e arquivo de retorno

**Segurança e Compliance**

- RLS (Row Level Security) em todas as tabelas
- Anonimização LGPD + exportação de dados pessoais
- Rate limiting em Edge Functions
- Headers de segurança (CSP, X-Frame-Options)

## Estrutura

```
src/
├── pages/
│   ├── admin/       # /admin — visão global
│   ├── teacher/     # /teacher — gestão do professor
│   └── student/     # /student — portal do aluno (mobile-first)
├── components/      # Componentes por domínio + shadcn/ui
├── hooks/           # TanStack Query + *Service.ts (Supabase)
├── content/         # 860+ strings UI centralizadas
├── lib/
│   ├── validation/  # Schemas Zod
│   ├── utils/       # Formatters, date, cn()
│   └── security/    # Auth utilities
└── test/            # Utilitários de teste
supabase/
├── migrations/      # 78 SQL migrations com RLS
└── functions/       # Edge Functions (Deno/TS)
```

## Documentação

- [`docs/sprints/`](./docs/sprints/) — 32 sprints implementadas
- [`docs/architecture/`](./docs/architecture/) — Arquitetura e decisões técnicas
- [`docs/database/`](./docs/database/) — Schema, migrations e RLS

---

**Autor:** João Gabriel Silva Caetano  
**Orientador:** Adriano Malerba  
**Instituição:** FEPI — Faculdade de Engenharia de Pindamonhangaba
