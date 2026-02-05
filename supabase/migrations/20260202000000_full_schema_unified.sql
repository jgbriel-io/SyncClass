-- ============================================================
-- MIGRATION UNIFICADA - Schema completo do banco (edu-core-zen)
-- ============================================================
-- Uso: executar em um projeto Supabase NOVO para recriar toda
-- a estrutura (migrar de conta, novo ambiente, etc.).
-- Banco vazio: não inclui limpeza de dados nem correções retroativas.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'teacher');
CREATE TYPE public.student_origin AS ENUM ('indicacao', 'google', 'instagram', 'passante', 'outro');
CREATE TYPE public.student_status AS ENUM ('ativo', 'inativo');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'pago', 'atrasado');
CREATE TYPE public.teacher_status AS ENUM ('ativo', 'inativo');

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    full_name TEXT,
    email TEXT,
    CONSTRAINT user_roles_user_id_key UNIQUE (user_id)
);

CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    cpf TEXT,
    phone TEXT,
    specialization TEXT,
    status public.teacher_status DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cpf TEXT,
    phone TEXT,
    email TEXT,
    origin student_origin DEFAULT 'outro',
    status student_status DEFAULT 'ativo',
    birth_date DATE,
    city TEXT,
    state TEXT,
    hourly_rate NUMERIC(10,2),
    classes_per_week INTEGER,
    pay_day INTEGER CHECK (pay_day BETWEEN 1 AND 31),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    full_name TEXT,
    email TEXT,
    role TEXT,
    avatar_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.class_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    class_date DATE NOT NULL,
    start_at TIMESTAMPTZ NULL,
    end_at TIMESTAMPTZ NULL,
    duration_minutes INTEGER NULL,
    billed_amount NUMERIC NULL,
    observations TEXT NULL,
    title TEXT NULL,
    attendance BOOLEAN DEFAULT true,
    grade DECIMAL(4,2) CHECK (grade >= 0 AND grade <= 10),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    class_log_id UUID REFERENCES public.class_logs(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    status payment_status DEFAULT 'pendente',
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_class_log_id UNIQUE (class_log_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_profiles_teacher_id ON public.profiles(teacher_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_financial_records_student_id ON public.financial_records(student_id);
CREATE INDEX idx_financial_records_status ON public.financial_records(status);
CREATE INDEX idx_financial_records_due_date ON public.financial_records(due_date);
CREATE INDEX idx_class_logs_student_id ON public.class_logs(student_id);
CREATE INDEX idx_class_logs_class_date ON public.class_logs(class_date);

-- Unique CPF/phone (normalized digits)
CREATE UNIQUE INDEX students_unique_cpf ON public.students ((regexp_replace(trim(coalesce(cpf, '')), '\D', '', 'g')))
    WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11;
CREATE UNIQUE INDEX students_unique_phone ON public.students ((regexp_replace(trim(coalesce(phone, '')), '\D', '', 'g')))
    WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10;
CREATE UNIQUE INDEX teachers_unique_cpf ON public.teachers ((regexp_replace(trim(coalesce(cpf, '')), '\D', '', 'g')))
    WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11;
CREATE UNIQUE INDEX teachers_unique_phone ON public.teachers ((regexp_replace(trim(coalesce(phone, '')), '\D', '', 'g')))
    WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10;

-- Performance indexes
CREATE INDEX idx_class_logs_teacher ON public.class_logs(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_class_logs_student_date ON public.class_logs(student_id, class_date DESC);
CREATE INDEX idx_class_logs_teacher_date ON public.class_logs(teacher_id, class_date DESC) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_class_logs_student_attendance_date ON public.class_logs(student_id, attendance, class_date DESC);
CREATE INDEX idx_class_logs_date ON public.class_logs(class_date DESC);
CREATE INDEX idx_class_logs_attendance ON public.class_logs(attendance);
CREATE INDEX idx_financial_student_status ON public.financial_records(student_id, status, due_date DESC);
CREATE INDEX idx_financial_overdue ON public.financial_records(student_id, due_date, status) WHERE status = 'pendente';
CREATE INDEX idx_financial_records_student_status ON public.financial_records(student_id, status, due_date);
CREATE INDEX idx_class_logs_student_attendance ON public.class_logs(student_id, attendance);
CREATE INDEX idx_students_teacher_status ON public.students(teacher_id, status) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_students_not_deleted ON public.students(id) WHERE deleted_at IS NULL;

-- ============================================================
-- CONSTRAINTS (class_logs temporal + overlap)
-- ============================================================
ALTER TABLE public.class_logs
  ADD CONSTRAINT chk_class_logs_no_future_attendance
  CHECK ((attendance = false) OR (class_date <= (CURRENT_DATE)));

ALTER TABLE public.class_logs
  ADD CONSTRAINT chk_class_logs_grade_null_when_absent
  CHECK ((attendance = true) OR (grade IS NULL));

ALTER TABLE public.class_logs
  ADD CONSTRAINT class_logs_no_overlap_teacher
  EXCLUDE USING gist (
    teacher_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  )
  WHERE (teacher_id IS NOT NULL AND start_at IS NOT NULL AND end_at IS NOT NULL);

-- ============================================================
-- VIEWS (criadas aqui antes das funções que as usam)
-- ============================================================

CREATE VIEW public.student_financial_balance WITH (security_invoker = true) AS
SELECT s.id AS student_id, s.name AS student_name,
  COALESCE(SUM(CASE WHEN fr.status = 'pago' THEN fr.amount ELSE 0 END), 0) AS total_paid,
  COALESCE(SUM(CASE WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE THEN fr.amount ELSE 0 END), 0) AS total_pending,
  COALESCE(SUM(CASE WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE THEN fr.amount ELSE 0 END), 0) AS total_overdue,
  COALESCE(SUM(CASE WHEN fr.status = 'pendente' THEN fr.amount ELSE 0 END), 0) AS total_unpaid,
  COUNT(CASE WHEN fr.status = 'pago' THEN 1 END) AS count_paid,
  COUNT(CASE WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE THEN 1 END) AS count_pending,
  COUNT(CASE WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE THEN 1 END) AS count_overdue
FROM public.students s
LEFT JOIN public.financial_records fr ON fr.student_id = s.id
GROUP BY s.id, s.name;

CREATE VIEW public.student_class_stats WITH (security_invoker = true) AS
SELECT s.id AS student_id, s.name AS student_name,
  COUNT(cl.id) AS total_classes,
  COUNT(CASE WHEN cl.attendance = true THEN 1 END) AS present_classes,
  COUNT(CASE WHEN cl.attendance = false THEN 1 END) AS absent_classes,
  CASE WHEN COUNT(cl.id) > 0 THEN ROUND((COUNT(CASE WHEN cl.attendance = true THEN 1 END)::NUMERIC / COUNT(cl.id)::NUMERIC) * 100, 1) ELSE 0 END AS attendance_rate,
  ROUND(AVG(CASE WHEN cl.grade IS NOT NULL THEN cl.grade ELSE NULL END), 1) AS average_grade,
  COUNT(CASE WHEN cl.grade IS NOT NULL THEN 1 END) AS graded_classes,
  MAX(cl.class_date) AS last_class_date,
  MIN(cl.class_date) AS first_class_date
FROM public.students s
LEFT JOIN public.class_logs cl ON cl.student_id = s.id
GROUP BY s.id, s.name;

-- ============================================================
-- FUNCTIONS (auth helpers, triggers, RPCs, LGPD, checks)
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') $$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'teacher') $$;

CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT student_id FROM public.profiles WHERE user_id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.get_my_teacher_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT teacher_id FROM public.profiles WHERE user_id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_full_name TEXT;
BEGIN
    -- Try to get role from user metadata, default to 'student' if not provided
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    
    -- Ensure role is valid
    IF user_role NOT IN ('admin', 'student', 'teacher') THEN
        user_role := 'student';
    END IF;
    
    -- Get full name from metadata
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    
    -- Insert into profiles (only if doesn't exist)
    INSERT INTO public.profiles (user_id, full_name, email, role, active)
    VALUES (NEW.id, user_full_name, NEW.email, user_role, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert into user_roles (only if doesn't exist)
    INSERT INTO public.user_roles (user_id, role, full_name, email)
    VALUES (NEW.id, user_role, user_full_name, NEW.email)
    ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_class_log_duration()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL AND NEW.start_at < NEW.end_at THEN
    NEW.duration_minutes := (EXTRACT(EPOCH FROM (NEW.end_at - NEW.start_at)) / 60)::integer;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_financial_requires_class_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.class_log_id IS NULL THEN
    RAISE EXCEPTION 'Cobranças devem ser vinculadas a uma aula. Registre a aula na aba Aulas.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_cpf(cpf TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN cpf IS NULL OR cpf = '' THEN NULL
    WHEN LENGTH(REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '')) = 11 THEN
      '***.' || SUBSTRING(REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', ''), 4, 3) || '.***-' ||
      SUBSTRING(REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', ''), 10, 2)
    ELSE REPEAT('*', GREATEST(0, LENGTH(cpf) - 2)) || RIGHT(cpf, 2)
  END
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN phone IS NULL OR phone = '' THEN NULL
    WHEN LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) >= 10 THEN
      '(' || SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 2) || ') ' ||
      '****-' || RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 4)
    ELSE REPEAT('*', GREATEST(0, LENGTH(phone) - 4)) || RIGHT(phone, 4)
  END
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role public.app_role,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas administradores podem alterar roles'; END IF;
  UPDATE public.profiles
  SET role = p_role::TEXT, full_name = COALESCE(p_full_name, full_name), email = COALESCE(p_email, email),
      teacher_id = CASE WHEN p_role = 'teacher' THEN p_teacher_id ELSE NULL END,
      student_id = CASE WHEN p_role = 'student' THEN p_student_id ELSE NULL END
  WHERE user_id = p_user_id;
  UPDATE public.user_roles
  SET role = p_role, full_name = COALESCE(p_full_name, full_name), email = COALESCE(p_email, email)
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_user_role_safe(
  p_user_id UUID, p_role public.app_role, p_full_name TEXT DEFAULT NULL, p_email TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_my_teacher_id UUID; v_allowed BOOLEAN := false;
BEGIN
  IF public.is_admin() THEN v_allowed := true; END IF;
  IF NOT v_allowed THEN
    v_my_teacher_id := public.get_my_teacher_id();
    IF v_my_teacher_id IS NOT NULL THEN
      v_allowed := EXISTS (SELECT 1 FROM public.profiles p JOIN public.students s ON s.id = p.student_id WHERE p.user_id = p_user_id AND s.teacher_id = v_my_teacher_id)
        OR EXISTS (SELECT 1 FROM public.profiles p JOIN public.teachers t ON t.id = p.teacher_id WHERE p.user_id = p_user_id AND t.id = v_my_teacher_id);
    END IF;
  END IF;
  IF NOT v_allowed AND p_user_id = auth.uid() THEN v_allowed := true; END IF;
  IF NOT v_allowed THEN RAISE EXCEPTION 'Sem permissão para atualizar user_roles'; END IF;
  INSERT INTO public.user_roles (user_id, role, full_name, email)
  VALUES (p_user_id, p_role, p_full_name, p_email)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, email = EXCLUDED.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_class_billed(p_class_log_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.financial_records WHERE class_log_id = p_class_log_id) $$;

CREATE OR REPLACE FUNCTION public.get_unbilled_classes(p_student_id UUID)
RETURNS TABLE (class_log_id UUID, class_date DATE, attendance BOOLEAN, title TEXT, teacher_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cl.id, cl.class_date, cl.attendance, cl.title, t.name
  FROM public.class_logs cl
  LEFT JOIN public.financial_records fr ON fr.class_log_id = cl.id
  LEFT JOIN public.teachers t ON t.id = cl.teacher_id
  WHERE cl.student_id = p_student_id AND fr.id IS NULL AND cl.attendance = true
  ORDER BY cl.class_date DESC;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_student(p_student_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.students SET deleted_at = NOW(), status = 'inativo' WHERE id = p_student_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aluno não encontrado ou já foi deletado'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_student(p_student_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.students SET deleted_at = NULL, status = 'ativo' WHERE id = p_student_id AND deleted_at IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aluno não encontrado ou não está deletado'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_balance(p_student_id UUID)
RETURNS TABLE (total_paid NUMERIC, total_pending NUMERIC, total_overdue NUMERIC, total_unpaid NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT total_paid, total_pending, total_overdue, total_unpaid FROM public.student_financial_balance WHERE student_id = p_student_id $$;

-- Check CPF/phone exists (invite-user, etc.)
CREATE OR REPLACE FUNCTION public.check_student_cpf_exists(p_cpf_digits TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.students WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11 AND regexp_replace(trim(cpf), '\D', '', 'g') = p_cpf_digits) $$;

CREATE OR REPLACE FUNCTION public.check_student_phone_exists(p_phone_digits TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.students WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10 AND regexp_replace(trim(phone), '\D', '', 'g') = p_phone_digits) $$;

CREATE OR REPLACE FUNCTION public.check_teacher_cpf_exists(p_cpf_digits TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.teachers WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11 AND regexp_replace(trim(cpf), '\D', '', 'g') = p_cpf_digits) $$;

CREATE OR REPLACE FUNCTION public.check_teacher_phone_exists(p_phone_digits TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.teachers WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10 AND regexp_replace(trim(phone), '\D', '', 'g') = p_phone_digits) $$;

CREATE OR REPLACE FUNCTION public.check_cpf_exists_platform(p_cpf_digits TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.students WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11 AND regexp_replace(trim(cpf), '\D', '', 'g') = p_cpf_digits)
  OR EXISTS (SELECT 1 FROM public.teachers WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11 AND regexp_replace(trim(cpf), '\D', '', 'g') = p_cpf_digits);
$$;

CREATE OR REPLACE FUNCTION public.check_phone_exists_platform(p_phone_digits TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.students WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10 AND regexp_replace(trim(phone), '\D', '', 'g') = p_phone_digits)
  OR EXISTS (SELECT 1 FROM public.teachers WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10 AND regexp_replace(trim(phone), '\D', '', 'g') = p_phone_digits);
$$;

CREATE OR REPLACE FUNCTION public.check_cpf_phone_platform_trigger()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
DECLARE v_cpf_digits TEXT; v_phone_digits TEXT; v_exists BOOLEAN; v_excluding_id UUID;
BEGIN
  v_cpf_digits := regexp_replace(trim(COALESCE(NEW.cpf, '')), '\D', '', 'g');
  v_phone_digits := regexp_replace(trim(COALESCE(NEW.phone, '')), '\D', '', 'g');
  v_excluding_id := NEW.id;
  IF length(v_cpf_digits) = 11 THEN
    IF TG_TABLE_NAME = 'students' THEN
      SELECT EXISTS (SELECT 1 FROM public.students WHERE id IS DISTINCT FROM v_excluding_id AND cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11 AND regexp_replace(trim(cpf), '\D', '', 'g') = v_cpf_digits)
        OR EXISTS (SELECT 1 FROM public.teachers WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11 AND regexp_replace(trim(cpf), '\D', '', 'g') = v_cpf_digits) INTO v_exists;
    ELSE
      SELECT EXISTS (SELECT 1 FROM public.teachers WHERE id IS DISTINCT FROM v_excluding_id AND cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11 AND regexp_replace(trim(cpf), '\D', '', 'g') = v_cpf_digits)
        OR EXISTS (SELECT 1 FROM public.students WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11 AND regexp_replace(trim(cpf), '\D', '', 'g') = v_cpf_digits) INTO v_exists;
    END IF;
    IF v_exists THEN RAISE EXCEPTION 'CPF já cadastrado na plataforma'; END IF;
  END IF;
  IF length(v_phone_digits) >= 10 THEN
    IF TG_TABLE_NAME = 'students' THEN
      SELECT EXISTS (SELECT 1 FROM public.students WHERE id IS DISTINCT FROM v_excluding_id AND phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10 AND regexp_replace(trim(phone), '\D', '', 'g') = v_phone_digits)
        OR EXISTS (SELECT 1 FROM public.teachers WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10 AND regexp_replace(trim(phone), '\D', '', 'g') = v_phone_digits) INTO v_exists;
    ELSE
      SELECT EXISTS (SELECT 1 FROM public.teachers WHERE id IS DISTINCT FROM v_excluding_id AND phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10 AND regexp_replace(trim(phone), '\D', '', 'g') = v_phone_digits)
        OR EXISTS (SELECT 1 FROM public.students WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10 AND regexp_replace(trim(phone), '\D', '', 'g') = v_phone_digits) INTO v_exists;
    END IF;
    IF v_exists THEN RAISE EXCEPTION 'Telefone já cadastrado na plataforma'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON public.financial_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_class_logs_updated_at BEFORE UPDATE ON public.class_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER trg_compute_class_log_duration BEFORE INSERT OR UPDATE OF start_at, end_at ON public.class_logs FOR EACH ROW EXECUTE FUNCTION public.compute_class_log_duration();
CREATE TRIGGER trg_check_financial_requires_class_log BEFORE INSERT ON public.financial_records FOR EACH ROW EXECUTE FUNCTION public.check_financial_requires_class_log();
CREATE TRIGGER trg_check_cpf_phone_platform_students BEFORE INSERT OR UPDATE OF cpf, phone ON public.students FOR EACH ROW EXECUTE FUNCTION public.check_cpf_phone_platform_trigger();
CREATE TRIGGER trg_check_cpf_phone_platform_teachers BEFORE INSERT OR UPDATE OF cpf, phone ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.check_cpf_phone_platform_trigger();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()));

CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "user_roles_teacher_sync_student" ON public.user_roles FOR ALL
  USING (
    (SELECT public.get_my_teacher_id()) IS NOT NULL
    AND user_id IN (SELECT p.user_id FROM public.profiles p JOIN public.students s ON s.id = p.student_id WHERE s.teacher_id = (SELECT public.get_my_teacher_id()) AND p.user_id IS NOT NULL)
  )
  WITH CHECK (
    (SELECT public.get_my_teacher_id()) IS NOT NULL
    AND user_id IN (SELECT p.user_id FROM public.profiles p JOIN public.students s ON s.id = p.student_id WHERE s.teacher_id = (SELECT public.get_my_teacher_id()) AND p.user_id IS NOT NULL)
  );

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT auth.role()) = 'service_role' OR (SELECT public.is_admin()));

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role' OR user_id = (SELECT auth.uid()));

CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL
  USING ((SELECT public.is_admin()));

CREATE POLICY "students_admin_all" ON public.students FOR ALL
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "students_select" ON public.students FOR SELECT
  USING (id = (SELECT public.get_my_student_id()) OR teacher_id = (SELECT public.get_my_teacher_id()));

CREATE POLICY "students_update_teacher" ON public.students FOR UPDATE
  USING (teacher_id = (SELECT public.get_my_teacher_id()))
  WITH CHECK (teacher_id = (SELECT public.get_my_teacher_id()));

CREATE POLICY "teachers_admin_all" ON public.teachers FOR ALL
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "teachers_select" ON public.teachers FOR SELECT
  USING (id = (SELECT public.get_my_teacher_id()) OR (SELECT public.is_admin()));

CREATE POLICY "financial_records_select" ON public.financial_records FOR SELECT
  USING (
    student_id = (SELECT public.get_my_student_id())
    OR (SELECT public.is_admin())
    OR student_id IN (SELECT id FROM public.students WHERE teacher_id = (SELECT public.get_my_teacher_id()))
  );

CREATE POLICY "financial_records_admin_teacher_all" ON public.financial_records FOR ALL
  USING (
    (SELECT public.is_admin())
    OR student_id IN (SELECT id FROM public.students WHERE teacher_id = (SELECT public.get_my_teacher_id()))
  )
  WITH CHECK (
    (SELECT public.is_admin())
    OR student_id IN (SELECT id FROM public.students WHERE teacher_id = (SELECT public.get_my_teacher_id()))
  );

CREATE POLICY "class_logs_select" ON public.class_logs FOR SELECT
  USING (
    student_id = (SELECT public.get_my_student_id())
    OR (SELECT public.is_admin())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = class_logs.student_id AND s.teacher_id = (SELECT public.get_my_teacher_id()))
  );

CREATE POLICY "class_logs_admin_teacher_all" ON public.class_logs FOR ALL
  USING (
    (SELECT public.is_admin())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = class_logs.student_id AND s.teacher_id = (SELECT public.get_my_teacher_id()))
  )
  WITH CHECK (
    (SELECT public.is_admin())
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = class_logs.student_id AND s.teacher_id = (SELECT public.get_my_teacher_id()))
  );

-- Adicionais views com complementos de dados
CREATE VIEW public.student_complete_balance WITH (security_invoker = true) AS
SELECT s.id, s.name, s.email, s.phone, s.cpf, s.status, s.origin, s.birth_date, s.city, s.state, s.hourly_rate, s.classes_per_week, s.pay_day, s.teacher_id, s.created_at, s.updated_at,
  COALESCE(fb.total_paid, 0) AS total_paid, COALESCE(fb.total_pending, 0) AS total_pending, COALESCE(fb.total_overdue, 0) AS total_overdue, COALESCE(fb.total_unpaid, 0) AS total_unpaid,
  COALESCE(fb.count_paid, 0) AS count_paid, COALESCE(fb.count_pending, 0) AS count_pending, COALESCE(fb.count_overdue, 0) AS count_overdue,
  COALESCE(cs.total_classes, 0) AS total_classes, COALESCE(cs.present_classes, 0) AS present_classes, COALESCE(cs.absent_classes, 0) AS absent_classes,
  COALESCE(cs.attendance_rate, 0) AS attendance_rate, COALESCE(cs.average_grade, 0) AS average_grade, COALESCE(cs.graded_classes, 0) AS graded_classes,
  cs.last_class_date, cs.first_class_date
FROM public.students s
LEFT JOIN public.student_financial_balance fb ON fb.student_id = s.id
LEFT JOIN public.student_class_stats cs ON cs.student_id = s.id
WHERE s.deleted_at IS NULL;

CREATE VIEW public.students_active WITH (security_invoker = true) AS
SELECT id, name, cpf, phone, email, origin, status, birth_date, city, state, hourly_rate, classes_per_week, pay_day, teacher_id, created_at, updated_at
FROM public.students WHERE deleted_at IS NULL;

CREATE VIEW public.students_active_masked WITH (security_invoker = true) AS
SELECT s.id, s.name,
  CASE WHEN public.is_admin() THEN s.cpf ELSE public.mask_cpf(s.cpf) END AS cpf,
  CASE WHEN public.is_admin() THEN s.phone WHEN (public.get_my_teacher_id() IS NOT NULL AND s.teacher_id = public.get_my_teacher_id()) THEN s.phone ELSE public.mask_phone(s.phone) END AS phone,
  s.email, s.origin, s.status, s.birth_date, s.city, s.state, s.hourly_rate, s.classes_per_week, s.pay_day, s.teacher_id, s.created_at, s.updated_at
FROM public.students s WHERE s.deleted_at IS NULL;

CREATE VIEW public.students_masked WITH (security_invoker = true) AS
SELECT s.id, s.name,
  CASE WHEN public.is_admin() THEN s.cpf ELSE public.mask_cpf(s.cpf) END AS cpf,
  CASE WHEN public.is_admin() THEN s.phone WHEN (public.get_my_teacher_id() IS NOT NULL AND s.teacher_id = public.get_my_teacher_id()) THEN s.phone ELSE public.mask_phone(s.phone) END AS phone,
  s.email, s.origin, s.status, s.birth_date, s.city, s.state, s.hourly_rate, s.classes_per_week, s.pay_day, s.teacher_id, s.created_at, s.updated_at
FROM public.students s;

CREATE VIEW public.teachers_masked WITH (security_invoker = true) AS
SELECT t.id, t.name, t.email,
  CASE WHEN public.is_admin() THEN t.cpf ELSE public.mask_cpf(t.cpf) END AS cpf,
  CASE WHEN public.is_admin() THEN t.phone ELSE public.mask_phone(t.phone) END AS phone,
  t.specialization, t.status, t.created_at, t.updated_at
FROM public.teachers t;

CREATE VIEW public.class_logs_with_billing WITH (security_invoker = true) AS
SELECT cl.id AS class_log_id, cl.student_id, cl.teacher_id, cl.class_date, cl.attendance, cl.title, cl.grade, cl.feedback, cl.created_at,
  fr.id AS financial_record_id, fr.amount AS billed_amount, fr.status AS billing_status, fr.due_date AS billing_due_date, fr.paid_at AS billing_paid_at,
  CASE WHEN fr.id IS NULL THEN 'not_billed' WHEN fr.status = 'pago' THEN 'paid' WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE THEN 'pending' WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE THEN 'overdue' ELSE 'unknown' END AS billing_status_consolidated,
  s.name AS student_name, t.name AS teacher_name
FROM public.class_logs cl
LEFT JOIN public.financial_records fr ON fr.class_log_id = cl.id
LEFT JOIN public.students s ON s.id = cl.student_id
LEFT JOIN public.teachers t ON t.id = cl.teacher_id
ORDER BY cl.class_date DESC;

-- ============================================================
-- STORAGE (avatars bucket)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- ============================================================
-- GRANTS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role, TEXT, TEXT, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(UUID, public.app_role, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(UUID, public.app_role, TEXT, TEXT) TO service_role;
GRANT SELECT ON public.class_logs_with_billing TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_billed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unbilled_classes(UUID) TO authenticated;
GRANT SELECT ON public.student_financial_balance TO authenticated;
GRANT SELECT ON public.student_class_stats TO authenticated;
GRANT SELECT ON public.student_complete_balance TO authenticated;
GRANT SELECT ON public.students_active TO authenticated;
GRANT SELECT ON public.students_active_masked TO authenticated;
GRANT SELECT ON public.students_masked TO authenticated;
GRANT SELECT ON public.teachers_masked TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_student_cpf_exists(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_student_phone_exists(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_teacher_cpf_exists(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_teacher_phone_exists(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_cpf_exists_platform(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_cpf_exists_platform(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_phone_exists_platform(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_phone_exists_platform(TEXT) TO authenticated;

-- ============================================================
-- FIM MIGRATION UNIFICADA
-- ============================================================
