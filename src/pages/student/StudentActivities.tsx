import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import {
  useActivities,
  useMarkActivityAsDelivered,
  getActivityFileUrl,
  type ActivityWithRelations,
} from "@/hooks/useActivities";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyActivitiesStudentState } from "@/components/ui/contextual-empty-states";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DeliverActivityDialog } from "@/components/activities/DeliverActivityDialog";
import { StudentActivityCard } from "@/components/student/StudentActivityCard";
import { typography } from "@/lib/design-tokens/typography";
import { stack } from "@/lib/design-tokens/spacing";
import { logger } from "@/lib/logger";
import { studentPortal } from "@/content";

const StudentActivitiesPage = () => {
  const { user } = useAuth();
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityWithRelations | null>(null);

  const { data: profile, isLoading: profileLoading } = useCurrentUserProfile(
    user?.id
  );
  const { data: activities = [], isLoading } = useActivities(
    undefined,
    profile?.student_id || undefined
  );
  const markAsDelivered = useMarkActivityAsDelivered();

  const handleViewFile = async (filePath: string) => {
    try {
      const url = await getActivityFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(studentPortal.activities.toasts.fileOpenError);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      toast.loading(studentPortal.activities.toasts.downloadPreparing);
      const signedUrl = await getActivityFileUrl(filePath);

      // Forçar download via fetch para evitar abrir em nova aba
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Liberar memória
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(studentPortal.activities.toasts.downloadSuccess);
    } catch (error) {
      logger.error(error as Error, { context: "download_activity_file" });
      toast.dismiss();
      toast.error(studentPortal.activities.toasts.downloadError);
    }
  };

  const handleOpenDeliverDialog = (activity: ActivityWithRelations) => {
    setSelectedActivity(activity);
    setDeliverDialogOpen(true);
  };

  const handleDeliverActivity = async (data: {
    responseText?: string;
    responseFileUrl?: string;
    responseFileName?: string;
  }) => {
    if (!selectedActivity) return;

    await markAsDelivered.mutateAsync({
      activityId: selectedActivity.id,
      responseText: data.responseText,
      responseFileUrl: data.responseFileUrl,
      responseFileName: data.responseFileName,
    });
  };

  return (
    <PageContainer constrained maxWidth="5xl">
      {/* Header */}
      <div className="mb-4">
        <h1 className={typography("H1")}>{studentPortal.activities.title}</h1>
        <p className={`${typography("SMALL")} mt-1`}>
          {studentPortal.activities.subtitle}
        </p>
      </div>

      {/* Loading */}
      {(profileLoading || isLoading) && (
        <div className="rounded-lg border bg-card flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Lista de Atividades */}
      {!profileLoading && !isLoading && activities.length === 0 && (
        <div className="rounded-lg border bg-card">
          <EmptyActivitiesStudentState />
        </div>
      )}

      {!profileLoading && !isLoading && activities.length > 0 && (
        <div className={stack("DEFAULT")}>
          <h2 className={typography("TABLE_HEADER")}>
            {studentPortal.activities.sectionTitle}
          </h2>
          <div className={stack("DEFAULT")}>
            {activities.map((activity) => (
              <StudentActivityCard
                key={activity.id}
                activity={activity}
                onViewFile={handleViewFile}
                onDownload={handleDownload}
                onDeliver={handleOpenDeliverDialog}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dialog de Entrega */}
      {selectedActivity && (
        <DeliverActivityDialog
          open={deliverDialogOpen}
          onOpenChange={setDeliverDialogOpen}
          onDeliver={handleDeliverActivity}
          activityTitle={selectedActivity.title}
        />
      )}
    </PageContainer>
  );
};

export default StudentActivitiesPage;
