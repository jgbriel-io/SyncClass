# Sprint N — Título Descritivo

> **Nomenclatura do arquivo:** `sprint-NN-tipo-descricao-kebab-case.md`
> - Tipos válidos: `mvp`, `refactor`, `fix`
> - Exemplo: `sprint-01-mvp-crud-basico-financeiro.md`
> - Não implementadas: sufixo `-NAO-IMPLEMENTADA.md`

**Período:** DD mês – DD mês YYYY
**Status:** ✅ Concluída | 🚧 Em andamento | ⏸️ Pausada
**Tipo:** MVP | Refactor | Fix
**Prioridade:** 🔴 Alta | 🟡 Média | 🟢 Baixa

## Problem Statement

Descrição clara e técnica do problema que motivou a sprint:
- Qual era o estado atual do sistema
- Quais sintomas/dores foram observados
- Por que isso era um problema (impacto técnico, UX, manutenção)
- Quantificação quando possível (ex: "~170 strings hardcoded", "6 páginas duplicando lógica")

## Requirements

Lista objetiva do que precisa ser entregue:
- Requisito funcional 1
- Requisito funcional 2
- Requisito não-funcional 1
- Critérios de aceitação claros
- O que NÃO está no escopo (se relevante)

## Background

Contexto técnico necessário para entender a solução:
- Stack/tecnologias envolvidas
- Arquitetura atual relevante
- Padrões já estabelecidos no projeto
- Arquivos/pastas existentes que serão afetados
- Convenções que devem ser seguidas

## Proposed Solution

Descrição da abordagem escolhida:
- Arquitetura da solução
- Estrutura de pastas/arquivos a ser criada
- Padrões de código a serem seguidos
- Exemplos de uso da solução
- Por que essa abordagem foi escolhida (vs alternativas)

Pode incluir:
```
Estrutura proposta:
src/
├── nova-pasta/
│   ├── arquivo1.ts
│   └── arquivo2.ts
```

## Task Breakdown

### Task 1: Título da Task

- **Objetivo:** O que essa task entrega
- **Implementação:** Detalhes técnicos do que será feito
  - Sub-item 1
  - Sub-item 2
- **Arquivos afetados:** Lista de arquivos criados/modificados
- **Teste:** Como validar que funcionou
- **Demo:** Resultado observável

### Task 2: Título da Task

- **Objetivo:** ...
- **Implementação:** ...
- **Arquivos afetados:** ...
- **Teste:** ...
- **Demo:** ...

(Continuar para todas as tasks)

## Implementation Details

### Categoria 1 (ex: Migrations, Components, Hooks)

| Item | Descrição | Arquivo |
|------|-----------|---------|
| Nome técnico | O que faz | `caminho/arquivo.ts` |

### Categoria 2

...

## Files Created

```
src/
├── pasta/
│   ├── arquivo1.ts          ← descrição breve
│   ├── arquivo2.tsx         ← descrição breve
│   └── arquivo3.ts          ← descrição breve
```

## Files Modified

- `src/caminho/arquivo.ts` — o que mudou e por quê
- `src/caminho/arquivo.tsx` — o que mudou e por quê
- `docs/arquivo.md` — o que mudou e por quê

## Testing & Validation

- [ ] Build sem erros (`npm run build`)
- [ ] Type-check passou (`npm run type-check`)
- [ ] Lint passou (`npm run lint`)
- [ ] Testes unitários passaram (`npm run test`)
- [ ] Teste manual: [descrever cenário testado]
- [ ] Validação: [métrica ou resultado observado]

## Results & Impact

### Métricas Quantitativas
- ✅ X arquivos criados
- ✅ Y arquivos modificados
- ✅ Z strings centralizadas
- ✅ Performance: antes X ms → depois Y ms
- ✅ Redução de duplicação: X linhas removidas

### Melhorias Qualitativas
- ✅ Melhoria 1 (ex: "Manutenção simplificada")
- ✅ Melhoria 2 (ex: "Estrutura pronta para i18n")
- ✅ Melhoria 3 (ex: "Consistência garantida")

## Technical Debt

Itens identificados mas não resolvidos nesta sprint:

- [ ] Item pendente 1 — justificativa de por que ficou pendente
- [ ] Item pendente 2 — justificativa de por que ficou pendente

## Lessons Learned

### O que funcionou bem
- ✅ Decisão/abordagem que acelerou o trabalho
- ✅ Ferramenta/padrão que facilitou a implementação
- ✅ Prática que evitou bugs ou retrabalho

### O que poderia melhorar
- ⚠️ Problema encontrado e como foi contornado
- ⚠️ Abordagem que gerou complexidade desnecessária
- ⚠️ Gap de conhecimento que atrasou a entrega

### Aplicações futuras
- 💡 Aprendizado que será usado em próximas sprints
- 💡 Padrão que deve ser replicado
- 💡 Anti-pattern que deve ser evitado

## Next Steps

O que vem depois desta sprint:

1. Próxima ação 1
2. Próxima ação 2
3. Sprint seguinte sugerida

## References

- Link para issue/PR relevante
- Link para documentação relacionada
- Link para ADR se houver decisão arquitetural
