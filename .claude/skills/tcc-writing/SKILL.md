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

## Estrutura dos 10 Capítulos

| Cap. | Título | Status |
|------|--------|--------|
| 1 | Introdução | ✅ Concluído |
| 2 | Referencial Teórico | 🟠 Rascunho |
| 3 | Metodologia | 🔴 Pendente |
| 4 | Engenharia de Requisitos | 🔴 Pendente |
| 5 | Arquitetura e Modelagem | 🔴 Pendente |
| 6 | Implementação Técnica | 🔴 Pendente |
| 7 | Qualidade e Testes | 🔴 Pendente |
| 8 | Gestão do Projeto | 🔴 Pendente |
| 9 | Infraestrutura e Deploy | 🔴 Pendente |
| 10 | Conclusão | 🔴 Pendente |

Arquivos: `docs/tcc/cap{N}-{slug}.md`

## Traduzir Código Real → Texto Acadêmico

Fontes verídicas do projeto (ler antes de afirmar):
- `docs/tcc/tcc-referencia.md` — números, RFs/RNFs
- `docs/architecture/overview.md` — diagramas, camadas
- `docs/sprints/` — 24 sprints
- `supabase/migrations/` — 25 migrations
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

Ver: `docs/tcc/tcc-8-periodo/projeto-escrito/Referências Bibliográficas.md`
- Eric Ries — *A startup enxuta* (MVP)
- NIST — *The NIST Definition of Cloud Computing*
- ISO/IEC 25010 — Modelo de Qualidade
- Lei nº 13.709/2018 — LGPD
