import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAvatarLetter } from "@/lib/utils/patterns";
import { AVATAR_MAX_SIZE_BYTES, AVATAR_MAX_PX } from "@/lib/utils/avatarUpload";
import { useUploadAvatar, useUpdateMyProfile } from "@/hooks/useUsers";
import {
  useUpdateProfileName,
  useUpdateProfileEmail,
} from "@/hooks/useUserProfileMutations";
import { layout } from "@/content";

const MAX_MB = AVATAR_MAX_SIZE_BYTES / (1024 * 1024);
const s = layout.settings.profile;

interface SettingsPerfilTabProps {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  teacherId?: string | null;
  isTeacher: boolean;
}

export function SettingsPerfilTab({
  userId,
  displayName,
  email,
  avatarUrl,
  teacherId,
  isTeacher,
}: SettingsPerfilTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const updateAvatar = useUpdateMyProfile();
  const updateProfileName = useUpdateProfileName();
  const updateProfileEmail = useUpdateProfileEmail();
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [newEmail, setNewEmail] = useState(email);
  const [isExporting, setIsExporting] = useState(false);

  const isPending =
    uploadAvatar.isPending ||
    updateAvatar.isPending ||
    updateProfileName.isPending ||
    updateProfileEmail.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate({ userId, file });
    e.target.value = "";
  };

  const handleUpdateName = () => {
    if (!newName.trim()) return;
    updateProfileName.mutate(
      { userId, fullName: newName.trim() },
      { onSuccess: () => setEditingName(false) }
    );
  };

  const handleUpdateEmail = () => {
    if (!newEmail.trim()) return;
    const normalized = newEmail.trim().toLowerCase();
    if (normalized === email) {
      setEditingEmail(false);
      return;
    }
    updateProfileEmail.mutate(
      { email: normalized },
      { onSuccess: () => setEditingEmail(false) }
    );
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error(s.toasts.sessionExpired);
        return;
      }
      const res = await supabase.functions.invoke("export-user-data", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) {
        const msg = (res.error as { message?: string })?.message ?? "";
        if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
          toast.error(s.toasts.exportRateLimit);
        } else {
          toast.error(s.toasts.exportError);
        }
        return;
      }
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `syncclass-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(s.toasts.exportSuccess);
    } catch (_e) {
      toast.error(s.toasts.exportError);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl || undefined} alt="" />
          <AvatarFallback className="text-xl">
            {getAvatarLetter(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 w-full sm:w-auto">
          <Label>{s.avatarLabel}</Label>
          <p className="text-xs text-muted-foreground">
            Máx. {MAX_MB} MB, até {AVATAR_MAX_PX}×{AVATAR_MAX_PX} px. JPEG, PNG
            ou WebP.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              {uploadAvatar.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {s.uploading}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {s.uploadButton}
                </>
              )}
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() =>
                  updateAvatar.mutate({ userId, avatar_url: null })
                }
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
                {s.removeButton}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="settings-name">{s.nameLabel}</Label>
        <div className="flex gap-2">
          <Input
            id="settings-name"
            value={editingName ? newName : displayName}
            onChange={(e) => setNewName(e.target.value)}
            readOnly={!editingName}
            className={editingName ? "" : "bg-muted/50"}
          />
          {!isTeacher &&
            (editingName ? (
              <>
                <Button
                  size="sm"
                  onClick={handleUpdateName}
                  disabled={isPending || !newName.trim()}
                >
                  {updateProfileName.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    s.saveButton
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingName(false);
                    setNewName(displayName);
                  }}
                  disabled={isPending}
                >
                  {s.cancelButton}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingName(true)}
              >
                {s.editButton}
              </Button>
            ))}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="settings-email">{s.emailLabel}</Label>
        <div className="flex gap-2">
          <Input
            id="settings-email"
            type="email"
            value={editingEmail ? newEmail : email}
            onChange={(e) => setNewEmail(e.target.value)}
            readOnly={!editingEmail}
            className={editingEmail ? "" : "bg-muted/50"}
          />
          {!isTeacher &&
            (editingEmail ? (
              <>
                <Button
                  size="sm"
                  onClick={handleUpdateEmail}
                  disabled={isPending || !newEmail.trim()}
                >
                  {updateProfileEmail.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    s.saveButton
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingEmail(false);
                    setNewEmail(email);
                  }}
                  disabled={isPending}
                >
                  {s.cancelButton}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingEmail(true)}
              >
                {s.editButton}
              </Button>
            ))}
        </div>
      </div>

      {/* Exportar dados (LGPD) */}
      <div className="space-y-2 border-t pt-4">
        <Label className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {s.exportLabel}
        </Label>
        <p className="text-xs text-muted-foreground">{s.exportHint}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleExportData}
          disabled={isExporting || isPending}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {s.exportingButton}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {s.exportButton}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
