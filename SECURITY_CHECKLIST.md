# ✅ Checklist de Segurança - Antes do Deploy

**Status:** ⚠️ **AÇÃO REQUERIDA** (P1-AUTH pendente)  
**Última atualização:** 30/01/2026

---

## 🎯 Resumo Rápido

| Issue | Status | Requer Ação? |
|-------|--------|--------------|
| P0-SEC-01: RLS Brecha | ✅ RESOLVIDO | Não |
| P0-SEC-02: LGPD Masking | ✅ RESOLVIDO | Não |
| P0-SEC-03: Race Condition | ✅ RESOLVIDO | Não |
| P0-OBS-01: Observabilidade | ✅ IMPLEMENTADO | Não |
| **P1-AUTH: Rate Limiting** | ⚠️ **PENDENTE** | **SIM** |

---

## ⚠️ AÇÃO OBRIGATÓRIA: P1-AUTH Rate Limiting

**Status:** NÃO configurado  
**Prioridade:** ALTA  
**Tempo estimado:** 5 minutos  
**Responsável:** Quem tem acesso ao Dashboard do Supabase

### Por que é obrigatório?

Sem rate limiting, o sistema está vulnerável a:
- ❌ Ataques de força bruta (testar milhões de senhas)
- ❌ Account enumeration (descobrir emails válidos)
- ❌ DDoS de signup (criar milhares de contas falsas)
- ❌ Flood de emails de recuperação de senha

### Como configurar?

**⚡ Guia Super Rápido (2 min):** [.github/RATE_LIMITING_QUICK_GUIDE.md](.github/RATE_LIMITING_QUICK_GUIDE.md)

#### 1. Acesse o Dashboard
1. Vá em [https://app.supabase.com](https://app.supabase.com)
2. Selecione o projeto **edu-core-zen**
3. Clique em **Authentication** → **Settings**

#### 2. Configure Rate Limits
Na seção **"Rate Limits"**, configure (valores são por **5 minutos por IP**):

```
Rate limit for sign-ups and sign-ins:    10 requests/5 min  (= 120/hora)
Rate limit for token refreshes:         150 requests/5 min  (= 1800/hora)
Rate limit for token verifications:      30 requests/5 min  (= 360/hora)
Rate limit for anonymous users:          10 requests/5 min  (= 120/hora)
Rate limit for sending emails:            2 emails/hour
Rate limit for sending SMS messages:     30 sms/hour
```

**Nota:** Os valores padrão (30/5min) são muito permissivos. Reduza para 10/5min em produção.

#### 3. Configure Session Settings
Na seção **"Sessions"**, configure:

```
Max Inactivity Time:      24 hours
JWT Expiry Limit:          1 hour
Refresh Token Rotation:    ON (ativado)
```

#### 4. Ative Email Confirmation
Na seção **"Email Provider"**, garanta que:

```
Confirm email:       ON (ativado)
Secure email change: ON (ativado)
Autoconfirm users:   OFF (desativado em produção)
```

#### 5. Teste a Configuração
Após configurar, teste:

```bash
# Tente fazer login 15 vezes com senha errada
# Esperado: Depois da 10ª tentativa, retornar erro 429 (Too Many Requests)
```

### Documentação Completa
Ver: `.github/RATE_LIMITING.md`

---

## ✅ Correções Já Implementadas (Não requer ação)

### P0-SEC-01: Brecha no RLS ✅
- **Status:** Resolvido via migration
- **Arquivo:** `supabase/migrations/fix_financial_records_rls_security.sql`
- **Ação:** Aplicar migration em produção (`supabase db push`)

### P0-SEC-02: Mascaramento LGPD ✅
- **Status:** Resolvido via migration
- **Arquivo:** `supabase/migrations/lgpd_masking_sensitive_data.sql`
- **Ação:** Aplicar migration em produção (`supabase db push`)
- **Impacto:** CPF e telefone agora são mascarados automaticamente

### P0-SEC-03: Race Condition no Signup ✅
- **Status:** Resolvido no código frontend
- **Arquivo:** `src/hooks/useUserMutations.ts`
- **Ação:** Nenhuma (já aplicado)

### P0-OBS-01: Observabilidade ✅
- **Status:** Implementado com Sentry
- **Arquivos:** `src/lib/sentry.ts`, `src/components/ErrorBoundary.tsx`
- **Ação:** Verificar se `VITE_SENTRY_DSN` está configurado no `.env`

---

## 🚀 Checklist Final para Produção

### Antes do Deploy

#### Banco de Dados
- [ ] Aplicar migration do RLS (`supabase db push`)
- [ ] Aplicar migration do LGPD (`supabase db push`)
- [ ] Verificar que policies foram criadas corretamente

#### Autenticação
- [ ] **CRÍTICO:** Configurar Rate Limits no Dashboard ⚠️
- [ ] **CRÍTICO:** Configurar Session Settings no Dashboard ⚠️
- [ ] Ativar Email Confirmation
- [ ] Testar que rate limit funciona (429 após N tentativas)

#### Ambiente
- [ ] Configurar `VITE_ENVIRONMENT="production"` no `.env`
- [ ] Configurar `VITE_SENTRY_DSN` no `.env`
- [ ] Verificar que Supabase URL e ANON_KEY estão corretos

#### Monitoramento
- [ ] Confirmar que Sentry está recebendo eventos
- [ ] Configurar alertas no Sentry
- [ ] Testar ErrorBoundary simulando um erro

### Após o Deploy

#### Testes de Aceitação
- [ ] Criar novo usuário como admin
- [ ] Fazer login como professor
- [ ] Fazer login como aluno
- [ ] Acessar registros financeiros (verificar RLS)
- [ ] Verificar que CPF/telefone estão mascarados
- [ ] Simular erro e verificar no Sentry

#### Monitoramento (Primeira Semana)
- [ ] Revisar Auth Logs diariamente
- [ ] Verificar taxa de erros no Sentry
- [ ] Monitorar rate limit hits
- [ ] Ajustar limites se necessário

---

## 🔥 Prioridades

### 🚨 OBRIGATÓRIO (Bloqueia produção)
1. ⚠️ **Configurar Rate Limiting no Dashboard**
2. Aplicar migrations do RLS e LGPD
3. Configurar variáveis de ambiente

### ✅ Recomendado (Antes do deploy)
4. Testar rate limiting manualmente
5. Configurar alertas no Sentry
6. Executar testes E2E

### 📊 Pós-Deploy (Primeira semana)
7. Monitorar Auth Logs
8. Revisar erros no Sentry
9. Ajustar rate limits se necessário

---

## 📞 Em Caso de Problemas

### Rate Limit bloqueando usuários legítimos
Se muitos usuários reclamarem de bloqueio:
1. Acesse Dashboard → Authentication → Settings
2. Aumente temporariamente os limites:
   - SignIn: 10/hour → 20/hour
3. Monitore por 24h
4. Ajuste conforme necessário

### Ataque em andamento
Se detectar ataque de brute force:
1. **Imediato:** Reduza rate limits drasticamente
   - SignIn: 10/hour → 3/hour
2. Ative CAPTCHA obrigatório (Auth Settings)
3. Monitore logs em tempo real
4. Considere bloquear IPs específicos

### Sentry não recebendo eventos
1. Verifique `.env` tem `VITE_SENTRY_DSN`
2. Verifique console do navegador
3. Simule erro com `<SentryTest />` component

---

## 📚 Documentação Adicional

- [Guia Completo de Rate Limiting](.github/RATE_LIMITING.md) ⚠️ **LEIA ANTES DO DEPLOY**
- [Correções de Segurança](.github/SECURITY_FIXES.md)
- [Implementação LGPD](.github/LGPD_IMPLEMENTATION.md)
- [Observabilidade](.github/OBSERVABILITY.md)
- [Checklist de Deploy](./DEPLOYMENT_CHECKLIST_COMPLETE.md)

---

## ✅ Critérios de Sucesso

O sistema está pronto para produção quando:

1. ✅ Todas as migrations foram aplicadas
2. ✅ **Rate limiting está configurado no Dashboard** ⚠️
3. ✅ Sentry está recebendo eventos
4. ✅ Testes de aceitação passaram
5. ✅ Variáveis de ambiente estão corretas

---

**Importante:** NÃO faça deploy em produção sem configurar o Rate Limiting! Isso deixa o sistema vulnerável a ataques automatizados.

**Responsável:** Equipe de Desenvolvimento  
**Próxima revisão:** Após primeiro deploy em produção
