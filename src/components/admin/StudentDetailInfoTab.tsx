import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { formatPhoneDisplay } from "@/lib/utils/format-phone";
import { User, Mail, Phone, Calendar, TrendingUp, BookOpen, MapPin, CreditCard } from "lucide-react";
import type { StudentDetails } from "@/hooks/useStudentDetails";

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

interface StudentDetailInfoTabProps {
  student: StudentDetails;
}

export function StudentDetailInfoTab({ student }: StudentDetailInfoTabProps) {
  const hourlyRate = student.hourly_rate;
  const classesPerWeek = student.classes_per_week;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

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
      : hourlyRate != null && classesPerWeek != null
        ? hourlyRate * classesPerWeek * 4
        : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Frequência
            </div>
            <p className="text-2xl font-bold">{student.stats.attendanceRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              {student.stats.presentClasses}/{student.stats.totalClasses} aulas
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BookOpen className="h-4 w-4" />
              Média
            </div>
            <p className="text-2xl font-bold">
              {student.stats.averageGrade > 0 ? student.stats.averageGrade.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Nota geral</p>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Informações Pessoais</h3>
          <div className="space-y-3">
            {[
              { icon: Mail, label: "Email", value: student.email || "—" },
              { icon: Phone, label: "Telefone", value: formatPhoneDisplay(student.phone, student.country) || "—" },
              { icon: Calendar, label: "Data de Nascimento", value: student.birth_date ? formatDate(student.birth_date) : "—" },
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
          <h3 className="text-sm font-medium text-muted-foreground">Localização</h3>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">País - Estado - Cidade</p>
              <p className="text-sm font-medium">
                {`${student.country || "—"} - ${student.state || "—"} - ${student.city || "—"}`}
              </p>
            </div>
          </div>
        </div>

        {/* Plano de aulas e cobrança */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Plano de aulas e cobrança</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Valor por hora", value: hourlyRate != null ? formatCurrency(hourlyRate) : "—" },
              { label: "Aulas por semana", value: classesPerWeek != null ? String(classesPerWeek) : "—" },
              { label: "Total mensal", value: monthlyTotal != null ? formatCurrency(monthlyTotal) : "—" },
              { label: "Dia de pagamento", value: student.pay_day != null ? String(student.pay_day) : "—" },
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
          {student.created_at && <p>Cadastro em {formatDate(student.created_at)}</p>}
          {student.updated_at && <p>Última edição em {formatDate(student.updated_at)}</p>}
        </div>

        {/* Origem */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Origem</h3>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">
            {student.origin ? originLabels[student.origin] || student.origin : "Não informado"}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
