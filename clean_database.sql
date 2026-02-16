-- SQL para limpar o banco e manter apenas usuários admin

-- Desabilita triggers temporariamente para evitar conflitos
SET session_replication_role = replica;

-- Deleta dados das tabelas (em ordem para respeitar FKs)
DELETE FROM financial_record_class_logs;
DELETE FROM financial_records;
DELETE FROM class_logs;
DELETE FROM students WHERE id NOT IN (SELECT id FROM user_roles WHERE role = 'admin');
DELETE FROM teachers WHERE id NOT IN (SELECT id FROM user_roles WHERE role = 'admin');
DELETE FROM user_roles WHERE role != 'admin';
DELETE FROM profiles WHERE id NOT IN (SELECT id FROM user_roles WHERE role = 'admin');

-- Reabilita triggers
SET session_replication_role = DEFAULT;

-- Mostra o que sobrou
SELECT 'Admins restantes:' as info;
SELECT p.full_name, p.email, ur.role 
FROM profiles p
JOIN user_roles ur ON p.id = ur.id
WHERE ur.role = 'admin';

SELECT 'Total de registros por tabela:' as info;
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'class_logs', COUNT(*) FROM class_logs
UNION ALL
SELECT 'financial_records', COUNT(*) FROM financial_records;
