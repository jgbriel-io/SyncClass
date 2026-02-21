# Guia: Exportar e Restaurar Dump PostgreSQL (Supabase)

## Ferramentas Utilizadas

- `pg_dump` - Exporta banco de dados PostgreSQL
- `psql` - Cliente PostgreSQL para executar comandos e restaurar dumps
- `nslookup` - Diagnóstico de DNS

## 1. Exportar Dump do Banco de Dados

### Comando Básico
```cmd
pg_dump --dbname="CONNECTION_STRING" > dump.sql
```

### Comando Completo (Recomendado)
```cmd
pg_dump --dbname="postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres" --clean --if-exists --no-owner --no-privileges --disable-triggers > database-dump-final.sql
```

### Flags Importantes

- `--clean` - Adiciona comandos DROP antes de cada CREATE
- `--if-exists` - Usa DROP IF EXISTS (evita erros)
- `--no-owner` - Remove comandos ALTER OWNER (portabilidade)
- `--no-privileges` - Remove comandos GRANT/REVOKE
- `--disable-triggers` - Desabilita triggers durante restore

### Exemplo Real Usado
```cmd
pg_dump --dbname="postgresql://postgres.yxwtxewwszoovqrjrrfb:c4d9kKc79gf2pRkGJD39evEm4YMByhyh@aws-1-us-east-2.pooler.supabase.com:5432/postgres" --clean --if-exists --no-owner --no-privileges --disable-triggers > C:\Users\B2ML\Desktop\database-dump-final.sql
```

## 2. Restaurar Dump em Outro Banco

### Comando Básico
```cmd
psql --dbname="CONNECTION_STRING" -f dump.sql
```

### Exemplo Real Usado
```cmd
psql --dbname="postgresql://postgres.owmxvunobygacooqnobg:pR39ehyhc4kGm4JDd9kKc79gf2vEYMBy@aws-1-us-east-1.pooler.supabase.com:5432/postgres" -f C:\Users\B2ML\Desktop\database-dump-final.sql
```

## 3. Limpar Banco Antes de Restaurar (Opcional)

### Via SQL Editor do Supabase
Acesse: `https://supabase.com/dashboard/project/[PROJECT_ID]/editor`

Execute:
```sql
DROP SCHEMA public CASCADE;
DROP SCHEMA IF EXISTS extensions CASCADE;
CREATE SCHEMA public;
CREATE SCHEMA extensions;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Via psql
```cmd
psql --dbname="CONNECTION_STRING" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
```

## 4. Conectar ao Banco (Teste)

```cmd
psql --dbname="postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

Comandos úteis dentro do psql:
- `\l` - Listar databases
- `\dt` - Listar tabelas
- `\df` - Listar funções
- `\q` - Sair

## 5. Troubleshooting

### Problema: DNS não resolve
```cmd
nslookup db.PROJECT.supabase.co 8.8.8.8
```

**Solução:** Use o pooler ao invés da conexão direta:
- ❌ `db.PROJECT.supabase.co:5432`
- ✅ `aws-1-us-east-1.pooler.supabase.com:5432`

### Problema: Erros de sintaxe no dump
Funções com delimitador `$` incorreto devem usar `$$`:

```sql
-- ❌ Errado
AS $
DECLARE
...
END;
$;

-- ✅ Correto
AS $$
DECLARE
...
END;
$$;
```

### Problema: Funções já existem
Use `--clean --if-exists` no pg_dump para adicionar DROP IF EXISTS automaticamente.

### Problema: Permissões/Owner
Use `--no-owner --no-privileges` para remover dependências de usuários específicos.

## 6. Connection String do Supabase

### Formato Geral
```
postgresql://postgres.PROJECT_ID:PASSWORD@REGION.pooler.supabase.com:5432/postgres
```

### Onde Encontrar
1. Dashboard Supabase
2. Settings > Database
3. Connection string > Connection pooling

### Exemplo
```
postgresql://postgres.yxwtxewwszoovqrjrrfb:c4d9kKc79gf2pRkGJD39evEm4YMByhyh@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

## 7. Workflow Completo

### Migração de Banco A para Banco B

1. **Exportar do Banco A**
```cmd
pg_dump --dbname="postgresql://postgres.PROJECT_A:PASS_A@aws-1-us-east-1.pooler.supabase.com:5432/postgres" --clean --if-exists --no-owner --no-privileges --disable-triggers > dump.sql
```

2. **Limpar Banco B (opcional)**
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

3. **Restaurar no Banco B**
```cmd
psql --dbname="postgresql://postgres.PROJECT_B:PASS_B@aws-1-us-east-1.pooler.supabase.com:5432/postgres" -f dump.sql
```

## 8. Dicas

- Use sempre o **pooler** para melhor compatibilidade de rede
- Adicione `--clean --if-exists` para evitar conflitos
- Use `--no-owner --no-privileges` para portabilidade
- Teste a conexão com `psql` antes de fazer dump/restore
- Dumps grandes podem demorar - seja paciente
- Guarde a senha em local seguro (não commite no git)

## 9. Comandos Rápidos

### Dump Rápido
```cmd
pg_dump "postgresql://USER:PASS@HOST:PORT/DB" > dump.sql
```

### Restore Rápido
```cmd
psql "postgresql://USER:PASS@HOST:PORT/DB" -f dump.sql
```

### Dump + Restore em Um Comando (pipe)
```cmd
pg_dump "postgresql://SOURCE" | psql "postgresql://DESTINATION"
```

---

**Nota:** Substitua `PROJECT_ID`, `PASSWORD`, `REGION` pelos valores reais do seu projeto Supabase.
