# 🚀 Deploy Homolog com Banco Produção - Guia Prático

**Objetivo:** Subir branch `homolog` no Cloudflare Pages conectada ao banco **PRODUÇÃO** do Supabase para o professor cadastrar alunos reais.

---

## 📋 Checklist de Setup

- [ ] Criar/confirmar branch `homolog` (se não existe)
- [ ] Supabase Produção: Executar migrations
- [ ] Supabase Produção: Criar primeiro admin
- [ ] Cloudflare Pages: Conectar branch `homolog`
- [ ] Cloudflare Pages: Configurar env vars (PROD)
- [ ] Testar login + cadastro aluno
- [ ] Compartilhar URL + credenciais com professor

---

## 🔧 Passo 1: Criar Branch Homolog (Local)

```bash
# Se ainda não existe
git checkout -b homolog

# Se já existe
git checkout homolog
git pull origin homolog

# Enviando para remoto
git push -u origin homolog
```

---

## 💾 Passo 2: Setup do Supabase Produção

### 2.1 - Criar Novo Projeto Supabase (Production)

1. **Supabase Dashboard** → New Project
2. Configurar:
   - **Name:** `edu-core-zen-prod`
   - **Database Password:** Senha forte (salvar em local seguro)
   - **Region:** Escolher próximo (ex: São Paulo)

### 2.2 - Executar Migration Unificada

1. **Copiar credentials** (salvar em `.env.production`):
   ```
   VITE_SUPABASE_PROJECT_ID=seu_project_id
   VITE_SUPABASE_URL=https://seu_project_id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
   ```

2. **No SQL Editor do Supabase:**
   - Abrir arquivo: `supabase/migrations/20260202000000_full_schema_unified.sql`
   - Copiar TODO o conteúdo
   - Colar no SQL Editor e executar
   
   ✅ Pronto! Banco completo criado com RLS, triggers, tudo!

### 2.3 - Criar Primeiro Admin

**Via SQL:**
```sql
-- 1. Criar usuário via Auth (manual no Supabase Dashboard)
-- Supabase > Authentication > Users > Add user
-- Email: admin@educore.com
-- Password: Senha_Forte_123

-- 2. Depois executar (substitua USER_UUID):
INSERT INTO public.user_roles (user_id, role, full_name, email)
VALUES ('USER_UUID_AQUI', 'admin', 'Admin', 'admin@educore.com');

UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = 'USER_UUID_AQUI';
```

---

## 🌍 Passo 3: Cloudflare Pages - Conectar Branch Homolog

### 3.1 - Conectar Repositório

1. **Cloudflare Dashboard** → Pages
2. **Create a project** → Connect to Git
3. Selecionar seu repositório GitHub
4. **Selecionar branch: `homolog`** (ao invés de `main`)

### 3.2 - Configurar Build

```
Build command: npm run build
Build output: dist
Node.js version: 18 ou 20
```

### 3.3 - Adicionar Environment Variables

**IMPORTANTE:** Estas devem ser as credenciais de **PRODUÇÃO** do Supabase!

```
VITE_SUPABASE_PROJECT_ID = seu_project_id_prod
VITE_SUPABASE_URL = https://seu_project_id_prod.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = (copie de Supabase PROD > Settings > API)
VITE_SENTRY_DSN = (ou deixe vazio por enquanto)
VITE_ENVIRONMENT = production
```

### 3.4 - Deploy

Cloudflare fará o deploy automaticamente quando você fazer push na branch `homolog`.

```bash
# Local
git push origin homolog

# Cloudflare vai iniciar build automaticamente
```

---

## 🔑 Passo 4: Configurar Supabase para Produção

### 4.1 - Auth Redirects (IMPORTANTE!)

1. **Supabase Dashboard** → Authentication → URL Configuration
2. **Site URL:** `https://seu-projeto.pages.dev`
3. **Redirect URLs:** Adicionar
   ```
   https://seu-projeto.pages.dev
   https://seu-projeto.pages.dev/login
   https://seu-projeto.pages.dev/dashboard
   ```

### 4.2 - Email Verification (Opcional)

1. **Authentication** → Email Templates
2. Customizar template de confirmação (se desejar)

### 4.3 - RLS Validation

Testar se RLS está funcionando:

```sql
-- No SQL Editor, trocar para um role específico
-- Simular: SELECT current_user_id();

-- Se tudo OK, professor vê apenas seus dados
SELECT * FROM students; -- Deve retornar vazio ou apenas seus alunos
```

---

## 👥 Passo 5: Criar Contas de Teste

### Conta Admin (Você)

```
Email: seu-email@gmail.com
Senha: Sua_Senha_123
Role: admin
```

### Conta Professor (Teste)

```
Email: professor@test.com
Senha: Prof_Senha_123
Role: teacher
```

**Via SQL:**
```sql
-- Depois de criar via Auth:
INSERT INTO public.profiles (user_id, full_name, role)
VALUES ('UUID_DO_PROFESSOR', 'Professor Teste', 'teacher');

INSERT INTO public.teachers (id, name, email)
VALUES ('teacher_001', 'Professor Teste', 'professor@test.com');

INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID_DO_PROFESSOR', 'teacher');

-- Vincular professor ao profile
UPDATE public.profiles 
SET teacher_id = 'teacher_001' 
WHERE user_id = 'UUID_DO_PROFESSOR';
```

---

## ✅ Passo 6: Testar Tudo

### 6.1 - Login como Admin
```
URL: https://seu-projeto.pages.dev
Email: admin@educore.com
Senha: Sua_Senha_123

Esperado: Dashboard admin carrega com 0 alunos/aulas/receita
```

### 6.2 - Login como Professor
```
Email: professor@test.com
Senha: Prof_Senha_123

Esperado: Dashboard professor vazio
```

### 6.3 - Cadastrar Aluno Real

Como admin ou professor:
1. Ir para "Alunos"
2. "+ Novo Aluno"
3. Preencher dados:
   - Nome: João da Silva
   - CPF: 12345678901
   - Telefone: (11) 98765-4321
4. Salvar

✅ Aluno deve aparecer na lista

### 6.4 - Registrar Aula

1. Ir para "Aulas"
2. "+ Nova Aula"
3. Selecionar aluno criado
4. Data/hora
5. Salvar

✅ Aula deve aparecer + gerar cobrança automaticamente

---

## 🎯 O que Compartilhar com o Professor

Envie um email assim:

```
Olá [Professor],

Seu painel homolog está pronto! 🎉

🔗 URL: https://seu-projeto-homolog.pages.dev

📧 Email: professor@test.com
🔑 Senha: [ENVIAR SEPARADO - não por email!]

✅ Você pode:
   • Cadastrar alunos
   • Registrar aulas
   • Ver cobranças
   • Marcar como pago

⚠️ Dados REAIS:
   - Este banco é PRODUÇÃO
   - Não é para testes
   - Dados serão mantidos

💬 Dúvidas: me chama no WhatsApp/Chat

Obrigado!
```

---

## 🔒 Segurança - Checklist

- [ ] `.env.production` está em `.gitignore`
- [ ] Não commitou credenciais sensíveis
- [ ] Supabase RLS está ativo em todas as tabelas
- [ ] Auth Redirects configurados com domínio Cloudflare
- [ ] Professor só vê seus dados (validar SQL)
- [ ] Admin pode ver tudo (validar SQL)
- [ ] Senhas são fortes (mín. 12 caracteres)
- [ ] Backups do Supabase ativados

---

## 📊 Estrutura Final

```
GitHub
├── branch: main (dev, teste local)
├── branch: dev (pode deixar)
└── branch: homolog ← HOMOLOG (Cloudflare Pages)

Supabase
├── Staging (opcional, para QA)
└── Production ← HOMOLOG usa isto

Cloudflare Pages
└── projeto-homolog.pages.dev → branch homolog → Supabase Prod
```

---

## ⚡ Comando Rápido (Resume)

```bash
# 1. Create/switch branch
git checkout -b homolog
git push -u origin homolog

# 2. Local build test
npm run build
npm run preview

# 3. Cloudflare
# - Connect branch homolog
# - Add env vars (PROD credentials)
# - Deploy

# 4. Supabase PROD
# - Execute migration unificada
# - Create admin
# - Configure redirects

# 5. Test
# - Login as admin
# - Create professor account
# - Share with professor
```

---

## 🆘 Troubleshooting

### Erro: "Redirect URI mismatch"

**Solução:** Supabase > Settings > Auth > Redirect URLs
- Adicionar `https://seu-projeto-homolog.pages.dev`

### Erro: "RLS denied access"

**Solução:** Verificar RLS policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'students';
```

### Erro: "Migration failed"

**Solução:** 
- Copiar SQL da migration unificada
- Executar linha por linha no SQL Editor
- Procurar erro específico

### Professor vê dados de outros

**CRÍTICO!** RLS não está funcionando.
```sql
-- Validar policies
SELECT * FROM pg_policies WHERE tablename = 'students';

-- Testar como professor (mudar auth.uid())
SELECT * FROM students WHERE teacher_id = get_my_teacher_id();
```

---

## 📞 Contato

Quando estiver tudo pronto:
1. Teste local: ✅
2. Teste no Cloudflare: ✅
3. Teste com credenciais professor: ✅
4. Me avisa e compartilha com professor

**Pronto? Bora lá!** 🚀
