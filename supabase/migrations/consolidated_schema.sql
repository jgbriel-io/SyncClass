-- ============================================================
-- CONSOLIDATED SCHEMA - Estado completo do banco até 26/01/2026
-- ============================================================
-- Este arquivo consolida todas as migrations aplicadas até o momento
-- Para usar: execute em um banco novo do Supabase
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'teacher');
CREATE TYPE public.student_origin AS ENUM ('indicacao', 'google', 'instagram', 'passante', 'outro');
CREATE TYPE public.student_status AS ENUM ('ativo', 'inativo');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'pago', 'atrasado');

-- ============================================================
-- TABLES
-- ============================================================

-- Tabela de roles (CRÍTICO para segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    full_name TEXT,
    email TEXT,
    CONSTRAINT user_roles_user_id_key UNIQUE (user_id)
);

COMMENT ON CONSTRAINT user_roles_user_id_key ON public.user_roles 
IS 'Ensures each user can have only one role entry';

-- Tabela de professores
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialization TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de alunos
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de perfis (link entre auth.users e students/teachers)
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

-- Tabela de registros de aula
CREATE TABLE public.class_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    class_date DATE NOT NULL,
    attendance BOOLEAN DEFAULT true,
    grade DECIMAL(4,2) CHECK (grade >= 0 AND grade <= 10),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de registros financeiros
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
CREATE INDEX idx_financial_records_class_log_id ON public.financial_records(class_log_id);
CREATE INDEX idx_financial_records_status ON public.financial_records(status);
CREATE INDEX idx_financial_records_due_date ON public.financial_records(due_date);
CREATE INDEX idx_class_logs_student_id ON public.class_logs(student_id);
CREATE INDEX idx_class_logs_class_date ON public.class_logs(class_date);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Função SECURITY DEFINER para verificar role (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função helper para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Função helper para verificar se é teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'teacher')
$$;

-- Função helper para obter student_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Função helper para obter teacher_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'student');
    
    INSERT INTO public.user_roles (user_id, role, full_name, email)
    VALUES (
        NEW.id,
        'student',
        NEW.raw_user_meta_data->>'full_name',
        NEW.email
    );
    
    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at
    BEFORE UPDATE ON public.financial_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_logs_updated_at
    BEFORE UPDATE ON public.class_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: user_roles
-- ============================================================

CREATE POLICY "Users can read own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role and admins can read all roles"
    ON public.user_roles FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        public.is_admin()
    );

CREATE POLICY "Usuários podem receber sua própria role" 
    ON public.user_roles 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todas as roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================

CREATE POLICY "Usuários podem ver seu próprio perfil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu próprio perfil" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todos os perfis"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: students
-- ============================================================

CREATE POLICY "Admins podem gerenciar alunos"
    ON public.students FOR ALL
    USING (public.is_admin());

CREATE POLICY "Alunos podem ver seus próprios dados"
    ON public.students FOR SELECT
    USING (id = public.get_my_student_id());

CREATE POLICY "Professores podem ver seus próprios alunos"
    ON public.students FOR SELECT
    USING (
        teacher_id = public.get_my_teacher_id()
        OR public.is_admin()
    );

-- ============================================================
-- RLS POLICIES: financial_records
-- ============================================================

CREATE POLICY "Admins podem gerenciar registros financeiros"
    ON public.financial_records FOR ALL
    USING (public.is_admin());

CREATE POLICY "Alunos podem ver seus próprios registros financeiros"
    ON public.financial_records FOR SELECT
    USING (student_id = public.get_my_student_id());

CREATE POLICY "Professores podem gerenciar registros financeiros dos seus alunos"
    ON public.financial_records FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = financial_records.student_id
            AND s.teacher_id = public.get_my_teacher_id()
        )
        OR public.is_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = financial_records.student_id
            AND s.teacher_id = public.get_my_teacher_id()
        )
        OR public.is_admin()
    );

-- ============================================================
-- RLS POLICIES: class_logs
-- ============================================================

CREATE POLICY "Admins podem gerenciar registros de aula"
    ON public.class_logs FOR ALL
    USING (public.is_admin());

CREATE POLICY "Alunos podem ver seus próprios registros de aula"
    ON public.class_logs FOR SELECT
    USING (student_id = public.get_my_student_id());

CREATE POLICY "Professores podem gerenciar registros de aula dos seus alunos"
    ON public.class_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = class_logs.student_id
            AND s.teacher_id = public.get_my_teacher_id()
        )
        OR public.is_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = class_logs.student_id
            AND s.teacher_id = public.get_my_teacher_id()
        )
        OR public.is_admin()
    );

-- ============================================================
-- RLS POLICIES: teachers
-- ============================================================

CREATE POLICY "Admins podem gerenciar professores"
    ON public.teachers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Professores podem ver seus próprios dados"
    ON public.teachers FOR SELECT
    USING (id = public.get_my_teacher_id() OR public.is_admin());

-- ============================================================
-- FIM DO SCHEMA CONSOLIDADO
-- ============================================================
