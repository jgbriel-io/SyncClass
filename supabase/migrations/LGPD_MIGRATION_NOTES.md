# Notas sobre a Migration LGPD

## Problema Encontrado

Durante a aplicação da migration `lgpd_masking_sensitive_data.sql`, ocorreu o erro:

```
ERROR: 42703: column t.specialization does not exist
LINE 113: t.specialization,
```

## Causa Raiz

A migration original assumia que a tabela `teachers` tinha as colunas:
- `specialization` (especialização do professor)
- `status` (status ativo/inativo)

No entanto, essas colunas existem no `consolidated_schema.sql` mas podem não estar presentes em todas as instâncias do banco de dados, especialmente se o consolidated schema não foi aplicado completamente.

## Solução Implementada

A migration foi atualizada para ser **defensiva e idempotente**:

### 1. Verificação e Criação Condicional de Colunas

```sql
-- Adicionar coluna specialization se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teachers' 
        AND column_name = 'specialization'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN specialization TEXT;
    END IF;
END $$;
```

### 2. Criação Condicional do Enum

```sql
-- Criar enum teacher_status se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'teacher_status') THEN
        CREATE TYPE public.teacher_status AS ENUM ('ativo', 'inativo');
    END IF;
END $$;
```

### 3. Views Atualizadas

As views agora incluem todas as colunas:
- `teachers_masked`: inclui `specialization` e `status`
- `students_masked`: mantém todas as colunas originais

## Como Aplicar

A migration agora é totalmente segura para aplicar em qualquer banco:

```bash
cd supabase
supabase db push
```

A migration irá:
1. ✅ Verificar se as colunas existem
2. ✅ Adicionar colunas faltantes (se necessário)
3. ✅ Criar as funções de mascaramento
4. ✅ Criar as views mascaradas
5. ✅ Configurar permissões

## Compatibilidade

A migration agora é compatível com:
- ✅ Bancos com schema completo (consolidated_schema.sql aplicado)
- ✅ Bancos com schema parcial (algumas colunas faltando)
- ✅ Execução múltipla (idempotente - pode ser executada várias vezes)

## Testes de Validação

Após aplicar a migration, execute os testes:

```sql
SELECT * FROM public.test_lgpd_masking();
```

Resultado esperado: Todos os testes com `passed = true`.

## Notas Importantes

1. **Colunas adicionadas automaticamente**:
   - Se `specialization` não existir, será criada como `TEXT NULL`
   - Se `status` não existir, será criada como `teacher_status DEFAULT 'ativo'`

2. **Dados existentes**:
   - Colunas novas terão valor `NULL` ou default para registros existentes
   - Isso não afeta o mascaramento de CPF e telefone

3. **Rollback**:
   - As views podem ser removidas com: `DROP VIEW IF EXISTS students_masked, teachers_masked CASCADE;`
   - As funções podem ser removidas com: `DROP FUNCTION IF EXISTS mask_cpf, mask_phone CASCADE;`
   - As colunas adicionadas podem ser removidas com: `ALTER TABLE teachers DROP COLUMN IF EXISTS specialization, status;`

## Logs de Mudanças

### Versão 2 (Corrigida) - 30/01/2026
- ✅ Adicionada verificação condicional de colunas
- ✅ Adicionada criação condicional de enum
- ✅ Migration agora é defensiva e idempotente
- ✅ Compatível com qualquer estado do schema

### Versão 1 (Original) - 30/01/2026
- ❌ Assumia que todas as colunas existiam
- ❌ Falhava se `specialization` ou `status` não existissem

## Suporte

Para questões sobre esta migration, consulte:
- `.github/LGPD_IMPLEMENTATION.md` - Documentação completa
- `.github/SECURITY_FIXES.md` - Contexto de segurança
- `SECURITY_AUDIT_RESOLUTION.md` - Visão geral da auditoria
