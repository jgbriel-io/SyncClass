-- Fix: validate_activity_tenant_isolation compared students.teacher_id with auth.uid()
-- but teacher_id references teachers.id, not auth.users.id.
-- Must compare via profiles.teacher_id of the current user.
CREATE OR REPLACE FUNCTION validate_activity_tenant_isolation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_profile_teacher_id UUID;
  v_student_teacher_id UUID;
BEGIN
  SELECT role, teacher_id INTO v_user_role, v_profile_teacher_id
  FROM profiles
  WHERE user_id = auth.uid();

  IF v_user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  IF v_user_role = 'teacher' THEN
    SELECT teacher_id INTO v_student_teacher_id
    FROM students
    WHERE id = NEW.student_id;

    IF v_student_teacher_id IS NULL THEN
      RAISE EXCEPTION 'Aluno não encontrado';
    END IF;

    IF v_student_teacher_id != v_profile_teacher_id THEN
      RAISE EXCEPTION 'Você não pode criar atividades para alunos de outros professores';
    END IF;

    IF NEW.teacher_id IS NOT NULL AND NEW.teacher_id != v_profile_teacher_id THEN
      RAISE EXCEPTION 'Você não pode criar atividades em nome de outros professores';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
