-- ============================================
-- TESTE: Verificar Materialized Views
-- ============================================

-- 1. Verificar se as materialized views existem
SELECT 
  schemaname,
  matviewname,
  hasindexes,
  ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
AND matviewname IN ('activities_dashboard', 'financial_dashboard');

-- 2. Verificar índices criados
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('activities_dashboard', 'financial_dashboard')
ORDER BY tablename, indexname;

-- 3. Testar SELECT nas views
SELECT COUNT(*) as activities_count FROM activities_dashboard;
SELECT COUNT(*) as financial_count FROM financial_dashboard;

-- 4. Testar funções de refresh
SELECT refresh_all_dashboards();

-- 5. Verificar se refresh funcionou (última atualização)
SELECT 
  schemaname,
  matviewname,
  ispopulated,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
AND matviewname IN ('activities_dashboard', 'financial_dashboard');
