import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { getClassStatusWithTime } from "@/lib/utils/classTime";

export interface TodayClassItem {
  id: string;
  title: string | null;
  class_date: string;
  start_at: string | null;
  end_at: string | null;
  attendance: boolean | null;
  studentName: string;
  timeLabel: string; // "9h às 10h" ou "Horário não definido"
  sortKey: number; // para ordenação (timestamp ou 999999 se sem horário)
}

export function getTodayClassStatus(item: {
  class_date: string;
  attendance: boolean | null;
  start_at: string | null;
  end_at: string | null;
}): { label: string; variant: "success" | "info" | "warning" } {
  return getClassStatusWithTime(item);
}

export interface TodayClassesData {
  classes: TodayClassItem[];
  nextClass: TodayClassItem | null; // próxima aula (ainda não começou ou em andamento)
}

function formatTimeLabel(startAt: string | null, endAt: string | null): string {
  if (!startAt || !endAt) return "Horário não definido";
  try {
    const start = new Date(startAt);
    const end = new Date(endAt);
    return `${format(start, "H'h'", { locale: ptBR })} às ${format(end, "H'h'", { locale: ptBR })}`;
  } catch {
    return "Horário não definido";
  }
}

function getSortKey(startAt: string | null): number {
  if (!startAt) return 999999; // sem horário vai pro final
  return new Date(startAt).getTime();
}

export function useTodayClasses(teacherId?: string | null) {
  return useQuery({
    queryKey: [QK.TODAY_CLASSES, teacherId],
    queryFn: async (): Promise<TodayClassesData> => {
      const today = format(new Date(), "yyyy-MM-dd");

      let query = supabase
        .from("class_logs")
        .select(
          `
          id,
          title,
          class_date,
          start_at,
          end_at,
          attendance,
          student_id,
          students (
            name
          )
        `
        )
        .eq("class_date", today)
        .order("start_at", { ascending: true, nullsFirst: false });

      if (teacherId) {
        query = query.eq("teacher_id", teacherId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();
      const seenIds = new Set<string>();
      const items: TodayClassItem[] = [];
      for (const row of data || []) {
        const r = row as Record<string, unknown>;
        const id = r.id as string;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const startAt = r.start_at as string | null;
        const endAt = r.end_at as string | null;
        const students = r.students as { name: string } | null;
        items.push({
          id,
          title: (r.title as string) || null,
          class_date: r.class_date as string,
          start_at: startAt,
          end_at: endAt,
          attendance: r.attendance as boolean | null,
          studentName: students?.name || "Aluno",
          timeLabel: formatTimeLabel(startAt, endAt),
          sortKey: getSortKey(startAt),
        });
      }

      // Ordenar: com horário primeiro (por start_at), sem horário depois
      items.sort((a, b) => a.sortKey - b.sortKey);

      // Próxima aula: primeira que ainda não terminou
      // (em andamento: start <= now < end, ou futura: start > now)
      let nextClass: TodayClassItem | null = null;
      for (const item of items) {
        const endAt = item.end_at ? new Date(item.end_at) : null;
        const startAt = item.start_at ? new Date(item.start_at) : null;
        if (endAt && endAt >= now) {
          nextClass = item;
          break;
        }
        if (!endAt && !startAt) {
          nextClass = item;
          break;
        }
      }

      return { classes: items, nextClass };
    },
  });
}
