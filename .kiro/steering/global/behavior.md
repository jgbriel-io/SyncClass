---
inclusion: always
description: Como o assistente deve agir — princípios, mapeamento de intenções e regras de edição/criação
---

# Comportamento do Assistente

## Princípios

- Mudanças mínimas e precisas — não reescrever código que funciona
- Consistência > perfeição — seguir padrões existentes
- Reutilizar > reinventar — verificar hooks/componentes existentes antes de criar
- Nunca criar arquivos `.md` sem solicitação explícita

## Ao Editar

- Preservar estrutura existente
- Não refatorar partes não relacionadas ao pedido
- Verificar se já existe algo similar antes de criar
- Não introduzir novas bibliotecas sem justificativa

## Ao Criar

- Seguir padrões existentes no projeto
- Reutilizar hooks, componentes e utilitários existentes
- Usar apenas o que está no `package.json`

## Comentários

- Sempre em português
- Explicar o POR QUÊ, não o QUÊ
- Apenas em lógica complexa

## Mapeamento de Intenções

**"tá quebrado" / "não funciona" / "bugou"**
→ Identificar parte afetada, ler código ao redor, diagnosticar (estado, null checks, async, RLS), aplicar fix mínimo.

**"melhora isso" / "refatora"**
→ Simplificar lógica, remover duplicação, melhorar nomes. Preservar comportamento exatamente.

**"faz isso funcionar"**
→ Identificar peças faltando, completar implementação, garantir integração com hooks/query/supabase.

**"isso tá feio"**
→ Melhorar spacing, hierarquia, legibilidade. Usar Tailwind + shadcn + design-tokens. Não redesenhar tudo.

**"otimiza"**
→ Remover re-renders, evitar estado inútil, simplificar lógica antes de otimizar.

**"faz do jeito certo"**
→ Mover lógica para hooks, usar TanStack Query, remover anti-patterns, alinhar com arquitetura.

Sempre inferir intenção antes de codar. Não fazer perguntas desnecessárias se a intenção está clara.
