import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { formatPhoneDisplay } from "@/lib/utils/format-phone";
import {
  User,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  BookOpen,
  MapPin,
  CreditCard,
} from "lucide-react";
import { common, students as studentsContent } from "@/content";
import type { StudentDetails } from "@/hooks/useStudentDetails";

interface StudentDetailInfoTabProps {
  student: StudentDetails;
}

export function StudentDetailInfoTab({ student }: StudentDetailInfoTabProps) {
  const hourlyRate = student.hourly_rate;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

  // Calcular aulas/semana com base nas últimas 8 semanas de class_logs reais
  const classesPerWeekCalc = (() => {
    const logs = student.classLogs ?? [];
    if (logs.length === 0) return null;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 56); // 8 semanas
    const recent = logs.filter((l) => new Date(l.class_date) >= cutoff);
    if (recent.length === 0) return null;
    // Span real: do mais antigo ao mais recente dentro da janela
    const dates = recent.map((l) => new Date(l.class_date).getTime());
    const spanDays = Math.max(
      1,
      (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)
    );
    const spanWeeks = Math.max(1, spanDays / 7);
    return Math.round(recent.length / spanWeeks);
  })();

  const monthlyFromCharges =
    student.financialRecords?.reduce((sum, r) => {
      if (r.due_date == null || r.amount == null) return sum;
      const [y, m] = r.due_date.split("-");
      if (y !== String(currentYear) || m !== currentMonth) return sum;
      return sum + Number(r.amount);
    }, 0) ?? 0;

  const monthlyTotal =
    monthlyFromCharges > 0
      ? monthlyFromCharges
      : hourlyRate != null && classesPerWeekCalc != null
        ? hourlyRate * classesPerWeekCalc * 4
        : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              {common.labels.frequency}
            </div>
            <p className="text-2xl font-bold">
              {student.stats.attendanceRate.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {student.stats.presentClasses}/{student.stats.totalClasses}{" "}
              {common.labels.classes}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BookOpen className="h-4 w-4" />
              {common.labels.average}
            </div>
            <p className="text-2xl font-bold">
              {student.stats.averageGrade > 0
                ? student.stats.averageGrade.toFixed(1)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {common.labels.generalGrade}
            </p>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {common.labels.personalInfo}
          </h3>
          <div className="space-y-3">
            {[
              {
                icon: Mail,
                label: common.labels.email,
                value: student.email || "—",
              },
              {
                icon: Phone,
                label: common.labels.phone,
                value:
                  formatPhoneDisplay(student.phone, student.country) || "—",
              },
              {
                icon: Calendar,
                label: common.labels.birthDate,
                value: student.birth_date
                  ? formatDate(student.birth_date)
                  : "—",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Localização */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {common.labels.location}
          </h3>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {common.labels.countryStateCity}
              </p>
              <p className="text-sm font-medium">
                {`${student.country || "—"} - ${student.state || "—"} - ${student.city || "—"}`}
              </p>
            </div>
          </div>
        </div>

        {/* Plano de aulas e cobrança */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {common.labels.planAndBilling}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: common.labels.hourlyRate,
                value: hourlyRate != null ? formatCurrency(hourlyRate) : "—",
              },
              {
                label: common.labels.classesPerWeek,
                value:
                  classesPerWeekCalc != null ? String(classesPerWeekCalc) : "—",
              },
              {
                label: common.labels.monthlyTotal,
                value:
                  monthlyTotal != null ? formatCurrency(monthlyTotal) : "—",
              },
              {
                label: common.labels.paymentDay,
                value: student.pay_day != null ? String(student.pay_day) : "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Datas */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {student.created_at && (
            <p>
              {common.labels.registeredAt} {formatDate(student.created_at)}
            </p>
          )}
          {student.updated_at && (
            <p>
              {common.labels.lastEdited} {formatDate(student.updated_at)}
            </p>
          )}
        </div>

        {/* Origem */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {common.labels.origin}
          </h3>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">
            {student.origin
              ? studentsContent.originOptions[
                  student.origin as keyof typeof studentsContent.originOptions
                ] || student.origin
              : common.labels.notInformed}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
