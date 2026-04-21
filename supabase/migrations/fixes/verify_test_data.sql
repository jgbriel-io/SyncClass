-- ============================================
-- VERIFICAR SETUP DOS DADOS DE TESTE
-- ============================================

-- Verificar professores
SELECT 
    '👨‍🏫 PROFESSORES' as tipo,
    COUNT(*) as total,
    STRING_AGG(email, ', ') as emails
FROM public.teachers 
WHERE email LIKE '%@test.com';

-- Verificar alunos
SELECT 
    '👨‍🎓 ALUNOS' as tipo,
    COUNT(*) as total,
    STRING_AGG(email, ', ') as emails
FROM public.students 
WHERE email LIKE '%@test.com';

-- Verificar cobranças
SELECT 
    '💰 COBRANÇAS' as tipo,
    COUNT(*) as total,
    STRING_AGG(DISTINCT fr.status, ', ') as status_list
FROM public.financial_records fr
JOIN public.students s ON fr.student_id = s.id
WHERE s.email LIKE '%@test.com';

-- Verificar atividades
SELECT 
    '📝 ATIVIDADES' as tipo,
    COUNT(*) as total,
    STRING_AGG(DISTINCT a.status, ', ') as status_list
FROM public.activities a
JOIN public.students s ON a.student_id = s.id
WHERE s.email LIKE '%@test.com';

-- Verificar aulas
SELECT 
    '📚 AULAS' as tipo,
    COUNT(*) as total,
    STRING_AGG(DISTINCT attendance::TEXT, ', ') as attendance_list
FROM public.class_logs cl
JOIN public.students s ON cl.student_id = s.id
WHERE s.email LIKE '%@test.com';

-- Resumo final
SELECT 
    '✅ SETUP COMPLETO!' as status,
    (SELECT COUNT(*) FROM public.teachers WHERE email LIKE '%@test.com') as professores,
    (SELECT COUNT(*) FROM public.students WHERE email LIKE '%@test.com') as alunos,
    (SELECT COUNT(*) FROM public.financial_records fr JOIN public.students s ON fr.student_id = s.id WHERE s.email LIKE '%@test.com') as cobrancas,
    (SELECT COUNT(*) FROM public.activities a JOIN public.students s ON a.student_id = s.id WHERE s.email LIKE '%@test.com') as atividades,
    (SELECT COUNT(*) FROM public.class_logs cl JOIN public.students s ON cl.student_id = s.id WHERE s.email LIKE '%@test.com') as aulas;
