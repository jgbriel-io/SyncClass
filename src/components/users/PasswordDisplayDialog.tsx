import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { users as usersContent, common } from "@/content";

interface PasswordDisplayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  source: "create" | "reset" | null;
}

export function PasswordDisplayDialog({
  open,
  onOpenChange,
  password,
  source,
}: PasswordDisplayDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (!password) return;

    const onSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const tryInputCopy = () => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.select();
        input.setSelectionRange(0, password.length);
        if (document.execCommand("copy")) onSuccess();
        else toast.error(usersContent.passwordDialog.copyError);
      } else {
        toast.error(usersContent.passwordDialog.copyError);
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(password).then(onSuccess).catch(tryInputCopy);
    } else {
      tryInputCopy();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setShowPassword(false);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {source === "reset" ? "Senha redefinida" : usersContent.passwordDialog.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {usersContent.passwordDialog.description}
          </p>

          <div className="space-y-2">
            <Label>{usersContent.passwordDialog.passwordLabel}</Label>
            <div className="relative">
              <Input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                readOnly
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {common.actions.copied}
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  {usersContent.passwordDialog.copyButton}
                </>
              )}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {usersContent.passwordDialog.closeButton}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
