# ✅ CI Quick Checklist

## Antes de fazer PUSH

```bash
# 1. Rodar checks localmente
npm run check

# 2. Se houver erros de lint simples
npm run lint:fix

# 3. Se ainda houver erros, corrija manualmente

# 4. Teste o build
npm run build

# 5. Tudo ok? Faça o push!
git push
```

## Primeiro Push com CI

- [ ] Fazer push para `dev`
- [ ] Ir para GitHub → Actions
- [ ] Ver workflow "CI - Continuous Integration" rodando
- [ ] Aguardar ~2-3 minutos
- [ ] ✅ Passou? Celebrar! 🎉
- [ ] ❌ Falhou? Ler os logs e corrigir

## Configuração Inicial (Uma vez)

- [ ] Verificar se o badge no README está correto
  - Substituir `YOUR_USERNAME` pelo username real do GitHub
- [ ] (Opcional) Ativar branch protection
  - Settings → Branches → Add rule
  - Require status checks to pass
- [ ] (Opcional) Notificações
  - Settings → Notifications → Actions
  - Escolher como quer ser notificado

## Workflow Diário

### Começando o trabalho
```bash
git pull origin dev
npm install  # Se houver dependências novas
npm run dev
```

### Durante o desenvolvimento
- Editor deve mostrar erros de TypeScript/ESLint em tempo real
- Corrigir conforme aparecem

### Antes de commitar
```bash
npm run check
```

### Após fazer push
- Verificar no GitHub Actions se passou
- Se falhar, corrigir e fazer novo push

## Troubleshooting Rápido

### ❌ "Lint failed"
```bash
npm run lint        # Ver os erros
npm run lint:fix    # Tentar corrigir automaticamente
```

### ❌ "Type check failed"
```bash
npm run type-check  # Ver os erros de tipo
# Corrigir manualmente
```

### ❌ "Build failed"
```bash
npm run build       # Reproduzir localmente
# Verificar logs de erro
```

### ❌ "npm ci failed"
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock"
```

## Dicas Rápidas

✅ **DO:**
- Rode `npm run check` antes de cada push
- Faça commits pequenos e frequentes
- Leia os logs do CI quando falhar
- Corrija erros logo que aparecem

❌ **DON'T:**
- Não ignore erros do CI
- Não force push sem CI passar
- Não desabilite regras do ESLint "só dessa vez"
- Não use `any` sem necessidade extrema

## Status Atual

- ✅ CI configurado
- ✅ 0 erros no código
- ✅ Build otimizado (206KB)
- ✅ Documentação completa

## Links Úteis

- 📖 [Guia Completo do CI](CI_GUIDE.md)
- 📊 [Resumo da Implementação](../CI_IMPLEMENTATION_SUMMARY.md)
- 🔧 [Workflows README](workflows/README.md)
- 🚀 [GitHub Actions](https://github.com/YOUR_USERNAME/edu-core-zen/actions)

---

**Lembre-se:** CI é seu amigo, não seu inimigo! 🤝
