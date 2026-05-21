import { useState } from "react";
import { toast } from "sonner";
import { getActivityFileUrl } from "./useActivities";
import { logger } from "@/lib/logger";
import { activities } from "@/content";

export const useActivityFileActions = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const viewFile = async (filePath: string) => {
    setIsViewing(true);
    try {
      const url = await getActivityFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(activities.view.toasts.fileOpenError);
    } finally {
      setIsViewing(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    setIsDownloading(true);
    try {
      toast.loading(activities.view.toasts.downloadPreparing);
      const signedUrl = await getActivityFileUrl(filePath);
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success(activities.view.toasts.downloadSuccess);
    } catch (error) {
      logger.error(error as Error, { context: 'download_activity_file' });
      toast.dismiss();
      toast.error(activities.view.toasts.downloadError);
    } finally {
      setIsDownloading(false);
    }
  };

  return { viewFile, downloadFile, isDownloading, isViewing };
};
