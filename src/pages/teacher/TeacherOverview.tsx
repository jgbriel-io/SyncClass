import TeacherLayout from "@/components/layout/TeacherLayout";
import { useClassLogsSummary } from "@/hooks/useClassLogs";
import { useFinancialSummary } from "@/hooks/useFinancialRecords";
import { Loader2 } from "lucide-react";

const TeacherOverviewPage = () => {
  // RLS garante que os resumos considerem apenas dados dos alunos do professor
  const { data: classSummary, isLoading: loadingClasses } = useClassLogsSummary();
  const { data: financialSummary, isLoading: loadingFinancial } = useFinancialSummary();

  const isLoading = loadingClasses || loadingFinancial;

  const attendanceRate = classSummary
    ? classSummary.totalClasses > 0
      ? ((classSummary.totalPresent / classSummary.totalClasses) * 100).toFixed(0)
      : "0"
    : "0";

  return (
    <TeacherLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
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
          </>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherOverviewPage;
