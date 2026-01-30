# 🗑️ Soft Delete - Guia Completo

**Data:** 30/01/2026  
**Status:** ✅ IMPLEMENTADO (requer aplicação de migration)

---

## 🎯 Problema

### ❌ Hard Delete (Antes)

```sql
DELETE FROM students WHERE id = 'uuid';
```

**O que acontecia:**
1. Postgres executa `ON DELETE CASCADE`
2. **Deleta TODOS os class_logs** (histórico de aulas perdido! 😱)
3. **Deleta TODOS os financial_records** (receita perdida dos relatórios! 😱)
4. Professor fica sem saber quanto ganhou com aquele aluno
5. **IRREVERSÍVEL** - dados perdidos para sempre

**Exemplo real:**
```
Aluno "João Silva" tem:
- 50 aulas registradas
- R$ 7.500 em cobranças pagas
- R$ 1.500 em cobranças pendentes

Professor clica em "Deletar aluno"

❌ TUDO PERDIDO:
- 50 aulas desapareceram
- R$ 7.500 sumiram dos relatórios de receita
- R$ 1.500 pendentes foram esquecidos
- Impossível recuperar
```

---

## ✅ Soft Delete (Solução)

```sql
SELECT soft_delete_student('uuid');
```

**O que acontece:**
1. Marca campo `deleted_at = NOW()`
2. Muda `status` para `'inativo'`
3. **Preserva TODOS os class_logs** (histórico intacto ✅)
4. **Preserva TODOS os financial_records** (receita nos relatórios ✅)
5. Aluno não aparece mais nas listagens (filtrado automaticamente)
6. **REVERSÍVEL** - pode restaurar a qualquer momento!

**Mesmo exemplo:**
```
Aluno "João Silva" tem:
- 50 aulas registradas
- R$ 7.500 em cobranças pagas
- R$ 1.500 em cobranças pendentes

Professor clica em "Deletar aluno"

✅ TUDO PRESERVADO:
- 50 aulas continuam no banco
- R$ 7.500 continuam nos relatórios
- R$ 1.500 pendentes rastreados
- Pode ser restaurado se necessário
- Aluno não aparece nas listagens (deleted_at IS NOT NULL)
```

---

## 🛠️ Como Usar

### No SQL (Backend)

#### Deletar Aluno (Soft Delete)
```sql
SELECT soft_delete_student('a1b2c3d4-e5f6-7890-1234-567890abcdef');
```

#### Restaurar Aluno
```sql
SELECT restore_student('a1b2c3d4-e5f6-7890-1234-567890abcdef');
```

#### Listar Alunos Ativos (Não Deletados)
```sql
-- View automática (excl ui deletados)
SELECT * FROM students_active;

-- Ou com mascaramento LGPD
SELECT * FROM students_active_masked;

-- Ou manualmente
SELECT * FROM students WHERE deleted_at IS NULL;
```

#### Listar Alunos Deletados
```sql
SELECT 
    id,
    name,
    deleted_at,
    status
FROM students 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

### No Frontend (React/TypeScript)

#### Hook para Deletar Aluno
```typescript
// src/hooks/useStudents.ts

export function useSoftDeleteStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      // Opção 1: Via função SQL
      const { error } = await supabase.rpc('soft_delete_student', {
        p_student_id: studentId
      });
      
      if (error) throw error;
      
      // Opção 2: Via UPDATE direto
      // const { error } = await supabase
      //   .from('students')
      //   .update({ 
      //     deleted_at: new Date().toISOString(),
      //     status: 'inativo'
      //   })
      //   .eq('id', studentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno arquivado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao arquivar aluno:', error);
      toast.error('Erro ao arquivar aluno. Tente novamente.');
    },
  });
}
```

#### Hook para Restaurar Aluno
```typescript
export function useRestoreStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.rpc('restore_student', {
        p_student_id: studentId
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno restaurado com sucesso!');
    },
  });
}
```

#### Buscar Alunos (Excluindo Deletados)
```typescript
// Opção 1: Usar view students_active
const { data } = await supabase
  .from('students_active')
  .select();

// Opção 2: Filtrar manualmente
const { data } = await supabase
  .from('students')
  .select()
  .is('deleted_at', null);  // ⚠️ IMPORTANTE: filtrar deletados
```

#### Componente de Confirmação
```typescript
const DeleteStudentDialog = ({ student }: Props) => {
  const deleteMutation = useSoftDeleteStudent();
  
  const handleDelete = () => {
    // Confirmação clara
    const confirmed = window.confirm(
      `Tem certeza que deseja arquivar o aluno "${student.name}"?\n\n` +
      `IMPORTANTE: Os dados do aluno serão preservados, mas ele ` +
      `não aparecerá mais nas listagens. Você pode restaurá-lo depois.`
    );
    
    if (confirmed) {
      deleteMutation.mutate(student.id);
    }
  };
  
  return (
    <Button 
      variant="destructive" 
      onClick={handleDelete}
      disabled={deleteMutation.isLoading}
    >
      {deleteMutation.isLoading ? 'Arquivando...' : 'Arquivar Aluno'}
    </Button>
  );
};
```

---

## 📊 Impacto nos Dados

### Dados Preservados (Soft Delete)

| Tabela | O que é preservado | Por quê |
|--------|-------------------|---------|
| `students` | Registro do aluno (com `deleted_at`) | Histórico completo |
| `class_logs` | **TODAS as aulas** | Histórico de ensino |
| `financial_records` | **TODAS as cobranças** | Receita nos relatórios |
| `profiles` | Link com auth.users | Possível restaurar login |

### Dados Afetados

| Campo | Antes | Depois |
|-------|-------|--------|
| `deleted_at` | `NULL` | `2026-01-30 15:30:00` |
| `status` | `'ativo'` | `'inativo'` |
| Aparece em listagens? | ✅ SIM | ❌ NÃO (filtrado) |

---

## 🔍 Queries Comuns

### Ver Histórico Completo de Aluno Deletado
```sql
-- Dados do aluno
SELECT * FROM students WHERE id = 'uuid';

-- Suas aulas (preservadas!)
SELECT * FROM class_logs WHERE student_id = 'uuid';

-- Suas cobranças (preservadas!)
SELECT * FROM financial_records WHERE student_id = 'uuid';

-- Saldo total (ainda calculável!)
SELECT * FROM student_financial_balance WHERE student_id = 'uuid';
```

### Relatório de Receita Total (Incluindo Deletados)
```sql
-- Receita total de TODOS os alunos (ativos + deletados)
SELECT 
    SUM(amount) FILTER (WHERE status = 'pago') AS total_receita
FROM financial_records;
-- ✅ Inclui receita de alunos deletados!
```

### Alunos Deletados Recentemente
```sql
SELECT 
    name,
    email,
    deleted_at,
    DATE_PART('day', NOW() - deleted_at) AS dias_desde_delecao
FROM students 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 10;
```

---

## ⚠️ Atenção: Atualizar Queries Existentes

### ❌ Queries Antigas (Precisam Atualizar)

```typescript
// ❌ ERRADO: Vai incluir alunos deletados!
const { data } = await supabase
  .from('students')
  .select();

// ❌ ERRADO: View antiga sem filtro
const { data } = await supabase
  .from('students_masked')
  .select();
```

### ✅ Queries Corretas (Após Migration)

```typescript
// ✅ CORRETO: Usa view que filtra deletados
const { data } = await supabase
  .from('students_active')
  .select();

// ✅ CORRETO: Usa view com mascaramento + filtro
const { data } = await supabase
  .from('students_active_masked')
  .select();

// ✅ CORRETO: Filtra manualmente
const { data } = await supabase
  .from('students')
  .select()
  .is('deleted_at', null);
```

---

## 🧪 Testando Soft Delete

### Teste 1: Deletar e Verificar
```sql
-- 1. Obter um aluno de teste
SELECT id, name FROM students LIMIT 1;
-- Copiar o UUID

-- 2. Soft delete
SELECT soft_delete_student('uuid-copiado');

-- 3. Verificar que não aparece mais
SELECT * FROM students_active WHERE id = 'uuid-copiado';
-- Esperado: Vazio

-- 4. Verificar que ainda existe
SELECT * FROM students WHERE id = 'uuid-copiado';
-- Esperado: Retorna o aluno com deleted_at preenchido
```

### Teste 2: Dados Preservados
```sql
-- Verificar que aulas foram preservadas
SELECT COUNT(*) FROM class_logs WHERE student_id = 'uuid-copiado';
-- Esperado: Número > 0

-- Verificar que cobranças foram preservadas
SELECT COUNT(*) FROM financial_records WHERE student_id = 'uuid-copiado';
-- Esperado: Número > 0
```

### Teste 3: Restaurar
```sql
-- Restaurar aluno
SELECT restore_student('uuid-copiado');

-- Verificar que voltou
SELECT * FROM students_active WHERE id = 'uuid-copiado';
-- Esperado: Retorna o aluno
```

---

## 📋 Checklist de Migração

Ao aplicar soft delete:

- [ ] Aplicar migration `performance_and_soft_delete.sql`
- [ ] Atualizar hooks que usam `students` → usar `students_active`
- [ ] Atualizar queries que usam `students_masked` → usar `students_active_masked`
- [ ] Criar hook `useSoftDeleteStudent()`
- [ ] Criar hook `useRestoreStudent()` (opcional)
- [ ] Atualizar UI: "Deletar" → "Arquivar"
- [ ] Adicionar página "Alunos Arquivados" (opcional)
- [ ] Testar que soft delete funciona
- [ ] Testar que restore funciona
- [ ] Verificar que relatórios incluem alunos deletados

---

## 🎯 Benefícios

| Aspecto | Antes (Hard Delete) | Depois (Soft Delete) |
|---------|---------------------|----------------------|
| **Histórico** | ❌ Perdido | ✅ Preservado |
| **Receita** | ❌ Sumiu dos relatórios | ✅ Mantida |
| **Restaurar** | ❌ Impossível | ✅ Possível |
| **Auditoria** | ❌ Sem rastro | ✅ Rastreável (deleted_at) |
| **LGPD** | ❌ Difícil de comprovar exclusão | ✅ Timestamp de exclusão |

---

## 🚀 Próximos Passos (Opcional)

1. **Página de Alunos Arquivados**
   - Listar alunos com `deleted_at IS NOT NULL`
   - Botão "Restaurar"

2. **Exclusão Permanente (Hard Delete)**
   - Apenas para admins
   - Após 1 ano arquivado
   - Com confirmação tripla

3. **Auditoria**
   - Log de quem arquivou e quando
   - Tabela `student_deletions` com histórico

4. **LGPD Compliance**
   - Permitir exclusão permanente a pedido do titular
   - Gerar certificado de exclusão (LGPD Art. 18)

---

**Migration:** `supabase/migrations/performance_and_soft_delete.sql`  
**Aplicar:** Ver [APPLY_MIGRATIONS_GUIDE.md](./APPLY_MIGRATIONS_GUIDE.md)

**Implementado por:** Claude AI + B2ML  
**Data:** 30/01/2026
