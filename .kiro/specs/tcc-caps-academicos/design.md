# Design: Versões Acadêmicas TCC

## Arquitetura

```
Input: docs/tcc/tecnico/cap{N}-{slug}.md
  ↓
Workflow: /tcc-fragmentos → /tcc-rascunho → /tcc-writing-style
  ↓
Output: docs/tcc/academico/cap{N}-{slug}.md
```

## Componentes

### 1. Leitor de Cap Técnico

- Lê `docs/tcc/tecnico/cap{N}-{slug}.md`
- Extrai: seções, parágrafos, tabelas, refs cruzadas
- Preserva: estrutura, assets pendentes

### 2. Conversor Voz Impessoal

- Identifica voz ativa direta
- Converte → 3ª pessoa ou passiva
- Exemplos:
  - "Desenvolvemos" → "Desenvolveu-se"
  - "Implementei" → "O sistema implementa"
  - "Vamos" → "A plataforma oferece"

### 3. Quebrador de Parágrafos

- Identifica parágrafos >5 linhas
- Quebra em múltiplos parágrafos (1 ideia cada)
- Adiciona quebras de linha ~80-100 chars

### 4. Validador de Travessões

- Identifica travessões
- Valida: legal/contraste forte?
- Remove: travessões dramáticos/explicativos

### 5. Detector de Jargões IA

- Lista: "nesse contexto", "vale destacar", "cabe ressaltar"
- Remove ou substitui por texto direto

### 6. Integrador de Refs ABNT

- Lê `referencias-bibliograficas.md`
- Formata citações: (AUTOR, ano)
- Citações longas: recuo 4cm, fonte 10

### 7. Gerador de Cap Acadêmico

- Monta arquivo final
- Preserva: estrutura, assets, refs cruzadas
- Adiciona: status, data, resumo

## Fluxo de Dados

```
cap1-introducao.md (técnico)
  ↓
[Leitor] → extrai seções
  ↓
[Conversor Voz] → impessoal
  ↓
[Quebrador] → parágrafos ≤5 linhas
  ↓
[Validador Travessões] → remove dramáticos
  ↓
[Detector Jargões] → remove IA
  ↓
[Integrador Refs] → ABNT
  ↓
[Gerador] → cap1-introducao.md (acadêmico)
```

## Estrutura de Arquivo Acadêmico

```markdown
> **Status:** 🟡 Versão Acadêmica
> **Última Atualização:** DD/MM/AAAA

**Resumo:** [2-3 frases contextuais]

## 1.1 Seção

Parágrafo 1 (≤5 linhas, quebra ~80-100 chars).
Uma ideia por parágrafo.

Parágrafo 2 com citação (AUTOR, ano).

### 1.1.1 Subseção

Conteúdo...

---

## Assets Necessários

- [ ] 🖼️ Figura: ...

---

## Referências cruzadas

- **Link:** Ver [arquivo](caminho)
```

## Regras de Transformação

### Voz Impessoal

| Técnico                    | Acadêmico                         |
| -------------------------- | --------------------------------- |
| "Desenvolvemos o sistema"  | "Desenvolveu-se o sistema"        |
| "Implementei autenticação" | "A autenticação foi implementada" |
| "Vamos analisar"           | "Analisa-se"                      |
| "Nosso projeto"            | "O projeto"                       |

### Parágrafos

**Antes (técnico):**

```
O mercado de ensino de idiomas no Brasil é composto majoritariamente por professores autônomos e pequenas escolas que dependem de ferramentas genéricas — planilhas, WhatsApp, aplicativos de agenda — para gerenciar suas operações. Essa fragmentação gera retrabalho, perda de informações e dificuldade de acompanhamento financeiro. Plataformas SaaS especializadas para esse nicho são escassas ou inacessíveis financeiramente para professores individuais.
```

**Depois (acadêmico):**

```
O mercado de ensino de idiomas no Brasil é composto majoritariamente
por professores autônomos e pequenas escolas.
Essas instituições dependem de ferramentas genéricas para gerenciar
suas operações: planilhas, WhatsApp e aplicativos de agenda.

Essa fragmentação gera retrabalho, perda de informações e dificuldade
de acompanhamento financeiro.
Plataformas SaaS especializadas para esse nicho são escassas ou
inacessíveis financeiramente para professores individuais.
```

### Travessões

**Remover:**

```
O sistema — que foi desenvolvido em React — oferece...
```

**Manter:**

```
A Lei nº 13.709/2018 — Lei Geral de Proteção de Dados — estabelece...
```

### Jargões IA

**Antes:**

```
Nesse contexto, vale destacar que o uso de IA aumenta a produtividade.
```

**Depois:**

```
O uso de IA aumenta a produtividade em tarefas de desenvolvimento.
```

## Validação

### Checklist por Capítulo

- [ ] Voz impessoal 100%
- [ ] Parágrafos ≤5 linhas
- [ ] Quebra ~80-100 chars/linha
- [ ] Zero jargões IA
- [ ] Travessões apenas legal/contraste
- [ ] Refs ABNT integradas
- [ ] Estrutura preservada
- [ ] Assets marcados
- [ ] Refs cruzadas no final

## Ferramentas

### Skills Kiro

1. `/tcc-fragmentos`: captura material bruto
2. `/tcc-rascunho`: molda em seções ABNT
3. `/tcc-writing-style`: revisão final

### Arquivos de Apoio

- `guia-de-normatizacao-e-estrutura-final.md`: regras ABNT/FEPI
- `referencias-bibliograficas.md`: refs disponíveis

## Ordem de Processamento

1. Cap 1 - Introdução ← começar
2. Cap 2 - Referencial
3. Cap 3 - Metodologia
4. Cap 4 - Requisitos
5. Cap 5 - Modelagem
6. Cap 6 - Desenvolvimento
7. Cap 7 - Qualidade
8. Cap 8 - Gestão
9. Cap 9 - Deploy
10. Cap 10 - Conclusão

## Critérios de Sucesso

### Cap 1 completo quando:

- Arquivo `docs/tcc/academico/cap1-introducao.md` existe
- Passa checklist de validação
- Usuário aprova conteúdo

### Projeto completo quando:

- 10 caps acadêmicos gerados
- Todos passam checklist
- Prontos para Word final
