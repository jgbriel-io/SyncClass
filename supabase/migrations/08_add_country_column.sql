-- Adiciona coluna country para armazenar o país separadamente do estado
-- Isso permite que brasileiros tenham state=UF e estrangeiros tenham state=região/província

-- Adicionar coluna country nas tabelas students e teachers
ALTER TABLE students ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Comentários para documentação
COMMENT ON COLUMN students.country IS 'País do aluno (ex: Brasil, Estados Unidos, Portugal)';
COMMENT ON COLUMN teachers.country IS 'País do professor (ex: Brasil, Estados Unidos, Portugal)';
