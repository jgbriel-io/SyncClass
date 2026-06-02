-- Fix: teacher_id in students references teachers.id, not auth.uid().
-- Must compare via profiles.teacher_id of the current user.
CREATE OR REPLACE FUNCTION prevent_student_hourly_rate_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_profile_teacher_id UUID;
BEGIN
  IF OLD.hourly_rate = NEW.hourly_rate OR
     (OLD.hourly_rate IS NULL AND NEW.hourly_rate IS NULL) THEN
    RETURN NEW;
  END IF;

  SELECT role, teacher_id INTO v_user_role, v_profile_teacher_id
  FROM profiles
  WHERE user_id = auth.uid();

  IF v_user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  IF v_user_role = 'teacher' THEN
    IF OLD.teacher_id = v_profile_teacher_id THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Você não pode alterar o valor/hora de alunos de outros professores';
    END IF;
  END IF;

  IF v_user_role = 'student' THEN
    RAISE EXCEPTION 'Alunos não podem alterar o valor da hora-aula';
  END IF;

  RAISE EXCEPTION 'Você não tem permissão para alterar o valor da hora-aula';
END;
$$;
