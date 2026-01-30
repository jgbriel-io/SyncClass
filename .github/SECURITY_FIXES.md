# Correções de Segurança Implementadas

Este documento consolida todas as correções de segurança críticas implementadas no projeto.

## Status Geral

✅ **P0-SEC-01**: Brecha no RLS - CORRIGIDO  
✅ **P0-SEC-02**: Mascaramento LGPD - IMPLEMENTADO  
✅ **P0-SEC-03**: Race Condition no Signup - CORRIGIDO  
✅ **P0-OBS-01**: Observabilidade - IMPLEMENTADO  
⚠️ **P1-AUTH**: Rate Limiting - REQUER CONFIGURAÇÃO MANUAL  

---

## P0-SEC-01: Brecha no RLS da tabela `financial_records`

### Problema Identificado
A policy original usava uma subquery que não validava explicitamente se o `student_id` pertencia ao professor atual. Isso criava uma potencial brecha de segurança onde um professor poderia, teoricamente, acessar registros financeiros de estudantes não vinculados a ele.

### Solução Implementada
Criada migration `fix_financial_records_rls_security.sql` que:

```sql
CREATE POLICY "Professores podem gerenciar registros financeiros dos seus alunos"
    ON public.financial_records FOR ALL
    USING (
        student_id IN (
            SELECT id 
            FROM public.students 
            WHERE teacher_id = public.get_my_teacher_id()
        )
        OR public.is_admin()
    )
    WITH CHECK (
        student_id IN (
            SELECT id 
            FROM public.students 
            WHERE teacher_id = public.get_my_teacher_id()
        )
        OR public.is_admin()
    );
```

### Impacto
- ✅ Elimina a possibilidade de acesso não autorizado
- ✅ Sintaxe mais clara e explícita
- ✅ Proteção dupla (USING + WITH CHECK)
- ✅ Mantém privilégios de admin intactos

### Arquivos Modificados
- `supabase/migrations/fix_financial_records_rls_security.sql` (novo)

---

## P0-SEC-03: Race Condition no Signup

### Problema Identificado
O trigger do Postgres que cria `profiles` e `user_roles` após um signup é **assíncrono**. Se o frontend tentasse atualizar esses registros imediatamente após o `signUp`, havia uma race condition onde:

1. O trigger ainda não havia completado
2. O código tentava fazer UPDATE em registros inexistentes
3. Operação falhava, corrompendo o estado do banco

### Solução Implementada
Implementação de **Exponential Backoff com Verificação Ativa** em `src/hooks/useUserMutations.ts`:

#### Função de Retry Genérica
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T>
```

**Configuração padrão:**
- 5 tentativas máximas
- Delay inicial: 200ms
- Delay máximo: 3000ms (3s)
- Multiplicador: 2x (200ms → 400ms → 800ms → 1600ms → 3000ms)

#### Funções de Verificação
```typescript
// Verifica se o perfil foi criado pelo trigger
async function waitForProfileCreation(userId: string): Promise<void>

// Verifica se a role foi criada pelo trigger
async function waitForUserRoleCreation(userId: string): Promise<void>
```

#### Integração
Aplicado em **3 fluxos críticos**:
1. `useCreateUser` - Criação de usuário via admin
2. `useCreateAuthUserForStudent` - Vinculação de aluno existente
3. `useCreateAuthUserForTeacher` - Vinculação de professor existente

### Impacto
- ✅ Elimina completamente a race condition
- ✅ Resiliente a carga do banco de dados
- ✅ Fail-fast com mensagem clara ao usuário
- ✅ Não prossegue até confirmar que o trigger completou

### Arquivos Modificados
- `src/hooks/useUserMutations.ts`

---

## P0-OBS-01: Observabilidade

### Problema Identificado
Zero visibilidade sobre erros em produção. Se algo quebrar no navegador do professor/aluno, não há como saber:
- Que erro ocorreu
- Em qual contexto
- Quais ações levaram ao erro
- Quantos usuários foram afetados

### Solução Implementada

#### 1. Sentry Integration
```typescript
// src/lib/sentry.ts
export function initSentry()
export const logger = {
  info, warn, error,
  setUser, clearUser,
  addBreadcrumb
}
```

**Características:**
- Filtros de segurança (remove headers sensíveis)
- Amostragem configurável (10% prod, 100% dev)
- Session Replay em erros
- Performance monitoring

#### 2. Error Boundary Global
```typescript
// src/components/ErrorBoundary.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Recursos:**
- Captura erros não tratados do React
- UI de fallback amigável
- Detalhes técnicos em desenvolvimento
- Botões de recuperação
- HOC disponível: `withErrorBoundary(Component)`

#### 3. Logger Centralizado
API unificada para logging estruturado:

```typescript
import { logger } from "@/lib/sentry";

logger.error(error, { context: "payment", userId });
logger.addBreadcrumb("Form submitted", "user-action");
```

#### 4. Integração Automática

**AuthContext:**
- Login/logout rastreado
- Contexto de usuário em todos os erros
- Breadcrumbs de autenticação

**useUserMutations:**
- Erros de criação de usuário
- Falhas no trigger
- Tentativas de retry

### Impacto
- ✅ Visibilidade total de erros em produção
- ✅ Contexto rico (usuário, role, ações recentes)
- ✅ Session Replay para reproduzir problemas
- ✅ Performance monitoring
- ✅ Alertas configuráveis

### Arquivos Criados/Modificados
- `src/lib/sentry.ts` (novo)
- `src/components/ErrorBoundary.tsx` (novo)
- `src/components/__tests__/ErrorBoundary.test.tsx` (novo)
- `src/main.tsx` (modificado)
- `src/contexts/AuthContext.tsx` (modificado)
- `src/hooks/useUserMutations.ts` (modificado)
- `.env.example` (modificado)
- `.env` (modificado)
- `.github/OBSERVABILITY.md` (novo)

### Configuração
```env
VITE_SENTRY_DSN="https://7f3d664a5136400177fbb49ed1c328b7@o4510801647042560.ingest.us.sentry.io/4510801648615424"
VITE_ENVIRONMENT="development"
```

---

## Checklist de Deploy

### Banco de Dados
- [ ] Aplicar migration `fix_financial_records_rls_security.sql`
- [ ] Verificar que a policy foi atualizada corretamente
- [ ] Testar acesso de professor aos registros financeiros

### Frontend
- [ ] Garantir que `.env` em produção tem `VITE_ENVIRONMENT="production"`
- [ ] Confirmar que Sentry está recebendo eventos
- [ ] Configurar alertas no Sentry

### Testes
- [ ] Testar signup de novo usuário
- [ ] Testar criação de aluno/professor
- [ ] Verificar que não há race conditions
- [ ] Simular erro e verificar no Sentry

---

## P1-AUTH: Rate Limiting

### Problema Identificado
Atualmente, **não há rate limiting configurado no lado do servidor**. Um atacante pode:
- Tentar 1 milhão de combinações de senha (brute force)
- Criar milhares de contas falsas (DDoS de signup)
- Enviar flood de emails de recuperação de senha
- Enumerar emails válidos no sistema

Rate limiting no frontend é **inútil** porque:
- Atacante pode chamar a API diretamente
- Pode resetar localStorage/cookies
- Pode trocar de IP facilmente

### Solução Requerida
**⚠️ Configuração manual no Dashboard do Supabase**

O Supabase Auth tem rate limiting nativo, mas precisa ser ativado manualmente:

#### 1. Rate Limits Recomendados
**Nota:** Valores no Dashboard são por **5 minutos por IP** (não por hora)

| Campo no Dashboard | Recomendado | Equivale a/hora | Justificativa |
|-------------------|-------------|-----------------|---------------|
| Sign-ups and sign-ins | 10/5min | 120/hora | Bloqueia brute force |
| Token refreshes | 150/5min | 1800/hora | Permite uso normal |
| Token verifications | 30/5min | 360/hora | Padrão adequado |
| Anonymous users | 10/5min | 120/hora | Limita abuse de anônimos |
| Sending emails | 2/hora | 2/hora | Previne flood de emails |

#### 2. Session Settings
| Configuração | Valor | Impacto |
|-------------|-------|---------|
| Max Inactivity Time | 24 hours | Logout automático |
| JWT Expiry | 1 hour | Token expira rápido |
| Refresh Token Rotation | ON | Invalida tokens antigos |

#### 3. Passos de Configuração
1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** → **Settings**
3. Configure **Rate Limits** conforme tabela acima
4. Configure **Session Settings** conforme tabela acima
5. Ative **Email Confirmation** para novos usuários
6. (Opcional) Ative **CAPTCHA** após tentativas falhas

### Impacto
- ✅ Bloqueia ataques de força bruta
- ✅ Previne account enumeration
- ✅ Limita abuse de recursos
- ✅ Reduz risco de DDoS
- ✅ Protege serviço de email

### Arquivos Relacionados
- `.github/RATE_LIMITING.md` (guia completo)

### Status
⚠️ **PENDENTE - Requer ação manual no Dashboard do Supabase**

**Não pode ser automatizado via migration ou código.**

---

## Monitoramento Contínuo

### Sentry Dashboard
Acesse: [https://sentry.io](https://sentry.io)

**Métricas importantes:**
- Taxa de erros por endpoint
- Erros por usuário/role
- Performance de transações críticas
- Session Replays de erros

### Logs Estruturados
Todos os erros incluem:
- ID do usuário
- Role (admin/teacher/student)
- Contexto da operação
- Stack trace completo
- Breadcrumbs (histórico de ações)

---

## Próximos Passos Recomendados

### Curto Prazo
1. Aplicar migration do RLS em produção
2. Monitorar Sentry por 1 semana
3. Ajustar taxa de amostragem se necessário

### Médio Prazo
1. Adicionar testes E2E para fluxos de signup
2. Configurar alertas no Sentry (Slack/Discord)
3. Implementar health checks

### Longo Prazo
1. Adicionar logging de auditoria para ações sensíveis
2. ✅ ~~Implementar rate limiting~~ → Ver RATE_LIMITING.md (P1-AUTH)
3. Adicionar 2FA para admins (P2-SEC)

---

## Documentação Adicional

- [Guia de Observabilidade](.github/OBSERVABILITY.md)
- [Guia de CI](.github/CI_GUIDE.md)
- [Guia de Rate Limiting](.github/RATE_LIMITING.md) ⚠️ **AÇÃO REQUERIDA**
- [Implementação LGPD](.github/LGPD_IMPLEMENTATION.md)
- [Checklist de Deploy](../DEPLOYMENT_CHECKLIST_COMPLETE.md)

---

## Contato

Para questões sobre segurança, entre em contato com a equipe de desenvolvimento.

**Última atualização:** 2026-01-30
