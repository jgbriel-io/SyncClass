import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import {
  CheckCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  Loader2,
  TrendingUp,
  Award,
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import {
  useStudentProfile,
  useStudentStats,
  useLastClass,
} from "@/hooks/useStudentPortal";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { studentPortal } from "@/content";

export default function StudentHome() {
  const { data: profile, isLoading: loadingProfile } = useStudentProfile();
  const stats = useStudentStats();
  const lastClass = useLastClass();

  const isLoading = loadingProfile;
  const studentName = profile?.name?.split(" ")[0] || "Aluno";
  const isFinancialOk = !stats.hasPendingPayments;

  return (
    <PageContainer constrained maxWidth="5xl">
      {/* Loading */}
      {isLoading && (
        <EmptyState size="lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </EmptyState>
      )}

      {!isLoading && (
        <div className={stack("RELAXED")}>
          {/* Título + subtítulo */}
          <div className="text-center">
            <h1
              className={`${typography("DISPLAY")} mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl`}
            >
              {studentPortal.home.greeting(studentName)}
            </h1>
            <p
              className={`${typography("SMALL")} mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm mt-1`}
            >
              {studentPortal.home.subtitle}
            </p>
          </div>

          {/* No profile linked message */}
          {!profile && (
            <div className="rounded-xl border bg-card p-5 shadow-card text-center">
              <AlertCircle className="h-10 w-10 text-warning mx-auto mb-3" />
              <h2
                className={`${typography("H3")} laptop:text-base desktop:text-lg`}
              >
                {studentPortal.home.noProfile}
              </h2>
              <p className={`${typography("SMALL")} mt-1`}>
                {studentPortal.home.noProfileDescription}
              </p>
            </div>
          )}

          {profile && (
            <>
              {/* Card Situação Financeira */}
              <StudentMetricCard
                icon={isFinancialOk ? CheckCircle : AlertCircle}
                label={studentPortal.home.financialLabel}
                value={
                  isFinancialOk
                    ? studentPortal.home.financialOk
                    : studentPortal.home.financialPending
                }
                description={
                  isFinancialOk
                    ? studentPortal.home.financialOkDescription
                    : studentPortal.home.financialPendingDescription
                }
                variant={isFinancialOk ? "success" : "warning"}
              />

              {/* Card Última Aula */}
              {lastClass ? (
                <div className="rounded-xl border bg-card p-5 shadow-card">
                  <div
                    className={`flex items-center justify-between ${gap("LOOSE")}`}
                  >
                    <div className={`flex items-center ${gap("DEFAULT")}`}>
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                        <BookOpen className={iconSize("MD")} />
                      </div>
                      <div>
                        <h2
                          className={`${typography("H3")} laptop:text-base desktop:text-lg`}
                        >
                          {studentPortal.home.lastClassTitle}
                        </h2>
                        <div
                          className={`flex items-center ${gap("TIGHT")} ${typography("SMALL")}`}
                        >
                          <Calendar className={iconSize("XS")} />
                          {formatDate(lastClass.class_date)}
                        </div>
                      </div>
                    </div>
                    {lastClass.grade !== null && (
                      <div className="text-right">
                        <p className={typography("TABLE_HEADER")}>
                          {studentPortal.home.gradeLabel}
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            Number(lastClass.grade) >= 7
                              ? "text-success"
                              : Number(lastClass.grade) >= 5
                                ? "text-warning"
                                : "text-destructive"
                          }`}
                        >
                          {Number(lastClass.grade).toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                  {lastClass.feedback && (
                    <div className="pt-4 border-t">
                      <p className={typography("SMALL")}>
                        <span className="font-medium text-foreground">
                          {studentPortal.home.feedbackLabel}{" "}
                        </span>
                        {lastClass.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border bg-card shadow-card">
                  <EmptyState
                    icon={BookOpen}
                    message={studentPortal.home.noClasses}
                  />
                </div>
              )}

              {/* Cards Aulas realizadas + Média geral */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${gap("LOOSE")}`}
              >
                <StudentMetricCard
                  icon={TrendingUp}
                  label={studentPortal.home.totalClassesLabel}
                  value={stats.totalClasses}
                  variant="default"
                />
                <StudentMetricCard
                  icon={Award}
                  label={studentPortal.home.averageGradeLabel}
                  value={
                    stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : "—"
                  }
                  variant="success"
                />
              </div>
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}
