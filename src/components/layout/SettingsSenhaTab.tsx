import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { layout } from "@/content";

const s = layout.settings.password;

export function SettingsSenhaTab() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success(s.toasts.success);
    } catch {
      toast.error(s.toasts.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      {sent ? (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">{s.sentMessage}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{s.description}</p>
          <Button
            onClick={handleSendReset}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {s.sending}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {s.sendEmailButton}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
