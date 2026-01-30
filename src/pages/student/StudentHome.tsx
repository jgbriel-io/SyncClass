import { StudentLayout } from "@/components/layout/StudentLayout";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import { CheckCircle, AlertCircle, BookOpen, Calendar, Loader2, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useStudentProfile,
  useStudentStats,
  useLastClass,
} from "@/hooks/useStudentPortal";

function formatDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

export default function StudentHome() {
  const { data: profile, isLoading: loadingProfile } = useStudentProfile();
  const stats = useStudentStats();
  const lastClass = useLastClass();

  const isLoading = loadingProfile;
  const studentName = profile?.name?.split(" ")[0] || "Aluno";
  const isFinancialOk = !stats.hasPendingPayments;

  return (
    <StudentLayout>
      <PageContainer constrained maxWidth="5xl">
        {/* Loading */}
        {isLoading && (
          <EmptyState size="lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </EmptyState>
        )}

        {!isLoading && (
          <>
            {/* Greeting */}
            <div className="text-center py-4">
              <h1 className="text-2xl font-semibold">
                Olá, {studentName}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Bom te ver por aqui
              </p>
            </div>

            {/* No profile linked message */}
            {!profile && (
              <div className="rounded-xl border bg-card p-5 shadow-card text-center">
                <AlertCircle className="h-10 w-10 text-warning mx-auto mb-3" />
                <h2 className="font-semibold">Perfil não vinculado</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu usuário ainda não está vinculado a um cadastro de aluno.
                  Entre em contato com a secretaria.
                </p>
              </div>
            )}

            {profile && (
              <>
                {/* ⚡ P0-1: Financial Status usando StudentMetricCard */}
                <StudentMetricCard
                  icon={isFinancialOk ? CheckCircle : AlertCircle}
                  label="Situação Financeira"
                  value={isFinancialOk ? "Em dia" : "Pendente"}
                  description={
                    isFinancialOk
                      ? "Você está em dia com seus pagamentos"
                      : "Você tem pendências financeiras"
                  }
                  variant={isFinancialOk ? "success" : "warning"}
                />

                {/* Last Class Card */}
                {lastClass ? (
                  <div className="rounded-xl border bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h2 className="font-semibold">Última Aula</h2>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(lastClass.class_date)}
                          </div>
                        </div>
                      </div>
                      {lastClass.grade !== null && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Nota
                          </p>
                          <p className={`text-2xl font-bold ${
                            Number(lastClass.grade) >= 7 
                              ? "text-success" 
                              : Number(lastClass.grade) >= 5 
                              ? "text-warning" 
                              : "text-destructive"
                          }`}>
                            {Number(lastClass.grade).toFixed(1)}
                          </p>
                        </div>
                      )}
                    </div>
                    {lastClass.feedback && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Feedback: </span>
                          {lastClass.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border bg-card shadow-card">
                    <EmptyState
                      icon={BookOpen}
                      message="Nenhuma aula registrada ainda"
                    />
                  </div>
                )}

                {/* ⚡ P0-1: Quick Stats usando StudentMetricCard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StudentMetricCard
                    icon={TrendingUp}
                    label="Aulas realizadas"
                    value={stats.totalClasses}
                    variant="default"
                  />
                  <StudentMetricCard
                    icon={Award}
                    label="Média geral"
                    value={stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : "—"}
                    variant="success"
                  />
                </div>
              </>
            )}
          </>
        )}
      </PageContainer>
    </StudentLayout>
  );
}
