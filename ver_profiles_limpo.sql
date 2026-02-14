-- Ver apenas a estrutura da tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Ver um exemplo de registro existente (se houver)
SELECT * FROM profiles LIMIT 1;
