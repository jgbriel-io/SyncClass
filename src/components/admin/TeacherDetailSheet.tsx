import { common, teachers as teachersContent } from "@/content";
import { BaseDetailSheet } from "@/components/ui/custom/BaseDetailSheet";
import { DetailSection } from "@/components/ui/custom/DetailSection";
import { formatCurrency } from "@/lib/utils/formatters";
import { formatPhoneDisplay } from "@/lib/utils/format-phone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  BookOpen,
  Users,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTeachers } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import { useClassLogs } from "@/hooks/useClassLogs";
import { useFinancialRecords } from "@/hooks/useFinancialRecords";
import { useMemo } from "react";

interface TeacherDetailSheetProps {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherDetailSheet({
  teacherId,
  open,
  onOpenChange,
}: TeacherDetailSheetProps) {
  const { data: teachers = [] } = useTeachers();
  const { data: students = [] } = useStudents();
  const { data: classLogs = [] } = useClassLogs();
  const { data: financialRecords = [] } = useFinancialRecords();

  const teacher = useMemo(
    () => teachers.find((t) => t.id === teacherId),
    [teachers, teacherId]
  );

  const teacherStudents = useMemo(
    () => students.filter((s) => s.teacher_id === teacherId && s.status === "ativo"),
    [students, teacherId]
  );

  const teacherClasses = useMemo(
    () => classLogs.filter((log) => log.students?.teacher_id === teacherId && log.attendance),
    [classLogs, teacherId]
  );

  const teacherFinancials = useMemo(
    () => financialRecords.filter((rec) => rec.students?.teacher_id === teacherId && rec.status === "pago"),
    [financialRecords, teacherId]
  );

  const totalReceived = useMemo(
    () => teacherFinancials.reduce((sum, rec) => sum + Number(rec.amount || 0), 0),
    [teacherFinancials]
  );

  if (!open) return null;

  return (
    <BaseDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={common.buttons.viewDetails}
      subtitle={
        !teacher ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <>
            <h2 className="text-2xl font-bold">{teacher.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {teacher.email || common.errors.noEmail}
            </p>
            <StatusBadge
              variant={teacher.status === "ativo" ? "success" : "default"}
              className="mt-2"
            >
              {teacher.status === "ativo" ? common.labels.active : common.labels.inactive}
            </StatusBadge>
          </>
        )
      }
      size="XL"
      noScroll
    >
      {!teacher ? (
        <div className="p-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid w-full grid-cols-3">
            <TabsTrigger value="info">{teachersContent.detailSheet.tabInfo}</TabsTrigger>
            <TabsTrigger value="students">{teachersContent.detailSheet.tabStudents}</TabsTrigger>
            <TabsTrigger value="stats">{teachersContent.detailSheet.tabClasses}</TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="flex-1 overflow-auto m-0 px-6 py-4">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                {teachersContent.detailSheet.personalDataSection}
              </h3>
              <div className="grid gap-4 text-sm">
                <DetailSection icon={Mail} label={common.labels.email} value={teacher.email || "—"} inline />
                <DetailSection icon={Phone} label={common.labels.phone} value={formatPhoneDisplay(teacher.phone, "Brasil") || "—"} inline />
                <DetailSection
                  icon={Calendar}
                  label={common.labels.createdAt}
                  value={
                    teacher.created_at
                      ? format(new Date(teacher.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : "—"
                  }
                  inline
                />
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Alunos */}
          <TabsContent value="students" className="flex-1 overflow-auto m-0 px-6 py-4">
            <Card className="p-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                {teachersContent.detailSheet.activeStudentsLabel} ({teacherStudents.length})
              </h3>
              {teacherStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {teachersContent.detailSheet.noActiveStudentsMessage}
                </p>
              ) : (
                <div className="space-y-2">
                  {teacherStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.email || formatPhoneDisplay(student.phone, student.country) || "—"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {student.hourly_rate && (
                          <p>{formatCurrency(student.hourly_rate)}/h</p>
                        )}
                        {student.classes_per_week && (
                          <p>{student.classes_per_week}x/semana</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Estatísticas */}
          <TabsContent value="stats" className="flex-1 overflow-auto m-0 px-6 py-4">
            <div className="grid gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{teachersContent.detailSheet.totalStudentsLabel}</span>
                  </div>
                  <span className="text-2xl font-bold">{teacherStudents.length}</span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{teachersContent.detailSheet.totalClassesLabel}</span>
                  </div>
                  <span className="text-2xl font-bold">{teacherClasses.length}</span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-success" />
                    <span className="text-sm text-muted-foreground">{teachersContent.detailSheet.totalReceivedLabel}</span>
                  </div>
                  <span className="text-2xl font-bold text-success">
                    {formatCurrency(totalReceived)}
                  </span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{teachersContent.detailSheet.averagePerClassLabel}</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {teacherClasses.length > 0
                      ? formatCurrency(totalReceived / teacherClasses.length)
                      : "—"}
                  </span>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </BaseDetailSheet>
  );
}
