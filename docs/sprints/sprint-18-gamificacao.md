# Sprint 18 — Gamificação do Portal do Aluno
**Período:** Junho 2026
**Status:** ⬜ Pendente
**Estimativa:** ~5h

## Objetivo
Adicionar elementos de gamificação no portal do aluno para aumentar engajamento com atividades e frequência nas aulas.

## Mecânicas Planejadas

### 18.1 — Sequência de presença (streak)
- Contador de aulas consecutivas sem falta
- Exibido no `StudentHome` como card de destaque
- Reset ao faltar uma aula

**Schema:**
```sql
-- Calculado via view, sem coluna extra
CREATE VIEW student_streak AS
SELECT student_id, COUNT(*) as streak
FROM class_logs
WHERE attendance = true
  AND class_date >= (
    SELECT MAX(class_date) FROM class_logs cl2
    WHERE cl2.student_id = class_logs.student_id AND attendance = false
  )
GROUP BY student_id;
```

---

### 18.2 — Badges de conquistas
**Arquivo:** `src/components/student/StudentBadges.tsx`

| Badge | Critério |
|---|---|
| 🎯 Primeira aula | Completou a primeira aula |
| 🔥 Sequência de 5 | 5 aulas consecutivas sem falta |
| 📚 Dedicado | 10 atividades entregues no prazo |
| ⭐ Destaque | Média de notas acima de 8.0 |
| 💰 Em dia | Nenhuma cobrança atrasada no mês |

**Schema:**
```sql
CREATE TABLE student_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_type)
);
```

---

### 18.3 — Barra de progresso mensal
**Arquivo:** `src/components/student/StudentProgressBar.tsx`
- Progresso de atividades entregues no mês (X de Y)
- Progresso de presença (X aulas de Y planejadas)
- Exibido no `StudentHome`

---

### 18.4 — Hook `useStudentGamification`
**Arquivo:** `src/hooks/useStudentGamification.ts`
- Busca streak, badges e progresso do aluno
- Verifica e concede novos badges automaticamente via RPC

## Critério de Conclusão
- Streak visível no portal do aluno
- Badges exibidos com animação ao ganhar novo
- Barra de progresso mensal atualizada em tempo real
