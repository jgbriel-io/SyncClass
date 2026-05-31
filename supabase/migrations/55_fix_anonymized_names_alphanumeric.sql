-- Fix anonymized student/teacher names to always include letters+digits mix.
-- Previously, id.slice(0,8) could produce all-digit segments (e.g. "02818510").
-- This re-derives names using the first 8-char hex window that has both a-f and 0-9.

CREATE OR REPLACE FUNCTION _pick_anon_segment(p_id UUID) RETURNS TEXT AS $$
DECLARE
  hex TEXT;
  seg TEXT;
  i   INT;
BEGIN
  hex := replace(p_id::text, '-', '');
  FOR i IN 0..(length(hex) - 8) LOOP
    seg := substring(hex FROM i + 1 FOR 8);
    IF seg ~ '[a-f]' AND seg ~ '[0-9]' THEN
      RETURN seg;
    END IF;
  END LOOP;
  RETURN substring(hex FROM 1 FOR 8); -- unreachable for UUID v4
END;
$$ LANGUAGE plpgsql;

UPDATE students
SET name = 'Aluno ' || _pick_anon_segment(id)
WHERE is_deleted = true AND name LIKE 'Aluno %';

UPDATE teachers
SET name = 'Professor ' || _pick_anon_segment(id)
WHERE is_deleted = true AND name LIKE 'Professor %';

DROP FUNCTION _pick_anon_segment;
