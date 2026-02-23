-- Teste simples: verificar se views existem

-- 1. Listar todas as materialized views
SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';

-- 2. Tentar SELECT direto
SELECT COUNT(*) FROM activities_dashboard;
SELECT COUNT(*) FROM financial_dashboard;

-- 3. Se der erro acima, views não existem. Criar manualmente:
-- (descomente as linhas abaixo se necessário)

/*
CREATE MATERIALIZED VIEW activities_dashboard AS
SELECT 
  a.id,
  a.title,
  a.description,
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

CREATE UNIQUE INDEX idx_activities_dashboard_id ON activities_dashboard(id);

REFRESH MATERIALIZED VIEW activities_dashboard;
*/
