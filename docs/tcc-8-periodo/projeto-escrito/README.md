# Projeto Escrito — TCC SyncClass

**Última Atualização:** 2026-06-03

Documentação escrita do TCC. Contém rascunhos dos 10 capítulos, versões finais formatadas, listas ABNT, referências e revisão do orientador.

---

## Estrutura

```
docs/tcc-8-periodo/projeto-escrito/
├── README.md                                  ← Este arquivo
├── capitulos/                                 ← Rascunhos de trabalho (cap1–cap10)
│   ├── cap1-introducao.md
│   ├── cap2-referencial.md
│   ├── cap3-metodologia.md
│   ├── cap4-requisitos.md
│   ├── cap5-modelagem.md
│   ├── cap6-desenvolvimento.md
│   ├── cap7-qualidade.md
│   ├── cap8-gestao.md
│   ├── cap9-deploy-infra.md
│   └── cap10-conclusao.md
├── capitulos-final/                            ← Prosa ABNT revisada (caps entregáveis)
│   ├── capitulo1-final.md                     ← reescrita pendente (blockers cap1)
│   ├── capitulo2-final.md                     ← reescrita pendente
│   └── capitulo3-final.md                     ← rascunho de referência (reescrever)
├── listas/                                    ← Elementos pré-textuais
│   ├── lista-de-figuras.md
│   ├── lista-de-quadros.md
│   └── lista-de-siglas.md
├── assets-pendentes.md                        ← Checklist de figuras/prints a capturar
├── decisoes-transversais.md                   ← Valores canônicos (prazo, commits, RF, H1-H3)
├── decisoes-escrita.md                        ← Blockers resolvidos por capítulo
├── guia-de-normatizacao-e-estrutura-final.md  ← Regras ABNT/FEPI para Word
├── referencias-bibliograficas.md              ← 28 referências em ABNT — fonte canônica
└── revisao-orientador.md                      ← Feedback do orientador (03/06/2026)
```

---

## Status dos Capítulos

| Cap | Título                   | Rascunho | Final ABNT                           | Observação                                             |
| --- | ------------------------ | -------- | ------------------------------------ | ------------------------------------------------------ |
| 1   | Introdução               | ✅       | 🔁 reescrever (`capitulo1-final.md`) | 7 blockers críticos — ver `revisao-orientador.md`      |
| 2   | Referencial Teórico      | ✅       | 🔁 reescrever (`capitulo2-final.md`) | Reescrita manual                                       |
| 3   | Metodologia              | ✅       | 🔁 reescrever (`capitulo3-final.md`) | Rascunho de referência gerado — reescrever manualmente |
| 4   | Engenharia de Requisitos | ✅       | ⏳ pendente                          | —                                                      |
| 5   | Arquitetura e Modelagem  | ✅       | ⏳ pendente                          | Assets: DER + diagrama arq. pendentes                  |
| 6   | Implementação            | ✅       | ⏳ pendente                          | Assets: prints das telas pendentes                     |
| 7   | Qualidade e Testes       | ✅       | ⏳ pendente                          | Assets: output de testes pendente                      |
| 8   | Gestão do Projeto        | ✅       | ⏳ pendente                          | Assets: Gantt pendente                                 |
| 9   | Deploy e Infraestrutura  | ✅       | ⏳ pendente                          | —                                                      |
| 10  | Conclusão                | ✅       | ⏳ pendente                          | Último — depende de todos os outros                    |

**Legenda:** ✅ pronto · ⏳ a fazer · 🔁 reescrever versão existente

Todos os rascunhos têm seção `## Planejamento` no topo (estrutura, citações planejadas, pendências).

### Valores canônicos (usar em todos os capítulos)

| Grandeza             | Valor canônico                                   |
| -------------------- | ------------------------------------------------ |
| Prazo real           | 4,5 meses (19 jan – 03 jun 2026)                 |
| Commits              | 152                                              |
| Migrations           | 70                                               |
| RF implementados     | 31                                               |
| RF trabalhos futuros | 4                                                |
| Testes automatizados | 304                                              |
| H2 limiar            | ≥60% de redução de esforço backend               |
| Metodologia          | modelo iterativo incremental com ciclos semanais |

Ver `capitulos-final/decisoes-transversais.md` para justificativas.

---

## Arquivos de Suporte

### `revisao-orientador.md`

Revisão completa de 03/06/2026 via 10 agents tcc-orientador em paralelo.
Contém: problemas transversais, críticos por capítulo, importantes, perguntas da banca e checklist de correções priorizadas.

**Bloqueadores antes de qualquer entrega:** ver seção "Checklist de Correções Prioritárias".

### `assets-pendentes.md`

Checklist de todos os elementos visuais necessários por capítulo (prints, diagramas, Gantt, DER, output de testes). Prioridades: DER (cap5), prints das telas (cap6), Gantt (cap8).

### `referencias-bibliograficas.md`

28 referências em formato ABNT — fonte canônica para o Word. Atualizado Jun/2026.
Inclui: Fowler (MonolithFirst), TanStack, Thiollent, Tripp, Vercel/shadcn, Wohlin, Cohn.

### `guia-de-normatizacao-e-estrutura-final.md`

Regras ABNT/FEPI: margens, fontes, espaçamento, voz acadêmica, estrutura dos 10 capítulos. Usar para auditoria do Word antes da entrega.

### `listas/`

| Arquivo               | Status                                                  |
| --------------------- | ------------------------------------------------------- |
| `lista-de-siglas.md`  | ✅ 29 siglas — atualizado Jun/2026                      |
| `lista-de-figuras.md` | ⏳ Preencher quando figuras forem inseridas no Word     |
| `lista-de-quadros.md` | ⏳ Preencher quando Quadros estiverem numerados no Word |

---

## Fluxo de Trabalho

```
capitulos/cap*.md                     ← rascunho + iteração com orientador
       ↓  (tcc-rascunho skill)
capitulos-final/cap*-final.md          ← prosa ABNT, voz impessoal
       ↓  (copiar para Word)
Arquivo .docx final                   ← formatação Word + listas + referências
```

### Ordem de escrita recomendada (caps 3–10)

1. **Step 0:** criar `capitulos-final/decisoes-transversais.md` (valores canônicos)
2. Cap 3 → Cap 8 (compartilham blocker metodologia/prazo)
3. Cap 4 → Cap 5 (requisitos antes de modelagem)
4. Cap 6 → Cap 7 (implementação antes de qualidade)
5. Cap 9 (deploy — independente)
6. **Cap 10 por último** (depende de todos)
7. Caps 1 e 2: reescrita manual separada

> Caps 1 e 2 têm versão existente em `capitulos-final/` mas precisam de reescrita completa. Fora do escopo da escrita assistida — tratar manualmente após caps 3–10 concluídos.

---

## Referências

- **Gestão de Projeto:** `docs/tcc-8-periodo/gestao-projeto/`
- **Projeto Prático:** `docs/tcc-8-periodo/projeto-pratico/`
- **Sprints:** `docs/sprints/`
