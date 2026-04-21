-- ============================================
-- SETUP COMPLETO - TESTES E2E (SEM USER_ID)
-- ============================================
-- Execute este script após criar os usuários no dashboard
-- ============================================

-- Verificar usuários
DO $$
DECLARE
  admin_exists BOOLEAN;
  prof1_exists BOOLEAN;
  prof2_exists BOOLEAN;
  aluno1_exists BOOLEAN;
  aluno2_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@test.com') INTO admin_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'professor1@test.com') INTO prof1_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'professor2@test.com') INTO prof2_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'aluno1@test.com') INTO aluno1_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'aluno2@test.com') INTO aluno2_exists;

  IF NOT (admin_exists AND prof1_exists AND prof2_exists AND aluno1_exists AND aluno2_exists) THEN
    RAISE EXCEPTION 'Crie todos os usuários no dashboard primeiro!';
  END IF;
END $$;

-- Criar professores
INSERT INTO public.teachers (name, email, phone, pix_key, hourly_rate)
SELECT 'Professor 1 Teste', 'professor1@test.com', '11987654321', '12345678901', 50.00
WHERE NOT EXISTS (SELECT 1 FROM public.teachers WHERE email = 'professor1@test.com');

INSERT INTO public.teachers (name, email, phone, pix_key, hourly_rate)
SELECT 'Professor 2 Teste', 'professor2@test.com', '11987654322', '12345678902', 60.00
WHERE NOT EXISTS (SELECT 1 FROM public.teachers WHERE email = 'professor2@test.com');

-- Criar alunos
INSERT INTO public.students (teacher_id, name, email, phone, pay_day, hourly_rate)
SELECT t.id, 'Aluno 1 Professor 1', 'aluno1@test.com', '11987654323', 10, 50.00
FROM public.teachers t
WHERE t.email = 'professor1@test.com'
  AND NOT EXISTS (SELECT 1 FROM public.students WHERE email = 'aluno1@test.com');

INSERT INTO public.students (teacher_id, name, email, phone, pay_day, hourly_rate)
SELECT t.id, 'Aluno 2 Professor 1', 'aluno2@test.com', '11987654324', 15, 50.00
FROM public.teachers t
WHERE t.email = 'professor1@test.com'
  AND NOT EXISTS (SELECT 1 FROM public.students WHERE email = 'aluno2@test.com');

INSERT INTO public.students (teacher_id, name, email, phone, pay_day, hourly_rate)
SELECT t.id, 'Aluno Professor 2', 'aluno.prof2@test.com', '11987654325', 20, 60.00
FROM public.teachers t
WHERE t.email = 'professor2@test.com'
  AND NOT EXISTS (SELECT 1 FROM public.students WHERE email = 'aluno.prof2@test.com');

-- Criar cobranças
INSERT INTO public.financial_records (student_id, amount, due_date, status, description, class_log_id)
SELECT s.id, 150.00, CURRENT_DATE + 15, 'pendente', 'Mensalidade de teste - Pendente', NULL
FROM public.students s
WHERE s.email = 'aluno1@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_records fr
    WHERE fr.student_id = s.id AND fr.description = 'Mensalidade de teste - Pendente'
  );

INSERT INTO public.financial_records (student_id, amount, due_date, status, description, paid_at, class_log_id)
SELECT s.id, 150.00, CURRENT_DATE - 5, 'pago', 'Mensalidade de teste - Paga', NOW() - INTERVAL '2 days', NULL
FROM public.students s
WHERE s.email = 'aluno1@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_records fr
    WHERE fr.student_id = s.id AND fr.description = 'Mensalidade de teste - Paga'
  );

INSERT INTO public.financial_records (student_id, amount, due_date, status, description, class_log_id)
SELECT s.id, 200.00, CURRENT_DATE + 10, 'pendente', 'Mensalidade de teste - Aluno 2', NULL
FROM public.students s
WHERE s.email = 'aluno2@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.financial_records fr
    WHERE fr.student_id = s.id AND fr.description = 'Mensalidade de teste - Aluno 2'
  );

-- Criar atividades
INSERT INTO public.activities (teacher_id, student_id, title, description, due_date, status)
SELECT t.id, s.id, 'Atividade de Teste - Pendente', 'Descrição da atividade pendente', CURRENT_DATE + 7, 'pendente'
FROM public.teachers t, public.students s
WHERE t.email = 'professor1@test.com' AND s.email = 'aluno1@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.student_id = s.id AND a.title = 'Atividade de Teste - Pendente'
  );

INSERT INTO public.activities (teacher_id, student_id, title, description, due_date, status)
SELECT t.id, s.id, 'Atividade de Teste - Atrasada', 'Descrição da atividade atrasada', CURRENT_DATE - 2, 'atrasada'
FROM public.teachers t, public.students s
WHERE t.email = 'professor1@test.com' AND s.email = 'aluno1@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.student_id = s.id AND a.title = 'Atividade de Teste - Atrasada'
  );

INSERT INTO public.activities (teacher_id, student_id, title, description, due_date, status, student_response_text, delivered_at)
SELECT t.id, s.id, 'Atividade de Teste - Entregue', 'Descrição da atividade entregue', CURRENT_DATE + 5, 'entregue', 'Resposta do aluno', NOW() - INTERVAL '1 day'
FROM public.teachers t, public.students s
WHERE t.email = 'professor1@test.com' AND s.email = 'aluno2@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.student_id = s.id AND a.title = 'Atividade de Teste - Entregue'
  );

-- Criar aulas
INSERT INTO public.class_logs (teacher_id, student_id, class_date, start_at, end_at, attendance, notes, grade)
SELECT t.id, s.id, CURRENT_DATE - 1, (CURRENT_DATE - 1 + TIME '14:00:00')::TIMESTAMPTZ, (CURRENT_DATE - 1 + TIME '15:00:00')::TIMESTAMPTZ, true, 'Aula sobre verbos irregulares - Teste E2E', 85
FROM public.teachers t, public.students s
WHERE t.email = 'professor1@test.com' AND s.email = 'aluno1@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.class_logs cl
    WHERE cl.student_id = s.id AND cl.notes = 'Aula sobre verbos irregulares - Teste E2E'
  );

INSERT INTO public.class_logs (teacher_id, student_id, class_date, start_at, end_at, attendance, notes, grade)
SELECT t.id, s.id, CURRENT_DATE - 2, (CURRENT_DATE - 2 + TIME '15:00:00')::TIMESTAMPTZ, (CURRENT_DATE - 2 + TIME '16:00:00')::TIMESTAMPTZ, true, 'Aula sobre present perfect - Teste E2E', 90
FROM public.teachers t, public.students s
WHERE t.email = 'professor1@test.com' AND s.email = 'aluno2@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.class_logs cl
    WHERE cl.student_id = s.id AND cl.notes = 'Aula sobre present perfect - Teste E2E'
  );

-- Verificação final
DO $$
DECLARE
  teachers_count INT;
  students_count INT;
  financial_count INT;
  activities_count INT;
  class_logs_count INT;
BEGIN
  SELECT COUNT(*) INTO teachers_count FROM public.teachers WHERE email LIKE '%@test.com';
  SELECT COUNT(*) INTO students_count FROM public.students WHERE email LIKE '%@test.com';
  SELECT COUNT(*) INTO financial_count FROM public.financial_records WHERE description LIKE '%Teste%';
  SELECT COUNT(*) INTO activities_count FROM public.activities WHERE title LIKE '%Teste%';
  SELECT COUNT(*) INTO class_logs_count FROM public.class_logs WHERE notes LIKE '%Teste E2E%';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETO! ✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Professores: %', teachers_count;
  RAISE NOTICE 'Alunos: %', students_count;
  RAISE NOTICE 'Cobranças: %', financial_count;
  RAISE NOTICE 'Atividades: %', activities_count;
  RAISE NOTICE 'Aulas: %', class_logs_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Próximo passo: npm run test:e2e:ui';
  RAISE NOTICE '========================================';
END $$;
