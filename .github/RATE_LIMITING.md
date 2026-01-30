# Rate Limiting - P1-AUTH

**Prioridade:** P1 (Alta)  
**Status:** ⚠️ **REQUER CONFIGURAÇÃO MANUAL NO DASHBOARD**  
**Data:** 30 de Janeiro de 2026

---

## 🎯 Objetivo

Proteger o sistema contra ataques de força bruta (brute force) e tentativas automatizadas de acesso não autorizado.

**Problema:** Rate limiting no frontend não adianta nada. Um bot pode chamar a API do Supabase diretamente e tentar 1 milhão de combinações de senha sem que o frontend saiba.

**Solução:** Configurar Rate Limiting nativo do Supabase Auth, que funciona no lado do servidor e bloqueia por IP.

---

## 🚨 Por que isso é P1-AUTH?

Sem rate limiting real:

- ❌ **Brute force em senhas:** Bot pode testar milhares de senhas por minuto
- ❌ **Account enumeration:** Descobrir quais emails existem no sistema
- ❌ **DDoS de signup:** Criar milhares de contas falsas
- ❌ **Flood de recuperação de senha:** Enviar emails de reset em massa
- ❌ **Abuse de recursos:** Consumir créditos da API sem limites

---

## ⚡ Guia Rápido

**Quer algo mais direto?** 👉 [GUIA RÁPIDO - 2 minutos](./RATE_LIMITING_QUICK_GUIDE.md)

**Resumo:** Apenas altere 2 valores no Dashboard:
- "sign-ups and sign-ins": `30` → `10`
- "anonymous users": `30` → `10`

---

## ⚙️ Configuração no Supabase Dashboard (Guia Detalhado)

### 1. Acessar o Dashboard

1. Acesse: [https://app.supabase.com](https://app.supabase.com)
2. Selecione o projeto **edu-core-zen**
3. Vá em **Authentication** → **Settings**

---

### 2. Rate Limits (Seção Principal)

Localize a seção **"Rate Limits"** no menu lateral de Authentication Settings.

#### 🔐 Configurações Recomendadas

**⚠️ IMPORTANTE:** Os valores no Dashboard são por **5 minutos por IP**, não por hora!

| Campo no Dashboard | Padrão | Recomendado | Descrição |
|-------------------|--------|-------------|-----------|
| **Rate limit for sign-ups and sign-ins** | 30 | `10-20` | Protege contra brute force (120-240/hora) |
| **Rate limit for token refreshes** | 150 | `150` | Permite uso normal (1800/hora) |
| **Rate limit for token verifications** | 30 | `30` | Limite padrão adequado (360/hora) |
| **Rate limit for anonymous users** | 30 | `10-20` | Reduz abuse de usuários não autenticados |
| **Rate limit for sending emails** | 2 | `2-5` | Previne flood de emails (24-60/hora) |
| **Rate limit for sending SMS messages** | 30 | `30` | Padrão OK (360/hora) |
| **Rate limit for Web3 sign-ups** | 30 | `10` | Se não usar Web3, deixar padrão |

**Conversão:** 10 requests/5min = 120 requests/hora

**Ambiente de Desenvolvimento:** Use valores maiores (ex: 50/5min) para evitar bloqueios durante testes.  
**Ambiente de Produção:** Comece conservador (10/5min) e aumente conforme necessário.

---

### 3. Auth Providers Settings

Em **Authentication** → **Settings** → **Auth Providers**:

#### Email Provider
- ✅ **Enable Email Provider:** ON
- ✅ **Confirm email:** ON (obrigatório para produção)
- ✅ **Secure email change:** ON
- ⚠️ **Autoconfirm users:** OFF (exceto em dev)

#### Rate Limiting
- ✅ **Enable rate limiting:** ON
- ✅ **Max concurrent requests per IP:** 50
- ✅ **Time window:** 1 minute

---

### 4. Session Timeout Settings

Em **Authentication** → **Settings** → **Sessions**:

| Configuração | Valor Recomendado | Impacto |
|-------------|-------------------|---------|
| **Time-box user sessions** | ON | Força re-login periódico |
| **Max Inactivity Time** | `24 hours` | Logout automático após 24h inativo |
| **JWT Expiry Limit** | `1 hour` | Token expira em 1h (renovado automaticamente) |
| **Refresh Token Rotation** | ON | Invalida tokens antigos ao renovar |

**Por que isso importa:**
- Se um atacante roubar um JWT, ele expira em 1 hora
- Se o usuário ficar inativo 24h, precisa fazer login novamente
- Refresh tokens são rotacionados (não reutilizáveis)

---

## 🛡️ Proteções Nativas do Supabase

O Supabase Auth já implementa algumas proteções por padrão:

### 1. **CAPTCHA Automático**
- Depois de 5 tentativas falhas de login do mesmo IP
- Requer `hcaptcha` ou `recaptcha` nos próximos logins

### 2. **Account Lockout**
- Depois de 10 tentativas falhas em 1 hora
- Conta fica bloqueada por 1 hora

### 3. **Password Breach Detection**
- Integração com HaveIBeenPwned (opcional)
- Bloqueia senhas conhecidas em vazamentos

### 4. **Email Rate Limiting**
- Limita envio de emails de verificação/reset
- Previne uso abusivo do serviço de email

---

## 📊 Monitoramento

### 1. Logs do Supabase

Em **Logs** → **Auth Logs**, monitore:

- ⚠️ `auth.rate_limit_exceeded` - Indica tentativa de abuse
- ⚠️ `auth.failed_login_attempts` - Possível brute force
- ⚠️ `auth.suspicious_activity` - Padrões anormais

### 2. Sentry Integration

Os erros de rate limit já são capturados pelo Sentry:

```typescript
// Em src/contexts/AuthContext.tsx
if (error.message.includes('rate_limit')) {
  logger.warn('Rate limit hit', { 
    context: 'auth', 
    action: 'login' 
  });
}
```

### 3. Alertas Recomendados

Configure alertas para:
- ✅ Mais de 100 tentativas falhas de login por hora
- ✅ Mais de 50 signups do mesmo IP por dia
- ✅ Taxa de sucesso de login < 30% (indicador de brute force)

---

## 🚀 Checklist de Implementação

### Dashboard do Supabase
- [ ] Acessar Authentication → Settings
- [ ] Configurar Rate Limits:
  - [ ] SignUp: 5/hour
  - [ ] SignIn: 10/hour
  - [ ] Password Recovery: 3/hour
  - [ ] Email Verification: 5/hour
  - [ ] Token Refresh: 100/hour
- [ ] Configurar Session Settings:
  - [ ] Max Inactivity Time: 24 hours
  - [ ] JWT Expiry: 1 hour
  - [ ] Refresh Token Rotation: ON
- [ ] Ativar Email Confirmation para novos usuários
- [ ] (Opcional) Ativar CAPTCHA after failed attempts

### Frontend
- [ ] Adicionar mensagem amigável para rate limit:
  ```typescript
  if (error.message.includes('rate_limit')) {
    toast.error('Muitas tentativas. Aguarde alguns minutos.');
  }
  ```
- [ ] Implementar CAPTCHA visual (se necessário)

### Monitoramento
- [ ] Configurar alertas no Sentry para rate limit
- [ ] Revisar Auth Logs semanalmente
- [ ] Criar dashboard de métricas de autenticação

---

## 🔍 Testando Rate Limiting

### 1. Teste Manual (Dev)

```bash
# Tentar login 15 vezes seguidas com senha errada
for i in {1..15}; do
  curl -X POST 'https://seu-projeto.supabase.co/auth/v1/token?grant_type=password' \
    -H "apikey: sua-anon-key" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "teste@example.com",
      "password": "senhaErrada123"
    }'
done

# Esperado: Depois da 10ª tentativa, retornar 429 Too Many Requests
```

### 2. Verificar no Dashboard

Acesse **Logs** → **Auth Logs** e procure por:
```json
{
  "event": "rate_limit_exceeded",
  "ip": "xxx.xxx.xxx.xxx",
  "timestamp": "2026-01-30T12:00:00Z"
}
```

### 3. Testar Frontend

```typescript
// src/contexts/AuthContext.tsx (já implementado)
try {
  await supabase.auth.signInWithPassword({ email, password });
} catch (error) {
  if (error.message.includes('rate_limit')) {
    // ✅ Tratamento correto
    toast.error('Muitas tentativas. Aguarde alguns minutos.');
  }
}
```

---

## 📝 Notas de Implementação

### Por que não implementamos rate limiting no frontend?

**Frontend não é confiável:**
```typescript
// ❌ INÚTIL - Fácil de bypassar
let attempts = 0;
if (attempts > 5) {
  alert('Muitas tentativas!');
  return;
}
```

**Por que não funciona:**
- Atacante pode chamar a API diretamente
- Pode resetar localStorage/cookies
- Pode trocar de IP facilmente
- Pode usar múltiplos navegadores

**✅ Solução correta:**
- Rate limiting no **servidor** (Supabase Auth)
- Baseado em **IP** (não localStorage)
- Aplicado **antes** de processar a requisição
- **Sem depender do frontend**

---

## 🚨 Situações de Emergência

### Se detectar ataque em andamento:

#### 1. **Bloqueio imediato (temporário)**
```sql
-- Bloquear IP específico (executar no SQL Editor)
-- ATENÇÃO: Isso é uma solução temporária
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip TEXT PRIMARY KEY,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

INSERT INTO blocked_ips (ip, reason) 
VALUES ('xxx.xxx.xxx.xxx', 'Brute force attack');
```

#### 2. **Reduzir rate limits no Dashboard**
- SignIn: 10/hour → **3/hour**
- SignUp: 5/hour → **1/hour**

#### 3. **Ativar CAPTCHA obrigatório**
- Authentication → Settings → CAPTCHA
- Enable for ALL requests (não apenas failed)

#### 4. **Monitorar logs em tempo real**
```bash
# Via Supabase CLI
supabase logs --level=warn --filter="auth.rate_limit"
```

---

## 📚 Referências

- [Supabase Auth Rate Limiting](https://supabase.com/docs/guides/auth/auth-rate-limits)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

## ✅ Critérios de Sucesso

Este issue está resolvido quando:

- ✅ Rate limits configurados no Dashboard do Supabase
- ✅ Session timeout configurado (24h inativo)
- ✅ JWT expiry configurado (1h)
- ✅ Refresh token rotation ativado
- ✅ Teste manual de rate limit passa (429 após N tentativas)
- ✅ Logs de Auth monitorados no Sentry
- ✅ Documentação atualizada

---

## 🎯 Próximos Passos (P2+)

Melhorias futuras (não urgentes):

1. **2FA para Admins** (P2-SEC)
   - Autenticação de dois fatores obrigatória para role admin
   - Usar Supabase Auth MFA

2. **IP Allowlist para Admins** (P2-SEC)
   - Restringir admin a IPs específicos
   - Implementar via RLS

3. **Audit Log de Autenticação** (P3-OBS)
   - Registrar todos os logins/logouts
   - Alertar em login de localização nova

4. **Device Fingerprinting** (P3-SEC)
   - Detectar dispositivos conhecidos
   - Alertar em dispositivo novo

---

**Responsável:** Equipe de Desenvolvimento  
**Última atualização:** 30/01/2026  
**Status:** ⚠️ Aguardando configuração manual no Dashboard
