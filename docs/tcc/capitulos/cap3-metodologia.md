> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo descreve a metodologia de pesquisa (pesquisa-ação), o
processo de desenvolvimento iterativo com Kanban, o uso estratégico de IA
(Claude e Copilot) em todas as fases do projeto, e as ferramentas e tecnologias
utilizadas.

## 3.1 Classificação da Pesquisa

Este trabalho classifica-se como:

- **Quanto à natureza:** Pesquisa aplicada — produz conhecimento para aplicação
  prática.

- **Quanto à abordagem:** Qualitativa e quantitativa — análise de produtividade
  com métricas objetivas.

- **Quanto aos objetivos:** Exploratória e descritiva — explora o uso de IA no
  desenvolvimento e descreve o processo.

- **Quanto aos procedimentos:** Pesquisa-ação — o pesquisador é o próprio
  desenvolvedor do sistema.

## 3.2 Processo de Desenvolvimento

O desenvolvimento seguiu um modelo **iterativo e incremental** com
características de Kanban:

- Sem sprints fixas ou cerimônias formais.
- Fluxo contínuo orientado por funcionalidades.
- Branches git como separação de ambientes (`dev → homolog → main`).
- _Pull Requests_ como pontos de revisão.
- Commits semânticos como registro de progresso (`feat:`, `fix:`, `refactor:`,
  `security:`).

### 3.2.1 Fluxo de Trabalho

```
Ideia / Bug
  └── Branch feature/fix
        └── Desenvolvimento + IA
              └── Commit semântico
                    └── PR → homolog
                          └── Teste manual
                                └── Merge → main
```

## 3.3 Uso de Inteligência Artificial

A IA foi utilizada como ferramenta de desenvolvimento em todas as fases do
projeto, não apenas para geração de código.

### 3.3.1 Ferramentas Utilizadas

| **Ferramenta**                  | **Uso Principal**                                           |
| ------------------------------- | ----------------------------------------------------------- |
| Claude (Anthropic) via Kiro IDE | Geração de código, auditorias, migrations SQL, documentação |
| GitHub Copilot                  | Autocompletar inline no editor                              |

### 3.3.2 Como a IA Foi Utilizada

- **Geração de migrations SQL:** RLS, triggers e RPCs complexas.
- **Scaffolding de componentes:** Seguindo padrões do projeto.
- **Auditorias de segurança:** Identificação de vulnerabilidades em sessões
  dedicadas.
- **Refatorações:** Com contexto de todo o codebase.
- **Documentação técnica:** Geração retroativa de docs a partir do código.
- **Debugging:** Diagnóstico de bugs com análise de contexto.

### 3.3.3 O que a IA Não Fez

- Decisões de produto (escopo, features, UX).
- Testes manuais e validação de fluxos reais.
- Configuração de ambiente e deploy.
- Revisão e aprovação de cada mudança gerada.

## 3.4 Ferramentas e Tecnologias

| **Categoria**    | **Tecnologia**                     | **Versão**              |
| ---------------- | ---------------------------------- | ----------------------- |
| Frontend         | React + TypeScript + Vite          | 18.3.1 / 5.8.3 / 5.4.19 |
| Estilização      | Tailwind CSS + shadcn/ui           | 3.4.17                  |
| Backend/BaaS     | Supabase                           | 2.90.1                  |
| Data fetching    | TanStack Query                     | 5.83.0                  |
| Formulários      | React Hook Form + Zod              | 7.61.1 / 3.25.76        |
| Testes unitários | Vitest + Testing Library           | 3.2.4                   |
| CI/CD            | GitHub Actions                     | —                       |
| IA               | Claude (Anthropic), GitHub Copilot | —                       |

> 🖼️ **Figura:** Tabela de ferramentas formatada para impressão

---

## Assets Necessários

- [ ] 🖼️ Figura: Tabela de ferramentas (versão formatada para impressão)
- [ ] 🖼️ Figura: Fluxo de desenvolvimento (diagrama do processo iterativo)

---

## Referências cruzadas

- **Git Workflow:** Ver [docs/git/workflow.md](../git/workflow.md) para detalhes
  do fluxo de branches e PRs
- **Git Conventions:** Ver [docs/git/conventions.md](../git/conventions.md) para
  padrão de commits semânticos
- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md) para histórico
  completo de 31 sprints implementadas
- **Gestão:** Ver [Cap. 8 — Gestão do Projeto](./cap8-gestao.md) para métricas
  de produtividade com IA
- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md)
  para implementação do modelo iterativo na prática
