import { BaseDetailSheet } from "@/components/ui/custom/BaseDetailSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, BookOpen, FileText, CreditCard } from "lucide-react";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { useActivities } from "@/hooks/useActivities";
import { StudentDetailInfoTab } from "@/components/admin/StudentDetailInfoTab";
import { StudentDetailClassesTab } from "@/components/admin/StudentDetailClassesTab";
import { StudentDetailActivitiesTab } from "@/components/admin/StudentDetailActivitiesTab";
import { StudentDetailFinancialTab } from "@/components/admin/StudentDetailFinancialTab";
import { students as studentsContent, common } from "@/content";

interface StudentDetailSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando preenchido (ex.: professor), filtra atividades só desse professor; senão mostra todas do aluno. */
  teacherId?: string | null;
}

export function StudentDetailSheet({
  studentId,
  open,
  onOpenChange,
  teacherId = null,
}: StudentDetailSheetProps) {
  const { data: student, isLoading } = useStudentDetails(studentId);
  const {
    data: activities = [],
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useActivities(teacherId ?? undefined, studentId ?? undefined);

  return (
    <BaseDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isLoading ? "" : student?.name || ""}
      subtitle={
        isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <StatusBadge
            variant={student?.status === "ativo" ? "success" : "default"}
          >
            {student?.status === "ativo"
              ? common.labels.active
              : common.labels.inactive}
          </StatusBadge>
        )
      }
      size="LG"
      noScroll={true}
    >
      {isLoading ? (
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : student ? (
        <Tabs
          defaultValue="info"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="mx-6 mt-4 grid grid-cols-4">
            <TabsTrigger value="info" className="text-xs">
              <User className="h-3.5 w-3.5 mr-1.5" />
              {studentsContent.detailSheet.tabInfo}
            </TabsTrigger>
            <TabsTrigger value="classes" className="text-xs">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              {studentsContent.detailSheet.tabClasses}
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-xs">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {studentsContent.detailSheet.tabActivities}
            </TabsTrigger>
            <TabsTrigger value="financial" className="text-xs">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              {studentsContent.detailSheet.tabFinancial}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex-1 overflow-auto m-0">
            <StudentDetailInfoTab student={student} />
          </TabsContent>

          <TabsContent value="classes" className="flex-1 overflow-auto m-0">
            <StudentDetailClassesTab student={student} />
          </TabsContent>

          <TabsContent value="activities" className="flex-1 overflow-auto m-0">
            <StudentDetailActivitiesTab
              activities={activities}
              activitiesLoading={activitiesLoading}
              onRefetch={refetchActivities}
            />
          </TabsContent>

          <TabsContent value="financial" className="flex-1 overflow-auto m-0">
            <StudentDetailFinancialTab student={student} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="p-6 text-center text-muted-foreground">
          {common.errors.studentNotFound}
        </div>
      )}
    </BaseDetailSheet>
  );
}
