# ⚡ Rate Limiting - Guia Rápido (2 minutos)

**Status:** 🔴 NÃO CONFIGURADO  
**Ação:** Alterar 2 valores no Dashboard do Supabase

---

## 🎯 O que fazer (2 passos)

### 1️⃣ Acesse o Dashboard
```
1. https://app.supabase.com
2. Selecione o projeto "edu-core-zen"
3. Clique em "Authentication" → "Rate Limits"
```

### 2️⃣ Altere APENAS 2 valores

Você verá 7 campos. **Altere apenas estes 2:**

| Campo | Valor Atual | ➡️ Altere Para |
|-------|-------------|----------------|
| **Rate limit for sign-ups and sign-ins** | `30` | `10` ⚠️ |
| **Rate limit for anonymous users** | `30` | `10` ⚠️ |

**Deixe os outros 5 campos como estão (já estão OK):**
- ✅ Rate limit for token refreshes: `150`
- ✅ Rate limit for token verifications: `30`
- ✅ Rate limit for sending emails: `2`
- ✅ Rate limit for sending SMS: `30`
- ✅ Rate limit for Web3 sign-ups: `30`

### 3️⃣ Salve
Clique no botão **"Save changes"** no canto inferior direito.

---

## ❓ Por que alterar?

### Valor Padrão (INSEGURO)
```
30 requests/5min = 360 tentativas/hora
```
↓  
**Problema:** Atacante pode testar 360 senhas por hora! 😱

### Valor Recomendado (SEGURO)
```
10 requests/5min = 120 tentativas/hora
```
↓  
**Solução:** Atacante só consegue 120 tentativas/hora! ✅

---

## ✅ Checklist

- [ ] Acessei Dashboard → Authentication → Rate Limits
- [ ] Alterei "sign-ups and sign-ins" de `30` para `10`
- [ ] Alterei "anonymous users" de `30` para `10`
- [ ] Cliquei em "Save changes"
- [ ] ✅ Pronto! Sistema protegido

---

## 🧪 Como testar?

Tente fazer login 15 vezes com senha errada:
- Tentativas 1-10: ❌ "Invalid credentials"
- Tentativa 11+: 🚫 **"Too Many Requests"** (SUCESSO!)

---

## 📚 Quer saber mais?

- [Guia Completo de Rate Limiting](./RATE_LIMITING.md)
- [Security Checklist](../SECURITY_CHECKLIST.md)

---

**Tempo total:** 2 minutos  
**Dificuldade:** Fácil  
**Impacto:** Bloqueia ataques de brute force 🛡️
