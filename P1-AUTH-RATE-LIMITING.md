# ⚠️ P1-AUTH: Rate Limiting - AÇÃO OBRIGATÓRIA

**Status:** 🔴 NÃO CONFIGURADO  
**Prioridade:** P1 (ALTA)  
**Bloqueia produção:** SIM  
**Tempo estimado:** 5 minutos  

---

## 🚨 O Problema

**Seu sistema está vulnerável a ataques de força bruta!**

Sem rate limiting configurado, um atacante pode:

```bash
# Um bot pode fazer isso AGORA:
for i in {1..1000000}; do
  curl -X POST 'sua-api/auth/token' \
    -d '{"email":"professor@escola.com","password":"tentativa'$i'"}'
done

# Resultado: 1 MILHÃO de tentativas de senha em poucos minutos! 😱
```

### Por que rate limiting no frontend não funciona?

```typescript
// ❌ INÚTIL - Fácil de bypassar
let attempts = 0;
if (attempts > 5) {
  alert('Muitas tentativas!');
  return;
}

// Atacante simplesmente chama a API diretamente:
fetch('https://seu-supabase.co/auth/v1/token', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})
// Seu frontend nem sabe que isso aconteceu! 🤦
```

---

## ✅ A Solução: Rate Limiting no Servidor

**Configurar rate limiting nativo do Supabase Auth**

- ✅ Funciona no lado do servidor (não pode ser bypassado)
- ✅ Bloqueia por IP automaticamente
- ✅ Protege contra brute force, DDoS e enumeration
- ✅ Já está disponível no Supabase (só precisa ativar!)

---

## ⚡ Guia Super Rápido (2 minutos)

**Quer algo mais direto?** 👉 [GUIA RÁPIDO - 2 minutos](.github/RATE_LIMITING_QUICK_GUIDE.md)

**TL;DR:**
1. Acesse Dashboard → Authentication → Rate Limits
2. Altere "sign-ups and sign-ins" de `30` para `10`
3. Altere "anonymous users" de `30` para `10`
4. Clique em "Save changes"
5. ✅ Pronto!

---

## 📋 Guia Detalhado (5 minutos)

### Passo 1: Acesse o Dashboard
1. Vá em [https://app.supabase.com](https://app.supabase.com)
2. Selecione o projeto **edu-core-zen**
3. Clique em **Authentication** → **Settings**

### Passo 2: Configure Rate Limits

Na seção **"Rate Limits"**, você verá os seguintes campos:

**⚠️ IMPORTANTE:** Os valores são por **5 minutos por IP**, não por hora!

| Campo no Dashboard | Padrão Atual | 🔒 Altere Para | Equivale a/hora | Por quê? |
|-------------------|--------------|----------------|-----------------|----------|
| **Rate limit for sign-ups and sign-ins** | 30 | `10` | 120/hora | ⚠️ CRÍTICO: Reduzir para bloquear brute force |
| **Rate limit for token refreshes** | 150 | `150` | 1800/hora | ✅ OK: Permite uso normal |
| **Rate limit for token verifications** | 30 | `30` | 360/hora | ✅ OK: Padrão adequado |
| **Rate limit for anonymous users** | 30 | `10` | 120/hora | ⚠️ Reduzir para limitar abuse |
| **Rate limit for sending emails** | 2 | `2` | 24/hora | ✅ OK: Padrão adequado |
| **Rate limit for sending SMS messages** | 30 | `30` | 360/hora | ✅ OK: Padrão adequado |
| **Rate limit for Web3 sign-ups** | 30 | `10` ou `30` | 120/hora | Se não usa Web3, deixar padrão |

**🎯 Ação Obrigatória:**
1. Altere **"Rate limit for sign-ups and sign-ins"** de `30` para `10`
2. Altere **"Rate limit for anonymous users"** de `30` para `10`
3. Clique em **"Save changes"**

**Por que reduzir de 30 para 10?**
- 30 requests/5min = 360 tentativas/hora = **MUITO PERMISSIVO** 😱
- 10 requests/5min = 120 tentativas/hora = **SEGURO** ✅

**Configuração Final:**
```
Rate limit for sign-ups and sign-ins:    10 requests/5 min  ⚠️ ALTERAR
Rate limit for token refreshes:         150 requests/5 min  ✅ OK
Rate limit for token verifications:      30 requests/5 min  ✅ OK
Rate limit for anonymous users:          10 requests/5 min  ⚠️ ALTERAR
Rate limit for sending emails:            2 emails/h        ✅ OK
Rate limit for sending SMS messages:     30 sms/h           ✅ OK
```

### Passo 3: Configure Session Settings

Na seção **"Sessions"**, configure:

| Configuração | Valor | Por quê? |
|-------------|-------|----------|
| **Max Inactivity Time** | `24 hours` | Logout automático após 24h inativo |
| **JWT Expiry Limit** | `1 hour` | Token expira em 1h (renova automático) |
| **Refresh Token Rotation** | `ON` | Invalida tokens antigos ao renovar |

**Benefício:** Se um atacante roubar um JWT, ele expira em 1 hora.

### Passo 4: Ative Email Confirmation

Na seção **"Email Provider"**:

```
✅ Enable Email Provider:     ON
✅ Confirm email:              ON (obrigatório em produção)
✅ Secure email change:        ON
❌ Autoconfirm users:          OFF (desativado em produção)
```

### Passo 5: Clique em "Save"

🎉 Pronto! Seu sistema agora está protegido.

---

## 🧪 Como Testar

Depois de configurar, teste se funcionou:

```bash
# Tente fazer login 15 vezes com senha errada
# (substitua com suas credenciais de teste)

for i in {1..15}; do
  echo "Tentativa $i"
  curl -X POST 'https://seu-projeto.supabase.co/auth/v1/token?grant_type=password' \
    -H "apikey: SUA-ANON-KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@teste.com","password":"senhaErrada'$i'"}'
  echo ""
done
```

**Esperado (com configuração de 10/5min):**
- Tentativas 1-10: Erro "Invalid login credentials"
- Tentativa 11 em diante: **Erro 429 "Too Many Requests"** ✅
- Após 5 minutos: IP é desbloqueado automaticamente

---

## 📊 O que Acontece Depois?

### Usuário Legítimo (uso normal)
```
08:00 - Login com sucesso ✅
08:30 - Acessa sistema normalmente ✅
12:00 - JWT renova automaticamente ✅
18:00 - Logout manual ✅
```

### Atacante (tentando brute force)
```
10:00 - Tentativa 1 (senha errada) ❌
10:01 - Tentativa 2 (senha errada) ❌
...
10:04 - Tentativa 10 (senha errada) ❌
10:05 - Tentativa 11 → 🚫 BLOQUEADO! (429 Too Many Requests)
10:06 - Tentativa 12 → 🚫 BLOQUEADO!
...
10:05-10:10 - IP continua bloqueado (5 minutos)
10:10 - Pode tentar novamente (mais 10 tentativas nos próximos 5 min)
```

**Resultado:** Atacante só consegue fazer 10 tentativas a cada 5 minutos = **120 tentativas/hora** (em vez de milhões). Atacante desiste! 🎉

---

## ⚠️ Checklist de Confirmação

Marque tudo antes de fazer deploy em produção:

- [ ] Acessei o Dashboard do Supabase
- [ ] Configurei Rate Limits (SignIn, SignUp, etc.)
- [ ] Configurei Session Settings (JWT Expiry, etc.)
- [ ] Ativei Email Confirmation
- [ ] Cliquei em "Save"
- [ ] Testei que rate limit funciona (erro 429 após N tentativas)
- [ ] Li a documentação completa (`.github/RATE_LIMITING.md`)

---

## 🆘 Precisa de Ajuda?

### Documentação Completa
📖 [.github/RATE_LIMITING.md](.github/RATE_LIMITING.md)

### Outros Recursos
- [Security Checklist](./SECURITY_CHECKLIST.md) - Checklist completo
- [Security Fixes](.github/SECURITY_FIXES.md) - Outras correções
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth/auth-rate-limits)

### Em Caso de Emergência (Ataque em andamento)
1. **Imediato:** Reduza rate limits drasticamente
   - SignIn: 10/hour → **3/hour**
   - SignUp: 5/hour → **1/hour**
2. Ative CAPTCHA obrigatório (Auth Settings)
3. Monitore logs em tempo real
4. Considere bloquear IPs específicos (via SQL)

---

## 🎯 Resumo

**Antes de configurar:**
- ❌ Sistema vulnerável a brute force
- ❌ Atacante pode testar 1 milhão de senhas
- ❌ Sem proteção contra DDoS

**Depois de configurar:**
- ✅ Rate limiting ativo (bloqueia por IP)
- ✅ Máximo 10 tentativas de login por hora
- ✅ Sessions expiram automaticamente
- ✅ Refresh tokens são rotacionados
- ✅ Sistema protegido contra ataques

---

**IMPORTANTE:** Esta configuração é **obrigatória** antes do deploy em produção!

**Tempo para configurar:** 5 minutos  
**Tempo economizado em lidar com ataques:** Infinito 😅  
**Paz de espírito:** Inestimável 🛡️

---

**Configurado?** Marque como concluído no [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)

**Última atualização:** 30/01/2026
