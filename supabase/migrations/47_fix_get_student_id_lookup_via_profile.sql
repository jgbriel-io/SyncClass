CREATE OR REPLACE FUNCTION public.get_student_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT student_id FROM profiles WHERE user_id = auth.uid();
$function$;
