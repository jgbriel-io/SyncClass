# 🛡️ Guia de Continuous Integration (CI)

## O que é CI e por que usamos?

O CI (Continuous Integration) automatiza a validação do código **antes** de ele ser mergeado no repositório. Isso garante que:

- ✅ O código segue os padrões do projeto (ESLint)
- ✅ Não há erros de tipagem (TypeScript)
- ✅ O build não está quebrado
- ✅ A qualidade do código é mantida

**Sem CI:** Na semana que vem você terá 10 novos erros.  
**Com CI:** Código "sujo" é bloqueado automaticamente.

## 🚀 Como funciona

### 1. Você faz um push

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin dev
```

### 2. GitHub Actions roda automaticamente

O CI executa:
1. `npm ci` - Instalação limpa das dependências
2. `npm run lint` - Validação de código
3. `npx tsc --noEmit` - Verificação de tipos
4. `npm run build` - Build do projeto

### 3. Resultado

- ✅ **Passou:** Seu código está pronto para review/merge
- ❌ **Falhou:** Você precisa corrigir os erros antes de mergear

## 🧪 Testar localmente ANTES de fazer push

**Sempre rode antes de fazer push:**

```bash
npm run check
```

Isso roda lint + type-check localmente.

**Simular o CI completo:**

```bash
npm run ci
```

Isso simula exatamente o que o GitHub Actions vai fazer.

**Corrigir erros de lint automaticamente:**

```bash
npm run lint:fix
```

## 📊 Ver status do CI

1. Acesse o repositório no GitHub
2. Clique na aba **Actions**
3. Veja o status de cada workflow
4. Clique em um job para ver detalhes dos erros

## 🚨 CI falhou - E agora?

### Erro de Lint

```
Error: 'any' is not allowed
```

**Solução:**
1. Veja qual arquivo tem o erro
2. Corrija o código (use tipos apropriados)
3. Rode `npm run lint` localmente
4. Faça commit e push novamente

### Erro de Tipo

```
Error: Type 'string' is not assignable to type 'number'
```

**Solução:**
1. Veja qual arquivo/linha tem o erro
2. Corrija a tipagem
3. Rode `npm run type-check` localmente
4. Faça commit e push novamente

### Build quebrado

```
Error: Could not resolve import
```

**Solução:**
1. Verifique se todos os imports estão corretos
2. Rode `npm run build` localmente
3. Corrija os erros
4. Faça commit e push novamente

## ⚡ Dicas Pro

### 1. Use scripts locais

Adicione ao seu fluxo diário:

```bash
# Antes de começar o trabalho
npm run dev

# Antes de fazer commit
npm run check

# Se houver erros de lint simples
npm run lint:fix
```

### 2. Configure seu editor

**VS Code** pode mostrar erros em tempo real:
- Instale extensões ESLint e TypeScript
- Erros aparecem enquanto você digita

### 3. Commits frequentes

Faça commits pequenos e frequentes:
- Mais fácil identificar onde o erro foi introduzido
- CI roda mais rápido
- Reviews mais fáceis

### 4. Branch protection

Quando o CI estiver estável, ative **branch protection rules** no GitHub:
- Settings → Branches → Add rule
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date

Isso **bloqueia** merges se o CI falhar.

## 📈 Métricas de Sucesso

**Antes do CI:**
- ~160 erros no código
- Builds quebrando em produção
- Tempo perdido com bugs

**Depois do CI:**
- 0 erros no main/dev
- Confiança para fazer deploy
- Time focado em features, não em bugs

## 🔄 Workflows Ativos

### CI - Continuous Integration
- **Quando:** Todo push/PR para main/dev
- **Tempo:** ~2-3 minutos
- **Arquivo:** `.github/workflows/ci.yml`

### Dependency Check
- **Quando:** Toda segunda às 9h (ou manual)
- **Tempo:** ~1 minuto
- **Arquivo:** `.github/workflows/dependency-check.yml`

## 💡 Próximos Passos

À medida que o projeto cresce, podemos adicionar:

- ✅ Testes automatizados (`npm test`)
- ✅ Code coverage (cobertura de testes)
- ✅ Deploy automático quando passa no CI
- ✅ Análise de segurança avançada
- ✅ Performance benchmarks

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Lembre-se:** CI não é um inimigo que bloqueia seu trabalho. É um amigo que te avisa quando algo está errado **antes** de virar problema de verdade. 🚀
