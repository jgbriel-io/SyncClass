import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useResetPassword } from "@/hooks/useUsers";
import type { Teacher } from "@/hooks/useTeachers";
import { teachers as teachersContent, common } from "@/content";

interface TeacherResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
  /** Chamado com a nova senha após sucesso, para exibir no TeacherPasswordDialog */
  onSuccess: (password: string) => void;
}

export function TeacherResetPasswordDialog({
  open,
  onOpenChange,
  teacher,
  onSuccess,
}: TeacherResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lookingUpUser, setLookingUpUser] = useState(false);
  const adminResetPassword = useResetPassword();

  const isPending = adminResetPassword.isPending || lookingUpUser;

  const handleClose = () => {
    onOpenChange(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async () => {
    if (!teacher) return;
    if (newPassword.length < 6) {
      toast.error(teachersContent.resetPasswordDialog.toasts.minLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(teachersContent.resetPasswordDialog.toasts.mismatch);
      return;
    }

    setLookingUpUser(true);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("teacher_id", teacher.id)
      .maybeSingle();
    setLookingUpUser(false);

    if (profileError || !profile?.user_id) {
      toast.error(teachersContent.resetPasswordDialog.toasts.noAccount);
      return;
    }

    const passwordToShow = newPassword;
    adminResetPassword.mutate(
      { userId: profile.user_id, password: newPassword },
      {
        onSuccess: () => {
          handleClose();
          onSuccess(passwordToShow);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{teachersContent.resetPasswordDialog.title}</DialogTitle>
          {teacher && (
            <DialogDescription>
              {teachersContent.resetPasswordDialog.description(teacher.name)}
            </DialogDescription>
          )}
        </DialogHeader>

        {teacher && (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reset-pw-teacher-new">{teachersContent.resetPasswordDialog.newPasswordLabel}</Label>
                <Input
                  id="reset-pw-teacher-new"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-pw-teacher-confirm">{teachersContent.resetPasswordDialog.confirmPasswordLabel}</Label>
                <Input
                  id="reset-pw-teacher-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  disabled={isPending}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
                  let p = "";
                  for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                  setNewPassword(p);
                  setConfirmPassword(p);
                }}
              >
                {teachersContent.resetPasswordDialog.generateButton}
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                {common.actions.cancel}
              </Button>
              <Button
                disabled={isPending || newPassword.length < 6 || newPassword !== confirmPassword}
                onClick={handleSubmit}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {teachersContent.resetPasswordDialog.submitting}
                  </>
                ) : (
                  teachersContent.resetPasswordDialog.submitButton
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
