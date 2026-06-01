# Sprint 20 — Gamificação do Portal do Aluno

**Período:** Junho 2026  
**Status:** ⬜ Planejada  
**Estimativa:** ~5h  
**Tipo:** Feature (MVP Extension)

---

## Problem Statement

### Contexto

O portal do aluno atualmente é puramente funcional:

- Lista de cobranças
- Histórico de aulas
- Atividades para entregar

Não há elementos que incentivem engajamento contínuo ou reconheçam conquistas do aluno.

### Impacto

- Baixo engajamento com atividades (alunos entregam no último dia)
- Falta de motivação para manter frequência nas aulas
- Experiência de usuário monótona e transacional
- Professores não têm ferramentas para incentivar comportamentos positivos

### Objetivo

Adicionar mecânicas de gamificação no portal do aluno para aumentar engajamento com atividades, frequência nas aulas e pagamentos em dia.

---

## Requirements

### Functional Requirements

- **FR-20.1:** Aluno vê contador de sequência de presença (streak)
- **FR-20.2:** Aluno ganha badges por conquistas (primeira aula, 5 aulas seguidas, etc)
- **FR-20.3:** Aluno vê barra de progresso mensal (atividades e presença)
- **FR-20.4:** Badges são exibidos com animação ao serem conquistados
- **FR-20.5:** Aluno pode ver histórico de badges conquistados

### Non-Functional Requirements

- **NFR-20.1:** Cálculo de streak deve ser eficiente (< 100ms)
- **NFR-20.2:** Badges devem ser concedidos automaticamente via trigger
- **NFR-20.3:** Animações devem ser suaves e não invasivas
- **NFR-20.4:** Sistema deve funcionar mesmo sem badges (graceful degradation)

### Out of Scope

- Ranking entre alunos (competição)
- Recompensas reais (descontos, brindes)
- Gamificação para professores
- Sistema de pontos ou níveis

---

## Background

### Mecânicas de Gamificação

**Streak (Sequência):**
Contador de aulas consecutivas sem falta. Motiva frequência regular.

**Badges (Conquistas):**
Reconhecimento visual de marcos importantes. Motiva conclusão de objetivos.

**Barra de Progresso:**
Feedback visual de progresso em direção a meta. Motiva conclusão de tarefas.

### Exemplos de Sucesso

- **Duolingo:** Streak de dias consecutivos aumenta retenção em 40%
- **GitHub:** Contribution streak motiva commits diários
- **Strava:** Badges de distância motivam exercícios regulares

---

## Proposed Solution

### Arquitetura

```
Evento (aula registrada, atividade entregue)
  ↓
Trigger SQL verifica critérios de badge
  ↓
Se critério atendido, insere em `student_badges`
  ↓
Frontend detecta novo badge via Realtime
  ↓
Animação de conquista exibida
```

### Schema de Badges

```sql
CREATE TABLE student_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'primeira_aula',
    'streak_5',
    'streak_10',
    'atividades_10',
    'media_alta',
    'pagamentos_em_dia'
  )),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_type)
);

CREATE INDEX idx_student_badges_student ON student_badges(student_id);
```

### View de Streak

```sql
CREATE VIEW student_streak AS
SELECT
  student_id,
  COUNT(*) as current_streak,
  MAX(class_date) as last_class_date
FROM class_logs
WHERE attendance = true
  AND class_date >= (
    SELECT COALESCE(MAX(class_date), '1900-01-01')
    FROM class_logs cl2
    WHERE cl2.student_id = class_logs.student_id
      AND attendance = false
  )
GROUP BY student_id;
```

---

## Task Breakdown

### Task 20.1 — Criar migration para `student_badges`

**Estimativa:** 20min  
**Responsável:** Backend  
**Dependências:** Nenhuma

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_student_badges.sql`

**Descrição:**
Criar tabela de badges e view de streak.

**Implementação:**

```sql
-- Tabela de badges
CREATE TABLE student_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'primeira_aula',
    'streak_5',
    'streak_10',
    'atividades_10',
    'media_alta',
    'pagamentos_em_dia'
  )),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_type)
);

CREATE INDEX idx_student_badges_student ON student_badges(student_id);

-- RLS
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_badges" ON student_badges
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- View de streak
CREATE VIEW student_streak AS
SELECT
  cl.student_id,
  COUNT(*) as current_streak,
  MAX(cl.class_date) as last_class_date
FROM class_logs cl
WHERE cl.attendance = true
  AND cl.class_date >= (
    SELECT COALESCE(MAX(cl2.class_date), '1900-01-01')
    FROM class_logs cl2
    WHERE cl2.student_id = cl.student_id
      AND cl2.attendance = false
  )
GROUP BY cl.student_id;
```

**Acceptance Criteria:**

- Migration aplicada sem erros
- RLS habilitado (aluno só vê seus badges)
- View de streak retorna contagem correta

---

### Task 20.2 — Criar triggers para conceder badges

**Estimativa:** 1h  
**Responsável:** Backend  
**Dependências:** 20.1

**Descrição:**
Criar triggers que concedem badges automaticamente quando critérios são atendidos.

**Implementação:**

```sql
-- Badge: Primeira Aula
CREATE OR REPLACE FUNCTION grant_first_class_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.attendance = true THEN
    INSERT INTO student_badges (student_id, badge_type)
    VALUES (NEW.student_id, 'primeira_aula')
    ON CONFLICT (student_id, badge_type) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_first_class_badge
  AFTER INSERT ON class_logs
  FOR EACH ROW EXECUTE FUNCTION grant_first_class_badge();

-- Badge: Streak de 5 aulas
CREATE OR REPLACE FUNCTION grant_streak_badges()
RETURNS TRIGGER AS $$
DECLARE
  streak_count INT;
BEGIN
  IF NEW.attendance = true THEN
    SELECT current_streak INTO streak_count
    FROM student_streak
    WHERE student_id = NEW.student_id;

    IF streak_count >= 5 THEN
      INSERT INTO student_badges (student_id, badge_type)
      VALUES (NEW.student_id, 'streak_5')
      ON CONFLICT (student_id, badge_type) DO NOTHING;
    END IF;

    IF streak_count >= 10 THEN
      INSERT INTO student_badges (student_id, badge_type)
      VALUES (NEW.student_id, 'streak_10')
      ON CONFLICT (student_id, badge_type) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_streak_badges
  AFTER INSERT OR UPDATE ON class_logs
  FOR EACH ROW EXECUTE FUNCTION grant_streak_badges();

-- Badge: 10 atividades entregues
CREATE OR REPLACE FUNCTION grant_activities_badge()
RETURNS TRIGGER AS $$
DECLARE
  activities_count INT;
BEGIN
  IF NEW.status = 'submitted' THEN
    SELECT COUNT(*) INTO activities_count
    FROM activities
    WHERE student_id = NEW.student_id
      AND status = 'submitted';

    IF activities_count >= 10 THEN
      INSERT INTO student_badges (student_id, badge_type)
      VALUES (NEW.student_id, 'atividades_10')
      ON CONFLICT (student_id, badge_type) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activities_badge
  AFTER INSERT OR UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION grant_activities_badge();

-- Badge: Pagamentos em dia (nenhuma cobrança atrasada no mês)
CREATE OR REPLACE FUNCTION grant_payments_badge()
RETURNS TRIGGER AS $$
DECLARE
  overdue_count INT;
BEGIN
  IF NEW.status = 'paid' THEN
    SELECT COUNT(*) INTO overdue_count
    FROM financial_records
    WHERE student_id = NEW.student_id
      AND status = 'pending'
      AND due_date < CURRENT_DATE
      AND EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE);

    IF overdue_count = 0 THEN
      INSERT INTO student_badges (student_id, badge_type)
      VALUES (NEW.student_id, 'pagamentos_em_dia')
      ON CONFLICT (student_id, badge_type) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_badge
  AFTER INSERT OR UPDATE ON financial_records
  FOR EACH ROW EXECUTE FUNCTION grant_payments_badge();
```

**Acceptance Criteria:**

- Triggers concedem badges automaticamente
- `ON CONFLICT DO NOTHING` evita duplicação
- Badges são concedidos apenas quando critérios são atendidos

---

### Task 20.3 — Hook `useStudentGamification`

**Estimativa:** 40min  
**Responsável:** Frontend  
**Dependências:** 20.1

**Arquivo:** `src/hooks/useStudentGamification.ts`

**Descrição:**
Hook que busca streak, badges e progresso do aluno.

**Implementação:**

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentGamification = (studentId?: string) => {
  // Buscar streak
  const { data: streak } = useQuery({
    queryKey: ["student-streak", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_streak")
        .select("current_streak, last_class_date")
        .eq("student_id", studentId)
        .maybeSingle();
      if (error) throw error;
      return data || { current_streak: 0, last_class_date: null };
    },
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });

  // Buscar badges
  const { data: badges = [] } = useQuery({
    queryKey: ["student-badges", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_badges")
        .select("*")
        .eq("student_id", studentId)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });

  // Buscar progresso mensal
  const { data: progress } = useQuery({
    queryKey: ["student-progress", studentId],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Atividades entregues no mês
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("id, status")
        .eq("student_id", studentId)
        .gte("created_at", startOfMonth.toISOString());

      if (activitiesError) throw activitiesError;

      const totalActivities = activities.length;
      const submittedActivities = activities.filter(
        (a) => a.status === "submitted" || a.status === "graded"
      ).length;

      // Aulas no mês
      const { data: classes, error: classesError } = await supabase
        .from("class_logs")
        .select("id, attendance")
        .eq("student_id", studentId)
        .gte("class_date", startOfMonth.toISOString());

      if (classesError) throw classesError;

      const totalClasses = classes.length;
      const attendedClasses = classes.filter((c) => c.attendance).length;

      return {
        activities: {
          total: totalActivities,
          completed: submittedActivities,
          percentage:
            totalActivities > 0
              ? (submittedActivities / totalActivities) * 100
              : 0,
        },
        classes: {
          total: totalClasses,
          attended: attendedClasses,
          percentage:
            totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0,
        },
      };
    },
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });

  return {
    streak: streak?.current_streak || 0,
    lastClassDate: streak?.last_class_date,
    badges,
    progress,
  };
};
```

**Acceptance Criteria:**

- Hook retorna streak, badges e progresso
- Queries otimizadas com `staleTime`
- Progresso calculado apenas para mês atual

---

### Task 20.4 — Componente `StudentStreakCard`

**Estimativa:** 30min  
**Responsável:** Frontend  
**Dependências:** 20.3

**Arquivo:** `src/components/student/StudentStreakCard.tsx`

**Descrição:**
Card que exibe contador de streak com ícone de fogo.

**Implementação:**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { typography } from "@/lib/design-tokens/typography";

interface StudentStreakCardProps {
  streak: number;
}

export const StudentStreakCard = ({ streak }: StudentStreakCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          Sequência de Presença
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={`${typography("H1")} text-orange-600`}>
            {streak}
          </span>
          <span className="text-muted-foreground">
            {streak === 1 ? "aula" : "aulas"} consecutivas
          </span>
        </div>
        {streak >= 5 && (
          <p className="text-sm text-orange-600 mt-2">
            🔥 Você está em chamas! Continue assim!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria:**

- Card exibe contador de streak
- Ícone de fogo presente
- Mensagem motivacional quando streak >= 5
- Cores laranja/vermelho para tema de "fogo"

---

### Task 20.5 — Componente `StudentBadges`

**Estimativa:** 45min  
**Responsável:** Frontend  
**Dependências:** 20.3

**Arquivo:** `src/components/student/StudentBadges.tsx`

**Descrição:**
Grid de badges conquistados com ícones e descrições.

**Implementação:**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Flame, BookOpen, Star, DollarSign } from "lucide-react";

interface Badge {
  badge_type: string;
  earned_at: string;
}

interface StudentBadgesProps {
  badges: Badge[];
}

const BADGE_CONFIG = {
  primeira_aula: {
    icon: Award,
    label: "Primeira Aula",
    description: "Completou a primeira aula",
    color: "text-blue-500",
  },
  streak_5: {
    icon: Flame,
    label: "Sequência de 5",
    description: "5 aulas consecutivas sem falta",
    color: "text-orange-500",
  },
  streak_10: {
    icon: Flame,
    label: "Sequência de 10",
    description: "10 aulas consecutivas sem falta",
    color: "text-red-500",
  },
  atividades_10: {
    icon: BookOpen,
    label: "Dedicado",
    description: "10 atividades entregues",
    color: "text-green-500",
  },
  media_alta: {
    icon: Star,
    label: "Destaque",
    description: "Média de notas acima de 8.0",
    color: "text-yellow-500",
  },
  pagamentos_em_dia: {
    icon: DollarSign,
    label: "Em Dia",
    description: "Nenhuma cobrança atrasada no mês",
    color: "text-emerald-500",
  },
};

export const StudentBadges = ({ badges }: StudentBadgesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conquistas</CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma conquista ainda. Continue estudando!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge) => {
              const config =
                BADGE_CONFIG[badge.badge_type as keyof typeof BADGE_CONFIG];
              if (!config) return null;

              const Icon = config.icon;

              return (
                <div
                  key={badge.badge_type}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <Icon className={`h-12 w-12 ${config.color}`} />
                  <div className="text-center">
                    <p className="font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria:**

- Grid de badges com ícones e descrições
- Cores distintas para cada badge
- Empty state quando não há badges
- Hover effect nos badges

---

### Task 20.6 — Componente `StudentProgressBar`

**Estimativa:** 30min  
**Responsável:** Frontend  
**Dependências:** 20.3

**Arquivo:** `src/components/student/StudentProgressBar.tsx`

**Descrição:**
Barras de progresso para atividades e presença no mês.

**Implementação:**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressData {
  activities: {
    total: number;
    completed: number;
    percentage: number;
  };
  classes: {
    total: number;
    attended: number;
    percentage: number;
  };
}

interface StudentProgressBarProps {
  progress?: ProgressData;
}

export const StudentProgressBar = ({ progress }: StudentProgressBarProps) => {
  if (!progress) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso do Mês</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Atividades</span>
            <span className="text-sm text-muted-foreground">
              {progress.activities.completed} de {progress.activities.total}
            </span>
          </div>
          <Progress value={progress.activities.percentage} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Presença</span>
            <span className="text-sm text-muted-foreground">
              {progress.classes.attended} de {progress.classes.total}
            </span>
          </div>
          <Progress value={progress.classes.percentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria:**

- Barras de progresso para atividades e presença
- Contadores exibidos acima das barras
- Progresso calculado apenas para mês atual

---

### Task 20.7 — Integrar componentes no `StudentHome`

**Estimativa:** 20min  
**Responsável:** Frontend  
**Dependências:** 20.4, 20.5, 20.6

**Arquivo:** `src/pages/student/StudentHome.tsx`

**Descrição:**
Adicionar componentes de gamificação na página inicial do aluno.

**Implementação:**

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { useStudentGamification } from "@/hooks/useStudentGamification";
import { StudentStreakCard } from "@/components/student/StudentStreakCard";
import { StudentBadges } from "@/components/student/StudentBadges";
import { StudentProgressBar } from "@/components/student/StudentProgressBar";

export const StudentHome = () => {
  const { profile } = useAuth();
  const { streak, badges, progress } = useStudentGamification(
    profile?.student_id
  );

  return (
    <div className="space-y-6">
      <h1 className={typography("H1")}>Bem-vindo, {profile?.full_name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StudentStreakCard streak={streak} />
        <StudentProgressBar progress={progress} />
      </div>

      <StudentBadges badges={badges} />

      {/* Outros componentes existentes */}
    </div>
  );
};
```

**Acceptance Criteria:**

- Componentes visíveis na página inicial
- Layout responsivo (grid 2 colunas em desktop)
- Dados carregados corretamente

---

### Task 20.8 — Animação de novo badge

**Estimativa:** 40min  
**Responsável:** Frontend  
**Dependências:** 20.3, 20.5

**Descrição:**
Exibir toast animado quando aluno ganha novo badge.

**Implementação:**

```tsx
// Em useStudentGamification.ts, adicionar subscription
useEffect(() => {
  if (!studentId) return;

  const channel = supabase
    .channel("student-badges")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "student_badges",
        filter: `student_id=eq.${studentId}`,
      },
      (payload) => {
        const badge = payload.new as Badge;
        const config =
          BADGE_CONFIG[badge.badge_type as keyof typeof BADGE_CONFIG];

        if (config) {
          toast.success(`🎉 Nova conquista: ${config.label}!`, {
            description: config.description,
            duration: 5000,
          });
        }

        queryClient.invalidateQueries({
          queryKey: ["student-badges", studentId],
        });
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [studentId, queryClient]);
```

**Acceptance Criteria:**

- Toast exibido quando novo badge é conquistado
- Animação suave e não invasiva
- Subscription limpa no cleanup

---

### Task 20.9 — Testes manuais

**Estimativa:** 45min  
**Responsável:** QA  
**Dependências:** 20.1-20.8

**Cenários de Teste:**

1. **Streak de presença:**
   - Registrar 5 aulas consecutivas com presença
   - Verificar que contador aumenta
   - Registrar falta
   - Verificar que streak reseta

2. **Badge de primeira aula:**
   - Criar novo aluno
   - Registrar primeira aula
   - Verificar que badge é concedido
   - Verificar animação de toast

3. **Badge de streak:**
   - Registrar 5 aulas consecutivas
   - Verificar que badge "Sequência de 5" é concedido

4. **Badge de atividades:**
   - Entregar 10 atividades
   - Verificar que badge "Dedicado" é concedido

5. **Progresso mensal:**
   - Verificar que barras de progresso refletem dados corretos
   - Verificar que apenas mês atual é considerado

**Acceptance Criteria:**

- Todos os cenários passam
- Badges concedidos automaticamente
- Animações suaves
- Sem erros no console

---

## Implementation Details

### Tecnologias Utilizadas

- **PostgreSQL Views:** Cálculo eficiente de streak
- **Supabase Realtime:** Notificação de novos badges
- **TanStack Query:** Cache de dados de gamificação
- **shadcn/ui:** Componentes `Card`, `Progress`
- **Lucide React:** Ícones de badges

### Padrões de Código

- Hook `useStudentGamification` segue padrão de outros hooks
- Componentes usam design tokens
- Triggers SQL seguem convenção `grant_*` para funções

### Considerações de Performance

- View `student_streak` otimizada com índices
- Queries de progresso limitadas ao mês atual
- Subscription Realtime apenas para novos badges (não busca histórico)

---

## Files to Create

### Migrations

- `supabase/migrations/YYYYMMDDHHMMSS_create_student_badges.sql`

### Frontend

- `src/hooks/useStudentGamification.ts`
- `src/components/student/StudentStreakCard.tsx`
- `src/components/student/StudentBadges.tsx`
- `src/components/student/StudentProgressBar.tsx`

---

## Files to Modify

### Frontend

- `src/pages/student/StudentHome.tsx` — adicionar componentes de gamificação

---

## Testing & Validation

### Unit Tests

- `useStudentGamification.test.ts` — testar hook
- Testar cálculo de progresso mensal

### Integration Tests

- Testar triggers de badges
- Testar view de streak

### Manual Testing

- Testar com múltiplos alunos
- Verificar animações em diferentes browsers
- Testar responsividade em mobile

---

## Results & Impact (Esperado)

### Métricas de Sucesso

- **Engajamento:** Aumento de 30% em atividades entregues no prazo
- **Frequência:** Redução de 20% em faltas
- **Satisfação:** Feedback positivo sobre gamificação

### Impacto no Usuário

- Alunos mais motivados a manter frequência
- Reconhecimento visual de conquistas
- Experiência mais divertida e engajadora

---

## Technical Debt

### Débitos Conhecidos

- Sem ranking entre alunos (competição)
- Sem recompensas reais (descontos, brindes)
- Badges não podem ser "perdidos" (apenas ganhos)
- Sem sistema de pontos ou níveis

### Melhorias Futuras

- Adicionar ranking mensal de alunos
- Implementar sistema de pontos
- Adicionar mais badges (ex: "Madrugador", "Noturno")
- Permitir que professor crie badges customizados
- Adicionar recompensas reais (desconto em mensalidade)
