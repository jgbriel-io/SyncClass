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
├── capitulo-final/                            ← Prosa ABNT revisada (caps prontos)
│   ├── capitulo1-final.md
│   └── capitulo2-final.md
├── listas/                                    ← Elementos pré-textuais
│   ├── lista-de-figuras.md
│   ├── lista-de-quadros.md
│   └── lista-de-siglas.md
├── assets-pendentes.md                        ← Checklist de figuras/prints a capturar
├── guia-de-normatizacao-e-estrutura-final.md  ← Regras ABNT/FEPI para Word
├── referencias-bibliograficas.md              ← Staging Obsidian (rascunho de referências)
├── referencias-final.md                       ← Referências em ABNT — fonte canônica
└── revisao-orientador.md                      ← Feedback do orientador (03/06/2026)
```

---

## Status dos Capítulos

| Cap | Título                   | Rascunho                 | Final ABNT              |
| --- | ------------------------ | ------------------------ | ----------------------- |
| 1   | Introdução               | ✅ com `## Planejamento` | ✅ `capitulo1-final.md` |
| 2   | Referencial Teórico      | ✅ com `## Planejamento` | ✅ `capitulo2-final.md` |
| 3   | Metodologia              | ✅ com `## Planejamento` | ⏳ pendente             |
| 4   | Engenharia de Requisitos | ✅ com `## Planejamento` | ⏳ pendente             |
| 5   | Arquitetura e Modelagem  | ✅ com `## Planejamento` | ⏳ pendente             |
| 6   | Implementação            | ✅ com `## Planejamento` | ⏳ pendente             |
| 7   | Qualidade e Testes       | ✅ com `## Planejamento` | ⏳ pendente             |
| 8   | Gestão do Projeto        | ✅ com `## Planejamento` | ⏳ pendente             |
| 9   | Deploy e Infraestrutura  | ✅ com `## Planejamento` | ⏳ pendente             |
| 10  | Conclusão                | ✅ com `## Planejamento` | ⏳ pendente             |

Todos os rascunhos têm seção `## Planejamento` no topo (estrutura, citações planejadas, pendências).

---

## Arquivos de Suporte

### `revisao-orientador.md`

Revisão completa de 03/06/2026 via 10 agents tcc-orientador em paralelo.
Contém: problemas transversais, críticos por capítulo, importantes, perguntas da banca e checklist de correções priorizadas.

**Bloqueadores antes de qualquer entrega:** ver seção "Checklist de Correções Prioritárias".

### `assets-pendentes.md`

Checklist de todos os elementos visuais necessários por capítulo (prints, diagramas, Gantt, DER, output de testes). Prioridades: DER (cap5), prints das telas (cap6), Gantt (cap8).

### `referencias-final.md`

27 referências em formato ABNT — fonte canônica para o Word. Atualizado Jun/2026.
Inclui: Fowler (MonolithFirst), TanStack, Thiollent, Tripp, Vercel/shadcn, Wohlin.

### `referencias-bibliograficas.md`

Staging em formato Obsidian. Contém guia de aplicação por capítulo. Usar apenas para consulta — `referencias-final.md` é a fonte para o Word.

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
capitulos/cap*.md          ← rascunho + iteração com orientador
       ↓  (tcc-rascunho skill)
capitulo-final/cap*-final.md  ← prosa ABNT, voz impessoal
       ↓  (copiar para Word)
Arquivo .docx final        ← formatação Word + listas + referências
```

---

## Referências

- **Gestão de Projeto:** `docs/tcc-8-periodo/gestao-projeto/`
- **Projeto Prático:** `docs/tcc-8-periodo/projeto-pratico/`
- **Sprints:** `docs/sprints/`
