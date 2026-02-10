-- Adicionar campos de resposta do aluno na tabela activities
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS student_response_text TEXT,
ADD COLUMN IF NOT EXISTS student_response_file_url TEXT,
ADD COLUMN IF NOT EXISTS student_response_file_name TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.activities.student_response_text IS 'Resposta do aluno em texto';
COMMENT ON COLUMN public.activities.student_response_file_url IS 'URL do arquivo de resposta enviado pelo aluno';
COMMENT ON COLUMN public.activities.student_response_file_name IS 'Nome do arquivo de resposta do aluno';
