---
name: syncclass-tcc
description: TCC SyncClass writing guide — FEPI/ABNT 2026 norms, impersonal voice, 10-chapter structure, academic vocabulary, code-to-text translation patterns. Use when writing, reviewing, or finalizing TCC chapters. For drafting process, use global skills tcc-fragmentos, tcc-rascunho, tcc-revisao-impessoal.
---

# TCC Writing — SyncClass

Escrita acadêmica para TCC SyncClass — 10 capítulos, normas FEPI/ABNT 2026.

## Normas Obrigatórias

### Voz e Tom
- **Impessoalidade absoluta:** Voz passiva ou terceira pessoa do singular.
- **NUNCA primeira pessoa:** Proibido "eu", "nós", "desenvolvemos", "implementei".

### Formatação (Word)
- **Fonte:** Arial ou Times New Roman, tamanho **12**. Secundária: **10**.
- **Espaçamento:** 1,5 no corpo | Simples em citações e legendas.
- **Recuo parágrafo:** 1,25 cm primeira linha. **Alinhamento:** Justificado.
- **Margens:** Superior/Esquerda 3 cm | Inferior/Direita 2 cm.

### Citações
- **Curta (≤ 3 linhas):** Entre aspas no corpo: "Lorem ipsum..." (AUTOR, ano).
- **Longa (> 3 linhas):** Recuo 4 cm, fonte 10, espaço simples, sem aspas, (AUTOR, ano) após.
- **Indireta:** Paráfrase sem aspas com (AUTOR, ano) no final.

### Figuras e Tabelas
```
Figura X – Título da Figura         (tamanho 12, centralizado, ACIMA)
[imagem/tabela]
Fonte: O autor (2026).              (tamanho 10, centralizado, ABAIXO)
```
Toda figura/tabela deve ser mencionada **antes** de aparecer no texto.

## Estrutura (5 Capítulos + Cronograma — definida pelo orientador 03/06/2026)

| Cap. | Título | Status |
|------|--------|--------|
| 1 | Introdução | ✅ Final escrito |
| 2 | Referencial Teórico | ✅ Final escrito |
| 3 | Metodologia (absorve ex-caps 4-9 como subtópicos 3.4-3.9) | 🟠 Guia pronto; final a reescrever |
| 4 | Resultados e Discussão | 🟠 Guia pronto |
| 5 | Conclusão (com trabalhos futuros) | 🟠 Guia pronto |
| 6 | Cronograma de Atividades | 🟠 Guia pronto (Gantt pendente) |
| — | Apêndices A–E (Forms, RF, RNF/RN, UCs, matriz) | 🟠 Guia pronto |

**Regras de estilo (além da voz impessoal):** terceira pessoa; sem travessão como pontuação em prosa; sem jargão de IA; "iteração" no lugar de "Sprint".

**Fluxo:**
- Rascunhos (guia/base): `docs/tcc-8-periodo/projeto-escrito/capitulos-guia/cap{N}-*.md`
- Versões finais (entrega): `docs/tcc-8-periodo/projeto-escrito/capitulos-final/capitulo{N}-final.md`
- Estrutura canônica: `decisoes-transversais.md` §0

## Traduzir Código Real → Texto Acadêmico

Fontes verídicas do projeto (ler antes de afirmar):
- `docs/tcc-8-periodo/projeto-escrito/decisoes-transversais.md` — valores canônicos (152 commits, 31 RF, 37 hooks, 70 migrations, ~3 meses março–junho 2026)
- `docs/tcc-8-periodo/projeto-escrito/decisoes-escrita.md` — decisões por capítulo
- `docs/architecture/overview.md` — diagramas, camadas
- `docs/sprints/` — 31 sprints
- `supabase/migrations/` — 70 migrations
- `package.json` — versões exatas

### Padrões de Tradução

| ❌ Evitar | ✅ Preferir |
|----------|-------------|
| "fiz", "implementei" | "foi implementado", "implementou-se" |
| "achei melhor" | "optou-se por", "considerou-se mais adequado" |
| "muito rápido" | "tempo de resposta inferior a 2s (RNF06)" |
| "no código" | "no código-fonte" |
| "a gente fez" | "realizou-se", "desenvolveu-se" |
| "deu certo" | "obteve êxito", "validou-se" |

### Estrutura de Justificativa Técnica

```
1. CONTEXTO    — Qual problema/necessidade existia?
2. ALTERNATIVAS — Que opções foram consideradas?
3. CRITÉRIOS   — Por que a escolhida atende melhor?
```

### Conectivos Acadêmicos

- Causalidade: "em virtude de", "uma vez que", "tendo em vista que"
- Adversidade: "no entanto", "todavia", "em contrapartida"
- Conclusão: "portanto", "desta forma", "depreende-se que"
- Adição: "ademais", "além disso", "outrossim"

## Checklist Antes de Enviar Capítulo

- [ ] Voz passiva/3ª pessoa — zero primeira pessoa
- [ ] Todas as figuras/tabelas citadas antes de aparecer
- [ ] Fontes: 12 corpo, 10 legendas/citações
- [ ] Todas as citações estão na lista de referências?
- [ ] Termos técnicos explicados na primeira aparição?
- [ ] Sem pontuação ao fim de títulos

## Referências Base

Ver: `docs/tcc-8-periodo/projeto-escrito/referencias-bibliograficas.md`
- Thiollent, M. (2011) — Pesquisa-Ação
- Tripp, D. (2005) — Pesquisa-ação: introdução metodológica
- Anderson, D. J. (2010) — Kanban (referência para fluxo contínuo)
- Pressman, R. S.; Maxim, B. R. (2016) — Engenharia de Software (modelo iterativo incremental)
- Fowler, M. (2015) — MonolithFirst (justificativa arquitetural)
- Mell, P.; Grance, T. (NIST, 2011) — The NIST Definition of Cloud Computing (BaaS/H2)
- ISO/IEC 25010 — Modelo de Qualidade
- Lei nº 13.709/2018 — LGPD (Art. 16, I)
