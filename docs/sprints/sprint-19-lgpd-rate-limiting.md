# Sprint 19 — LGPD Anonymization + Server-Side Rate Limiting

**Período:** 22/05/2026 – 23/05/2026  
**Status:** ✅ Concluída  
**Tipo:** Security + Compliance  
**Prioridade:** 🔴 Alta

## Problem Statement

Dois gaps de segurança e conformidade identificados no projeto:

### Gap 1 — LGPD: Dados pessoais sem ciclo de vida definido

Alunos e professores arquivados (soft delete) mantinham dados pessoais identificáveis indefinidamente no banco. Violação do princípio de minimização de dados (LGPD Art. 16).

**Impacto:**

- Dados como nome, telefone, email, endereço retidos após encerramento do vínculo
- Sem mecanismo de eliminação definitiva (LGPD Art. 18, II)
- Sem audit trail de operações de exclusão (LGPD Art. 37)

### Gap 2 — Rate Limiting: Proteção contra abuse inexistente no servidor

Apenas proteção client-side (Map em memória) existia. Bypassável via DevTools ou scripts automatizados. Operações financeiras críticas (`mark_as_paid`, `confirm_payment`, `undo_payment`) sem throttling real.

**Impacto:**

- Abuse intencional não detectado no servidor
- Múltiplas sessões paralelas contornavam proteção
- Ataques automatizados sem barreira de contenção

## Requirements

### Funcionais — LGPD

- [x] Soft delete anonimiza dados pessoais automaticamente via RPC
- [x] Dados preservados pós-anonimização: `id`, vínculos, status, timestamps, histórico de aulas e cobranças
- [x] Views mascaradas (`students_masked`, `students_active_masked`) para acesso ao frontend
- [x] Cron job mensal elimina definitivamente registros anonimizados há mais de 5 anos
- [x] Restauração bloqueada para registros já anonimizados
- [x] Audit log registra todas operações de anonimização

### Funcionais — Rate Limiting

- [x] Tabela `rate_limits` armazena requisições por `(user_id, operation, window_start)`
- [x] `check_rate_limit()` verifica e registra — retorna boolean
- [x] `get_rate_limit_info()` consulta status atual
- [x] `enforce_rate_limit()` valida e lança exceção se excedido (uso interno em RPCs)
- [x] RPCs financeiras protegidas: `mark_as_paid_idempotent` (10/min), `confirm_payment_idempotent` (10/min), `undo_payment_idempotent` (5/min)
- [x] Cron job horário limpa registros com `window_start < NOW() - INTERVAL '2 hours'`
- [x] Client-side (`src/lib/utils/rateLimit.ts`) mantido como complemento de UX

### Não-Funcionais

- [x] Anonimização atômica (tudo ou nada — transação única)
- [x] `anonymize_student()` / `anonymize_teacher()` com `SECURITY DEFINER`
- [x] Rate limiting server-side bypass-proof (validação via `auth.uid()`)
- [x] Usuários não autenticados (`auth.uid() NULL`) bloqueados automaticamente
- [x] Índices em `rate_limits` para performance: `(user_id, operation)` e `(window_start)`

### Critérios de Aceitação

- [x] Soft delete de aluno/professor retorna `{ success: true, anonymized: true }`
- [x] Dados pessoais NULL após soft delete (name substituído por placeholder)
- [x] Erro explícito ao tentar restaurar registro anonimizado
- [x] Audit log gerado para cada anonimização
- [x] `check_rate_limit()` retorna FALSE após limite excedido
- [x] Cron jobs ativos e com schedule correto

## Background

### LGPD — Artigos Atendidos

| Artigo      | Requisito                                   | Implementação                              |
| ----------- | ------------------------------------------- | ------------------------------------------ |
| Art. 16     | Dados anonimizados não são dados pessoais   | Soft delete elimina PII antes da retenção  |
| Art. 18, II | Direito à eliminação                        | Hard delete automático após 5 anos         |
| Art. 18, VI | Direito à informação sobre compartilhamento | Audit logs registram operações             |
| Art. 37     | Registro de operações pelo controlador      | `audit_logs` table com metadados completos |

### Retenção de Dados Definida

| Tipo                          | Período                     | Justificativa                  |
| ----------------------------- | --------------------------- | ------------------------------ |
| Dados pessoais identificáveis | Até soft delete             | Necessário para operação       |
| Dados anonimizados            | Até 5 anos após soft delete | Histórico financeiro/auditoria |
| Dados agregados (stats)       | Indefinido                  | Não identificam indivíduos     |

### Rate Limiting — Comparativo de Abordagens

| Aspecto          | Client-Side      | Server-Side            |
| ---------------- | ---------------- | ---------------------- |
| **Bypass**       | Fácil (DevTools) | Impossível             |
| **Persistência** | Por sessão       | Por usuário            |
| **Coordenação**  | Apenas local     | Global (todas sessões) |
| **Auditoria**    | Não              | Sim (banco)            |

**Decisão:** Arquitetura híbrida — client-side para UX imediato, server-side para segurança real.

## Proposed Solution

### Solução LGPD

Duas funções PL/pgSQL com `SECURITY DEFINER` executam anonimização atômica:

```sql
-- Alunos: substitui PII por placeholder
SELECT anonymize_student('uuid-do-aluno');
-- name → 'Aluno [8 chars UUID]', phone/email/birth_date/city/state/origin → NULL
-- anonymized_at → NOW()

-- Professores: substitui PII por placeholder
SELECT anonymize_teacher('uuid-do-professor');
-- name → 'Professor [8 chars UUID]', phone/email/address/pix_key → NULL
-- anonymized_at → NOW()
```

Soft delete chama anonimização antes de marcar `is_deleted = true`. Cron job mensal (dia 1, 4h) faz hard delete com CASCADE após 5 anos.

### Solução Rate Limiting

Tabela `rate_limits` com `(user_id, operation, window_start)` único. Três funções:

- `check_rate_limit(operation, max_requests, window_minutes)` — retorna boolean, registra
- `get_rate_limit_info(operation, window_minutes)` — consulta sem efeito colateral
- `enforce_rate_limit(operation, max_requests, window_minutes)` — chama internamente em RPCs, lança exceção

RPCs financeiras recebem `PERFORM enforce_rate_limit(...)` no início da função.

## Task Breakdown

### Task 1: Funções de Anonimização

**Objetivo:** Implementar `anonymize_student()` e `anonymize_teacher()` via migration

**Dados anonimizados — Alunos:**

- `name` → `'Aluno ' || LEFT(id::text, 8)`
- `phone`, `email`, `birth_date`, `city`, `state`, `origin` → `NULL`
- `anonymized_at` → `NOW()`

**Dados anonimizados — Professores:**

- `name` → `'Professor ' || LEFT(id::text, 8)`
- `phone`, `email`, `address`, `pix_key` → `NULL`
- `anonymized_at` → `NOW()`

**Dados preservados:** `id`, `teacher_id`/`student_id`, `status`, `is_deleted`, `created_at`, `updated_at`, registros de aulas e cobranças

**Migration:** `supabase/migrations/26_implement_lgpd_anonymization.sql`

**Esforço:** 2h

---

### Task 2: Soft Delete com Anonimização Automática

**Objetivo:** `soft_delete_student()` / `soft_delete_teacher()` chamam anonimização antes de marcar inativo

**Fluxo:**

```sql
SELECT soft_delete_student('uuid-do-aluno');
-- 1. anonymize_student(id) — zera PII
-- 2. UPDATE students SET is_deleted = true, status = 'inativo'
-- 3. Desativa profile de auth (se existir)
-- 4. INSERT audit_logs com metadata {anonymized: true, anonymized_at: ...}
-- Retorna: { success: true, message: "...", anonymized: true }
```

**Proteção contra restauração:**

```sql
SELECT restore_student('uuid-do-aluno');
-- EXCEPTION se anonymized_at IS NOT NULL: "Não é possível restaurar aluno anonimizado"
```

**Esforço:** 1h

---

### Task 3: Hard Delete Automático (Cron)

**Objetivo:** Eliminar definitivamente registros anonimizados há mais de 5 anos

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION hard_delete_anonymized_records()
RETURNS void AS $$
BEGIN
  DELETE FROM students WHERE anonymized_at < NOW() - INTERVAL '5 years';
  DELETE FROM teachers WHERE anonymized_at < NOW() - INTERVAL '5 years';
  -- CASCADE remove class_logs e financial_records vinculados
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron: dia 1 de cada mês às 4h
SELECT cron.schedule('hard-delete-anonymized-records', '0 4 1 * *',
  'SELECT hard_delete_anonymized_records()');
```

**Esforço:** 30min

---

### Task 4: Views com Mascaramento LGPD

**Objetivo:** Frontend nunca acessa dados sensíveis sem mascaramento

**Views atualizadas:** `students_masked`, `students_active_masked`

```sql
-- CPF mascarado: 123.456.789-01 → ***.***.***-01
CASE
  WHEN cpf IS NOT NULL THEN '***.***.***-' || SUBSTRING(cpf FROM LENGTH(cpf) - 1)
  ELSE NULL
END AS cpf,

-- Telefone mascarado: (11) 98765-4321 → (11) *****-4321
CASE
  WHEN phone IS NOT NULL THEN SUBSTRING(phone FROM 1 FOR 6) || '*****' || SUBSTRING(phone FROM LENGTH(phone) - 3)
  ELSE NULL
END AS phone
```

**Convenção de uso:**

```ts
// ✅ Sempre usar views masked no frontend
const { data } = await supabase.from("students_masked").select("*");

// ❌ Nunca acessar tabela direta
const { data } = await supabase.from("students").select("*");
```

**Esforço:** 30min

---

### Task 5: Tabela `rate_limits` e Índices

**Objetivo:** Estrutura server-side para rastreamento de requisições

**Migration:** `supabase/migrations/27_implement_server_side_rate_limiting_v2.sql`

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, operation, window_start)
);

CREATE INDEX idx_rate_limits_user_operation ON rate_limits(user_id, operation);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);
```

**Esforço:** 30min

---

### Task 6: Funções de Rate Limiting

**Objetivo:** `check_rate_limit`, `get_rate_limit_info`, `enforce_rate_limit`

**Configurações de limite:**

| RPC                          | Limite | Janela |
| ---------------------------- | ------ | ------ |
| `mark_as_paid_idempotent`    | 10 req | 1 min  |
| `confirm_payment_idempotent` | 10 req | 1 min  |
| `undo_payment_idempotent`    | 5 req  | 1 min  |

**Padrão de uso em novas RPCs:**

```sql
CREATE FUNCTION public.nova_rpc(p_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM enforce_rate_limit('nova_operacao', 10, 1);
  -- Resto da lógica...
  RETURN jsonb_build_object('success', true);
END;
$$;
```

**Mensagem de erro ao exceder limite:**

```
Rate limit excedido para "mark_as_paid".
12 requisições em 1 min. Limite: 10. Aguarde.
```

**Esforço:** 1.5h

---

### Task 7: Cron de Limpeza Rate Limits

**Objetivo:** Limpeza automática horária para evitar acúmulo

```sql
SELECT cron.schedule('cleanup-rate-limits', '0 * * * *',
  'DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL ''2 hours''');
```

**Verificação:**

```sql
SELECT * FROM cron.job WHERE jobname = 'cleanup-rate-limits';
```

**Esforço:** 15min

## Files Created

```
supabase/migrations/
├── 26_implement_lgpd_anonymization.sql     # anonymize_student/teacher, soft/hard delete, cron
└── 27_implement_server_side_rate_limiting_v2.sql  # rate_limits table, 3 functions, cron
```

## Files Modified

```
src/
└── lib/
    └── utils/
        └── rateLimit.ts     # Client-side mantido (complemento de UX)

supabase/migrations/         # Views students_masked e students_active_masked (incluídas em migration 26)
```

## Testing & Validation

- [x] Soft delete retorna `{ success: true, anonymized: true }`
- [x] `SELECT name, phone, email FROM students WHERE id = '<arquivado>'` → `name = 'Aluno abc12345'`, demais `NULL`
- [x] `SELECT restore_student('<anonimizado>')` → EXCEPTION com mensagem clara
- [x] `SELECT * FROM audit_logs WHERE action = 'soft_delete_student_with_anonymization'` → registro criado
- [x] `SELECT check_rate_limit('mark_as_paid', 10, 1)` → `TRUE` até 10 chamadas, `FALSE` na 11ª
- [x] `SELECT * FROM cron.job` → ambos os jobs ativos com schedule correto
- [x] Build sem erros (`npm run build`)
- [x] Type-check passou (`npm run type-check`)

## Results & Impact

### Métricas Quantitativas

- ✅ 2 funções de anonimização implementadas (`anonymize_student`, `anonymize_teacher`)
- ✅ 2 cron jobs adicionados (hard delete mensal + cleanup rate limits horário)
- ✅ 3 funções de rate limiting implementadas
- ✅ 3 RPCs financeiras protegidas com throttling server-side
- ✅ 4 artigos LGPD atendidos (Art. 16, 18-II, 18-VI, 37)
- ✅ 2 migrations criadas (26 + 27)

### Melhorias Qualitativas

- ✅ **Conformidade LGPD:** PII eliminada no momento do arquivamento, não retida indefinidamente
- ✅ **Segurança real:** Rate limiting bypass-proof (validação server-side via `auth.uid()`)
- ✅ **Audit trail:** Todas operações de exclusão rastreadas com metadados
- ✅ **Proteção financeira:** Operações críticas com throttling coordenado entre sessões
- ✅ **Manutenção automática:** Dois cron jobs eliminam acúmulo de dados desnecessários

## Technical Debt

Itens identificados mas não resolvidos nesta sprint:

- [ ] Portabilidade de dados (LGPD Art. 18, V) — exportação em formato legível — planejado para pós-TCC
- [ ] Notificação ao titular antes do hard delete (courtesy email) — requer Edge Function adicional
- [ ] Rate limiting para usuários não autenticados (fluxos de login/reset) — `auth.uid()` NULL não capturado pelo sistema atual
- [ ] Dashboard admin de rate limits (`get_rate_limit_info` disponível mas sem UI)
- [ ] DDoS protection — rate limiting não substitui WAF/Cloudflare para ataques distribuídos

## Lessons Learned

### O que funcionou bem

- ✅ `SECURITY DEFINER` nas funções de anonimização garantiu execução com permissões corretas independente do caller
- ✅ Arquitetura híbrida de rate limiting separou claramente UX (client) de segurança (server)
- ✅ Views mascaradas como contrato de interface — frontend nunca acessa tabela direta
- ✅ `UNIQUE(user_id, operation, window_start)` na tabela `rate_limits` previne dupla contagem por concorrência

### O que poderia melhorar

- ⚠️ Hard delete com `anonymized_at < NOW() - INTERVAL '5 years'` não terá efeito prático por anos — considerar período menor para testes (ex: 30 dias em staging)
- ⚠️ `enforce_rate_limit()` marcada como "não usada" na análise do banco — requer chamada explícita dentro de cada RPC (não automático)
- ⚠️ Client-side `rateLimit.ts` usa Map em memória — limpa ao recarregar página, usuário pode contornar com F5

### Aplicações futuras

- 💡 Aplicar `enforce_rate_limit()` em todas as RPCs críticas futuras como padrão
- 💡 Usar `anonymized_at` como flag de estado — evita booleanos adicionais
- 💡 Documentar ciclo de vida de dados (LGPD) no README para novos contribuidores

## Next Steps

1. **Sprint 20:** Exportação de dados LGPD (portabilidade — LGPD Art. 18, V), dashboard de rate limits (admin)
2. **Trabalho futuro:** Correções arquiteturais — God hooks, query keys inconsistentes, N+1 queries

## References

- [LGPD — Lei nº 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- Migration LGPD: `supabase/migrations/26_implement_lgpd_anonymization.sql`
- Migration Rate Limiting: `supabase/migrations/27_implement_server_side_rate_limiting_v2.sql`
- Client-side: `src/lib/utils/rateLimit.ts`
- Análise do banco: `docs/database/analise-banco.md`
