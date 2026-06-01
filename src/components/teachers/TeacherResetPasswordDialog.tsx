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
import { useResetPassword } from "@/hooks/useUsers";
import type { Teacher } from "@/hooks/useTeachers";
import { generateRandomPassword } from "@/hooks/inviteUserService";
import { teachers as teachersContent, common, auth } from "@/content";

interface TeacherResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
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
  const resetPassword = useResetPassword();

  const handleClose = () => {
    onOpenChange(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const isPasswordValid =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

  const handleSubmit = () => {
    if (newPassword.length < 8) {
      toast.error(auth.resetPassword.toasts.minLength);
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error(auth.resetPassword.toasts.uppercase);
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error(auth.resetPassword.toasts.lowercase);
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error(auth.resetPassword.toasts.number);
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      toast.error(auth.resetPassword.toasts.special);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(auth.resetPassword.toasts.passwordMismatch);
      return;
    }

    if (!teacher) return;
    const passwordToShow = newPassword;

    resetPassword.mutate(
      { teacherId: teacher.id, password: newPassword },
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
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2 mb-4">
              <p className="text-xs font-medium text-muted-foreground">
                {auth.resetPassword.requirements.title}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{auth.resetPassword.requirements.minLength}</li>
                <li>{auth.resetPassword.requirements.uppercase}</li>
                <li>{auth.resetPassword.requirements.lowercase}</li>
                <li>{auth.resetPassword.requirements.number}</li>
                <li>{auth.resetPassword.requirements.special}</li>
              </ul>
            </div>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reset-pw-teacher-new">
                  {teachersContent.resetPasswordDialog.newPasswordLabel}
                </Label>
                <Input
                  id="reset-pw-teacher-new"
                  type="password"
                  autoComplete="new-password"
                  placeholder={common.placeholders.password}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  disabled={resetPassword.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-pw-teacher-confirm">
                  {teachersContent.resetPasswordDialog.confirmPasswordLabel}
                </Label>
                <Input
                  id="reset-pw-teacher-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder={common.placeholders.password}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  disabled={resetPassword.isPending}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const p = generateRandomPassword(12);
                  setNewPassword(p);
                  setConfirmPassword(p);
                }}
              >
                {teachersContent.resetPasswordDialog.generateButton}
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {common.actions.cancel}
              </Button>
              <Button
                disabled={
                  resetPassword.isPending ||
                  !isPasswordValid ||
                  newPassword !== confirmPassword
                }
                onClick={handleSubmit}
              >
                {resetPassword.isPending ? (
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
