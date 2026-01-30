# 🚀 Guia Rápido: Aplicar Migrations

**Tempo estimado:** 5 minutos  
**Requer:** Acesso ao Dashboard do Supabase

---

## ⚡ Método Rápido (Dashboard)

### 1. Acesse o SQL Editor
```
1. Vá em https://app.supabase.com
2. Selecione o projeto "edu-core-zen"
3. Clique em "SQL Editor" no menu lateral
```

### 2. Aplique Migration 1: Cálculo de Saldo

**Arquivo:** `supabase/migrations/student_balance_view.sql`

```bash
# Copiar todo o conteúdo do arquivo
1. Abra: supabase/migrations/student_balance_view.sql
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em "RUN" (canto inferior direito)
5. ✅ Aguarde mensagem de sucesso
```

**Esperado:** 3 views criadas + 1 função + índices

### 3. Aplique Migration 2: Status de Aulas

**Arquivo:** `supabase/migrations/class_logs_improvements.sql`

```bash
# Mesmo processo
1. Abra: supabase/migrations/class_logs_improvements.sql
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em "RUN"
5. ✅ Aguarde mensagem de sucesso
```

**Esperado:** Campos adicionados + 1 view + 2 funções + índices

### 4. Verificar se Funcionou

Execute no SQL Editor:

```sql
-- Teste 1: Verificar views de saldo
SELECT * FROM public.student_complete_balance LIMIT 5;

-- Teste 2: Verificar cálculo de saldo (com detalhes)
SELECT 
    student_name,
    total_paid,
    total_pending,
    total_overdue,
    total_classes,
    attendance_rate
FROM public.student_financial_balance
LIMIT 5;

-- Teste 3: Verificar aulas com cobrança
SELECT * FROM public.class_logs_with_billing LIMIT 10;

-- Teste 4: Ver estatísticas de aulas
SELECT * FROM public.student_class_stats LIMIT 5;
```

**Esperado:** Dados retornados sem erros ✅

**Se quiser testar com um aluno específico:**
```sql
-- 1. Primeiro, obtenha um UUID de aluno:
SELECT id, name FROM public.students LIMIT 1;

-- 2. Copie o UUID retornado e use nas queries:
-- (Substitua 'SEU-UUID-AQUI' pelo UUID real copiado)

SELECT * FROM public.class_logs_with_billing 
WHERE student_id = 'SEU-UUID-AQUI'::uuid;

SELECT * FROM public.get_unbilled_classes('SEU-UUID-AQUI'::uuid);
```

---

## 🔧 Método Alternativo (CLI)

Se você tem o Supabase CLI instalado:

```bash
cd supabase

# Aplicar todas as migrations pendentes
supabase db push

# Ou aplicar migrations específicas
supabase db push --include-seed

# Verificar status
supabase db status
```

---

## ✅ Checklist Pós-Aplicação

Após aplicar as migrations:

- [ ] No SQL Editor, executar: `SELECT * FROM student_complete_balance;`
- [ ] Verificar que retorna dados dos alunos com saldo calculado
- [ ] No frontend (`npm run dev`), abrir um aluno
- [ ] Verificar que a nova aba "Extrato" aparece
- [ ] Verificar que o extrato mostra aulas + cobranças
- [ ] Confirmar que o saldo atual está correto

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
**Causa:** Views antigas não foram dropadas

**Solução:**
```sql
-- Dropar views antigas (se existirem)
DROP VIEW IF EXISTS public.student_complete_balance CASCADE;
DROP VIEW IF EXISTS public.student_financial_balance CASCADE;
DROP VIEW IF EXISTS public.student_class_stats CASCADE;
DROP VIEW IF EXISTS public.class_logs_with_billing CASCADE;

-- Depois, executar a migration novamente
```

### Erro: "column already exists"
**Causa:** Campos já foram adicionados antes

**Solução:**
- As migrations têm proteção (`IF NOT EXISTS`)
- Isso é esperado e seguro
- Ignore o aviso e continue

### Erro: "permission denied"
**Causa:** Falta de permissões

**Solução:**
```sql
-- Executar como superuser (no SQL Editor do Dashboard)
-- Ou verificar que está usando o banco correto
```

---

## 📊 Verificar Performance

Após aplicar, teste a performance:

```sql
-- Antes (cálculo no React) vs Depois (view SQL)

-- Query antiga (cálculo manual)
EXPLAIN ANALYZE
SELECT 
    s.*,
    (SELECT COUNT(*) FROM class_logs WHERE student_id = s.id) as total_classes
FROM students s;

-- Query nova (view otimizada)
EXPLAIN ANALYZE
SELECT * FROM student_complete_balance;
```

**Esperado:** Query nova deve ser mais rápida ⚡

---

## 🎉 Próximos Passos

Após aplicar as migrations:

1. ✅ Testar aba "Extrato" no frontend
2. ✅ Verificar cálculos de saldo
3. ✅ Atualizar hooks para usar views (opcional)
4. ✅ Fazer commit das migrations

```bash
git add supabase/migrations/
git commit -m "feat: adiciona views de saldo e melhorias em class_logs"
```

---

**Dúvidas?** Consulte: [PERFORMANCE_AND_UX_IMPROVEMENTS.md](./PERFORMANCE_AND_UX_IMPROVEMENTS.md)

**Última atualização:** 30/01/2026
