# Segurança do Projeto

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

As chaves Supabase foram expostas no histórico do Git. É necessário rotacioná-las:

### Rotacionar Chaves no Supabase

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard/project/rilpqhtpuhfeuagzdksz/settings/api)
2. Vá em **Settings → API → Rotate keys**
3. Rotacione a **anon/public key** (publishable key)
4. ⚠️ **IMPORTANTE**: Se houver `service_role` key exposta, rotacione imediatamente
5. Atualize seu arquivo `.env` local com as novas chaves

---

## Configuração Local

### Primeira Vez

```bash
# 1. Copie o arquivo de exemplo
cp .env.example .env

# 2. Edite o .env com suas credenciais reais
# Obtenha as chaves em: https://supabase.com/dashboard
```

### Regras Importantes

- ✅ `.env` está no `.gitignore` - **NUNCA** commite este arquivo
- ✅ Use `.env.example` para documentar variáveis necessárias
- ⛔ **NUNCA** exponha `service_role` key no frontend
- ⛔ **NUNCA** commite credenciais em nenhum arquivo

---

## Configuração em Produção

### Vercel / Netlify

1. Vá em **Project Settings → Environment Variables**
2. Adicione cada variável do `.env.example` com valores reais
3. Redeploy após adicionar as variáveis

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
```

Configure em: **Repository → Settings → Secrets → Actions**

---

## Políticas de Segurança Supabase

### RLS (Row Level Security)

Tabelas sensíveis devem ter RLS ativado:
- ✅ `profiles`
- ✅ `user_roles`
- ✅ `financial_records`

### CORS / Allowed Origins

Configure domínios permitidos no dashboard:
- **Development**: `http://localhost:5173`
- **Production**: `https://seu-dominio.com`

### Operações Administrativas

Use **Edge Functions** para operações privilegiadas:
- Criação/exclusão de usuários
- Alterações de permissões
- Operações financeiras

⚠️ **NUNCA** use `service_role` key no frontend

---

## Prevenção de Vazamentos

### Pre-commit Hook (Recomendado)

```bash
# Instale o husky
npm install --save-dev husky

# Configure pre-commit
npx husky add .husky/pre-commit "npm run check:secrets"
```

### Verificação Manual

```bash
# Verificar se .env está sendo ignorado
git status

# .env NÃO deve aparecer na lista de arquivos modificados
```

---

## Limpar Histórico (Se Necessário)

⚠️ **Operação destrutiva - coordene com toda a equipe**

```bash
# Usando git-filter-repo (recomendado)
git filter-repo --invert-paths --path .env

# Ou usando BFG Repo-Cleaner
bfg --delete-files .env
```

Após limpar o histórico:
1. Force push: `git push --force --all`
2. Todos os colaboradores devem clonar o repo novamente
3. Rotacione TODAS as chaves expostas

---

## Checklist de Segurança

- [ ] .env removido do repositório
- [ ] .env adicionado ao .gitignore
- [ ] Chaves rotacionadas no Supabase
- [ ] .env.example criado com placeholders
- [ ] Variáveis configuradas no provedor (Vercel/Netlify)
- [ ] RLS habilitado nas tabelas sensíveis
- [ ] CORS configurado com domínios específicos
- [ ] service_role key NUNCA no frontend
- [ ] Edge Functions para operações administrativas

---

## Contato

Em caso de incidente de segurança, notifique imediatamente:
- Rotacione todas as chaves
- Revise logs de acesso no Supabase
- Documente o incidente
