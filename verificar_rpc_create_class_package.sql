-- Ver a definição da função create_class_package
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'create_class_package';
