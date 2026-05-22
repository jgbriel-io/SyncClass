# Spec: Versões Acadêmicas dos Capítulos TCC

## Contexto

Projeto TCC SyncClass tem 10 caps técnicos em `docs/tcc/tecnico/`. Precisam versões acadêmicas (voz impessoal, ABNT, parágrafos ≤5 linhas, quebra ~80-100 chars/linha) em `docs/tcc/academico/`.

## Workflow

1. **Fragmentos** (`/tcc-fragmentos`): captura material bruto, voz livre
2. **Rascunho** (`/tcc-rascunho`): molda em seções, voz impessoal, ABNT
3. **Revisão** (`/tcc-writing-style`): checklist travessões, jargões IA, quebra linhas

## Estrutura

```
docs/tcc/
├── _fragmentos/
│   └── cap{N}-fragmentos.md
├── academico/
│   └── cap{N}-{slug}.md
└── tecnico/
    └── cap{N}-{slug}.md (já existe)
```

## Regras Acadêmicas

### Voz

- Impessoal absoluta (3ª pessoa ativa > passiva)
- ❌ "Desenvolvemos", "Implementei", "Vamos"
- ✅ "O sistema implementa", "A plataforma oferece", "Desenvolveu-se"

### Parágrafos

- ≤5 linhas
- Quebra ~80-100 chars/linha
- Uma ideia por parágrafo

### Travessões

- Só: identificação legal ou contraste narrativo forte
- ❌ "O sistema — que foi desenvolvido em React — oferece..."
- ✅ "A Lei nº 13.709/2018 — Lei Geral de Proteção de Dados — estabelece..."

### Jargões IA (evitar)

- "nesse contexto", "vale destacar", "cabe ressaltar"
- "é importante notar", "vale mencionar"
- Preferir: direto ao ponto

### Citações ABNT

- Direta curta (≤3 linhas): no corpo, entre aspas
- Direta longa (>3 linhas): recuo 4cm, fonte 10, sem aspas
- Indireta: sem aspas, (AUTOR, ano) no final

## Capítulos (ordem de criação)

1. **Cap 1 - Introdução** ← começar aqui
2. Cap 2 - Referencial
3. Cap 3 - Metodologia
4. Cap 4 - Requisitos
5. Cap 5 - Modelagem
6. Cap 6 - Desenvolvimento
7. Cap 7 - Qualidade
8. Cap 8 - Gestão
9. Cap 9 - Deploy
10. Cap 10 - Conclusão

## Requisitos Funcionais

### RF01: Criar estrutura de pastas

- Criar `docs/tcc/_fragmentos/` se não existe
- Criar `docs/tcc/academico/` se não existe

### RF02: Processar Cap 1 - Introdução

- Ler `docs/tcc/tecnico/cap1-introducao.md`
- Aplicar workflow (fragmentos → rascunho → revisão)
- Gerar `docs/tcc/academico/cap1-introducao.md`
- Preservar:
  - Estrutura de seções (1.1, 1.2, etc)
  - Tabelas (estrutura organizacional)
  - Referências cruzadas no final
  - Status e data no topo

### RF03: Adaptar conteúdo técnico → acadêmico

- Converter voz ativa direta → impessoal
- Quebrar parágrafos longos (>5 linhas)
- Adicionar quebras de linha (~80-100 chars)
- Remover jargões IA
- Validar travessões (só legal/contraste forte)

### RF04: Integrar referências ABNT

- Usar refs de `docs/tcc/tcc-8-periodo/projeto-escrito/referencias-bibliograficas.md`
- Formato: (AUTOR, ano) ou AUTOR (ano)
- Citações longas: recuo 4cm, fonte 10

### RF05: Preservar assets pendentes

- Manter marcadores `🖼️` para figuras/tabelas
- Não criar assets — apenas marcar onde vão

## Requisitos Não Funcionais

### RNF01: Qualidade textual

- Parágrafos ≤5 linhas
- Quebra ~80-100 chars/linha
- Voz impessoal 100%
- Zero jargões IA

### RNF02: Conformidade ABNT

- Citações formatadas corretamente
- Refs cruzadas preservadas
- Estrutura de seções mantida

### RNF03: Rastreabilidade

- Versão técnica preservada em `/tecnico/`
- Versão acadêmica em `/academico/`
- Fragmentos em `/_fragmentos/` (opcional)

## Regras de Negócio

### RN01: Não perder conteúdo técnico

- Versão técnica é fonte de verdade
- Versão acadêmica adapta tom, não remove info

### RN02: Workflow sequencial

- Fragmentos → Rascunho → Revisão
- Não pular etapas

### RN03: Um capítulo por vez

- Completar Cap 1 antes de Cap 2
- Validar com usuário antes de próximo

## Casos de Uso

### UC01: Criar versão acadêmica Cap 1

1. Ler `docs/tcc/tecnico/cap1-introducao.md`
2. Aplicar workflow (3 skills)
3. Gerar `docs/tcc/academico/cap1-introducao.md`
4. Validar com usuário

### UC02: Processar capítulos restantes

1. Repetir UC01 para Cap 2-10
2. Ordem: 1 → 2 → 3 → ... → 10

## Critérios de Aceitação

### Cap 1 completo quando:

- ✅ Arquivo `docs/tcc/academico/cap1-introducao.md` existe
- ✅ Voz impessoal 100%
- ✅ Parágrafos ≤5 linhas
- ✅ Quebra ~80-100 chars/linha
- ✅ Zero jargões IA
- ✅ Travessões apenas legal/contraste
- ✅ Refs ABNT integradas
- ✅ Estrutura de seções preservada
- ✅ Assets marcados (🖼️)
- ✅ Refs cruzadas no final

## Referências

- Guia: `docs/tcc/tcc-8-periodo/projeto-escrito/guia-de-normatizacao-e-estrutura-final.md`
- Refs: `docs/tcc/tcc-8-periodo/projeto-escrito/referencias-bibliograficas.md`
- Caps técnicos: `docs/tcc/tecnico/cap{1-10}-*.md`
