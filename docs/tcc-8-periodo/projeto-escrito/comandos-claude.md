# Comandos Claude — TCC SyncClass

Referência rápida de skills, agentes e comandos disponíveis para escrita do TCC.

---

## Fluxo de Escrita (ordem)

```
1. /tcc-rascunho        ← escrever cap final a partir do guia
2. /tcc-revisao-impessoal ← QA: voz, clichês, siglas, citações
3. /tcc-revisar cap N   ← orientador severo antes de marcar final
```

---

## Skills de Escrita

| Comando                  | O que faz                                                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tcc-rascunho`          | Molda `capitulos-guia/cap*.md` em prosa ABNT parágrafo a parágrafo. Propõe aberturas candidatas, argumenta formato (prosa/tabela/lista). Salva em `capitulos-final/`. |
| `/tcc-revisao-impessoal` | Varredura de 1ª pessoa, clichês, informalidade, siglas sem expansão, figuras sem chamada, citações órfãs. Gera relatório + opção de aplicar correções.                |
| `/tcc-fragmentos`        | Captura matéria-prima bruta (notas, ideias, citações) antes de escrever. Não usar — rascunhos-guia já estão prontos.                                                  |

---

## Revisão e Qualidade

| Comando              | O que faz                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/tcc-revisar cap N` | Invoca agent `tcc-orientador` no capítulo N. Feedback de orientador severo: argumento, evidência, coesão, aderência ao SyncClass. |
| `/grill-me-tcc`      | Simulação de banca. Uma pergunta por vez sobre H1/H2/H3, metodologia, escopo, técnico, referencial, resultados.                   |

---

## Acompanhamento

| Comando       | O que faz                                                                             |
| ------------- | ------------------------------------------------------------------------------------- |
| `/tcc-status` | Snapshot de progresso dos 10 caps — quais estão finalizados, pendentes, com blockers. |

---

## Referências de Conteúdo

Antes de afirmar qualquer número ou fato técnico, ler:

| Arquivo                                     | Contém                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `decisoes-transversais.md`                  | Valores canônicos: 152 commits, 31 RF, 37 hooks, 70 migrations, 4,5 meses, 304 testes |
| `decisoes-escrita.md`                       | Decisões por capítulo — o que escrever em cada blocker                                |
| `revisao-orientador.md`                     | Problemas identificados por cap + checklist de correções                              |
| `referencias-bibliograficas.md`             | 23 referências validadas                                                              |
| `guia-de-normatizacao-e-estrutura-final.md` | Normas FEPI/ABNT: margens, fontes, citações, figuras                                  |

---

## Pastas

| Pasta              | Uso                                                             |
| ------------------ | --------------------------------------------------------------- |
| `capitulos-guia/`  | Rascunhos com decisões aplicadas — base para escrever os finais |
| `capitulos-final/` | Versões finais em prosa ABNT — entrega                          |

---

## Status dos Caps (03/06/2026)

| Cap | Título                   | Status                                   |
| --- | ------------------------ | ---------------------------------------- |
| 1   | Introdução               | 🟠 Guia pronto                           |
| 2   | Referencial Teórico      | 🟠 Guia pronto                           |
| 3   | Metodologia              | 🟠 Guia pronto                           |
| 4   | Engenharia de Requisitos | 🟠 Guia pronto                           |
| 5   | Arquitetura e Modelagem  | 🟠 Guia pronto (DER pendente — manual)   |
| 6   | Implementação            | 🟠 Guia pronto                           |
| 7   | Qualidade e Testes       | 🟠 Guia pronto                           |
| 8   | Gestão do Projeto        | 🟠 Guia pronto (Gantt pendente — manual) |
| 9   | Infraestrutura e Deploy  | 🟠 Guia pronto                           |
| 10  | Conclusão                | 🟠 Guia pronto                           |

---

## Pendências Manuais (não bloqueiam escrita dos outros caps)

- **Cap 5:** gerar DER no dbdiagram.io e inserir no Word
- **Cap 8:** gerar Gantt retroativo e inserir no Word
- **Caps 3, 4, 7, 10:** Forms/Apêndice A — criar e distribuir na faculdade antes de finalizar esses caps
