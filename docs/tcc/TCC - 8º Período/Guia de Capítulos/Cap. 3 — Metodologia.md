---
capitulo: 3
titulo: Metodologia
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - tcc/escrita
  - status/rascunho
---

> [!INFO] Resumo do Capítulo
> Classificação da pesquisa, processo de desenvolvimento e ferramentas de IA utilizadas no cotidiano do projeto.

---

## 3.1 Classificação da Pesquisa

Este trabalho **classifica-se** de acordo com os seguintes critérios:

- **Quanto à natureza:** Pesquisa aplicada — busca produzir conhecimento para aplicação prática e solução de problemas específicos.
- **Quanto à abordagem:** Qualitativa e quantitativa — utiliza análise de produtividade com métricas objetivas aliada à percepção de usabilidade.
- **Quanto aos objetivos:** Exploratória e descritiva — explora o uso de IA no ciclo de desenvolvimento e descreve as etapas de construção.
- **Quanto aos procedimentos:** Pesquisa-ação — o pesquisador atua como o próprio desenvolvedor, permitindo que a documentação evolua junto com o software.

## 3.2 Processo de Desenvolvimento

O desenvolvimento **adota** um modelo iterativo e incremental fundamentado no sistema **Kanban**:

- **Fluxo contínuo:** Sem sprints fixas ou cerimônias formais, focado na entrega constante de valor.
- **Controle de Versão:** Uso de branches git para separação de ambientes (`dev` → `homolog` → `main`).
- **Revisão:** Pull Requests servem como pontos de controle antes da integração final.
- **Padronização:** Commits semânticos são utilizados para registrar o progresso (`feat:`, `fix:`, `refactor:`, `security:`, `chore:`).

### 3.2.1 Fluxo de Trabalho (Workflow)

O fluxo diário para a implementação de cada funcionalidade **consiste em**:

```text
Ideia / Bug
└── Branch feature/fix
    └── Desenvolvimento + IA
        └── Commit semântico
            └── PR → homolog
                └── Teste manual
                    └── Merge → main
```

## 3.3 Uso de Inteligência Artificial

A Inteligência Artificial **é integrada** como ferramenta estratégica de co-desenvolvimento em todas as fases do projeto.

### 3.3.1 Ferramentas Utilizadas

| Ferramenta                      | Uso Principal                                                       |
| :------------------------------ | :------------------------------------------------------------------ |
| Claude (Anthropic) via Kiro IDE | Geração de código, auditorias, migrations SQL, documentação técnica |
| GitHub Copilot                  | Assistência e autocompletar inline durante a escrita de código      |

### 3.3.2 Aplicação Prática da IA

O suporte da IA **está sendo aplicado** em:

- **Migrations SQL:** Escrita de políticas de RLS, triggers e funções RPC complexas.
- **Scaffolding:** Geração de componentes React seguindo os padrões de design do projeto.
- **Auditorias:** Identificação proativa de vulnerabilidades e débitos técnicos.
- **Refatoração:** Melhoria contínua do código com base no contexto global do repositório.
- **Documentação:** Geração de especificações técnicas a partir da análise do código fonte.
- **Debugging:** Diagnóstico rápido de erros com análise de logs e contexto.

## 3.4 Ferramentas e Tecnologias

A infraestrutura tecnológica do projeto **compõe-se** das seguintes ferramentas:

| Categoria        | Tecnologia                | Versão                  |
| :--------------- | :------------------------ | :---------------------- |
| Frontend         | React + TypeScript + Vite | 18.3.1 / 5.8.3 / 5.4.19 |
| Estilização      | Tailwind CSS + shadcn/ui  | 3.4.17                  |
| Backend/BaaS     | Supabase                  | 2.90.1                  |
| Data fetching    | TanStack Query            | 5.83.0                  |
| Formulários      | React Hook Form + Zod     | 7.61.1 / 3.25.76        |
| Testes unitários | Vitest + Testing Library  | 3.2.4                   |
| Monitoramento    | `logger.ts` interno       | —                       |

---

## Assets Necessários

- [ ] 🖼️ **Figura:** Tabela de ferramentas formatada para impressão.
- [ ] 🖼️ **Figura:** Fluxo de desenvolvimento (diagrama do processo iterativo).
