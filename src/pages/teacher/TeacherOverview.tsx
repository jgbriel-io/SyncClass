import TeacherLayout from "@/components/layout/TeacherLayout";
import { useClassLogs, useClassLogsSummary } from "@/hooks/useClassLogs";
import { useFinancialRecords, useFinancialSummary } from "@/hooks/useFinancialRecords";
import { useStudentsByTeacher } from "@/hooks/useStudentsByTeacher";
import { Loader2 } from "lucide-react";

const TeacherOverviewPage = () => {
  // RLS garante que os resumos considerem apenas dados dos alunos do professor
  const { data: classSummary, isLoading: loadingClasses } = useClassLogsSummary();
  const { data: financialSummary, isLoading: loadingFinancial } = useFinancialSummary();
  const { data: students = [] } = useStudentsByTeacher();
  const { data: classLogs = [] } = useClassLogs();
  const { data: financialRecords = [] } = useFinancialRecords();

  const isLoading = loadingClasses || loadingFinancial;

  const attendanceRate = classSummary
    ? classSummary.totalClasses > 0
      ? ((classSummary.totalPresent / classSummary.totalClasses) * 100).toFixed(0)
      : "0"
    : "0";

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">Análise detalhada dos seus alunos</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg border bg-card p-4 shadow-card">
                <p className="text-sm text-muted-foreground">Total de Aulas</p>
                <p className="text-2xl font-semibold mt-1">
                  {classSummary?.totalClasses || 0}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-card">
                <p className="text-sm text-muted-foreground">Presenças</p>
                <p className="text-2xl font-semibold mt-1 text-success">
                  {classSummary?.totalPresent || 0}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-card">
                <p className="text-sm text-muted-foreground">Faltas</p>
                <p className="text-2xl font-semibold mt-1 text-destructive">
                  {classSummary?.totalAbsent || 0}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-card">
                <p className="text-sm text-muted-foreground">Taxa de Presença</p>
                <p className="text-2xl font-semibold mt-1">
                  {attendanceRate}%
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 mt-6">
              <div className="rounded-lg border bg-card p-4 shadow-card">
                <p className="text-sm text-muted-foreground">Cobranças Pendentes</p>
                <p className="text-2xl font-semibold mt-1">
                  {financialSummary?.countPending || 0}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-card">
                <p className="text-sm text-muted-foreground">Cobranças Pagas</p>
                <p className="text-2xl font-semibold mt-1 text-success">
                  {financialSummary?.countPaid || 0}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-card">
                <p className="text-sm text-muted-foreground">Cobranças em Atraso</p>
                <p className="text-2xl font-semibold mt-1 text-destructive">
                  {financialSummary?.countOverdue || 0}
                </p>
              </div>
            </div>

            {/* Planilha por aluno (campos da planilha do cliente) */}
            <div className="mt-8 border rounded-lg overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Aluno</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Cidade</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Valor/hora</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Aulas/semana</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Aulas/mês</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Prev. mensal</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Dia pagamento</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Status pagto (mês)</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Aulas devidas (mês)</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const hourlyRate = (student as any).hourly_rate as number | null;
                    const classesPerWeek = (student as any).classes_per_week as number | null;
                    const payDay = (student as any).pay_day as number | null;
                    const city = (student as any).city as string | null;

                    const totalMonthlyClasses = classesPerWeek ? classesPerWeek * 4 : 0;
                    const expectedMonthlyAmount =
                      hourlyRate && totalMonthlyClasses
                        ? hourlyRate * totalMonthlyClasses
                        : 0;

                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);

                    const classesThisMonth = classLogs.filter(
                      (log) =>
                        log.student_id === student.id &&
                        new Date(log.class_date + "T00:00:00") >= monthStart &&
                        new Date(log.class_date + "T00:00:00") <= monthEnd
                    ).length;

                    const classesOwed = Math.max(
                      (totalMonthlyClasses || 0) - classesThisMonth,
                      0
                    );

                    const recordsThisMonth = financialRecords.filter(
                      (rec) =>
                        rec.student_id === student.id &&
                        new Date(rec.due_date + "T00:00:00") >= monthStart &&
                        new Date(rec.due_date + "T00:00:00") <= monthEnd
                    );

                    const lastRecord =
                      recordsThisMonth.length > 0
                        ? recordsThisMonth[recordsThisMonth.length - 1]
                        : null;

                    const paymentStatusLabel = lastRecord
                      ? lastRecord.status === "pago"
                        ? "Pago"
                        : lastRecord.status === "atrasado"
                        ? "Atrasado"
                        : "Pendente"
                      : "—";

                    return (
                      <tr key={student.id} className="border-b last:border-0">
                        <td className="px-4 py-2 whitespace-nowrap">{student.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{city || "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {hourlyRate
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(hourlyRate)
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {classesPerWeek ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {totalMonthlyClasses || "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {expectedMonthlyAmount
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(expectedMonthlyAmount)
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {payDay ?? "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {paymentStatusLabel}
                        </td>
                        <td className="px-4 py-2 text-center">{classesOwed}</td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        Nenhum aluno cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherOverviewPage;
