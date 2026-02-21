-- ============================================
-- EDUCORE DATABASE - 01 STRUCTURE
-- Fundação: Extensões, Tipos, Tabelas e Índices
-- Data: 15/02/2026
-- ============================================

-- --------------------------------------------
-- EXTENSÕES (em schema dedicado)
-- --------------------------------------------

-- Criar schema para extensões (melhor prática de segurança)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover extensões para schema dedicado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA extensions;

-- Adicionar schema extensions ao search_path
ALTER DATABASE postgres SET search_path TO public, extensions;

-- --------------------------------------------
-- TIPOS CUSTOMIZADOS
-- --------------------------------------------

-- Tipo para input de aulas em pacote
CREATE TYPE class_log_input AS (
  student_id UUID,
  teacher_id UUID,
  class_date DATE,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  attendance BOOLEAN,
  notes TEXT,
  billed_amount NUMERIC
);

-- Tipo para input de dados financeiros de pacote
CREATE TYPE package_financial_input AS (
  amount NUMERIC,
  due_date DATE,
  description TEXT,
  payment_method TEXT
);

-- --------------------------------------------
-- TABELAS BASE
-- --------------------------------------------

-- TEACHERS: Cadastro de professores (DEVE VIR ANTES DE STUDENTS)
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country VARCHAR(100),
  phone TEXT,
  email TEXT,
  address TEXT,
  hourly_rate NUMERIC(10,2),
  pix_key TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  anonymized_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE teachers IS 'Cadastro de professores';
COMMENT ON COLUMN teachers.country IS 'País do professor (ex: Brasil, Estados Unidos, Portugal)';
COMMENT ON COLUMN teachers.status IS 'Status do professor: ativo ou inativo';
COMMENT ON COLUMN teachers.hourly_rate IS 'Valor da hora/aula padrão do professor';
COMMENT ON COLUMN teachers.anonymized_at IS 'Data de anonimização dos dados pessoais (LGPD). NULL = dados não anonimizados';

-- STUDENTS: Cadastro de alunos
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country VARCHAR(100),
  phone TEXT,
  email TEXT,
  pay_day INTEGER CHECK (pay_day >= 1 AND pay_day <= 31),
  hourly_rate NUMERIC(10,2),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  birth_date DATE,
  city TEXT,
  state TEXT,
  origin TEXT,
  anonymized_at TIMESTAMPTZ DEFAULT NULL
);

COMMENT ON TABLE students IS 'Cadastro de alunos';
COMMENT ON COLUMN students.country IS 'País do aluno (ex: Brasil, Estados Unidos, Portugal)';
COMMENT ON COLUMN students.pay_day IS 'Dia do mês para vencimento de cobranças (1-31)';
COMMENT ON COLUMN students.hourly_rate IS 'Valor da hora/aula padrão do aluno';
COMMENT ON COLUMN students.is_deleted IS 'Soft delete - aluno inativo (deprecated, usar status)';
COMMENT ON COLUMN students.status IS 'Status do aluno: ativo ou inativo';
COMMENT ON COLUMN students.teacher_id IS 'Professor responsável pelo aluno';
COMMENT ON COLUMN students.origin IS 'Origem do aluno: indicacao, google, instagram, passante, outro';
COMMENT ON COLUMN students.birth_date IS 'Data de nascimento do aluno';
COMMENT ON COLUMN students.anonymized_at IS 'Data de anonimização dos dados pessoais (LGPD). NULL = dados não anonimizados';

-- PROFILES: Perfis de usuários (vinculada ao auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema vinculados ao auth.users';
COMMENT ON COLUMN profiles.role IS 'Papel do usuário: admin, teacher ou student';
COMMENT ON COLUMN profiles.avatar_url IS 'URL do avatar do usuário no storage bucket avatars';
COMMENT ON COLUMN profiles.active IS 'Indica se o perfil está ativo';
COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp quando profile foi soft deleted (oculto da UI mas preservado para auditoria)';

-- CLASS_LOGS: Registro de aulas
CREATE TABLE class_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  class_date DATE NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  attendance BOOLEAN DEFAULT NULL,
  notes TEXT,
  billed_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  grade NUMERIC(5,2),
  feedback TEXT,
  title TEXT,
  observations TEXT,
  CONSTRAINT class_logs_time_order CHECK (end_at > start_at)
);

COMMENT ON TABLE class_logs IS 'Registro de aulas ministradas';
COMMENT ON COLUMN class_logs.attendance IS 'NULL=pendente, TRUE=presente, FALSE=faltou';
COMMENT ON COLUMN class_logs.billed_amount IS 'Valor cobrado por esta aula específica';
COMMENT ON COLUMN class_logs.duration_minutes IS 'Duração calculada da aula em minutos';
COMMENT ON COLUMN class_logs.notes IS 'Notas da aula (deprecated, usar feedback/observations)';
COMMENT ON COLUMN class_logs.grade IS 'Nota da aula';
COMMENT ON COLUMN class_logs.feedback IS 'Feedback do professor sobre a aula';
COMMENT ON COLUMN class_logs.title IS 'Título/assunto da aula';
COMMENT ON COLUMN class_logs.observations IS 'Observações adicionais sobre a aula';

-- FINANCIAL_RECORDS: Cobranças
CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_log_id UUID REFERENCES class_logs(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  due_date DATE,
  description TEXT,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'abonado', 'extornado')),
  paid_at TIMESTAMPTZ,
  confirmed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_proof_url TEXT,
  payment_proof_filename TEXT,
  payment_proof_uploaded_at TIMESTAMPTZ,
  payment_proof_status TEXT CHECK (payment_proof_status IN ('pending', 'approved', 'rejected')),
  payment_proof_rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE financial_records IS 'Cobranças de aulas (individuais ou pacotes)';
COMMENT ON COLUMN financial_records.class_log_id IS 'NULL para pacotes, preenchido para aulas individuais';
COMMENT ON COLUMN financial_records.status IS 'Status da cobrança: pendente, pago, cancelado, abonado (falta não cobrada), extornado (pagamento devolvido por falta)';
COMMENT ON COLUMN financial_records.confirmed_by_user_id IS 'Usuário que confirmou o pagamento';
COMMENT ON COLUMN financial_records.payment_proof_url IS 'URL do comprovante de pagamento enviado pelo aluno';
COMMENT ON COLUMN financial_records.payment_proof_filename IS 'Nome do arquivo do comprovante';
COMMENT ON COLUMN financial_records.payment_proof_uploaded_at IS 'Data/hora do upload do comprovante';
COMMENT ON COLUMN financial_records.payment_proof_status IS 'Status do comprovante: pending (aguardando), approved (aprovado), rejected (rejeitado)';
COMMENT ON COLUMN financial_records.payment_proof_rejection_reason IS 'Motivo da rejeição do comprovante (se aplicável)';

-- FINANCIAL_RECORD_CLASS_LOGS: Relacionamento N:N (pacotes)
CREATE TABLE financial_record_class_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financial_record_id UUID NOT NULL REFERENCES financial_records(id) ON DELETE RESTRICT,
  class_log_id UUID NOT NULL REFERENCES class_logs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(financial_record_id, class_log_id)
);

COMMENT ON TABLE financial_record_class_logs IS 'Relacionamento N:N entre cobranças e aulas de pacote. Deleta em cascade quando aula é deletada. Quando cobrança é deletada, o trigger deleta as aulas e os links manualmente';

-- ACTIVITIES: Atividades/tarefas para alunos
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviada', 'entregue', 'corrigida', 'atrasada')),
  delivery_date TIMESTAMPTZ,
  correction TEXT,
  feedback TEXT,
  grade NUMERIC(5,2),
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  response_file_url TEXT,
  response_file_name TEXT,
  response_file_size BIGINT,
  response_file_type TEXT,
  student_response_text TEXT,
  student_response_file_name TEXT,
  correction_file_url TEXT,
  correction_file_name TEXT,
  delivered_at TIMESTAMPTZ,
  corrected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE activities IS 'Atividades e tarefas atribuídas aos alunos';
COMMENT ON COLUMN activities.status IS 'Status: pendente, enviada, entregue, corrigida ou atrasada';
COMMENT ON COLUMN activities.due_date IS 'Prazo de entrega da atividade (data e hora)';
COMMENT ON COLUMN activities.file_url IS 'Path do arquivo da atividade no storage';
COMMENT ON COLUMN activities.response_file_url IS 'Path do arquivo de resposta do aluno no storage';
COMMENT ON COLUMN activities.correction_file_url IS 'Path do arquivo de correção do professor no storage';

-- AUDIT_LOGS: Auditoria de operações
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as operações do sistema';
COMMENT ON COLUMN audit_logs.action_type IS 'Tipo de operação: INSERT, UPDATE ou DELETE';

-- IDEMPOTENCY_KEYS: Controle de idempotência
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT UNIQUE NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE idempotency_keys IS 'Garante que operações críticas não sejam executadas duas vezes';

-- PERFORMANCE_LOGS: Logs de performance
CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE performance_logs IS 'Logs de performance para monitoramento';

-- USER_ROLES: Papéis de usuários
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_roles IS 'Papéis de usuários para controle de acesso';
COMMENT ON COLUMN user_roles.email IS 'Email do usuário (sincronizado com profiles.email)';
COMMENT ON COLUMN user_roles.full_name IS 'Nome completo do usuário (sincronizado com profiles.full_name)';

-- --------------------------------------------
-- ÍNDICES DE PERFORMANCE
-- --------------------------------------------

-- Índices em profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_student_id ON profiles(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_profiles_teacher_id ON profiles(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_profiles_avatar_url ON profiles(avatar_url) WHERE avatar_url IS NOT NULL;
CREATE INDEX idx_profiles_active ON profiles(active) WHERE active = true;
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Índices em students (otimizados)
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_is_deleted ON students(is_deleted);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_teacher_id ON students(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_students_teacher_status ON students(teacher_id, status) WHERE teacher_id IS NOT NULL;

-- Índices em teachers (otimizados)
CREATE INDEX idx_teachers_name ON teachers(name);

-- Índices em class_logs (otimizados)
CREATE INDEX idx_class_logs_student_id ON class_logs(student_id);
CREATE INDEX idx_class_logs_teacher_id ON class_logs(teacher_id);
CREATE INDEX idx_class_logs_attendance ON class_logs(attendance);
CREATE INDEX idx_class_logs_teacher_date ON class_logs(teacher_id, class_date DESC);
CREATE INDEX idx_class_logs_student_date ON class_logs(student_id, class_date DESC);
CREATE INDEX idx_class_logs_date_attendance ON class_logs(class_date DESC, attendance);

-- Índices em financial_records (otimizados)
CREATE INDEX idx_financial_records_student_id ON financial_records(student_id);
CREATE INDEX idx_financial_records_class_log_id ON financial_records(class_log_id) WHERE class_log_id IS NOT NULL;
CREATE INDEX idx_financial_records_due_date ON financial_records(due_date);
CREATE INDEX idx_financial_records_confirmed_by ON financial_records(confirmed_by_user_id) WHERE confirmed_by_user_id IS NOT NULL;
CREATE INDEX idx_financial_records_student_status ON financial_records(student_id, status) WHERE status = 'pendente';
CREATE INDEX idx_financial_student_status_due ON financial_records(student_id, status, due_date) WHERE status = 'pendente';

-- Índices em financial_record_class_logs
CREATE INDEX idx_frcl_financial_record_id ON financial_record_class_logs(financial_record_id);
CREATE INDEX idx_frcl_class_log_id ON financial_record_class_logs(class_log_id);

-- Índices em activities (otimizados)
CREATE INDEX idx_activities_student_id ON activities(student_id);
CREATE INDEX idx_activities_teacher_id ON activities(teacher_id);
CREATE INDEX idx_activities_student_status ON activities(student_id, status);
CREATE INDEX idx_activities_teacher_status ON activities(teacher_id, status) WHERE teacher_id IS NOT NULL;

-- Índices em audit_logs (apenas created_at, user_id raramente usado)
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Índices em idempotency_keys
CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(idempotency_key);
CREATE INDEX idx_idempotency_keys_user_id ON idempotency_keys(user_id);
CREATE INDEX idx_idempotency_keys_status ON idempotency_keys(status);

-- Índices em performance_logs (apenas created_at, user_id raramente usado)
CREATE INDEX idx_performance_logs_created_at ON performance_logs(created_at);

-- Índices em user_roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_email ON user_roles(email);

-- --------------------------------------------
-- FINALIZAÇÃO
-- --------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ESTRUTURA BASE CRIADA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tabelas: 11';
  RAISE NOTICE 'Tipos customizados: 2';
  RAISE NOTICE 'Índices: 35+';
  RAISE NOTICE '============================================';
END $$;


-- ============================================
-- FIX: Tornar foreign keys DEFERRABLE para permitir triggers
-- ============================================

-- Profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- User roles
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- ============================================
-- COMENTÁRIOS SOBRE OTIMIZAÇÕES
-- ============================================

-- ÍNDICES REMOVIDOS (não utilizados):
-- - idx_students_cpf, idx_students_phone
-- - idx_teachers_cpf, idx_teachers_phone
-- - idx_class_logs_created_at
-- - idx_financial_records_created_at
-- - idx_activities_due_date

-- ÍNDICES COMPOSTOS ADICIONADOS (performance):
-- - idx_students_teacher_status (filtros por professor + status)
-- - idx_financial_student_status_due (cobranças pendentes)
-- - idx_activities_student_status (portal do aluno)
-- - idx_activities_teacher_status (dashboard do professor)
-- - idx_class_logs_date_attendance (relatórios)

-- COLUNAS ADICIONADAS:
-- - profiles.avatar_url (usado no código frontend)

COMMENT ON INDEX idx_students_teacher_status IS 
'Índice composto para filtros de alunos por professor e status. Usado em dashboards de professor.';

COMMENT ON INDEX idx_financial_student_status_due IS 
'Índice composto para queries de cobranças pendentes por aluno. Usado em dashboards financeiros.';

COMMENT ON INDEX idx_activities_student_status IS 
'Índice composto para portal do aluno filtrar atividades por status.';

COMMENT ON INDEX idx_activities_teacher_status IS 
'Índice composto para dashboard do professor filtrar atividades.';

COMMENT ON INDEX idx_class_logs_date_attendance IS 
'Índice composto para relatórios de aulas por data e presença.';


-- ============================================
-- SUPORTE A TELEFONES INTERNACIONAIS
-- Índices únicos parciais para telefone (CPF removido)
-- ============================================

-- Telefone único apenas quando preenchido (permite múltiplos NULL)
DROP INDEX IF EXISTS idx_students_phone_unique;
CREATE UNIQUE INDEX idx_students_phone_unique 
  ON students(phone) 
  WHERE phone IS NOT NULL AND phone != '';

DROP INDEX IF EXISTS idx_teachers_phone_unique;
CREATE UNIQUE INDEX idx_teachers_phone_unique 
  ON teachers(phone) 
  WHERE phone IS NOT NULL AND phone != '';

COMMENT ON INDEX idx_students_phone_unique IS 'Índice único parcial - permite múltiplos NULL';
COMMENT ON INDEX idx_teachers_phone_unique IS 'Índice único parcial - permite múltiplos NULL';

-- ============================================
-- FUNÇÕES DE NORMALIZAÇÃO DE TELEFONE
-- ============================================

-- Função para normalizar telefone (apenas dígitos)
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  -- Remove tudo exceto dígitos
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION normalize_phone IS 'Normaliza telefone removendo máscaras e mantendo apenas dígitos';

-- Trigger para normalizar telefone automaticamente ao inserir/atualizar students
CREATE OR REPLACE FUNCTION normalize_student_phone()
RETURNS TRIGGER AS $
BEGIN
  NEW.phone := normalize_phone(NEW.phone);
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_student_phone ON students;
CREATE TRIGGER trigger_normalize_student_phone
  BEFORE INSERT OR UPDATE OF phone ON students
  FOR EACH ROW
  EXECUTE FUNCTION normalize_student_phone();

-- Trigger para normalizar telefone automaticamente ao inserir/atualizar teachers
CREATE OR REPLACE FUNCTION normalize_teacher_phone()
RETURNS TRIGGER AS $
BEGIN
  NEW.phone := normalize_phone(NEW.phone);
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_teacher_phone ON teachers;
CREATE TRIGGER trigger_normalize_teacher_phone
  BEFORE INSERT OR UPDATE OF phone ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION normalize_teacher_phone();

COMMENT ON TRIGGER trigger_normalize_student_phone ON students IS 'Normaliza telefone automaticamente antes de inserir/atualizar';
COMMENT ON TRIGGER trigger_normalize_teacher_phone ON teachers IS 'Normaliza telefone automaticamente antes de inserir/atualizar';
