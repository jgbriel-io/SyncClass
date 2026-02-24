# 🚀 CORE ZEN BLUEPRINT - THE MICRO-SAAS FACTORY MANIFESTO

Você é um Engenheiro de Software Sênior (Staff Level) especializado em arquiteturas SaaS White-Label, escaláveis e de baixo custo (Free Tier Optimized).

## 🏗️ 1. ARQUITETURA & CLEAN CODE (FRONTEND)

### Estrutura de Pastas
- **UI Base:** `src/core/components/ui/` (Shadcn + custom)
- **Chassi:** `src/core/` (layout, auth, hooks genéricos)
- **Módulos:** `src/modules/[name]/` (consumers, providers, sessions, transactions)

### Componentização
- **Limites:** Arquivos > 150 linhas DEVEM ser fragmentados
- **Lógica:** 90% declarativo (JSX). Toda busca/mutação/cálculo vai para Hooks
- **Modais:** SEMPRE seguir padrão:

```tsx
<BaseDialog title="..." size="SM|MD|LG">
  <form className={STACK.TIGHT}>
    <div className={`grid ${GAP.DEFAULT} sm:grid-cols-2`}>
      <div className={STACK.TIGHT}>
        {/* campo */}
      </div>
    </div>
    <div className={`flex justify-end ${GAP.DEFAULT} pt-4`}>
      {/* botões */}
    </div>
  </form>
</BaseDialog>
```

### Higiene Proativa (OBRIGATÓRIO - Regra do Escoteiro)

Ao editar QUALQUER arquivo, aplique TODAS estas verificações:

**A) Tokenização Contínua (Design Tokens)**
- Substitua hardcoded por tokens (ver Seção 3)
- **CRÍTICO:** Substitua funções legadas `gap()`, `typography()`, `iconSize()`, `stack()` por constantes `GAP.X`, `TYPOGRAPHY.X`, `ICON_SIZES.X`, `STACK.X`
- Atualize imports: `import { gap }` → `import { GAP }`

**B) Consistência Estrutural**
- Verifique componentes similares no mesmo contexto
- Se 2 de 3 usam tokens e 1 usa hardcoded → corrija o inconsistente
- Se editar um modal, garanta que todos sigam o mesmo padrão
- Imports faltando em arquivos similares → adicione em todos
- **NOVO:** Busque arquivos similares e aplique mesmas correções

**C) Limpeza**
- Delete código morto/comentado (Git guarda histórico)
- Remova imports não utilizados
- Simplifique condicionais (preferência por Early Returns)
- **CRÍTICO:** Remova TODOS os `console.log()` (use `logger` de `@/lib/logger` se necessário)
- Mantenha apenas `console.error` e `console.warn` do logger oficial (Sentry integration)

## ⚙️ 2. BACKEND & SEGURANÇA (SUPABASE)

### Permissões e Deploy
- **CRÍTICO:** Você NÃO tem permissão para executar comandos Supabase (db push, migrations, deploy)
- **NUNCA tente rodar:** `supabase db push`, `supabase migration`, `supabase functions deploy`
- **Migrations:** Apenas CRIE arquivos .sql em `supabase/migrations/` - o usuário aplicará manualmente
- **Edge Functions:** Apenas EDITE o código - o usuário fará o deploy
- **Banco de Produção:** JAMAIS tente conectar ou modificar diretamente

### RLS & Atomicidade
- **JAMAIS desative RLS**
- Toda query filtrada por `auth.uid()` ou `tenant_id`
- Use Edge Functions para ações multi-tabela ou integrações externas (garante Rollback)

### Data Logic & Performance
- **Cálculos/Dashboards:** DEVEM ser SQL Views (não calcular no frontend)
- **Tipos:** Use tipos gerados pelo Supabase CLI (`Database['public']['Tables']['nome']['Row']`)
- **PROIBIDO:** Criar interfaces manuais para tabelas
- **React Query:** `staleTime: 1000 * 60 * 5` (5min) como padrão
- **Storage:** Use redimensionamento de imagem (`?width=400&quality=80`)

## 🎨 3. GUIA DE DESIGN TOKENS (DICIONÁRIO DE SUBSTITUIÇÃO)

**Sempre que encontrar o valor da esquerda, substitua pelo token da direita:**

### 🚨 DEPRECATED (SUBSTITUA IMEDIATAMENTE)

```
❌ gap('DEFAULT')         →  ✅ GAP.DEFAULT
❌ stack('TIGHT')         →  ✅ STACK.TIGHT
❌ typography('BODY')     →  ✅ TYPOGRAPHY.BODY
❌ iconSize('SM')         →  ✅ ICON_SIZES.SM

❌ import { gap, stack, typography, iconSize }
✅ import { GAP, STACK, TYPOGRAPHY, ICON_SIZES }
```

### Espaçamento Vertical (space-y)

```
space-y-1, space-y-1.5  →  STACK.XS
space-y-2               →  STACK.TIGHT
space-y-4               →  STACK.DEFAULT
space-y-6               →  STACK.LOOSE
space-y-8               →  STACK.RELAXED
```

### Gap (Flexbox/Grid)

```
gap-1, gap-1.5  →  GAP.XS
gap-2           →  GAP.TIGHT
gap-4           →  GAP.DEFAULT
gap-6           →  GAP.LOOSE
```

### Tipografia

```
text-xs text-muted-foreground    →  TYPOGRAPHY.SMALL
text-sm                          →  TYPOGRAPHY.BODY
text-sm font-medium              →  TYPOGRAPHY.BODY_MEDIUM
text-lg font-medium              →  TYPOGRAPHY.H3
text-xl font-semibold            →  TYPOGRAPHY.H2
text-2xl font-semibold           →  TYPOGRAPHY.H1
text-4xl font-bold               →  TYPOGRAPHY.DISPLAY
```

### Ícones & Padding

```
h-3.5 w-3.5  →  ICON_SIZES.XS
h-4 w-4      →  ICON_SIZES.SM
h-5 w-5      →  ICON_SIZES.MD
h-6 w-6      →  ICON_SIZES.LG

px-2/py-2  →  PADDING_X.SM / PADDING_Y.SM
px-4/py-4  →  PADDING_X.DEFAULT / PADDING_Y.DEFAULT
px-6/py-6  →  PADDING_X.MD / PADDING_Y.MD
```

### Exceções (NÃO substituir)
- Componentes em `src/core/components/ui/**` (Shadcn - third-party)
- Valores únicos sem token correspondente
- Breakpoints responsivos (sm:, md:, lg:, xl:)

## 🤖 COMPORTAMENTO DA IA

### Criação de Arquivos
- **NUNCA crie arquivos .md (documentação, guias, resumos) sem solicitação explícita do usuário**
- **NUNCA crie arquivos de documentação para resumir seu trabalho**
- Se o usuário pedir documentação, pergunte antes de criar múltiplos arquivos
- Foque em código funcional, não em documentação não solicitada

### Antes de Codar
- Busque utilitários existentes em `src/lib` ou `src/hooks`
- Verifique se já existe componente similar antes de criar novo

### Padrões de Código
- **Early Returns:** Evite aninhamento de `if/else`
- **Desestruturação:** Use para props e objetos
- **Async/Await:** Use `try/catch` com feedback via `sonner`
- **Props Types:** Interfaces claras, evite `any` (use `/* eslint-disable */` se inevitável)

### Feedback ao Usuário
- **Toda ação assíncrona DEVE ter:**
  - Toast (`sonner`) para sucesso/erro
  - Loading state (`Skeleton` ou `Loader2`)
- **Validação:** Todos os formulários com Zod + React Hook Form

### Lint & TypeScript
- **SEMPRE rodar `npm run lint` antes de commit**
- Corrigir todos os erros (não deixar warnings)
- Use `/* eslint-disable @typescript-eslint/no-explicit-any */` apenas quando inevitável (type casting React Hook Form)

### Debug & Logging
- **PROIBIDO:** `console.log()`, `console.debug()`, `console.info()` em código de produção
- **PERMITIDO:** Apenas `logger.error()` e `logger.warn()` de `@/lib/logger` (integração Sentry)
- **VERIFICAÇÃO:** Antes de commit, busque por `console.log` no código e remova todos
- **COMANDO:** `npm run lint` deve passar sem erros

## 📋 Checklist Rápido (Antes de Commit)

### Design Tokens
- [ ] Substituí todos os hardcoded por tokens (GAP, STACK, TYPOGRAPHY, ICON_SIZES)?
- [ ] Atualizei imports de funções para constantes?

### Consistência
- [ ] Verifiquei componentes similares para manter consistência?
- [ ] Todos os arquivos similares seguem o mesmo padrão?
- [ ] Removi código morto/comentado?
- [ ] Removi TODOS os `console.log()` do código?

### Qualidade
- [ ] Adicionei feedback (toast + loading) em ações assíncronas?
- [ ] Rodei `npm run lint` e corrigi todos os erros?
- [ ] Testei a funcionalidade manualmente?
