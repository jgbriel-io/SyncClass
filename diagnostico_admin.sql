-- Verificar quem é o admin no sistema
SELECT 
  'user_roles' as origem,
  ur.user_id,
  ur.role,
  t.name as teacher_name,
  t.email as teacher_email
FROM user_roles ur
LEFT JOIN teachers t ON t.id = ur.user_id
WHERE ur.role = 'admin';

-- Ver todos os registros de user_roles
SELECT 
  'todos_user_roles' as info,
  user_id,
  role
FROM user_roles
ORDER BY role;

-- Ver todos os teachers
SELECT 
  'todos_teachers' as info,
  id,
  name,
  email
FROM teachers
ORDER BY name;

-- Ver todos os auth.users
SELECT 
  'todos_auth_users' as info,
  id,
  email
FROM auth.users
ORDER BY email;
