import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getClassStatusWithTime } from "@/lib/utils/classTime";
import { classes as classesContent } from "@/content";

export function formatClassDateAndTime(log: {
  class_date: string;
  start_at?: string | null;
  end_at?: string | null;
}): { date: string; timeRange: string | null } {
  const date = format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
  if (log.start_at && log.end_at) {
    const start = format(new Date(log.start_at), "HH:mm", { locale: ptBR });
    const end = format(new Date(log.end_at), "HH:mm", { locale: ptBR });
    return { date, timeRange: `${start} às ${end}` };
  }
  return { date, timeRange: null };
}

export function getPaymentStatusVariant(status: string | null): "success" | "warning" | "destructive" {
  switch (status) {
    case "pago": return "success";
    case "pendente": return "warning";
    case "atrasado": return "destructive";
    default: return "warning";
  }
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function getPaymentStatusLabel(status: string | null): string {
  switch (status) {
    case "pago": return classesContent.tableRow.statusPaid;
    case "pendente": return classesContent.tableRow.statusPending;
    case "atrasado": return classesContent.tableRow.statusOverdue;
    default: return classesContent.tableRow.statusPending;
  }
}

export function getClassStatusBadge(log: {
  class_date: string;
  attendance: boolean | null;
  start_at?: string | null;
  end_at?: string | null;
}) {
  return getClassStatusWithTime(log);
}

export function getClassLogDisplayTitle(log: {
  title?: string | null;
  class_date?: string;
  financial_record_via_package?: boolean;
}): string {
  const rawTitle = log.title?.trim();
  const isPackage = log.financial_record_via_package;
  if (rawTitle) return isPackage ? `${rawTitle} (${classesContent.packageDialog.title})` : rawTitle;
  const d = log.class_date
    ? format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })
    : "";
  const fallback = d ? `${classesContent.view.title} - ${d}` : classesContent.view.title;
  return isPackage ? `${fallback} (${classesContent.packageDialog.title})` : fallback;
}
