-- Verificar aulas criadas recentemente
SELECT 
  id,
  student_id,
  class_date,
  start_at,
  end_at,
  attendance,
  grade,
  created_at,
  CASE 
    WHEN attendance IS NULL THEN 'AGENDADA (attendance = NULL)'
    WHEN attendance = true THEN 'CONCLUÍDA COM PRESENÇA (attendance = true)'
    WHEN attendance = false THEN 'CONCLUÍDA COM AUSÊNCIA (attendance = false)'
  END as status_interpretado
FROM class_logs
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 20;
