import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useResetOwnPassword } from "@/hooks/useUsers";
import { layout } from "@/content";

const s = layout.settings.password;

export function SettingsSenhaTab() {
  const resetOwnPassword = useResetOwnPassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = () => {
    resetOwnPassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      }
    );
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {s.sessionWarning}
        </p>
      </div>

      {[
        { id: "current-password", label: s.currentPasswordLabel, value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggleShow: () => setShowCurrent(v => !v), placeholder: s.currentPasswordPlaceholder },
        { id: "new-password", label: s.newPasswordLabel, value: newPassword, setter: setNewPassword, show: showNew, toggleShow: () => setShowNew(v => !v), placeholder: s.newPasswordPlaceholder },
        { id: "confirm-password", label: s.confirmPasswordLabel, value: confirmPassword, setter: setConfirmPassword, show: showConfirm, toggleShow: () => setShowConfirm(v => !v), placeholder: s.confirmPasswordPlaceholder },
      ].map(({ id, label, value, setter, show, toggleShow, placeholder }) => (
        <div key={id} className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <div className="relative">
            <Input
              id={id}
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              className="pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={toggleShow}
              aria-label={show ? s.hidePassword : s.showPassword}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ))}

      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <p className="text-sm text-destructive">{s.passwordMismatch}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={
          resetOwnPassword.isPending ||
          !currentPassword ||
          !newPassword ||
          newPassword.length < 6 ||
          newPassword !== confirmPassword
        }
        className="w-full"
      >
        {resetOwnPassword.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />{s.submitting}</>
        ) : (
          s.submitButton
        )}
      </Button>
    </div>
  );
}
