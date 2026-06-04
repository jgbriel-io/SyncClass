# TCC — SyncClass

**Trabalho de Conclusão de Curso — Engenharia de Software, FEPI, 8º Período**

**Autor:** João Gabriel Silva Caetano
**Orientador:** Adriano Malerba
**Período:** Janeiro–Junho 2026

---

## Hipóteses

**H1 — Viabilidade Solo com IA:** É possível desenvolver SaaS funcional com IA como aceleradora de produtividade em prazo acadêmico (4,5 meses).

**H2 — Eficiência do Supabase (BaaS):** Supabase reduz ≥60% do esforço de backend comparado a stack tradicional (Node.js + Express + PostgreSQL).

**H3 — Unificação de Processos:** Plataforma unificada reduz tarefas manuais e erros operacionais do professor autônomo.

---

## Métricas do Projeto

| Métrica                    | Valor                              |
| -------------------------- | ---------------------------------- |
| Período de desenvolvimento | 19 jan – 03 jun 2026 (~19 semanas) |
| Sprints implementadas      | 31                                 |
| Commits (branch main)      | 152                                |
| Arquivos TypeScript        | 305 (excl. testes e .d.ts)         |
| Linhas de código (src)     | ~50.000 (excl. tipos gerados)      |
| Migrations SQL             | 70                                 |
| Edge Functions             | 9                                  |
| Testes automatizados       | 304 (28 suites)                    |
| Strings UI centralizadas   | 860+                               |

---

## Status dos Capítulos

| Cap                                                           | Título                   | Rascunho | Final ABNT |
| ------------------------------------------------------------- | ------------------------ | -------- | ---------- |
| [1](./projeto-escrito/capitulos-guia/cap1-introducao.md)      | Introdução               | ✅       | ✅         |
| [2](./projeto-escrito/capitulos-guia/cap2-referencial.md)     | Referencial Teórico      | ✅       | ✅         |
| [3](./projeto-escrito/capitulos-guia/cap3-metodologia.md)     | Metodologia              | ✅       | ⏳         |
| [4](./projeto-escrito/capitulos-guia/cap4-requisitos.md)      | Engenharia de Requisitos | ✅       | ⏳         |
| [5](./projeto-escrito/capitulos-guia/cap5-modelagem.md)       | Arquitetura e Modelagem  | ✅       | ⏳         |
| [6](./projeto-escrito/capitulos-guia/cap6-desenvolvimento.md) | Implementação            | ✅       | ⏳         |
| [7](./projeto-escrito/capitulos-guia/cap7-qualidade.md)       | Qualidade e Testes       | ✅       | ⏳         |
| [8](./projeto-escrito/capitulos-guia/cap8-gestao.md)          | Gestão do Projeto        | ✅       | ⏳         |
| [9](./projeto-escrito/capitulos-guia/cap9-deploy-infra.md)    | Deploy e Infraestrutura  | ✅       | ⏳         |
| [10](./projeto-escrito/capitulos-guia/cap10-conclusao.md)     | Conclusão                | ✅       | ⏳         |

**Legenda:** ✅ Concluído | ⏳ Pendente

---

## Estrutura

```
docs/tcc-8-periodo/
├── README.md                  ← Este arquivo
├── apresentacao/              ← Q&A para defesa
│   └── perguntas-e-respostas.md
├── gestao-projeto/            ← Requisitos, regras, histórico, validação
│   ├── README.md
│   ├── requisitos-funcionais.md      (RF01-RF35)
│   ├── requisitos-nao-funcionais.md  (RNF01-RNF36)
│   ├── regras-de-negocio.md          (62 regras)
│   ├── historico-desenvolvimento.md  (período jan–jun 2026)
│   └── validacao-sprints.md          (validação sprints 1-31)
├── projeto-escrito/           ← Escrita do TCC
│   ├── README.md
│   ├── capitulos/             ← Rascunhos cap1–cap10
│   ├── capitulos-final/        ← Prosa ABNT (caps 1, 2, 3 prontos)
│   ├── listas/                ← Siglas, figuras, quadros
│   ├── assets-pendentes.md
│   ├── decisoes-transversais.md      ← Valores canônicos
│   ├── decisoes-escrita.md           ← Blockers resolvidos por cap
│   ├── referencias-bibliograficas.md ← 28 referências ABNT (canônica)
│   ├── guia-de-normatizacao-e-estrutura-final.md
│   └── revisao-orientador.md  ← Feedback 03/06/2026
└── projeto-pratico/           ← Documentação do código/desenvolvimento
    ├── README.md
    ├── conclusao-desenvolvimento.md
    ├── resumo-orientador.md
    ├── referencias.md
    └── historico-de-desenvolvimento-syncclass.md
```

---

## Links Rápidos

### Escrita

- [Revisão do Orientador](./projeto-escrito/revisao-orientador.md) — bloqueadores e checklist
- [Assets Pendentes](./projeto-escrito/assets-pendentes.md) — figuras, prints, diagramas
- [Referências ABNT](./projeto-escrito/referencias-bibliograficas.md) — 28 entradas prontas para o Word
- [Guia ABNT/FEPI](./projeto-escrito/guia-de-normatizacao-e-estrutura-final.md) — formatação Word

### Projeto Prático

- [Conclusão do Desenvolvimento](./projeto-pratico/conclusao-desenvolvimento.md) — métricas, sprints, hipóteses
- [Resumo para Orientador](./projeto-pratico/resumo-orientador.md) — 1 página executiva
- [Histórico Sprint 1–31](./projeto-pratico/historico-de-desenvolvimento-syncclass.md)

### Gestão

- [Requisitos Funcionais](./gestao-projeto/requisitos-funcionais.md) — RF01-RF35
- [Regras de Negócio](./gestao-projeto/regras-de-negocio.md) — 62 regras com fontes
- [Validação Sprints 1–31](./gestao-projeto/validacao-sprints.md)

### Documentação Técnica

- [Architecture Overview](../architecture/overview.md)
- [Database Overview](../database/overview.md)
- [Security Overview](../security/overview.md)
- [Sprints README](../sprints/README.md)
