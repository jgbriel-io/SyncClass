# 🚀 PLANO DE SPRINTS - CORREÇÕES E OTIMIZAÇÕES
## JLAC EduCore - Auditoria 360º

**Data de Criação:** 23/02/2026  
**Score Atual:** 9.3/10  
**Score Alvo:** 9.8/10  
**Duração Total:** 9.5 dias (~2 semanas)

---

## 📋 SPRINT 1: SEGURANÇA CRÍTICA
**Duração:** 2 dias (14h)  
**Prioridade:** 🔴 CRÍTICO  
**Objetivo:** Corrigir vulnerabilidades de segurança identificadas

### 1.1 Verificar e Corrigir Views (CRÍTICO)
**Estimativa:** 4h

**Problema:**
Views podem estar sem `security_invoker = true`, permitindo bypass de RLS.

**Tarefas:**
- [ ] Verificar `security_invoker` em todas as views
- [ ] Criar migration 18 para corrigir views
- [ ] Testar bypass de RLS em views
- [ ] Validar em homologação

**Arquivos Afetados:**
```
supabase/migrations/18_fix_views_security_invoker.sql
```

**SQL de Verificação:**
```sql
SELECT 
  schemaname, 
  viewname, 
  viewowner,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE '%masked%';
```

**Critério de Aceitação:**
- Todas as views têm `security_invoker = true`
- Testes de bypass de RLS falham (segurança OK)

---

### 1.2 Implementar Limpeza de Storage Órfão (CRÍTICO)
**Estimativa:** 6h

**Problema:**
Arquivos de atividades deletadas permanecem no Storage, causando vazamento de espaço.

**Tarefas:**
- [ ] Criar função SQL `cleanup_orphaned_storage_files()`
- [ ] Criar Edge Function `cleanup-storage`
- [ ] Adicionar ao cron job de limpeza
- [ ] Testar com atividades deletadas

**Arquivos Afetados:**
```
supabase/migrations/18_fix_views_security_invoker.sql (adicionar função)
supabase/functions/cleanup-storage/index.ts
supabase/functions/cleanup-storage/cleanup-storage.ts
```

**Lógica da Função:**
```sql
CREATE FUNCTION cleanup_orphaned_storage_files()
RETURNS void AS $$
DECLARE
  v_file_path TEXT;
BEGIN
  -- Buscar arquivos de atividades deletadas há mais de 90 dias
  FOR v_file_path IN
    SELECT file_url FROM activities 
    WHERE deleted_at < NOW() - INTERVAL '90 days'
    AND file_url IS NOT NULL
  LOOP
    -- Deletar do storage
    PERFORM storage.delete_object('activities', v_file_path);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
```

**Critério de Aceitação:**
- Arquivos órfãos são deletados automaticamente
- Storage não cresce infinitamente
- Logs de limpeza registrados

---

### 1.3 Adicionar Retry em Edge Functions (CRÍTICO)
**Estimativa:** 4h

**Problema:**
Edge Functions falham silenciosamente sem retry ou alertas.

**Tarefas:**
- [ ] Implementar retry com exponential backoff
- [ ] Adicionar integração com Sentry
- [ ] Configurar alertas para falhas críticas
- [ ] Testar cenários de falha

**Arquivos Afetados:**
```
supabase/functions/cleanup-old-records/cleanup-old-records.ts
supabase/functions/cleanup-storage/cleanup-storage.ts
```

**Implementação:**
```typescript
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      log(`Attempt ${attempt}/${maxRetries} failed`, { error: lastError.message });
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  // Todas as tentativas falharam - enviar alerta
  Sentry.captureException(lastError, {
    tags: { function: context, critical: true },
    extra: { maxRetries, attempts: maxRetries },
  });
  
  throw lastError;
}
```

**Critério de Aceitação:**
- Edge Functions tentam 3x antes de falhar
- Falhas críticas geram alertas no Sentry
- Logs detalhados de cada tentativa

---

## 📋 SPRINT 2: CONSISTÊNCIA DE DADOS
**Duração:** 1 dia (6h)  
**Prioridade:** 🟡 IMPORTANTE  
**Objetivo:** Padronizar validações e escala de dados

### 2.1 Padronizar Escala de Notas (0-100)
**Estimativa:** 3h

**Problema:**
Frontend valida 0-10, banco valida 0-100. Inconsistência pode causar confusão.

**Tarefas:**
- [ ] Atualizar schema Zod no frontend (0-100)
- [ ] Atualizar labels e placeholders
- [ ] Atualizar constraint do banco (já está 0-100)
- [ ] Migrar notas antigas se necessário
- [ ] Testar formulários de correção

**Arquivos Afetados:**
```
src/components/activities/AddCorrectionDialog.tsx
src/components/activities/EditActivityDialog.tsx
src/components/activities/ActivityDetailSheet.tsx
```

**Mudança no Schema:**
```typescript
// ANTES
const correctionSchema = z.object({
  grade: z.string().min(1, "Informe a nota (0–10)"),
}).refine(
  (data) => {
    const n = parseFloat(data.grade.replace(",", "."));
    return !Number.isNaN(n) && n >= 0 && n <= 10;
  },
  { message: "Informe a nota (0–10)", path: ["grade"] }
);

// DEPOIS
const correctionSchema = z.object({
  grade: z.string().min(1, "Informe a nota (0–100)"),
}).refine(
  (data) => {
    const n = parseFloat(data.grade.replace(",", "."));
    return !Number.isNaN(n) && n >= 0 && n <= 100;
  },
  { message: "Informe a nota (0–100)", path: ["grade"] }
);
```

**Critério de Aceitação:**
- Todos os formulários validam 0-100
- Labels e placeholders atualizados
- Notas antigas migradas (se necessário)

---

### 2.2 Adicionar Validação de Email no Banco
**Estimativa:** 2h

**Problema:**
Banco não valida formato de email, permitindo emails inválidos.

**Tarefas:**
- [ ] Criar constraint de formato de email
- [ ] Criar função de validação `is_valid_email()`
- [ ] Aplicar em students e teachers
- [ ] Testar com emails inválidos

**Arquivos Afetados:**
```
supabase/migrations/19_add_email_validation.sql
```

**Implementação:**
```sql
-- Função de validação
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Constraint em students
ALTER TABLE students 
ADD CONSTRAINT students_email_format 
CHECK (email IS NULL OR is_valid_email(email));

-- Constraint em teachers
ALTER TABLE teachers 
ADD CONSTRAINT teachers_email_format 
CHECK (email IS NULL OR is_valid_email(email));
```

**Critério de Aceitação:**
- Emails inválidos são rejeitados pelo banco
- Emails existentes são validados
- Mensagem de erro amigável no frontend

---

### 2.3 Adicionar Índice para Soft Delete
**Estimativa:** 1h

**Problema:**
Queries filtram `deleted_at IS NULL` sem índice, causando lentidão.

**Tarefas:**
- [ ] Criar índice `idx_activities_deleted_at`
- [ ] Analisar performance antes/depois
- [ ] Aplicar em outras tabelas com soft delete

**Arquivos Afetados:**
```
supabase/migrations/19_add_email_validation.sql (adicionar)
```

**Implementação:**
```sql
-- Índice parcial (apenas registros não deletados)
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at 
ON activities(deleted_at) 
WHERE deleted_at IS NULL;

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_activities_student_deleted 
ON activities(student_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_teacher_deleted 
ON activities(teacher_id, deleted_at) 
WHERE deleted_at IS NULL;
```

**Critério de Aceitação:**
- Queries de listagem 30-50% mais rápidas
- EXPLAIN ANALYZE mostra uso do índice
- Sem impacto em writes

---

## 📋 SPRINT 3: PRIVACIDADE E CRIPTOGRAFIA
**Duração:** 2 dias (8-12h)  
**Prioridade:** 🟡 IMPORTANTE  
**Objetivo:** Criptografar dados sensíveis

### 3.1 Configurar Chave de Criptografia
**Estimativa:** 2h

**Problema:**
Funções de criptografia criadas mas chave não configurada.

**Tarefas:**
- [ ] Gerar chave segura (256-bit)
- [ ] Configurar `app.settings.encryption_key` no Supabase
- [ ] Testar funções de criptografia
- [ ] Documentar processo de rotação de chave

**Comandos:**
```bash
# Gerar chave segura
openssl rand -base64 32

# Configurar no Supabase (via Dashboard ou CLI)
# Settings > Database > Custom Settings
# app.settings.encryption_key = "sua-chave-aqui"
```

**Teste:**
```sql
-- Testar criptografia
SELECT encrypt_sensitive_data('12345678900') AS encrypted;

-- Testar descriptografia
SELECT decrypt_sensitive_data(
  encrypt_sensitive_data('12345678900')
) AS decrypted;
```

**Critério de Aceitação:**
- Chave configurada e funcionando
- Criptografia/descriptografia testada
- Documentação de rotação criada

---

### 3.2 Migrar PIX Keys para Criptografado
**Estimativa:** 6h

**Problema:**
PIX keys armazenadas em texto plano no banco.

**Tarefas:**
- [ ] Criar migration para criptografar PIX keys existentes
- [ ] Criar view `teachers_with_pix_decrypted` (apenas admin)
- [ ] Atualizar queries do frontend
- [ ] Testar descriptografia

**Arquivos Afetados:**
```
supabase/migrations/20_encrypt_pix_keys.sql
src/hooks/useTeachers.ts
src/components/teachers/TeacherFormDialog.tsx
```

**Implementação:**
```sql
-- Criptografar PIX keys existentes
UPDATE teachers 
SET pix_key = encrypt_sensitive_data(pix_key) 
WHERE pix_key IS NOT NULL 
AND pix_key NOT LIKE 'encrypted:%'; -- Evitar re-criptografar

-- View para admin descriptografar
CREATE OR REPLACE VIEW teachers_with_pix_decrypted 
WITH (security_invoker = true) AS
SELECT 
  id, name, email, phone, address,
  CASE 
    WHEN is_admin() THEN decrypt_sensitive_data(pix_key)
    ELSE NULL
  END AS pix_key_decrypted,
  created_at, updated_at
FROM teachers;

-- RLS na view
ALTER VIEW teachers_with_pix_decrypted OWNER TO postgres;
GRANT SELECT ON teachers_with_pix_decrypted TO authenticated;
```

**Frontend:**
```typescript
// useTeachers.ts
export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers_with_pix_decrypted") // Usar view
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
}
```

**Critério de Aceitação:**
- PIX keys criptografadas no banco
- Apenas admin vê PIX descriptografado
- Frontend funciona sem mudanças visíveis

---

### 3.3 Criptografar Outros Dados Sensíveis (Opcional)
**Estimativa:** 4h

**Problema:**
Endereços e outros dados sensíveis em texto plano.

**Tarefas:**
- [ ] Avaliar necessidade de criptografar endereços
- [ ] Implementar se necessário
- [ ] Atualizar views e queries

**Critério de Aceitação:**
- Decisão documentada (criptografar ou não)
- Se sim, implementado e testado

---

## 📋 SPRINT 4: PERFORMANCE E MONITORAMENTO
**Duração:** 2 dias (12h)  
**Prioridade:** 🟢 MELHORIA  
**Objetivo:** Otimizar queries e adicionar monitoramento

### 4.1 Implementar Monitoramento de LocalStorage
**Estimativa:** 3h

**Problema:**
LocalStorage pode exceder 5MB e travar o app.

**Tarefas:**
- [ ] Criar utilitário `checkStorageQuota()`
- [ ] Adicionar limpeza automática
- [ ] Integrar no App.tsx
- [ ] Testar com cache grande

**Arquivos Afetados:**
```
src/lib/utils/storage.ts (novo)
src/App.tsx
```

**Implementação:**
```typescript
// src/lib/utils/storage.ts
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB (margem de 1MB)

export function calculateStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
}

export function checkStorageQuota(): void {
  const used = calculateStorageSize();
  const usedMB = (used / 1024 / 1024).toFixed(2);
  
  console.log(`LocalStorage: ${usedMB}MB / 5MB`);
  
  if (used > MAX_STORAGE_SIZE) {
    console.warn('LocalStorage limit approaching, clearing cache...');
    
    // Limpar cache do React Query
    const queryClient = useQueryClient();
    queryClient.clear();
    
    // Manter apenas auth session
    const session = localStorage.getItem('supabase.auth.token');
    localStorage.clear();
    if (session) {
      localStorage.setItem('supabase.auth.token', session);
    }
    
    toast.info('Cache limpo para liberar espaço');
  }
}
```

**Integração no App:**
```typescript
// src/App.tsx
useEffect(() => {
  checkStorageQuota();
  const interval = setInterval(checkStorageQuota, 60000); // A cada 1min
  return () => clearInterval(interval);
}, []);
```

**Critério de Aceitação:**
- LocalStorage monitorado a cada 1min
- Limpeza automática quando > 4MB
- Toast informa usuário sobre limpeza

---

### 4.2 Criar Materialized Views para Dashboards
**Estimativa:** 6h

**Problema:**
Queries de dashboard são pesadas e lentas.

**Tarefas:**
- [ ] Criar `activities_dashboard` materialized view
- [ ] Criar `financial_dashboard` materialized view
- [ ] Configurar refresh automático
- [ ] Atualizar queries do frontend

**Arquivos Afetados:**
```
supabase/migrations/21_create_materialized_views.sql
src/hooks/useActivities.ts
src/hooks/useFinancialRecords.ts
```

**Implementação:**
```sql
-- Materialized view para atividades
CREATE MATERIALIZED VIEW activities_dashboard AS
SELECT 
  a.id,
  a.title,
  a.status,
  a.due_date,
  a.grade,
  a.created_at,
  s.id AS student_id,
  s.name AS student_name,
  t.id AS teacher_id,
  t.name AS teacher_name
FROM activities a
LEFT JOIN students s ON a.student_id = s.id
LEFT JOIN teachers t ON a.teacher_id = t.id
WHERE a.deleted_at IS NULL;

-- Índices na materialized view
CREATE INDEX idx_activities_dashboard_student ON activities_dashboard(student_id);
CREATE INDEX idx_activities_dashboard_teacher ON activities_dashboard(teacher_id);
CREATE INDEX idx_activities_dashboard_status ON activities_dashboard(status);

-- Refresh automático (via cron ou trigger)
CREATE OR REPLACE FUNCTION refresh_activities_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY activities_dashboard;
END;
$$ LANGUAGE plpgsql;

-- Agendar refresh a cada 5 minutos
SELECT cron.schedule(
  'refresh-activities-dashboard',
  '*/5 * * * *',
  'SELECT refresh_activities_dashboard();'
);
```

**Frontend:**
```typescript
// src/hooks/useActivities.ts
export function useActivitiesDashboard() {
  return useQuery({
    queryKey: ["activities-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities_dashboard") // Usar materialized view
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5min (sincronizado com refresh)
  });
}
```

**Critério de Aceitação:**
- Queries de dashboard 50-70% mais rápidas
- Refresh automático a cada 5min
- Dados sempre atualizados

---

### 4.3 Adicionar Alertas via Sentry
**Estimativa:** 3h

**Problema:**
Falhas críticas não geram alertas.

**Tarefas:**
- [ ] Configurar alertas para Edge Functions
- [ ] Configurar alertas para cleanup failures
- [ ] Configurar alertas para storage órfão
- [ ] Testar notificações

**Arquivos Afetados:**
```
supabase/functions/cleanup-old-records/cleanup-old-records.ts
supabase/functions/cleanup-storage/cleanup-storage.ts
```

**Implementação:**
```typescript
import * as Sentry from "@sentry/deno";

// Configurar Sentry
Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  environment: Deno.env.get("ENVIRONMENT") || "production",
  tracesSampleRate: 1.0,
});

// Capturar erros críticos
try {
  await executeWithRetry(
    () => supabaseAdmin.rpc("cleanup_old_audit_logs"),
    3,
    "cleanup-audit-logs"
  );
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      function: "cleanup-old-records",
      operation: "cleanup-audit-logs",
      critical: true,
    },
    level: "error",
  });
  
  // Enviar email para admin (opcional)
  await sendAdminAlert({
    subject: "CRÍTICO: Falha na limpeza de logs",
    message: error.message,
  });
}
```

**Critério de Aceitação:**
- Alertas configurados no Sentry
- Notificações recebidas em falhas
- Emails enviados para admin (opcional)

---

## 📋 SPRINT 5: TESTES E VALIDAÇÃO
**Duração:** 2.5 dias (18h)  
**Prioridade:** 🔴 CRÍTICO  
**Objetivo:** Validar todas as correções em produção

### 5.1 Testes de Segurança
**Estimativa:** 6h

**Tarefas:**
- [ ] Testar bypass de RLS em views
- [ ] Testar criptografia de dados
- [ ] Testar validações de constraint
- [ ] Pentesting básico

**Checklist de Testes:**

**RLS:**
```sql
-- Tentar acessar dados de outro usuário
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user-id-1';

SELECT * FROM activities WHERE student_id = 'user-id-2';
-- Deve retornar vazio (RLS bloqueou)
```

**Criptografia:**
```sql
-- Verificar que PIX está criptografado
SELECT pix_key FROM teachers LIMIT 1;
-- Deve retornar string criptografada

-- Verificar descriptografia (como admin)
SELECT pix_key_decrypted FROM teachers_with_pix_decrypted LIMIT 1;
-- Deve retornar PIX em texto plano
```

**Constraints:**
```sql
-- Tentar inserir nota inválida
INSERT INTO activities (student_id, title, grade) 
VALUES ('uuid', 'Teste', 150);
-- Deve falhar com erro de constraint

-- Tentar inserir email inválido
INSERT INTO students (name, email) 
VALUES ('Teste', 'email-invalido');
-- Deve falhar com erro de constraint
```

**Critério de Aceitação:**
- Todos os testes de segurança passam
- Nenhum bypass de RLS encontrado
- Constraints funcionando corretamente

---

### 5.2 Testes de Performance
**Estimativa:** 4h

**Tarefas:**
- [ ] Benchmark de queries antes/depois
- [ ] Testar materialized views
- [ ] Testar índices novos
- [ ] Analisar slow queries

**Benchmark:**
```sql
-- Antes (sem índice)
EXPLAIN ANALYZE
SELECT * FROM activities 
WHERE deleted_at IS NULL 
AND student_id = 'uuid'
ORDER BY created_at DESC;

-- Depois (com índice)
EXPLAIN ANALYZE
SELECT * FROM activities 
WHERE deleted_at IS NULL 
AND student_id = 'uuid'
ORDER BY created_at DESC;

-- Comparar tempo de execução
```

**Métricas Esperadas:**
- Queries de listagem: 30-50% mais rápidas
- Dashboard: 50-70% mais rápido
- Uso de índices: 100% das queries principais

**Critério de Aceitação:**
- Performance melhorou conforme esperado
- Nenhuma regressão de performance
- Slow queries identificadas e otimizadas

---

### 5.3 Testes de Resiliência
**Estimativa:** 4h

**Tarefas:**
- [ ] Testar retry em Edge Functions
- [ ] Testar limpeza de storage
- [ ] Testar falhas de rede
- [ ] Testar cenários de erro

**Cenários de Teste:**

**Retry:**
```typescript
// Simular falha temporária
// Edge Function deve tentar 3x antes de falhar
// Logs devem mostrar tentativas
```

**Storage Cleanup:**
```sql
-- Criar atividade com arquivo
-- Soft delete
-- Aguardar 90 dias (simular com UPDATE)
-- Verificar que arquivo foi deletado
```

**Falhas de Rede:**
```typescript
// Desconectar internet
// Tentar operação
// Verificar mensagem de erro amigável
// Reconectar
// Verificar retry automático
```

**Critério de Aceitação:**
- Retry funciona em falhas temporárias
- Storage cleanup funciona corretamente
- Erros de rede tratados adequadamente

---

### 5.4 Deploy em Produção
**Estimativa:** 4h

**Tarefas:**
- [ ] Aplicar migrations em ordem
- [ ] Deploy de Edge Functions
- [ ] Configurar cron jobs
- [ ] Monitorar logs por 24h

**Ordem de Deploy:**

**1. Migrations (em ordem):**
```bash
# Sprint 1
supabase db push --file supabase/migrations/18_fix_views_security_invoker.sql

# Sprint 2
supabase db push --file supabase/migrations/19_add_email_validation.sql

# Sprint 3
supabase db push --file supabase/migrations/20_encrypt_pix_keys.sql

# Sprint 4
supabase db push --file supabase/migrations/21_create_materialized_views.sql
```

**2. Edge Functions:**
```bash
supabase functions deploy cleanup-old-records
supabase functions deploy cleanup-storage
```

**3. Configurar Secrets:**
```bash
supabase secrets set SENTRY_DSN="..."
supabase secrets set CRON_SECRET="..."
supabase secrets set ENCRYPTION_KEY="..."
```

**4. Configurar Cron Jobs:**
```
Via Supabase Dashboard > Edge Functions > Schedule
- cleanup-old-records: 0 2 * * * (2h da manhã)
- cleanup-storage: 0 3 * * * (3h da manhã)
- refresh-materialized-views: */5 * * * * (a cada 5min)
```

**5. Monitoramento:**
```bash
# Monitorar logs por 24h
supabase functions logs cleanup-old-records --tail
supabase functions logs cleanup-storage --tail

# Verificar Sentry para alertas
# Verificar performance no Supabase Dashboard
```

**Critério de Aceitação:**
- Todas as migrations aplicadas sem erro
- Edge Functions deployadas e funcionando
- Cron jobs agendados e executando
- Nenhum erro crítico em 24h

---

## 📊 RESUMO EXECUTIVO

### Duração Total
- **Sprint 1:** 2 dias (Segurança Crítica)
- **Sprint 2:** 1 dia (Consistência)
- **Sprint 3:** 2 dias (Privacidade)
- **Sprint 4:** 2 dias (Performance)
- **Sprint 5:** 2.5 dias (Testes e Deploy)
- **TOTAL:** 9.5 dias (~2 semanas)

### Priorização
| Sprint | Prioridade | Pode Pular? |
|--------|------------|-------------|
| Sprint 1 | 🔴 CRÍTICO | NÃO |
| Sprint 2 | 🟡 IMPORTANTE | Parcialmente |
| Sprint 3 | 🟡 IMPORTANTE | SIM (se não houver dados sensíveis) |
| Sprint 4 | 🟢 MELHORIA | SIM |
| Sprint 5 | 🔴 CRÍTICO | NÃO |

### Impacto no Score
| Sprint | Score Antes | Score Depois | Ganho |
|--------|-------------|--------------|-------|
| Sprint 1 | 9.3 | 9.5 | +0.2 |
| Sprint 2 | 9.5 | 9.6 | +0.1 |
| Sprint 3 | 9.6 | 9.7 | +0.1 |
| Sprint 4 | 9.7 | 9.8 | +0.1 |
| Sprint 5 | 9.8 | 9.8 | 0 (validação) |

### Recursos Necessários
- **Desenvolvedor Full-Stack:** 1 pessoa
- **Acesso ao Supabase Dashboard:** Admin
- **Acesso ao Sentry:** Admin
- **Ambiente de Homologação:** Obrigatório
- **Ambiente de Produção:** Para deploy final

### Riscos e Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Migration falhar em prod | Baixa | Alto | Testar em homolog primeiro |
| Criptografia quebrar queries | Média | Médio | Usar views de descriptografia |
| Performance piorar | Baixa | Médio | Benchmark antes/depois |
| Storage cleanup deletar arquivos errados | Baixa | Alto | Testar com dados de teste |

### Checklist Final
- [ ] Todas as migrations testadas em homologação
- [ ] Backup do banco de produção realizado
- [ ] Edge Functions deployadas e testadas
- [ ] Cron jobs configurados
- [ ] Monitoramento ativo (Sentry + Logs)
- [ ] Documentação atualizada
- [ ] Equipe treinada nas mudanças
- [ ] Rollback plan documentado

---

## 🚀 PRÓXIMOS PASSOS

1. **Revisar este documento** com a equipe
2. **Priorizar sprints** conforme necessidade do negócio
3. **Alocar recursos** (desenvolvedor + tempo)
4. **Criar branch** `feature/security-improvements`
5. **Começar Sprint 1** (Segurança Crítica)

---

## 📞 CONTATO

**Dúvidas sobre as sprints?**
- Consulte a auditoria completa (documento anterior)
- Revise os critérios de aceitação de cada task
- Teste em homologação antes de produção

**Boa sorte! 🎯**
